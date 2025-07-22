import logging
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List

from app.utils.static_loader import collect_static_files
from app.core import config as app_config
from app.utils.session_utils import get_uasgs_str, get_usuario_id
from app.db.session import get_session_contratos, get_session_financeiro
from app.services.encontro import EncontroService

logger = logging.getLogger(__name__)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Renderiza a página do encontro de contas
@router.get("/encontro-de-contas", response_class=HTMLResponse)
async def render_encontro_contas(request: Request):
    """
    Renderiza a página de Encontro de Contas
    """
    dev_css_files, dev_js_modules, dev_js_files = collect_static_files()
    return templates.TemplateResponse(
        "encontro-de-contas.html", 
        {
            "request": request,
            "dev_css_files": dev_css_files,
            "dev_js_modules": dev_js_modules,
            "dev_js_files": dev_js_files, 
            "config": app_config
        }
    )

@router.get("/encontro-de-contas/empenhos-contrato/{contrato_id}")
async def get_empenhos_por_contrato(
    contrato_id: int,
    request: Request,
    unidade_empenho_id: int = Query(None, description="ID da unidade de empenho (opcional)"),
    db: AsyncSession = Depends(get_session_contratos)
):
    """
    Retorna os empenhos vinculados a um contrato específico junto com os detalhes do contrato
    
    - contrato_id: ID do contrato (na URL)
    - unidade_empenho_id: ID da unidade de empenho (query parameter opcional)
    """
    # Se unidade_empenho_id não foi fornecido, tenta obter das UASGs da sessão
    if unidade_empenho_id is None:
        uasgs = get_uasgs_str(request)
        if not uasgs:
            raise HTTPException(status_code=403, detail="UASG não definida e unidade_empenho_id não fornecido")
        
        # Descobre os ID_UASG com base nos códigos
        result = await db.execute(
            text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
            {"uasg": uasgs}
        )
        ids_uasg = [row.id for row in result.fetchall()]
        
        if not ids_uasg:
            raise HTTPException(status_code=404, detail="Unidade não encontrada para as UASGs da sessão")
            
        unidade_empenho_id = ids_uasg[0]  # Usa a primeira UASG encontrada

    # Query 1: Buscar detalhes do contrato e fornecedor
    contrato_query = """
        SELECT 
            c.valor_inicial, 
            c.valor_global, 
            c.data_assinatura, 
            c.vigencia_inicio, 
            c.vigencia_fim,
            f.nome AS fornecedor_nome,
            f.cpf_cnpj_idgener
        FROM contratos c
        JOIN fornecedores f ON c.fornecedor_id = f.id
        WHERE c.unidade_id = :unidade_empenho_id 
          AND c.id = :contrato_id;
    """
    
    contrato_result = await db.execute(
        text(contrato_query), 
        {
            "unidade_empenho_id": unidade_empenho_id,
            "contrato_id": contrato_id
        }
    )
    contrato_row = contrato_result.mappings().first()
    
    if not contrato_row:
        raise HTTPException(
            status_code=404, 
            detail=f"Contrato {contrato_id} não encontrado na unidade {unidade_empenho_id}"
        )

    # Query 2: Buscar empenhos do contrato
    empenhos_query = """
        SELECT e.*
        FROM contratoempenhos ce
        JOIN empenhos e ON ce.empenho_id = e.id
        WHERE ce.unidadeempenho_id = :unidade_empenho_id 
          AND ce.contrato_id = :contrato_id
        ORDER BY e.id;
    """
    
    empenhos_result = await db.execute(
        text(empenhos_query), 
        {
            "unidade_empenho_id": unidade_empenho_id,
            "contrato_id": contrato_id
        }
    )
    empenhos_rows = empenhos_result.mappings().all() or []

    # Processar dados do contrato
    contrato_info = {
        "valor_inicial": float(contrato_row.get("valor_inicial", 0.0) or 0.0),
        "valor_global": float(contrato_row.get("valor_global", 0.0) or 0.0),
        "data_assinatura": contrato_row.get("data_assinatura").isoformat() if contrato_row.get("data_assinatura") else None,
        "vigencia_inicio": contrato_row.get("vigencia_inicio").isoformat() if contrato_row.get("vigencia_inicio") else None,
        "vigencia_fim": contrato_row.get("vigencia_fim").isoformat() if contrato_row.get("vigencia_fim") else None,
        "fornecedor_nome": contrato_row.get("fornecedor_nome"),
        "cpf_cnpj_idgener": contrato_row.get("cpf_cnpj_idgener"),
    }

    # Processar dados dos empenhos
    empenhos = [
        {
            "id": row.get("id"),
            "numero": row.get("numero"),
            "empenhado": float(row.get("empenhado", 0.0) or 0.0),
            "liquidado": float(row.get("liquidado", 0.0) or 0.0),
            "pago": float(row.get("pago", 0.0) or 0.0),
            "data_empenho": row.get("data_empenho").isoformat() if row.get("data_empenho") else None,
            "data_liquidacao": row.get("data_liquidacao").isoformat() if row.get("data_liquidacao") else None,
            "data_pagamento": row.get("data_pagamento").isoformat() if row.get("data_pagamento") else None,
            "credor_id": row.get("credor_id"),
            "unidade_id": row.get("unidade_id"),
            "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
            "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None,
            "deleted_at": row.get("deleted_at").isoformat() if row.get("deleted_at") else None
        }
        for row in empenhos_rows
    ]

    # Calcular totais dos empenhos
    total_empenhado = sum(emp["empenhado"] for emp in empenhos)
    total_liquidado = sum(emp["liquidado"] for emp in empenhos)
    total_pago = sum(emp["pago"] for emp in empenhos)

    # Calcular saldos e percentuais em relação ao contrato
    saldo_empenhado = total_empenhado - total_liquidado
    saldo_liquidado = total_liquidado
    
    # Percentuais em relação ao valor global do contrato
    percentual_empenhado = (total_empenhado / contrato_info["valor_global"] * 100) if contrato_info["valor_global"] > 0 else 0
    percentual_liquidado = (total_liquidado / contrato_info["valor_global"] * 100) if contrato_info["valor_global"] > 0 else 0
    percentual_pago = (total_pago / contrato_info["valor_global"] * 100) if contrato_info["valor_global"] > 0 else 0

    data = {
        "titulo": f"Empenhos do Contrato {contrato_id}",
        "subtitulo": f"Empenhos vinculados ao contrato na unidade {unidade_empenho_id}",
        "contrato_id": contrato_id,
        "unidade_empenho_id": unidade_empenho_id,
        
        # Informações do contrato
        "contrato": contrato_info,
        
        # Estatísticas dos empenhos
        "total_empenhos": len(empenhos),
        "total_empenhado": total_empenhado,
        "total_liquidado": total_liquidado,
        "total_pago": total_pago,
        "saldo_empenhado": saldo_empenhado,
        "saldo_liquidado": saldo_liquidado,
        
        # Percentuais em relação ao contrato
        "percentual_empenhado": round(percentual_empenhado, 2),
        "percentual_liquidado": round(percentual_liquidado, 2),
        "percentual_pago": round(percentual_pago, 2),
        
        # Saldo disponível no contrato
        "saldo_contrato": contrato_info["valor_global"] - total_pago if contrato_info["valor_global"] else 0.0,
        
        # Lista de empenhos
        "empenhos": empenhos
    }

    logger.info(f"Returning empenhos and contract details for contrato {contrato_id}: {len(empenhos)} empenhos found, contract value: {contrato_info['valor_global']}")
    return data

@router.get("/encontro-de-contas/historico-orcamentario/{contrato_id}")
async def get_historico_orcamentario(
    contrato_id: int,
    request: Request,
    unidade_empenho_id: int = Query(None, description="ID da unidade de empenho (opcional)"),
    db: AsyncSession = Depends(get_session_contratos)
):
    """
    Retorna dados do histórico orçamentário para um contrato específico
    
    - contrato_id: ID do contrato (na URL)
    - unidade_empenho_id: ID da unidade de empenho (query parameter opcional)
    """
    # Se unidade_empenho_id não foi fornecido, tenta obter das UASGs da sessão
    if unidade_empenho_id is None:
        uasgs = get_uasgs_str(request)
        if not uasgs:
            raise HTTPException(status_code=403, detail="UASG não definida e unidade_empenho_id não fornecido")
        
        # Descobre os ID_UASG com base nos códigos
        result = await db.execute(
            text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
            {"uasg": uasgs}
        )
        ids_uasg = [row.id for row in result.fetchall()]
        
        if not ids_uasg:
            raise HTTPException(status_code=404, detail="Unidade não encontrada para as UASGs da sessão")
            
        unidade_empenho_id = ids_uasg[0]  # Usa a primeira UASG encontrada

    # Query para contar empenhos do contrato
    count_query = """
        SELECT count(id) as total
        FROM contratoempenhos 
        WHERE unidadeempenho_id = :unidade_empenho_id 
          AND contrato_id = :contrato_id
    """
    
    result = await db.execute(
        text(count_query), 
        {
            "unidade_empenho_id": unidade_empenho_id,
            "contrato_id": contrato_id
        }
    )
    count_row = result.mappings().first()
    
    if not count_row:
        raise HTTPException(
            status_code=404, 
            detail=f"Nenhum dado encontrado para contrato {contrato_id} na unidade {unidade_empenho_id}"
        )

    total_empenhos = count_row.get("total", 0)
    
    # Calcular valores baseados no total (estimativas para demonstração)
    em_execucao = max(0, int(total_empenhos * 0.6))  # 60% em execução
    finalizados = max(0, int(total_empenhos * 0.3))   # 30% finalizados
    rap = max(0, int(total_empenhos * 0.1))           # 10% RAP
    criticos = max(0, int(total_empenhos * 0.05))     # 5% críticos

    data = {
        "contrato_id": contrato_id,
        "unidade_empenho_id": unidade_empenho_id,
        "quantidade_total": f"{total_empenhos}",
        "total_count": total_empenhos,
        "em_execucao": em_execucao,
        "finalizados": finalizados,
        "rap": rap,
        "criticos": criticos
    }

    logger.info(f"Returning historico orcamentario for contrato {contrato_id}: {total_empenhos} empenhos total")
    return data

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
            "total_documents": result.get('summary', {}).get('total_documents', {}),
            "total_financial_value": result.get('summary', {}).get('total_financial_value', 0),
            "empenhos_data": result.get('data', [])
        }
        
        logger.info(f"Successfully processed contract {contrato_id} with {formatted_response['total_empenhos']} empenhos")
        return formatted_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_tudo_data for contract {contrato_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")
