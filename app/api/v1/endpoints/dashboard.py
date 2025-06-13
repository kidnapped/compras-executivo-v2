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
import json

logger = logging.getLogger(__name__)


router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Renderiza a página do dashboard
@router.get("/dashboard", response_class=HTMLResponse)
async def render_dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# Endpoints do dashboard para contratos
@router.get("/dashboard/contratos")
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
        "titulo": "ÍconeContratos e Renovações",
        "descricao": "Total de contratos desde 2006",
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

# Endpoint para obter contratos por exercício
@router.get("/dashboard/contratos-por-exercicio")
async def get_contratos_por_exercicio(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
) -> dict[str, Any]:
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")

    # 1. Busca os ID das UASGs
    result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
        {"uasg": uasgs}
    )
    ids_uasg = [row.id for row in result.fetchall()]

    if not ids_uasg:
        return {
            "titulo": "Contratos por exercício",
            "subtitulo": "Nenhum dado encontrado",
            "icone": "/static/images/doc2.png",
            "anos": [],
            "valores": []
        }

    # 2. Query por ano de assinatura
    query = """
        SELECT
  EXTRACT(YEAR FROM c.data_assinatura)::int AS anos,
  COUNT(DISTINCT c.id)              AS valores
FROM 
  contratos AS c
JOIN 
  unidades   AS u
  ON c.unidadeorigem_id = u.id
WHERE 
  c.data_assinatura IS NOT NULL
  AND u.codigo = ANY(:uasg)
GROUP BY 
  u.codigo,
  c.unidadeorigem_id,
  anos
ORDER BY 
  u.codigo,
  anos;

    """
    result = await db.execute(text(query), {"uasg": uasgs})
    rows = result.fetchall()

    anos = [str(int(row[0])) for row in rows]
    valores = [row[1] for row in rows]

    return {
        "titulo": "Contratos por exercício",
        "subtitulo": "Histórico de contratos por ano",
        "icone": "/static/images/doc2.png",
        "anos": anos,
        "valores": valores
    }

# Endpoint para obter valores sazonais por exercício
@router.get("/dashboard/valores-por-exercicio")
async def get_valores_sazonais(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
) -> dict[str, Any]:
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")

    # 1. Pega IDs das UASGs
    result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
        {"uasg": uasgs}
    )
    ids_uasg = [row.id for row in result.fetchall()]
    if not ids_uasg:
        return {"anos": [], "coluna": [], "linha": []}

    # 2. Soma valor inicial dos contratos agrupado por ano
    query = text("""
      SELECT
        u.codigo                                 AS uasg,
        c.unidadeorigem_id                       AS unidade_id,
        EXTRACT(YEAR FROM c.data_assinatura)::int AS ano,
        SUM(CAST(c.valor_inicial AS numeric))     AS contrato_valor
      FROM 
        contratos c
      JOIN 
        unidades u
        ON c.unidadeorigem_id = u.id
      WHERE 
        c.data_assinatura IS NOT NULL
        AND c.unidadeorigem_id = ANY(:ids)
        AND c.valor_inicial IS NOT NULL
      GROUP BY 
        u.codigo, c.unidadeorigem_id, ano
      ORDER BY 
        u.codigo, ano

    """)
    result = await db.execute(query, {"ids": ids_uasg})
    rows = result.fetchall()

    # 3. Build the response arrays
    return {
        "anos":   [ str(r.ano)               for r in rows ],
        "coluna": [ float(r.contrato_valor)  for r in rows ],
        # if you later add an "aditivo" series, populate "linha" here
        "linha":  [float(r.contrato_valor)  for r in rows]
    }

# Endpoint para obter próximas atividades de contratos
@router.get("/dashboard/atividades")
async def get_proximas_atividades(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
) -> Dict[str, Any]:
    # Get UASGs from request
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")

    # Get unit IDs
    result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasgs)"),
        {"uasgs": uasgs}
    )
    unit_ids = [row[0] for row in result.fetchall()]
    if not unit_ids:
        return {"atividades": []}

    # Simplified SQL - just get the raw data we need
    query = text("""
    SELECT 
        c.numero,
        EXTRACT(YEAR FROM c.data_assinatura)::int AS ano,
        c.objeto,
        c.vigencia_fim AS fim
    FROM contratohistorico c
    WHERE c.unidade_id = ANY(:unit_ids)
      AND c.vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '120 days'
      AND c.numero NOT ILIKE '%NE%'
    ORDER BY c.vigencia_fim
    """)

    result = await db.execute(query, {"unit_ids": unit_ids})
    contracts = result.fetchall()

    # Process in Python
    atividades = []
    summary = {'urgente': 0, 'alerta': 0, 'aviso': 0}
    months_pt = [
        "janeiro", "fevereiro", "março", "abril",
        "maio", "junho", "julho", "agosto",
        "setembro", "outubro", "novembro", "dezembro"
    ]

    for contract in contracts:
        numero, ano, objeto, fim = contract
        dias_restantes = (fim - datetime.now().date()).days

        atividades.append({
            'dias_restantes': dias_restantes,
            'data': f"{fim.day} de {months_pt[fim.month - 1]}",
            'numero': numero,
            'ano': ano,
        })

    # Sort by priority and remaining days
    atividades_sorted = sorted(atividades, key=lambda x: (x['dias_restantes']))

    return {
        'atividades': atividades_sorted,
        'data_consulta': datetime.now().strftime('%d/%m/%Y %H:%M')
    }
    
    
