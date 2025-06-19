from datetime import date, timedelta, datetime
from typing import Any, Dict, List

from babel.dates import format_date
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.utils.session_utils import get_uasgs_str
from app.db.session import get_session_contratos


import logging
logger = logging.getLogger(__name__)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Renderiza a página do kpis
@router.get("/kpis", response_class=HTMLResponse)
async def render_dashboard(request: Request):
    return templates.TemplateResponse("kpi.html", {"request": request})


#Endpoints do kpi 1
@router.get("/kpis/kpi1")
async def get_dashboard_contratos(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # 1. Descobre os ID_UASG com base nos códigos
    result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
        {"uasg": uasgs}
    )
    ids_uasg = [row.id for row in result.fetchall()]

    if not ids_uasg:
        return {
            "titulo": "Contratos e Renovações",
            "subtitulo": "Nenhum dado encontrado",
            "total": 0,
            "labelTotal": "Contratos",
            "vigentes": 0,
            "finalizados": 0,
            "criticos": 0,
            "dias120": 0,
            "dias90": 0,
            "dias45": 0,
            "outros": 0
        }

    # 2. Executa a query principal
    query = """
        WITH h AS (
          SELECT hist.*
          FROM contratohistorico hist
          JOIN (
            SELECT contrato_id,
                   MAX(data_assinatura) AS max_assinatura
            FROM contratohistorico
            WHERE unidade_id = ANY(:ids)
            GROUP BY contrato_id
          ) latest
            ON hist.contrato_id = latest.contrato_id
           AND hist.data_assinatura = latest.max_assinatura
          WHERE hist.unidade_id = ANY(:ids)
        )

        SELECT
          SUM(CASE
                WHEN h.vigencia_fim BETWEEN CURRENT_DATE
                                      AND CURRENT_DATE + INTERVAL '45 days'
                THEN 1 ELSE 0
              END) AS ending_within_45_days,

          SUM(CASE
                WHEN h.vigencia_fim > CURRENT_DATE + INTERVAL '45 days'
                 AND h.vigencia_fim <= CURRENT_DATE + INTERVAL '90 days'
                THEN 1 ELSE 0
              END) AS ending_within_90_days,

          SUM(CASE
                WHEN h.vigencia_fim > CURRENT_DATE + INTERVAL '90 days'
                 AND h.vigencia_fim <= CURRENT_DATE + INTERVAL '120 days'
                THEN 1 ELSE 0
              END) AS ending_within_120_days,

          SUM(CASE
                WHEN h.vigencia_fim > CURRENT_DATE + INTERVAL '120 days'
                THEN 1 ELSE 0
              END) AS ending_after_120_days,

          COUNT(*) AS total_contracts,

          SUM(CASE
                WHEN CURRENT_DATE BETWEEN h.vigencia_inicio AND h.vigencia_fim
                THEN CAST(h.valor_inicial AS NUMERIC)
                ELSE 0.0
              END) AS total_valor_inicial

        FROM h;
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    row = result.mappings().first() or {}

    # Extract values
    dias45 = row.get("ending_within_45_days", 0) or 0
    dias90 = row.get("ending_within_90_days", 0) or 0
    dias120 = row.get("ending_within_120_days", 0) or 0
    outros = row.get("ending_after_120_days", 0) or 0
    quantidade_total = row.get("total_contracts", 0) or 0

    # Derived values
    vigentes = dias120 + outros + dias45 + dias90
    finalizados = quantidade_total - vigentes
    criticos = dias45 + dias90 + dias120

    # Prepare response
    data = {
        "titulo": "Contratos e Renovações",
        "subtitulo": "Total de contratos desde 2006",
        "quantidade_total": quantidade_total,
        "vigentes": vigentes,
        "finalizados": finalizados,
        "criticos": criticos,
        "dias120": dias120,
        "dias90": dias90,
        "dias45": dias45,
        "outros": outros
    }

    logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi2")
async def get_dashboard_contratos_sem_licitacao(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
        {"uasg": uasgs}
    )
    ids_uasg = [row.id for row in result.fetchall()]

    if not ids_uasg:
        return {
            "titulo": "Contratos sem Licitação",
            "subtitulo": "Nenhum dado encontrado",
            "total_contratos": 0,
            "contratos_sem_licitacao": 0,
            "percentual_sem_licitacao": 0.0
        }

    query = """
        SELECT 
          total.total_contratos,
          sem_licitacao.contratos_sem_licitacao,
          ROUND(
            100.0 * sem_licitacao.contratos_sem_licitacao / NULLIF(total.total_contratos, 0),
            2
          ) AS percentual_sem_licitacao
        FROM
          (
            SELECT COUNT(DISTINCT contrato_id) AS total_contratos
            FROM contratohistorico
            WHERE unidade_id = ANY(:ids)
          ) AS total,
          (
            SELECT COUNT(DISTINCT contrato_id) AS contratos_sem_licitacao
            FROM contratohistorico
            WHERE unidade_id = ANY(:ids) AND modalidade_id IN (74, 75)
          ) AS sem_licitacao;
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    row = result.mappings().first() or {}

    data = {
        "titulo": "Contratos sem Licitação",
        "subtitulo": "Percentual de contratos sem licitação",
        "total_contratos": row.get("total_contratos", 0) or 0,
        "contratos_sem_licitacao": row.get("contratos_sem_licitacao", 0) or 0,
        "percentual_sem_licitacao": float(row.get("percentual_sem_licitacao", 0.0) or 0.0)
    }

    logger.info(f"Returning JSON: {data}")
    return data