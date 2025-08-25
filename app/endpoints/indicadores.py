from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.templates import templates
from app.db.session import get_session_contratos
from app.utils.spa_utils import spa_route_handler, get_page_scripts, add_spa_context
from app.utils.session_utils import get_uasgs_str
from app.dao.unidade_dao import get_unidades_by_codigo
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/indicadores", response_class=HTMLResponse)
async def indicadores(request: Request):
    # Check if user is logged in
    cpf = request.session.get("cpf")
    if not cpf:
        return RedirectResponse(url="/login?next=/indicadores")
    
    # Criar contexto
    context = {
        "request": request,
        "template_name": "indicadores"
    }
    
    # Adicionar contexto SPA
    context = add_spa_context(context, request)
    
    # Usar o handler SPA
    return spa_route_handler(
        template_name="indicadores.html",
        context=context,
        templates=templates,
        request=request,
        title="Indicadores - Compras Executivo",
        scripts=get_page_scripts("indicadores")
    )

@router.get("/indicadores/mapa-estados")
async def get_indicadores_mapa_estados(
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

    return {
        "estados": estados
    }

@router.get("/indicadores/contratos-por-regiao")
async def get_indicadores_contratos_por_regiao(
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

    return {
        "regioes": regioes
    }

@router.get("/indicadores/contratos-por-tipo")
async def get_indicadores_contratos_por_tipo(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "tipos_contratacao": []
        }

    query = """
        SELECT
          c.tipo_id,
          COALESCE(ci.descricao, 'Sem descrição') AS descricao,
          COALESCE(ci.descres,  '')               AS descres,
          COUNT(*)                                 AS qt_contratos
        FROM contratos c
        LEFT JOIN codigoitens ci
               ON ci.id = c.tipo_id
        WHERE c.unidade_id = ANY(:unidade_ids)
        GROUP BY c.tipo_id, ci.descricao, ci.descres
        ORDER BY qt_contratos DESC, descricao;
    """
    result = await db.execute(text(query), {"unidade_ids": ids_uasg})
    rows = result.mappings().all() or []

    tipos_contratacao = [
        {
            "tipo": row.get("descricao") or "Sem descrição",
            "tipo_resumo": row.get("descres") or "",
            "total_contratos": row.get("qt_contratos", 0) or 0
        }
        for row in rows
    ]

    return {
        "tipos_contratacao": tipos_contratacao
    }

@router.get("/indicadores/contratos-com-aditivos")
async def get_indicadores_contratos_com_aditivos(
    db: AsyncSession = Depends(get_session_contratos)
):
    query = """
        SELECT
          COUNT(DISTINCT ch.contrato_id) FILTER (WHERE ch.tipo_id IS NOT NULL AND cit.descricao ILIKE '%aditivo%') AS contratos_com_aditivos,
          COUNT(DISTINCT ch.contrato_id) AS total_contratos_ativos
        FROM contratohistorico ch
        LEFT JOIN codigoitens cit ON cit.id = ch.tipo_id
        WHERE ch.deleted_at IS NULL
          AND CURRENT_DATE BETWEEN ch.vigencia_inicio AND ch.vigencia_fim;
    """
    result = await db.execute(text(query))
    row = result.mappings().first() or {}

    contratos_com_aditivos = row.get("contratos_com_aditivos", 0) or 0
    total_contratos_ativos = row.get("total_contratos_ativos", 0) or 0
    contratos_sem_aditivos = total_contratos_ativos - contratos_com_aditivos

    tipos_contratacao = [
        {
            "tipo": "Com Aditivos",
            "total_contratos": contratos_com_aditivos
        },
        {
            "tipo": "Sem Aditivos", 
            "total_contratos": contratos_sem_aditivos
        }
    ]

    return {
        "tipos_contratacao": tipos_contratacao
    }

@router.get("/indicadores/contratos-por-area")
async def get_indicadores_contratos_por_area(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
   
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "categorias": []
        }

    query = """
        -- Per-grupo count of distinct contracts (corrected for unique contracts)
        SELECT
          ci.grupo_id                  AS catmatsergrupo_id,
          COALESCE(g.descricao, 'Sem grupo') AS descricao,
          COUNT(DISTINCT c.id)         AS itens_qtd
        FROM contratos            c
        JOIN contratoitens        ci ON ci.contrato_id = c.id
        LEFT JOIN catmatsergrupos g  ON g.id = ci.grupo_id
        WHERE
          -- OR: multiple unidades (pass an int[] param)
          c.unidade_id = ANY(:ids)
        GROUP BY ci.grupo_id, g.descricao
        ORDER BY itens_qtd DESC, descricao
        LIMIT 10;
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    rows = result.mappings().all() or []

    categorias = [
        {
            "categoria_nome": row.get("descricao") or "Sem grupo",
            "categoria_id": row.get("catmatsergrupo_id"),
            "total_contratos": row.get("itens_qtd", 0) or 0
        }
        for row in rows
    ]

    return {
        "categorias": categorias
    }

@router.get("/indicadores/cronograma-vencimentos")
async def get_indicadores_cronograma_vencimentos(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "titulo": "Cronograma de Vencimentos 2025",
            "subtitulo": "Contratos que vencem por data",
            "calendar_data": [],
            "total_contratos": 0
        }

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
            AND c.unidade_id = ANY(:ids)
            AND c.deleted_at IS NULL
        ORDER BY c.vigencia_fim
    """
    
    result = await db.execute(text(query), {"ids": ids_uasg})
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

    return {
        "titulo": "Cronograma de Vencimentos 2025",
        "subtitulo": "Contratos que vencem por data com filtro de UASG",
        "calendar_data": calendar_data,
        "total_contratos": len(rows)
    }

@router.get("/indicadores/top-fornecedores")
async def get_indicadores_top_fornecedores(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "titulo": "Top Fornecedores",
            "subtitulo": "Nenhum dado encontrado",
            "fornecedores": []
        }

    query = """
        SELECT
            f.id AS fornecedor_id,
            f.nome AS fornecedor_nome,
            COUNT(DISTINCT c.id) as total_contratos,
            ROUND(SUM(COALESCE(
                CASE WHEN c.valor_global ~ '^[0-9.,]+$' THEN c.valor_global::numeric ELSE 0 END,
                CASE WHEN c.valor_inicial ~ '^[0-9.,]+$' THEN c.valor_inicial::numeric ELSE 0 END,
                0
            ))) AS valor_total_contratos
        FROM contratos c
        JOIN fornecedores f ON f.id = c.fornecedor_id
        WHERE c.unidade_id = ANY(:ids)
          AND c.deleted_at IS NULL
          AND (
            (c.valor_global IS NOT NULL AND c.valor_global ~ '^[0-9.,]+$') OR 
            (c.valor_inicial IS NOT NULL AND c.valor_inicial ~ '^[0-9.,]+$')
          )
        GROUP BY f.id, f.nome
        ORDER BY valor_total_contratos DESC 
        LIMIT 10;
    """
    result = await db.execute(text(query), {"ids": ids_uasg})
    rows = result.mappings().all() or []

    fornecedores = [
        {
            "fornecedor_id": row.get("fornecedor_id") or 0,
            "fornecedor_nome": row.get("fornecedor_nome") or "Desconhecido",
            "total_contratos": row.get("total_contratos") or 0,
            "valor_total_contratos": float(row.get("valor_total_contratos") or 0.0)
        }
        for row in rows
    ]

    return {
        "titulo": "Top Fornecedores",
        "subtitulo": "Top 10 fornecedores por valor total de contratos",
        "fornecedores": fornecedores
    }
