from datetime import date, timedelta
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

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/dashboard", response_class=HTMLResponse)
async def render_dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

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
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN vigencia_fim > CURRENT_DATE THEN 1 ELSE 0 END) AS vigentes,
            SUM(CASE WHEN vigencia_fim <= CURRENT_DATE THEN 1 ELSE 0 END) AS finalizados,
            SUM(CASE WHEN vigencia_fim <= CURRENT_DATE + INTERVAL '120 days' THEN 1 ELSE 0 END) AS dias120,
            SUM(CASE WHEN vigencia_fim <= CURRENT_DATE + INTERVAL '90 days' THEN 1 ELSE 0 END) AS dias90,
            SUM(CASE WHEN vigencia_fim <= CURRENT_DATE + INTERVAL '45 days' THEN 1 ELSE 0 END) AS dias45,
            MIN(EXTRACT(YEAR FROM data_assinatura)) AS ano_min
        FROM contratos
        WHERE unidade_id = ANY(:ids)
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    row = result.mappings().first()

    total = row["total"] or 0
    vigentes = row["vigentes"] or 0
    finalizados = row["finalizados"] or 0
    dias120 = row["dias120"] or 0
    dias90 = row["dias90"] or 0
    dias45 = row["dias45"] or 0
    criticos = dias120 + dias90 + dias45
    outros = vigentes - criticos
    ano_min = int(row["ano_min"]) if row["ano_min"] else "XXXX"

    return {
        "titulo": "Contratos e Renovações",
        "subtitulo": f"Total de contratos desde {ano_min}",
        "total": total,
        "labelTotal": "Contratos",
        "vigentes": vigentes,
        "finalizados": finalizados,
        "criticos": criticos,
        "dias120": dias120,
        "dias90": dias90,
        "dias45": dias45,
        "outros": max(outros, 0)
    }

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
        SELECT EXTRACT(YEAR FROM data_assinatura) AS ano, COUNT(*) AS total
        FROM contratos
        WHERE unidade_id = ANY(:ids)
          AND data_assinatura IS NOT NULL
        GROUP BY ano
        ORDER BY ano
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
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

    # 2. Soma contratos + aditivos agrupados por ano usando contratohistorico
    query = """
        WITH base AS (
            SELECT
                EXTRACT(YEAR FROM vigencia_inicio) AS ano,
                valor_global::numeric AS contrato_valor,
                0::numeric AS aditivo_valor
            FROM contratohistorico
            WHERE unidade_id = ANY(:ids)
              AND vigencia_inicio IS NOT NULL

            UNION ALL

            SELECT
                EXTRACT(YEAR FROM COALESCE(vigencia_inicio, data_assinatura, data_publicacao)) AS ano,
                0::numeric AS contrato_valor,
                valor_global::numeric AS aditivo_valor
            FROM contratohistorico
            WHERE unidade_id = ANY(:ids)
              AND COALESCE(vigencia_inicio, data_assinatura, data_publicacao) IS NOT NULL
        )
        SELECT
            ano,
            SUM(contrato_valor) AS contrato,
            SUM(aditivo_valor) AS aditivo
        FROM base
        GROUP BY ano
        ORDER BY ano DESC
        LIMIT 6
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    rows = result.fetchall()

    # Ordenar por ano ASC para o gráfico
    rows = sorted(rows, key=lambda r: int(r.ano))

    return {
        "anos": [str(int(r.ano)) for r in rows],
        "coluna": [float(r.contrato or 0) for r in rows],
        "linha": [float(r.aditivo or 0) for r in rows]
    }

@router.get("/dashboard/atividades")
async def get_proximas_atividades(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
) -> Dict[str, Any]:
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")

    # Mapeia UASGs para seus IDs
    result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasg)"),
        {"uasg": uasgs}
    )
    ids = [row.id for row in result.fetchall()]
    if not ids:
        return {"atividades": []}

    # Usa a materialized view para obter a vigência mais recente
    query = """
        SELECT
            c.id,
            c.numero,
            EXTRACT(YEAR FROM c.data_assinatura) AS ano,
            COALESCE(v.ultima_vigencia, c.vigencia_fim) AS fim
        FROM contratos c
        LEFT JOIN ultima_vigencia_por_contrato v ON v.contrato_id = c.id
        WHERE c.unidade_id = ANY(:ids)
    """
    result = await db.execute(text(query), {"ids": ids})
    contratos = result.fetchall()

    atividades = []
    hoje = date.today()
    dias_alerta = [45, 90, 120]

    for contrato in contratos:
        fim = contrato.fim
        if not fim or fim <= hoje:
            continue

        for dias in dias_alerta:
            data_alvo = fim - timedelta(days=dias)
            if data_alvo <= hoje:
                continue

            restante_dias = (data_alvo - hoje).days
            meses, dias_res = divmod(restante_dias, 30)

            if restante_dias > 30:
                restante = f"(em {meses} mês{'es' if meses != 1 else ''}, {dias_res} dia{'s' if dias_res != 1 else ''})"
            else:
                restante = f"(em {restante_dias} dia{'s' if restante_dias != 1 else ''})"

            data_fmt = format_date(data_alvo, "d 'de' MMMM", locale="pt_BR").capitalize()

            ano = str(contrato.ano)
            numero = str(contrato.numero)

            # Garante que o número já não termina com o ano, mesmo em formatos compostos
            if numero.endswith(f"/{ano}") or f"/{ano}/" in numero:
                contrato_fmt = numero
            else:
                contrato_fmt = f"{numero}/{ano}"

            atividades.append({
                "data": data_fmt,
                "restante": restante,
                "descricao": f"Renovação de <b>{dias} dias</b> para o contrato <b>{contrato_fmt}</b>"
            })

    atividades.sort(key=lambda x: x["data"])
    return {"atividades": atividades[:25]}
