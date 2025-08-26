from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.templates import templates
from app.db.session import get_session_contratos
from app.utils.spa_utils import spa_route_handler, get_page_scripts, add_spa_context
from app.utils.session_utils import get_uasgs_str
from app.dao.unidade_dao import get_unidades_by_codigo
from app.dao.contratos_variacoes_dao import ContratosVariacoesDAO
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
            c.objeto,
            c.prorrogavel
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
                'objeto': row.get("objeto"),
                'prorrogavel': row.get("prorrogavel")
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

@router.get("/indicadores/contratos-variacoes-significativas")
async def get_indicadores_contratos_variacoes_significativas(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos),
    limite_percentual: float = 0.25,
    limite_registros: int = 10
):
    """
    Endpoint para obter contratos com variações significativas entre valor inicial e global
    
    Args:
        limite_percentual: Limite mínimo de variação percentual (padrão: 0.25 = 25%)
        limite_registros: Número máximo de registros retornados (padrão: 10)
    """
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # 1. Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "titulo": "Contratos com Variações Significativas",
            "subtitulo": "Nenhum dado encontrado",
            "contratos": [],
            "total_contratos": 0,
            "limite_percentual_usado": limite_percentual
        }

    try:
        # Usar o DAO para obter os contratos com variações significativas
        logger.info(f"Buscando contratos com variações para UASGs: {ids_uasg}")
        logger.info(f"Parâmetros: limite_percentual={limite_percentual}, limite_registros={limite_registros}")
        
        # Usar uma query direta já que o DAO tem problemas com async sessions
        # Construir condições WHERE dinamicamente
        where_conditions = []
        params = {
            "limite_percentual": limite_percentual,
            "limite_registros": limite_registros
        }
        
        # Filtro por unidades
        if ids_uasg:
            where_conditions.append("c.unidade_id = ANY(:unidade_ids)")
            params["unidade_ids"] = ids_uasg
        
        # Manter o filtro padrão de 2021
        where_conditions.append("c.vigencia_inicio > '01-01-2021'")
        
        # Construir a query dinâmica
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        query = text(f"""
            WITH conv AS (
              SELECT
                c.id,
                c.numero,
                c.unidade_id,
                c.valor_inicial::numeric AS valor_inicial,
                c.valor_global::numeric  AS valor_global,
                c.vigencia_inicio,
                c.vigencia_fim
              FROM contratos c
              WHERE {where_clause}
                AND c.valor_inicial IS NOT NULL
                AND c.valor_inicial <> ''
                AND c.valor_global  IS NOT NULL
                AND c.valor_global  <> ''
            )
            SELECT
              id                    AS contrato_id,
              numero                AS contrato_numero,
              unidade_id,
              valor_inicial,
              valor_global,
              vigencia_inicio,
              vigencia_fim,
              (valor_global - valor_inicial)                                   AS delta,
              CASE WHEN valor_inicial > 0
                   THEN (valor_global - valor_inicial) / valor_inicial
              END                                                              AS delta_pct
            FROM conv
            WHERE valor_inicial > 0
              AND (valor_global - valor_inicial) / valor_inicial >= :limite_percentual
            ORDER BY delta DESC NULLS last 
            LIMIT :limite_registros
        """)
        
        result = await db.execute(query, params)
        rows = result.mappings().all() or []
        contratos = [dict(row) for row in rows]
        
        logger.info(f"Contratos encontrados: {len(contratos) if contratos else 0}")

        # Formatar os dados para o frontend
        contratos_formatados = []
        for contrato in contratos:
            contratos_formatados.append({
                "contrato_id": contrato.get("contrato_id"),
                "contrato_numero": contrato.get("contrato_numero"),
                "unidade_id": contrato.get("unidade_id"),
                "valor_inicial": float(contrato.get("valor_inicial", 0)),
                "valor_global": float(contrato.get("valor_global", 0)),
                "delta": float(contrato.get("delta", 0)),
                "delta_pct": float(contrato.get("delta_pct", 0)),
                "delta_pct_formatado": f"{float(contrato.get('delta_pct', 0)) * 100:.2f}%",
                "vigencia_inicio": contrato.get("vigencia_inicio"),
                "vigencia_fim": contrato.get("vigencia_fim")
            })

        return {
            "titulo": "Contratos com Variações Significativas",
            "subtitulo": f"Contratos com variação ≥ {limite_percentual * 100:.0f}% entre valor inicial e global",
            "contratos": contratos_formatados,
            "total_contratos": len(contratos_formatados),
            "limite_percentual_usado": limite_percentual,
            "limite_registros_usado": limite_registros
        }

    except Exception as e:
        logger.error(f"Erro ao buscar contratos com variações significativas: {str(e)}")
        logger.error(f"Tipo do erro: {type(e).__name__}")
        logger.error(f"UASGs: {ids_uasg}")
        logger.error(f"Parâmetros: limite_percentual={limite_percentual}, limite_registros={limite_registros}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@router.get("/indicadores/projecao-valores-mensais")
async def get_indicadores_projecao_valores_mensais(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    """
    Endpoint para obter projeção de valores mensais dos contratos para os próximos 6 meses
    
    Esta função calcula o valor mensal planejado dos contratos baseado na duração
    e distribui os valores apenas dentro do período de vigência dos contratos.
    """
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "titulo": "Projeção de Valores Mensais",
            "subtitulo": "Nenhum dado encontrado",
            "projecao_mensal": [],
            "total_valor_projetado": 0
        }

    try:
        logger.info(f"Buscando projeção de valores mensais para UASGs: {ids_uasg}")
        
        # Query principal com múltiplas unidades
        query = text("""
            WITH contratos_base AS (
              SELECT
                c.id                         AS contrato_id,
                c.numero,
                c.unidade_id,
                c.vigencia_inicio::date      AS dt_ini,
                c.vigencia_fim::date         AS dt_fim,
                c.valor_global::numeric      AS valor_global
              FROM contratos c
              WHERE c.unidade_id = ANY(:unidade_ids)
                AND c.valor_global IS NOT NULL AND c.valor_global <> ''
                AND c.vigencia_inicio IS NOT NULL
                AND c.vigencia_fim    IS NOT NULL
                AND c.deleted_at IS NULL
            ),
            dur AS (  -- total de meses do contrato
              SELECT
                contrato_id, numero, unidade_id, dt_ini, dt_fim, valor_global,
                GREATEST(
                  1,
                  (EXTRACT(YEAR FROM dt_fim) - EXTRACT(YEAR FROM dt_ini)) * 12
                  + (EXTRACT(MONTH FROM dt_fim) - EXTRACT(MONTH FROM dt_ini)) + 1
                ) AS meses_total
              FROM contratos_base
            ),
            rate AS ( -- valor mensal planejado
              SELECT
                contrato_id, numero, unidade_id, dt_ini, dt_fim, valor_global, meses_total,
                (valor_global / NULLIF(meses_total, 0)) AS valor_mensal_planejado
              FROM dur
            ),
            horiz AS ( -- próximos 6 meses
              SELECT
                generate_series(
                  date_trunc('month', current_date) + interval '1 month',
                  date_trunc('month', current_date) + interval '6 month',
                  interval '1 month'
                )::date AS mes
            ),
            alloc AS ( -- alocar somente dentro da vigência
              SELECT
                h.mes,
                r.contrato_id,
                CASE
                  WHEN h.mes BETWEEN date_trunc('month', r.dt_ini) AND date_trunc('month', r.dt_fim)
                  THEN r.valor_mensal_planejado
                  ELSE 0
                END AS valor_previsto
              FROM horiz h
              CROSS JOIN rate r
            )
            -- Resultado mensal
            SELECT 
                mes, 
                SUM(valor_previsto) AS valor_previsto
            FROM alloc
            GROUP BY mes
            ORDER BY mes;
        """)
        
        result = await db.execute(query, {"unidade_ids": ids_uasg})
        rows = result.mappings().all() or []
        
        logger.info(f"Dados de projeção encontrados: {len(rows)} meses")

        # Formatar os dados para o frontend
        projecao_mensal = []
        total_valor_projetado = 0
        
        for row in rows:
            mes = row.get("mes")
            valor_previsto = float(row.get("valor_previsto") or 0)
            
            # Formatar o mês para exibição
            mes_formatado = mes.strftime('%B %Y') if mes else "Indefinido"
            mes_abrev = mes.strftime('%m/%Y') if mes else "Indefinido"
            
            projecao_mensal.append({
                "mes": mes.isoformat() if mes else None,
                "mes_formatado": mes_formatado,
                "mes_abreviado": mes_abrev,
                "valor_previsto": valor_previsto,
                "valor_previsto_formatado": f"R$ {valor_previsto:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            })
            
            total_valor_projetado += valor_previsto

        return {
            "titulo": "Projeção de Valores Mensais",
            "subtitulo": "Valores previstos para os próximos 6 meses baseados na duração dos contratos",
            "projecao_mensal": projecao_mensal,
            "total_valor_projetado": total_valor_projetado,
            "total_valor_projetado_formatado": f"R$ {total_valor_projetado:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "periodo_inicio": projecao_mensal[0]["mes"] if projecao_mensal else None,
            "periodo_fim": projecao_mensal[-1]["mes"] if projecao_mensal else None
        }

    except Exception as e:
        logger.error(f"Erro ao buscar projeção de valores mensais: {str(e)}")
        logger.error(f"Tipo do erro: {type(e).__name__}")
        logger.error(f"UASGs: {ids_uasg}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@router.get("/indicadores/contratos-por-categoria")
async def get_indicadores_contratos_por_categoria(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    """
    Endpoint para obter contratos agrupados por categoria
    
    Retorna a contagem de contratos por categoria para as UASGs do usuário,
    considerando apenas contratos com vigência a partir de 2021.
    """
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "titulo": "Contratos por Categoria",
            "subtitulo": "Nenhum dado encontrado",
            "categorias": [],
            "total_contratos": 0
        }

    try:
        logger.info(f"Buscando contratos por categoria para UASGs: {ids_uasg}")
        
        # Query adaptada para múltiplas unidades - Valores de contratos por categoria (com participação no total)
        query = text("""
            SELECT
              ci.descricao                            AS categoria_descricao,
              COUNT(*)                                AS contratos_qtd,
              -- safe cast: treats '' as NULL before ::numeric
              SUM(NULLIF(btrim(c.valor_inicial),  '')::numeric)   AS total_valor_inicial,
              SUM(NULLIF(btrim(c.valor_global),   '')::numeric)   AS total_valor_global,
              SUM(NULLIF(btrim(c.valor_acumulado),'')::numeric)   AS total_valor_acumulado,
              -- % do total (sobre valor_acumulado)
              (
                SUM(NULLIF(btrim(c.valor_acumulado), '')::numeric)
                / NULLIF(SUM(SUM(NULLIF(btrim(c.valor_acumulado), '')::numeric)) OVER (), 0)
              )::numeric(12,4)                        AS pct_total_acumulado
            FROM contratos c
            JOIN codigoitens ci ON ci.id = c.categoria_id
            WHERE c.unidade_id = ANY(:unidade_ids)
              AND c.vigencia_inicio >= DATE '2021-01-01'
              AND c.deleted_at IS NULL
            GROUP BY c.categoria_id, ci.descricao
            ORDER BY total_valor_acumulado DESC NULLS LAST;
        """)
        
        result = await db.execute(query, {"unidade_ids": ids_uasg})
        rows = result.mappings().all() or []
        
        logger.info(f"Categorias encontradas: {len(rows)}")

        # Formatar os dados para o frontend
        categorias = []
        total_contratos = 0
        total_valor_acumulado_geral = 0
        
        for row in rows:
            total_valor_inicial = float(row.get("total_valor_inicial") or 0)
            total_valor_global = float(row.get("total_valor_global") or 0)
            total_valor_acumulado = float(row.get("total_valor_acumulado") or 0)
            pct_total_acumulado = float(row.get("pct_total_acumulado") or 0)
            contratos_qtd = row.get("contratos_qtd", 0) or 0
            
            categoria_data = {
                "categoria_nome": row.get("categoria_descricao") or "Sem categoria",
                "total_contratos": contratos_qtd,
                "total_valor_inicial": total_valor_inicial,
                "total_valor_global": total_valor_global,
                "total_valor_acumulado": total_valor_acumulado,
                "pct_total_acumulado": pct_total_acumulado,
                "total_valor_inicial_formatado": f"R$ {total_valor_inicial:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                "total_valor_global_formatado": f"R$ {total_valor_global:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                "total_valor_acumulado_formatado": f"R$ {total_valor_acumulado:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                "pct_total_acumulado_formatado": f"{pct_total_acumulado * 100:.2f}%"
            }
            categorias.append(categoria_data)
            total_contratos += contratos_qtd
            total_valor_acumulado_geral += total_valor_acumulado

        return {
            "titulo": "Contratos por Categoria",
            "subtitulo": f"Distribuição de {total_contratos} contratos por categoria desde 2021 com valores financeiros",
            "categorias": categorias,
            "total_contratos": total_contratos,
            "total_valor_acumulado_geral": total_valor_acumulado_geral,
            "total_valor_acumulado_geral_formatado": f"R$ {total_valor_acumulado_geral:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            "periodo_filtro": "A partir de 01/01/2021"
        }

    except Exception as e:
        logger.error(f"Erro ao buscar contratos por categoria: {str(e)}")
        logger.error(f"Tipo do erro: {type(e).__name__}")
        logger.error(f"UASGs: {ids_uasg}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@router.get("/indicadores/contratos-sem-empenhos")
async def get_indicadores_contratos_sem_empenhos(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    """
    Endpoint para obter contratos sem empenhos associados
    
    Retorna contratos que não possuem empenhos vinculados,
    considerando apenas contratos com vigência a partir de 2021.
    """
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "titulo": "Contratos sem Empenhos",
            "subtitulo": "Nenhum dado encontrado",
            "contratos": [],
            "total_contratos": 0
        }

    try:
        logger.info(f"Buscando contratos sem empenhos para UASGs: {ids_uasg}")
        
        # Query adaptada para múltiplas unidades
        query = text("""
            SELECT
              c.id                         AS contrato_id,
              c.numero                     AS contrato_numero,
              c.unidade_id,
              c.vigencia_fim,
              c.objeto,
              f.nome                       AS fornecedor_nome,
              c.valor_inicial::numeric     AS valor_inicial,
              c.valor_global::numeric      AS valor_global,
              c.valor_acumulado::numeric   AS valor_acumulado
            FROM contratos c
            LEFT JOIN contratoempenhos ce ON ce.contrato_id = c.id
            JOIN fornecedores f ON f.id = c.fornecedor_id
            WHERE ce.empenho_id IS NULL
              AND c.unidade_id = ANY(:unidade_ids)
              AND c.vigencia_inicio > '01-01-2021'
              AND c.deleted_at IS NULL
            ORDER BY c.vigencia_fim DESC, c.valor_acumulado::numeric DESC 
            LIMIT 10;
        """)
        
        result = await db.execute(query, {"unidade_ids": ids_uasg})
        rows = result.mappings().all() or []
        
        logger.info(f"Contratos sem empenhos encontrados: {len(rows)}")

        # Formatar os dados para o frontend
        contratos = []
        
        for row in rows:
            contratos.append({
                "contrato_id": row.get("contrato_id"),
                "contrato_numero": row.get("contrato_numero"),
                "unidade_id": row.get("unidade_id"),
                "vigencia_fim": row.get("vigencia_fim"),
                "objeto": row.get("objeto"),
                "fornecedor_nome": row.get("fornecedor_nome") or "Desconhecido",
                "valor_inicial": float(row.get("valor_inicial") or 0),
                "valor_global": float(row.get("valor_global") or 0),
                "valor_acumulado": float(row.get("valor_acumulado") or 0),
                "valor_inicial_formatado": f"R$ {float(row.get('valor_inicial') or 0):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                "valor_global_formatado": f"R$ {float(row.get('valor_global') or 0):,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
                "valor_acumulado_formatado": f"R$ {float(row.get('valor_acumulado') or 0):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            })

        return {
            "titulo": "Contratos sem Empenhos",
            "subtitulo": f"Top 10 contratos sem empenhos associados desde 2021",
            "contratos": contratos,
            "total_contratos": len(contratos),
            "periodo_filtro": "A partir de 01/01/2021",
            "observacao": "Contratos ordenados por data de vencimento e valor acumulado"
        }

    except Exception as e:
        logger.error(f"Erro ao buscar contratos sem empenhos: {str(e)}")
        logger.error(f"Tipo do erro: {type(e).__name__}")
        logger.error(f"UASGs: {ids_uasg}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@router.get("/indicadores/contratos-com-clausulas")
async def get_indicadores_contratos_com_clausulas(
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
):
    """
    Endpoint para obter contratos com cláusulas preenchidas
    Migrado de KPI7 para a nova arquitetura de indicadores
    """
    # Check if user has root scope - bypass UASG filtering
    user_scope = request.session.get("usuario_scope")
    
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

    if not ids_uasg:
        return {
            "titulo": "Contratos com Cláusulas",
            "subtitulo": "Nenhum dado encontrado",
            "tipos_contratacao": [
                {"tipo": "Com Cláusulas", "total_contratos": 0},
                {"tipo": "Sem Cláusulas", "total_contratos": 0}
            ],
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

    total_com_clausulas = row.get("total_com_clausulas", 0) or 0
    total_contratos = row.get("total_contratos", 0) or 0
    contratos_sem_clausulas = total_contratos - total_com_clausulas

    tipos_contratacao = [
        {
            "tipo": "Com Cláusulas",
            "total_contratos": total_com_clausulas
        },
        {
            "tipo": "Sem Cláusulas", 
            "total_contratos": contratos_sem_clausulas
        }
    ]

    return {
        "titulo": "Contratos com Cláusulas",
        "subtitulo": "Percentual de contratos com cláusulas preenchidas",
        "tipos_contratacao": tipos_contratacao,
        "total_com_clausulas": total_com_clausulas,
        "total_contratos": total_contratos,
        "percentual_com_clausulas": float(row.get("percentual_com_clausulas", 0.0) or 0.0)
    }
