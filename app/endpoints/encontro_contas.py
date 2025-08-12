import logging
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List

from app.core.templates import templates
from app.core import config as app_config
from app.utils.session_utils import get_uasgs_str, get_usuario_id
from app.db.session import get_session_contratos, get_session_financeiro
from app.services.encontro import EncontroService

logger = logging.getLogger(__name__)

router = APIRouter()

# Renderiza a página do encontro de contas
@router.get("/encontro-de-contas", response_class=HTMLResponse)
async def render_encontro_contas(request: Request):
    """
    Renderiza a página de Encontro de Contas
    """
    return templates.TemplateResponse(
        "encontro-de-contas.html", 
        {
            "request": request,
            "template_name": "encontro-de-contas"
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
        
        # Format response to maintain compatibility with existing frontend
        formatted_response = {
            "contrato_id": contrato_id,
            "total_empenhos": result.get('summary', {}).get('total_empenhos', 0),
            "total_empenhado": result.get('summary', {}).get('total_empenhado', 0),
            "total_orcamentario": result.get('summary', {}).get('total_orcamentario', 0),
            "total_documents": result.get('summary', {}).get('total_documents', {}),
            "total_financial_value": result.get('summary', {}).get('total_financial_value', 0),
            "total_financial_by_type": result.get('summary', {}).get('total_financial_by_type', {}),
            "empenhos_data": result.get('data', [])
        }
        
        logger.info(f"Successfully processed contract {contrato_id} with {formatted_response['total_empenhos']} empenhos, total empenhado: {formatted_response['total_empenhado']}, total orçamentário: {formatted_response['total_orcamentario']}")
        return formatted_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_tudo_data for contract {contrato_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")
