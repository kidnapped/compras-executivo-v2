from datetime import date, timedelta, datetime
from typing import Any, Dict, List

from babel.dates import format_date
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.templates import templates
from app.core import config as app_config
from app.core.config import settings
from app.utils.session_utils import get_uasgs_str
from app.db.session import get_session_contratos


import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Renderiza a página do kpis
@router.get("/kpis", response_class=HTMLResponse)
async def render_dashboard(request: Request):
    return templates.TemplateResponse("kpi.html", {
        "request": request,
        "template_name": "kpi"
    })


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

    # logger.info(f"Returning JSON: {data}")
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

    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi3")
async def get_dashboard_contratos_por_categoria(
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
            "titulo": "Contratos por Categoria",
            "subtitulo": "Nenhum dado encontrado",
            "categorias": []
        }

    query = """
        SELECT 
          ci.descricao  AS categoria_nome,
          ch.categoria_id,
          COUNT(DISTINCT ch.contrato_id) AS total_contratos
        FROM contratohistorico ch
        LEFT JOIN codigoitens ci ON ch.categoria_id = ci.id
        WHERE ch.unidade_id = ANY(:ids)
        GROUP BY ci.descricao, ch.categoria_id
        ORDER BY total_contratos DESC;
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    rows = result.mappings().all() or []

    categorias = [
        {
            "categoria_nome": row.get("categoria_nome"),
            "categoria_id": row.get("categoria_id"),
            "total_contratos": row.get("total_contratos", 0) or 0
        }
        for row in rows
    ]

    data = {
        "titulo": "Contratos por Categoria",
        "subtitulo": "Total de contratos por categoria",
        "categorias": categorias
    }

    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi4")
async def get_dashboard_top_fornecedores(
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
            "titulo": "Top Fornecedores",
            "subtitulo": "Nenhum dado encontrado",
            "fornecedores": []
        }

    query = """
        select
    f.id AS fornecedor_id,
    f.nome AS fornecedor_nome,
    COUNT(*) as total_contratos,
    round(SUM(c.valor_global::numeric)) AS valor_total_contratos
FROM contratos c
JOIN fornecedores f ON f.id = c.fornecedor_id
WHERE c.unidade_id = 16617
  AND c.valor_global IS NOT NULL
GROUP BY f.id, f.nome
ORDER BY valor_total_contratos desc limit 20;

    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    rows = result.mappings().all() or []

    fornecedores = [
        {
            "fornecedor_id": row.get("fornecedor_id") or 0,
            "fornecedor_nome": row.get("fornecedor_nome") or "Desconhecido",
            "total_contratos": row.get("total_contratos") or 0,
            "valor_total_contratos": row.get("valor_total_contratos") or 0.0
        }
        for row in rows
    ]

    data = {
        "titulo": "Top Fornecedores",
        "subtitulo": "Top 10 fornecedores por valor total de contratos",
        "fornecedores": fornecedores
    }

    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi5")
async def get_dashboard_contratos_por_regiao(
    db: AsyncSession = Depends(get_session_contratos)
):
    query = """
        WITH regioes AS (
            SELECT * FROM (VALUES
                (11, 'Norte'), (12, 'Norte'), (13, 'Norte'), (14, 'Norte'), (15, 'Norte'), (16, 'Norte'), (17, 'Norte'),
                (21, 'Nordeste'), (22, 'Nordeste'), (23, 'Nordeste'), (24, 'Nordeste'), (25, 'Nordeste'), (26, 'Nordeste'),
                (27, 'Nordeste'), (28, 'Nordeste'), (29, 'Nordeste'),
                (31, 'Sudeste'), (32, 'Sudeste'), (33, 'Sudeste'), (35, 'Sudeste'),
                (41, 'Sul'), (42, 'Sul'), (43, 'Sul'),
                (50, 'Centro-Oeste'), (51, 'Centro-Oeste'), (52, 'Centro-Oeste'), (53, 'Centro-Oeste')
            ) AS r(estado_id, regiao)
        )
        SELECT r.regiao,
               COUNT(DISTINCT c.id) AS total_contratos
        FROM contratos c
        JOIN unidades u ON u.id = c.unidade_id
        JOIN municipios m ON m.id = u.municipio_id
        JOIN regioes r ON r.estado_id = m.estado_id
        WHERE c.deleted_at IS NULL
        GROUP BY r.regiao
        ORDER BY total_contratos DESC;
    """
    result = await db.execute(text(query))
    rows = result.mappings().all() or []

    regioes = [
        {
            "regiao": row.get("regiao"),
            "total_contratos": row.get("total_contratos", 0) or 0
        }
        for row in rows
    ]

    data = {
        "titulo": "Contratos por Região",
        "subtitulo": "Total de contratos por região",
        "regioes": regioes
    }

    logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi6")
async def get_dashboard_contratos_com_aditivos(
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
            "titulo": "Contratos com Aditivos",
            "subtitulo": "Nenhum dado encontrado",
            "contratos_com_aditivos": 0,
            "total_contratos_ativos": 0,
            "percentual_com_aditivos": 0.0
        }

    query = """
        SELECT
          COUNT(DISTINCT ch.contrato_id) FILTER (WHERE ch.tipo_id IS NOT NULL AND cit.descricao ILIKE '%aditivo%') AS contratos_com_aditivos,
          COUNT(DISTINCT ch.contrato_id) AS total_contratos_ativos,
          ROUND(
            100.0 * 
            COUNT(DISTINCT ch.contrato_id) FILTER (WHERE ch.tipo_id IS NOT NULL AND cit.descricao ILIKE '%aditivo%') 
            / NULLIF(COUNT(DISTINCT ch.contrato_id), 0), 
            2
          ) AS percentual_com_aditivos
        FROM contratohistorico ch
        LEFT JOIN codigoitens cit ON cit.id = ch.tipo_id
        WHERE ch.unidade_id = ANY(:ids)
          AND CURRENT_DATE BETWEEN ch.vigencia_inicio AND ch.vigencia_fim;
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    row = result.mappings().first() or {}

    data = {
        "titulo": "Contratos com Aditivos",
        "subtitulo": "Percentual de contratos ativos com aditivos",
        "contratos_com_aditivos": row.get("contratos_com_aditivos", 0) or 0,
        "total_contratos_ativos": row.get("total_contratos_ativos", 0) or 0,
        "percentual_com_aditivos": float(row.get("percentual_com_aditivos", 0.0) or 0.0)
    }

    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi7")
async def get_dashboard_contratos_com_clausulas(
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
            "titulo": "Contratos com Cláusulas",
            "subtitulo": "Nenhum dado encontrado",
            "total_com_clausulas": 0,
            "total_contratos": 0,
            "percentual_com_clausulas": 0.0
        }

    query = """
        WITH contratos_totais AS (
          SELECT COUNT(DISTINCT contrato_id) AS total_contratos
          FROM contratohistorico
          WHERE deleted_at IS NULL
            AND unidade_id = ANY(:ids)
        ),
        contratos_com_clausulas AS (
          SELECT COUNT(DISTINCT contrato_id) AS total_com_clausulas
          FROM contratohistorico
          WHERE deleted_at IS NULL
            AND unidade_id = ANY(:ids)
            AND (
              TRIM(COALESCE(fundamento_legal, '')) <> ''
              OR TRIM(COALESCE(info_complementar, '')) <> ''
            )
        )
        SELECT 
          ctc.total_com_clausulas,
          ct.total_contratos,
          ROUND(100.0 * ctc.total_com_clausulas / NULLIF(ct.total_contratos, 0), 2) AS percentual_com_clausulas
        FROM contratos_com_clausulas ctc, contratos_totais ct;
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    row = result.mappings().first() or {}

    data = {
        "titulo": "Contratos com Cláusulas",
        "subtitulo": "Percentual de contratos com cláusulas preenchidas",
        "total_com_clausulas": row.get("total_com_clausulas", 0) or 0,
        "total_contratos": row.get("total_contratos", 0) or 0,
        "percentual_com_clausulas": float(row.get("percentual_com_clausulas", 0.0) or 0.0)
    }

    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi8")
async def get_dashboard_contratos_por_estado(
    db: AsyncSession = Depends(get_session_contratos)
):
    query = """
        WITH estados AS (
          SELECT * FROM (VALUES
            (11, 'RO'), (12, 'AC'), (13, 'AM'), (14, 'RR'), (15, 'PA'), (16, 'AP'), (17, 'TO'),
            (21, 'MA'), (22, 'PI'), (23, 'CE'), (24, 'RN'), (25, 'PB'), (26, 'PE'),
            (27, 'AL'), (28, 'SE'), (29, 'BA'),
            (31, 'MG'), (32, 'ES'), (33, 'RJ'), (35, 'SP'),
            (41, 'PR'), (42, 'SC'), (43, 'RS'),
            (50, 'MS'), (51, 'MT'), (52, 'GO'), (53, 'DF')
          ) AS e(estado_id, uf)
        )
        SELECT 
          e.uf,
          COUNT(DISTINCT c.id) AS total_contratos
        FROM contratos c
        JOIN unidades u ON u.id = c.unidade_id
        JOIN municipios m ON m.id = u.municipio_id
        JOIN estados e ON e.estado_id = m.estado_id
        WHERE c.deleted_at IS null and c.unidade_id is not null
        GROUP BY e.uf
        ORDER BY total_contratos DESC;
    """
    result = await db.execute(text(query))
    rows = result.mappings().all() or []

    estados = [
        {
            "uf": row.get("uf"),
            "total_contratos": row.get("total_contratos", 0) or 0
        }
        for row in rows
    ]

    data = {
        "titulo": "Contratos por Estado",
        "subtitulo": "Total de contratos por UF",
        "estados": estados
    }

    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi9")
async def get_dashboard_calendar_vencimentos(
    db: AsyncSession = Depends(get_session_contratos)
):
    query = """
        SELECT
            c.id AS contrato_id,
            c.numero AS contrato_numero,
            c.vigencia_fim AS data_fim,
            c.unidade_id, 
            c.valor_inicial,
            c.valor_global,
            c.objeto
        FROM contratos c
        WHERE
            c.vigencia_fim IS NOT NULL
            AND CAST(c.vigencia_fim AS DATE) BETWEEN '2025-01-01' AND '2025-12-31'
            AND c.unidade_id = 16617
        ORDER BY c.vigencia_fim
    """
    
    result = await db.execute(text(query))
    rows = result.mappings().all() or []
    
    # Group contracts by end date
    contratos_por_data = {}
    for row in rows:
        data_fim = row.get("data_fim")
        if data_fim:
            data_fim_str = data_fim.strftime('%Y-%m-%d') if hasattr(data_fim, 'strftime') else str(data_fim)
            if data_fim_str not in contratos_por_data:
                contratos_por_data[data_fim_str] = []
            contratos_por_data[data_fim_str].append({
                'contrato_id': row.get("contrato_id"),
                'contrato_numero': row.get("contrato_numero"),
                'data_fim': data_fim_str,
                'unidade_id': row.get("unidade_id"),
                'valor_inicial': row.get("valor_inicial"),
                'valor_global': row.get("valor_global"),
                'objeto': row.get("objeto")
            })
    
    # Format for calendar chart
    calendar_data = []
    for data, contratos in contratos_por_data.items():
        calendar_data.append([data, len(contratos), contratos])
    
    data = {
        'titulo': 'Calendário de Vencimentos 2025',
        'subtitulo': 'Contratos que vencem por data',
        'calendar_data': calendar_data,
        'total_contratos': len(rows)
    }
    
    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi10")
async def get_dashboard_kpi10(
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
            "titulo": "Contratos com Valor Global Maior que Inicial",
            "subtitulo": "Análise de contratos vigentes com aditivos de valor",
            "contratos": []
        }

    query = """
        SELECT
            c.id AS contrato_id,
            c.unidade_id,
            c.numero,
            COALESCE(CAST(c.valor_acumulado AS DECIMAL), 0) AS valor_acumulado,
            COALESCE(CAST(c.valor_inicial  AS DECIMAL), 0) AS valor_inicial,
            COALESCE(CAST(c.valor_global  AS DECIMAL), 0) AS valor_global,
            (CAST(c.valor_global AS DECIMAL) - CAST(c.valor_inicial AS DECIMAL)) AS diferenca_valores,
            (
                (CAST(c.valor_global AS DECIMAL) - CAST(c.valor_inicial AS DECIMAL))
                / NULLIF(CAST(c.valor_inicial AS DECIMAL), 0)
            ) * 100 AS percentual_diferenca,
            COUNT(ce.empenho_id) AS total_empenhos,
            SUM(CAST(e.empenhado  AS DECIMAL)) AS total_valor_empenhado
        FROM contratos AS c
        JOIN contratoempenhos AS ce ON c.id = ce.contrato_id
        JOIN empenhos AS e ON ce.empenho_id = e.id
        WHERE
            c.unidade_id = ANY(:ids) 
            AND c.deleted_at IS NULL
            AND CAST(c.vigencia_fim AS DATE) >= CURRENT_DATE
            AND CAST(c.valor_inicial AS DECIMAL) < CAST(c.valor_global AS DECIMAL)
        GROUP BY
            c.id,
            c.unidade_id,
            c.numero,
            c.valor_acumulado,
            c.valor_inicial,
            c.valor_global, 
            c.vigencia_fim	
        ORDER BY
            total_empenhos DESC;
    """
    
    result = await db.execute(text(query), {"ids": ids_uasg})
    rows = result.mappings().all() or []

    contratos = [
        {
            "contrato_id": row.get("contrato_id"),
            "unidade_id": row.get("unidade_id"),
            "numero": row.get("numero"),
            "valor_acumulado": float(row.get("valor_acumulado", 0.0) or 0.0),
            "valor_inicial": float(row.get("valor_inicial", 0.0) or 0.0),
            "valor_global": float(row.get("valor_global", 0.0) or 0.0),
            "diferenca_valores": float(row.get("diferenca_valores", 0.0) or 0.0),
            "percentual_diferenca": float(row.get("percentual_diferenca", 0.0) or 0.0),
            "total_empenhos": row.get("total_empenhos"),
            "total_valor_empenhado": float(row.get("total_valor_empenhado", 0.0) or 0.0)
        }
        for row in rows
    ]

    data = {
        "titulo": "Contratos com Valor Global Maior que Inicial",
        "subtitulo": "Análise de contratos vigentes com aditivos de valor",
        "contratos": contratos
    }
    
    # logger.info(f"Returning JSON: {data}")
    return data

@router.get("/kpis/kpi11")
async def get_dashboard_kpi11(
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
            "titulo": "Contratos Rescindidos",
            "subtitulo": "Análise de percentual de contratos rescindidos",
            "total_contratos": 0,
            "rescindidos": 0,
            "percentual_rescindidos": 0.0
        }

    query = """
        WITH total_contratos AS (
          SELECT COUNT(DISTINCT id) AS total
          FROM contratos
          WHERE unidade_id = ANY(:ids)
        ),
        rescindidos AS (
          SELECT COUNT(DISTINCT contrato_id) AS rescindidos
          FROM contratohistorico
          WHERE tipo_id = 191
            AND unidade_id = ANY(:ids)
        )
        SELECT 
          rescindidos,
          total,
          ROUND(100.0 * rescindidos / NULLIF(total, 0), 2) AS percentual_rescindidos
        FROM rescindidos, total_contratos;
    """
    
    result = await db.execute(text(query), {"ids": ids_uasg})
    row = result.mappings().first()

    if not row:
        return {
            "titulo": "Contratos Rescindidos",
            "subtitulo": "Análise de percentual de contratos rescindidos",
            "total_contratos": 0,
            "rescindidos": 0,
            "percentual_rescindidos": 0.0
        }

    data = {
        "titulo": "Contratos Rescindidos",
        "subtitulo": "Análise de percentual de contratos rescindidos",
        "total_contratos": int(row.get("total", 0) or 0),
        "rescindidos": int(row.get("rescindidos", 0) or 0),
        "percentual_rescindidos": float(row.get("percentual_rescindidos", 0.0) or 0.0)
    }
    
    # logger.info(f"KPI 11 - Returning JSON: {data}")
    return data

@router.get("/kpis/kpi12")
async def get_dashboard_kpi12(
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
            "titulo": "Análise de Vigência de Contratos",
            "subtitulo": "Duração média de vigência e tempo de execução",
            "total_contratos": 0,
            "media_anos_vigencia": 0,
            "media_meses_vigencia": 0.0,
            "media_dias_execucao": 0.0
        }

    query = """
        SELECT
            COUNT(*) AS total_contratos_inativos,
            FLOOR(AVG(EXTRACT(YEAR FROM AGE(vigencia_fim, vigencia_inicio)))) AS media_anos_vigencia,
            ROUND(AVG(EXTRACT(MONTH FROM AGE(vigencia_fim, vigencia_inicio)))) AS media_meses_vigencia,
            ROUND(AVG((vigencia_inicio::date - data_assinatura::date))) AS media_dias_execucao
        FROM contratos
        WHERE unidade_id = ANY(:ids)
          AND vigencia_inicio IS NOT NULL
          AND data_assinatura IS NOT NULL;
    """
    
    result = await db.execute(text(query), {"ids": ids_uasg})
    row = result.mappings().first()

    if not row:
        return {
            "titulo": "Análise de Vigência de Contratos",
            "subtitulo": "Duração média de vigência e tempo de execução",
            "total_contratos": 0,
            "media_anos_vigencia": 0,
            "media_meses_vigencia": 0.0,
            "media_dias_execucao": 0.0
        }

    data = {
        "titulo": "Análise de Vigência de Contratos",
        "subtitulo": "Duração média de vigência e tempo de execução",
        "total_contratos": int(row.get("total_contratos_inativos", 0) or 0),
        "media_anos_vigencia": int(row.get("media_anos_vigencia", 0) or 0),
        "media_meses_vigencia": float(row.get("media_meses_vigencia", 0.0) or 0.0),
        "media_dias_execucao": float(row.get("media_dias_execucao", 0.0) or 0.0)
    }
    
    # logger.info(f"KPI 12 - Returning JSON: {data}")
    return data