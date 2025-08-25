import logging
import json
import asyncio
from pathlib import Path
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List, AsyncGenerator

from app.core.templates import templates
from app.core import config as app_config
from app.utils.session_utils import get_uasgs_str, get_usuario_id
from app.utils.spa_utils import spa_route_handler, get_page_scripts, add_spa_context
from app.db.session import get_session_contratos, get_session_financeiro
from app.services.encontro import EncontroService

logger = logging.getLogger(__name__)

router = APIRouter()


def convert_dates_to_strings(obj):
    """
    Recursively convert date/datetime objects to ISO format strings to ensure JSON serializability.
    """
    if isinstance(obj, dict):
        return {k: convert_dates_to_strings(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_dates_to_strings(item) for item in obj]
    elif hasattr(obj, 'isoformat'):  # datetime, date objects
        return obj.isoformat()
    elif hasattr(obj, '__dict__'):  # Other objects that might have date fields
        return str(obj)
    else:
        return obj


# Renderiza a página do encontro de contas
@router.get("/encontro_contas", response_class=HTMLResponse)
async def render_encontro_contas(request: Request):
    """
    Renderiza a página de Encontro de Contas
    """
    # Contexto base para a página
    context = {
        "request": request,
        "template_name": "encontro_contas"
    }
    
    # Adicionar contexto SPA
    context = add_spa_context(context, request)
    
    # Usar o handler SPA
    return spa_route_handler(
        template_name="encontro_contas.html",
        context=context,
        templates=templates,
        request=request,
        title="Encontro de Contas - Compras Executivo",
        scripts=get_page_scripts("encontro_contas")
    )


@router.get("/tudo-stream")
async def get_tudo_data_stream(
    request: Request,
    contrato_id: int = Query(..., description="ID do contrato"),
    empenho_numero: str = Query(None, description="Número do empenho específico (opcional)")
):
    """
    Endpoint de streaming para atualizações em tempo real dos dados do encontro de contas.
    Uses manually managed database sessions to ensure proper cleanup.
    """
    async def stream_generator() -> AsyncGenerator[str, None]:
        db_contratos = None
        db_financeiro = None
        engine_contratos = None
        engine_financeiro = None
        service = None
        
        try:
            # Manually create database sessions to ensure proper cleanup
            from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
            from sqlalchemy.orm import sessionmaker
            from app.core.config import settings
            from app.db.session import build_database_url
            
            # Create engines for both databases
            engine_contratos = create_async_engine(
                build_database_url(settings.POSTGRES_DB_CONTRATOS),
                echo=False,
                future=True
            )
            engine_financeiro = create_async_engine(
                build_database_url(settings.POSTGRES_DB_FINANCEIRO),
                echo=False,
                future=True
            )
            
            # Create session makers
            session_maker_contratos = sessionmaker(
                bind=engine_contratos,
                class_=AsyncSession,
                expire_on_commit=False
            )
            session_maker_financeiro = sessionmaker(
                bind=engine_financeiro,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Create sessions
            db_contratos = session_maker_contratos()
            db_financeiro = session_maker_financeiro()
            
            # Send initial event
            yield f"data: {json.dumps({'type': 'start', 'message': 'Iniciando processamento...', 'contrato_id': contrato_id})}\n\n"
            
            # Get user ID
            user_id = get_usuario_id(request)
            if not user_id:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Usuário não identificado na sessão'})}\n\n"
                return
            
            # Initialize service with manually created sessions
            service = EncontroService(db_contratos, db_financeiro)
            
            # Step 1: Validate access
            yield f"data: {json.dumps({'type': 'progress', 'message': 'Validando acesso ao contrato...', 'step': 'validation'})}\n\n"
            
            validation_result = await service.validation_service.validate_contract_access(contrato_id, user_id, request)
            if not validation_result.get('valid', False):
                yield f"data: {json.dumps({'type': 'error', 'message': validation_result.get('message', 'Acesso negado')})}\n\n"
                return

            unidade_id = validation_result.get('unidade_id')
            unidadeempenho_id = validation_result.get('unidadeempenho_id')
            uasg_codigo = validation_result.get('uasg_codigo')
            valor_acumulado = validation_result.get('valor_acumulado', 0.0)

            # Step 2: Get empenhos
            yield f"data: {json.dumps({'type': 'progress', 'message': 'Buscando empenhos do contrato...', 'step': 'empenhos_search'})}\n\n"
            
            empenhos = await service.query_service.get_contract_empenhos(contrato_id, unidadeempenho_id, empenho_numero, request)
            
            if not empenhos:
                yield f"data: {json.dumps({'type': 'progress', 'message': 'Tentando busca alternativa de empenhos...', 'step': 'empenhos_fallback'})}\n\n"
                empenhos = await service.query_service.get_contract_empenhos(contrato_id, None, None, request)
                
                if not empenhos:
                    yield f"data: {json.dumps({'type': 'complete', 'data': {'contrato_id': contrato_id, 'total_empenhos': 0, 'empenhos_data': []}})}\n\n"
                    return

            # Notify empenhos found
            total_empenhos = len(empenhos)
            yield f"data: {json.dumps({'type': 'progress', 'message': f'Encontrados {total_empenhos} empenhos. Iniciando processamento...', 'step': 'empenhos_found', 'total_empenhos': total_empenhos, 'processed_empenhos': 0})}\n\n"

            # Step 3: Process each empenho with real-time updates
            successful_results = []
            for i, empenho in enumerate(empenhos):
                try:
                    empenho_id = empenho.get('id', 'unknown')
                    current_count = i + 1
                    
                    # Send processing start update
                    yield f"data: {json.dumps({'type': 'progress', 'message': f'Processando empenho {current_count} de {total_empenhos}... (ID: {empenho_id})', 'step': 'processing_empenho', 'current_empenho': current_count, 'total_empenhos': total_empenhos, 'processed_empenhos': i, 'empenho_id': empenho_id})}\n\n"
                    
                    # Process the empenho
                    result = await service._process_single_empenho(empenho, uasg_codigo)
                    
                    if not result.get('error', False):
                        successful_results.append(result)
                        
                        # Send success update
                        success_msg = f"✅ Empenho {current_count} de {total_empenhos} processado com sucesso"
                        success_data = {
                            'type': 'progress', 
                            'message': success_msg, 
                            'step': 'empenho_completed', 
                            'current_empenho': current_count, 
                            'total_empenhos': total_empenhos, 
                            'processed_empenhos': current_count, 
                            'successful_empenhos': len(successful_results), 
                            'empenho_id': empenho_id
                        }
                        yield f"data: {json.dumps(success_data)}\n\n"
                    else:
                        # Send error update
                        error_msg = f"⚠️ Erro ao processar empenho {current_count}: {result.get('message', 'Erro desconhecido')}"
                        error_data = {
                            'type': 'progress', 
                            'message': error_msg, 
                            'step': 'empenho_error', 
                            'current_empenho': current_count, 
                            'total_empenhos': total_empenhos, 
                            'processed_empenhos': current_count, 
                            'successful_empenhos': len(successful_results), 
                            'empenho_id': empenho_id
                        }
                        yield f"data: {json.dumps(error_data)}\n\n"
                        
                except Exception as e:
                    # Send critical error update
                    critical_msg = f"❌ Erro crítico ao processar empenho {current_count}: {str(e)}"
                    critical_data = {
                        'type': 'progress', 
                        'message': critical_msg, 
                        'step': 'empenho_critical_error', 
                        'current_empenho': current_count, 
                        'total_empenhos': total_empenhos, 
                        'processed_empenhos': current_count, 
                        'successful_empenhos': len(successful_results), 
                        'empenho_id': empenho.get('id', 'unknown')
                    }
                    yield f"data: {json.dumps(critical_data)}\n\n"

            # Final update
            final_msg = f"🎉 Processamento concluído: {len(successful_results)} de {total_empenhos} empenhos processados com sucesso"
            final_data = {
                'type': 'progress', 
                'message': final_msg, 
                'step': 'processing_complete', 
                'total_empenhos': total_empenhos, 
                'successful_empenhos': len(successful_results), 
                'failed_empenhos': total_empenhos - len(successful_results)
            }
            yield f"data: {json.dumps(final_data)}\n\n"

            # Create and send final response
            summary_response = service.data_processor.create_summary_response(successful_results, valor_acumulado)
            
            # Convert any date objects to strings to ensure JSON serializability
            summary_response = convert_dates_to_strings(summary_response)
            
            formatted_response = {
                "contrato_id": contrato_id,
                "total_empenhos": summary_response.get('summary', {}).get('total_empenhos', 0),
                "total_empenhado": summary_response.get('summary', {}).get('total_empenhado', 0),
                "total_orcamentario": summary_response.get('summary', {}).get('total_orcamentario', 0),
                "valor_acumulado": summary_response.get('summary', {}).get('valor_acumulado', 0),
                "total_documents": summary_response.get('summary', {}).get('total_documents', {}),
                "total_financial_value": summary_response.get('summary', {}).get('total_financial_value', 0),
                "total_financial_by_type": summary_response.get('summary', {}).get('total_financial_by_type', {}),
                "empenhos_data": summary_response.get('data', [])
            }
            
            # Apply date conversion to formatted response as well
            formatted_response = convert_dates_to_strings(formatted_response)
            
            yield f"data: {json.dumps({'type': 'complete', 'data': formatted_response})}\n\n"
            
        except Exception as e:
            logger.error(f"Erro no streaming para contrato {contrato_id}: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': f'Erro interno: {str(e)}'})}\n\n"
        finally:
            # Ensure proper cleanup of database connections
            try:
                if db_contratos:
                    await db_contratos.close()
                    logger.debug("Closed contratos session")
                if db_financeiro:
                    await db_financeiro.close()
                    logger.debug("Closed financeiro session")
                    
                # Also close the engines
                if engine_contratos:
                    await engine_contratos.dispose()
                    logger.debug("Disposed contratos engine")
                if engine_financeiro:
                    await engine_financeiro.dispose()
                    logger.debug("Disposed financeiro engine")
                    
            except Exception as cleanup_error:
                logger.error(f"Error during session cleanup: {cleanup_error}")
    
    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )


@router.get("/tudo")
async def get_tudo_data(
    request: Request,
    contrato_id: int = Query(..., description="ID do contrato"),
    empenho_numero: str = Query(None, description="Número do empenho específico (opcional)"),
    db_contratos: AsyncSession = Depends(get_session_contratos),
    db_financeiro: AsyncSession = Depends(get_session_financeiro)
):
    """
    Retorna todos os dados de empenhos e documentos relacionados para um contrato específico
    
    - contrato_id: ID do contrato (query parameter obrigatório)
    - empenho_numero: Número do empenho específico (query parameter opcional)
    
    Se empenho_numero for fornecido, retorna apenas os dados desse empenho específico.
    Se empenho_numero não for fornecido, retorna todos os empenhos do contrato.
    
    A validação de acesso é feita automaticamente baseada na sessão do usuário.
    
    Utiliza o serviço EncontroService para processamento otimizado e concorrente.
    """
    try:
        # Check if emulation mode is enabled
        if app_config.settings.ENCONTRO_CONTAS_EMULATION_MODE:
            logger.info(f"Emulation mode enabled - returning mock data for contract {contrato_id}")
            
            # Load mock data from JSON file
            mock_file_path = Path(__file__).parent / "mock_json" / "encontro_contas.json"
            
            with open(mock_file_path, 'r', encoding='utf-8') as f:
                mock_data = json.load(f)
                
            # Customize with the requested contract_id
            mock_data["contrato_id"] = contrato_id
            if empenho_numero:
                # Filter mock data for specific empenho if requested
                mock_data["filtered_for_empenho"] = empenho_numero
            return mock_data
        
        # Original logic when emulation mode is disabled
        # Get user ID from session
        user_id = get_usuario_id(request)
        if not user_id:
            raise HTTPException(status_code=403, detail="Usuário não identificado na sessão")
        
        # Initialize service
        encontro_service = EncontroService(db_contratos, db_financeiro)
        
        # Process contract data using service layer
        result = await encontro_service.get_complete_contract_data(contrato_id, user_id, request, empenho_numero)
        
        if result.get('error', False):
            if 'Access denied' in result.get('message', ''):
                raise HTTPException(status_code=403, detail=result['message'])
            elif 'not found' in result.get('message', '').lower():
                raise HTTPException(status_code=404, detail=result['message'])
            else:
                raise HTTPException(status_code=500, detail=result['message'])
        
        # Convert any date objects to strings to ensure JSON serializability
        result = convert_dates_to_strings(result)
        
        # Format response to maintain compatibility with existing frontend
        formatted_response = {
            "contrato_id": contrato_id,
            "total_empenhos": result.get('summary', {}).get('total_empenhos', 0),
            "total_empenhado": result.get('summary', {}).get('total_empenhado', 0),
            "total_orcamentario": result.get('summary', {}).get('total_orcamentario', 0),
            "valor_acumulado": result.get('summary', {}).get('valor_acumulado', 0),
            "total_documents": result.get('summary', {}).get('total_documents', {}),
            "total_financial_value": result.get('summary', {}).get('total_financial_value', 0),
            "total_financial_by_type": result.get('summary', {}).get('total_financial_by_type', {}),
            "empenhos_data": result.get('data', [])
        }
        
        # Apply date conversion to formatted response as well
        formatted_response = convert_dates_to_strings(formatted_response)
        
        logger.info(f"Successfully processed contract {contrato_id} with {formatted_response['total_empenhos']} empenhos, total empenhado: {formatted_response['total_empenhado']}, total orçamentário: {formatted_response['total_orcamentario']}")
        return formatted_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_tudo_data for contract {contrato_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@router.get("/financial-totals")
async def get_financial_totals(
    request: Request,
    contrato_id: int = Query(..., description="ID do contrato"),
    use_partial: bool = Query(False, description="Use partial amounts instead of nominal"),
    empenho_numero: str = Query(None, description="Número do empenho específico (opcional)"),
    db_contratos: AsyncSession = Depends(get_session_contratos),
    db_financeiro: AsyncSession = Depends(get_session_financeiro)
):
    """
    Calcula totais financeiros usando a implementação corrigida
    
    - contrato_id: ID do contrato (obrigatório)
    - use_partial: Se True, usa valores parciais; se False, usa valores nominais (padrão: False)
    - empenho_numero: Número do empenho específico (opcional)
    
    Retorna breakdown detalhado e validação dos cálculos.
    """
    try:
        # Get user ID from session
        user_id = get_usuario_id(request)
        if not user_id:
            raise HTTPException(status_code=403, detail="Usuário não identificado na sessão")
        
        # Initialize service
        encontro_service = EncontroService(db_contratos, db_financeiro)
        
        # Compute financial totals using corrected calculator
        result = await encontro_service.compute_financial_totals(
            contrato_id, user_id, request, use_partial, empenho_numero
        )
        
        if result.get('error', False):
            if 'Access denied' in result.get('message', ''):
                raise HTTPException(status_code=403, detail=result['message'])
            elif 'not found' in result.get('message', '').lower():
                raise HTTPException(status_code=404, detail=result['message'])
            else:
                raise HTTPException(status_code=500, detail=result['message'])
        
        logger.info(f"Financial totals calculated for contract {contrato_id} - Total: {result['breakdown']['total']}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_financial_totals for contract {contrato_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")
