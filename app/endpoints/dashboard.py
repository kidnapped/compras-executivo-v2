from datetime import date, timedelta, datetime
from typing import Any, Dict, List, Optional
import json
import logging

from fastapi import APIRouter, Depends, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.templates import templates
from app.utils.session_utils import get_uasgs_str
from app.db.session import get_session_contratos, get_session_blocok
from app.utils.static_loader import collect_static_files
from app.dao.unidade_dao import get_unidades_by_codigo
from app.utils.spa_utils import spa_route_handler, get_page_scripts, add_spa_context
from app.core import config as app_config

import logging
import os

logger = logging.getLogger(__name__)

# Global variable to cache the FontAwesome lookup data
_fontawesome_lookup = None

def load_fontawesome_lookup():
    """Load the FontAwesome lookup data from JSON file"""
    global _fontawesome_lookup
    if _fontawesome_lookup is None:
        try:
            # Get the path to the JSON file
            json_path = os.path.join(
                os.path.dirname(__file__), 
                "..", "..", "..", "static", "js", "contrato", "naturezadespesa_lookup_fa.json"
            )
            
            with open(json_path, 'r', encoding='utf-8') as f:
                lookup_data = json.load(f)
            
            # Convert to dictionary for faster lookup
            _fontawesome_lookup = {
                item['naturezadespesa_id']: item['FA'] 
                for item in lookup_data
            }
            
            logger.info(f"Loaded {len(_fontawesome_lookup)} FontAwesome icons from lookup file")
            
        except Exception as e:
            logger.error(f"Error loading FontAwesome lookup file: {e}")
            _fontawesome_lookup = {}
    
    return _fontawesome_lookup

def get_fontawesome_icon(naturezadespesa_id):
    """
    Get FontAwesome icon class for a given naturezadespesa_id
    
    Args:
        naturezadespesa_id: The ID to look up
        
    Returns:
        str: FontAwesome icon class (e.g., "fas fa-coins") or default icon
    """
    if naturezadespesa_id is None:
        return "fas fa-question-circle"
    
    lookup = load_fontawesome_lookup()
    return lookup.get(naturezadespesa_id, "fas fa-file-contract")

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set the logging level to INFO
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",  # Log format
    handlers=[
        logging.StreamHandler()  # Output logs to the console
    ]
)

router = APIRouter()

# Renderiza a página do dashboard
@router.get("/dashboard", response_class=HTMLResponse)
async def render_dashboard(
    request: Request, 
    db: AsyncSession = Depends(get_session_contratos)
):
    # Get UASG information from session
    uasgs = get_uasgs_str(request)
    uasg_info = None
    
    if uasgs:
        # Get UASG details for all user's UASGs via DAO
        try:
            unidades = await get_unidades_by_codigo(db, uasgs, return_type="codigo_nome")
            if unidades:
                if len(unidades) == 1:
                    # Single UASG
                    u = unidades[0]
                    uasg_info = {
                        "codigo": u["codigo"],
                        "nome": u["nomeresumido"],
                        "display": f"{u['codigo']} - {u['nomeresumido']}",
                        "multiple": False,
                        "count": 1,
                    }
                else:
                    # Multiple UASGs - show count
                    codes = [str(u["codigo"]) for u in unidades]
                    uasg_info = {
                        "codigo": codes[0],  # Primary UASG
                        "nome": unidades[0]["nomeresumido"],
                        "display": f"{len(unidades)} UASGs ({', '.join(codes[:2])}{'...' if len(codes) > 2 else ''})",
                        "multiple": True,
                        "count": len(unidades),
                        "all_uasgs": [{"codigo": u["codigo"], "nome": u["nomeresumido"]} for u in unidades],
                    }
        except Exception as e:
            logger.warning(f"Error fetching UASG info: {e}")
    
    # Criar contexto
    context = {
        "request": request,
        "template_name": "dashboard",
        "uasg_info": uasg_info
    }
    
    # Adicionar contexto SPA
    context = add_spa_context(context, request)
    
    # Usar o handler SPA
    return spa_route_handler(
        template_name="dashboard.html",
        context=context,
        templates=templates,
        request=request,
        title="Dashboard - Compras Executivo",
        scripts=get_page_scripts("dashboard")
    )

# Endpoints do dashboard para contratos
@router.get("/dashboard/contratos")
async def get_dashboard_contratos(
    request: Request,
    year_filters: Optional[str] = Query(None, description="Year filters as comma-separated string, e.g., '2023,2024'"),
    ano_filters: Optional[str] = Query(None, description="Ano filters as comma-separated string, e.g., '2023,2024'"),
    db: AsyncSession = Depends(get_session_contratos)
):
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")
    
    # 1. Descobre os ID_UASG com base nos códigos
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

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

    # 2. Build WHERE conditions
    where_conditions = ["c.unidade_id = ANY(:ids)"]
    
    # Add contract date filter: only contracts started after 2021-01-01
    where_conditions.append("c.vigencia_inicio >= DATE '2021-01-01'")
    
    # Handle both year_filters and ano_filters (frontend uses 'ano')
    year_filter_param = year_filters or ano_filters
    if year_filter_param:
        year_list = [y.strip() for y in year_filter_param.split(',') if y.strip().isdigit()]
        if year_list:
            year_conditions = [f"EXTRACT(YEAR FROM c.vigencia_inicio) = {year}" for year in year_list]
            where_conditions.append(f"({' OR '.join(year_conditions)})")
    
    where_clause = "WHERE " + " AND ".join(where_conditions)

    # 3. Executa a query principal
    query = f"""
        SELECT
  SUM(CASE
        WHEN c.vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days'
        THEN 1 ELSE 0
      END) AS ending_within_45_days,
  SUM(CASE
        WHEN c.vigencia_fim > CURRENT_DATE + INTERVAL '45 days'
         AND c.vigencia_fim <= CURRENT_DATE + INTERVAL '90 days'
        THEN 1 ELSE 0
      END) AS ending_within_90_days,
  SUM(CASE
        WHEN c.vigencia_fim > CURRENT_DATE + INTERVAL '90 days'
         AND c.vigencia_fim <= CURRENT_DATE + INTERVAL '120 days'
        THEN 1 ELSE 0
      END) AS ending_within_120_days,
  SUM(CASE
        WHEN c.vigencia_fim > CURRENT_DATE + INTERVAL '120 days'
        THEN 1 ELSE 0
      END) AS ending_after_120_days,
  COUNT(*) AS total_contracts,
  SUM(CASE
        WHEN CURRENT_DATE BETWEEN c.vigencia_inicio AND c.vigencia_fim
        THEN CAST(c.valor_global AS NUMERIC)
        ELSE 0.0
      END) AS total_valor_inicial
FROM contratos c
{where_clause}
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
        "subtitulo": "Total de contratos desde 2019",
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
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")

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
            COUNT(DISTINCT c.id) AS valores
        FROM 
            contratos AS c
        JOIN 
            unidades AS u ON c.unidadeorigem_id = u.id
        WHERE 
            c.data_assinatura IS NOT NULL
            AND c.vigencia_inicio >= DATE '2021-01-01'
            AND u.codigo = ANY(:uasg)
        GROUP BY 
            anos
        ORDER BY 
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
    ids_uasg = await get_unidades_by_codigo(db, uasgs, return_type="ids")
    if not ids_uasg:
        return {"anos": [], "coluna": [], "linha": []}

    # 2. Soma valor inicial dos contratos agrupado por ano
    # Use subquery to get newest 6 years, then order ascending
    query = text("""
      WITH newest_6_years AS (
        SELECT
          EXTRACT(YEAR FROM c.data_assinatura)::int AS ano,
          SUM(CAST(c.valor_inicial AS numeric))     AS contrato_valor,
          SUM(CAST(c.valor_global AS numeric))      AS valor_global
        FROM 
          contratos c
        WHERE 
          c.data_assinatura IS NOT NULL
          AND c.vigencia_inicio >= DATE '2021-01-01'
          AND c.unidadeorigem_id = ANY(:ids)
          AND c.valor_inicial IS NOT NULL
        GROUP BY 
          ano
        ORDER BY 
          ano DESC 
        LIMIT 6
      )
      SELECT 
        ano,
        contrato_valor,
        valor_global
      FROM newest_6_years
      ORDER BY ano ASC
    """)
    
    result = await db.execute(query, {"ids": ids_uasg})
    rows = result.fetchall()

    # 3. Build the response arrays (now already in ascending order)
    return {
        "anos":   [ str(r.ano)               for r in rows ],
        "coluna": [ float(r.valor_global)    for r in rows ],
        "linha":  [ float(r.contrato_valor) for r in rows]
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
    unit_ids = await get_unidades_by_codigo(db, uasgs, return_type="ids")
    if not unit_ids:
        return {"atividades": []}

    # Simplified SQL - just get the raw data we need
    query = text("""
    SELECT 
        c.numero,
        EXTRACT(YEAR FROM c.data_assinatura)::int AS ano,
        c.objeto,
        c.vigencia_fim AS fim
    FROM contratos c
    WHERE c.unidade_id = ANY(:unit_ids)
      AND c.vigencia_inicio >= DATE '2021-01-01'
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

# Endpoint para obter contratos por responsavel user_id
@router.get("/dashboard/contratos-by-responsavel/{user_id}")
async def get_contratos_by_responsavel(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
) -> Dict[str, Any]:
    """
    Get contract IDs for a specific responsavel user_id.
    Used for filtering contracts by responsavel.
    """
    # Get UASGs from request for authorization
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida")

    # Get unit IDs
    unit_ids = await get_unidades_by_codigo(db, uasgs, return_type="ids")
    if not unit_ids:
        raise HTTPException(status_code=403, detail="Nenhuma unidade encontrada")

    # Query to get contract numbers for this responsavel
    query = text("""
        SELECT DISTINCT c.numero
        FROM contratoresponsaveis cr
        JOIN contratos c ON cr.contrato_id = c.id
        WHERE cr.user_id = :user_id
          AND cr.situacao = true
          AND cr.deleted_at IS NULL
          AND c.unidade_id = ANY(:unit_ids)
          AND c.deleted_at IS NULL
          AND c.vigencia_inicio >= DATE '2021-01-01'
        ORDER BY c.numero
    """)

    result = await db.execute(query, {"user_id": user_id, "unit_ids": unit_ids})
    contract_numbers = [row.numero for row in result.fetchall()]

    return {
        "user_id": user_id,
        "contract_numbers": contract_numbers,
        "count": len(contract_numbers)
    }

# Endpoint para obter lista de contratos com paginação e filtros
@router.get("/dashboard/contratos-lista")
async def get_contratos_lista(
    request: Request,
    sort: Optional[str] = Query(None, description="Sorting criteria as JSON array, e.g., [['ano','DESC'],['numero','DESC']]"),
    uasgs: Optional[str] = Query(None, description="UASG codes as JSON array, e.g., ['393003']"),
    favoritos: Optional[bool] = Query(False, description="Show only favorites"),
    tipo: Optional[str] = Query("normal", description="Contract type filter"),
    page: Optional[int] = Query(1, ge=1, description="Page number"),
    start: Optional[int] = Query(0, ge=0, description="Start offset"),
    limit: Optional[int] = Query(5, ge=1, le=100, description="Items per page"),
    # New filter system parameters
    status_filters: Optional[str] = Query(None, description="Status filters as comma-separated string, e.g., 'vigentes,criticos'"),
    search_filters: Optional[str] = Query(None, description="Search filters as comma-separated string"),
    year_filters: Optional[str] = Query(None, description="Year filters as comma-separated string, e.g., '2023,2024'"),
    ano_filters: Optional[str] = Query(None, description="Ano filters as comma-separated string, e.g., '2023,2024'"),
    processo_filters: Optional[str] = Query(None, description="Processo filters as comma-separated string"),
    uasg_filters: Optional[str] = Query(None, description="UASG filters as comma-separated string"),
    db_contratos: AsyncSession = Depends(get_session_contratos),
    db_blocok: AsyncSession = Depends(get_session_blocok)
) -> Dict[str, Any]:
    """
    Optimized version: Split queries for better performance
    """
    
    # Get UASGs from URL parameter or fallback to session
    target_uasgs = []
    if uasgs:
        try:
            target_uasgs = json.loads(uasgs)
        except json.JSONDecodeError:
            target_uasgs = [uasgs]
    else:
        session_uasgs = get_uasgs_str(request)
        if not session_uasgs:
            raise HTTPException(status_code=403, detail="UASG não definida")
        target_uasgs = session_uasgs

    # Get unit IDs from UASG codes
    unit_ids = await get_unidades_by_codigo(db_contratos, target_uasgs, return_type="ids")
    
    if not unit_ids:
        return {
            "data": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "pages": 0
        }

    # If filtering by favorites, get favorite contract IDs first from blocok database
    favorite_contract_ids = []
    if favoritos:
        cpf_session = request.session.get('cpf')
        if cpf_session:
            favorite_result = await db_blocok.execute(
                text("SELECT id_contrato FROM contrato_favorito WHERE cpf = :cpf"),
                {"cpf": cpf_session}
            )
            favorite_contract_ids = [row.id_contrato for row in favorite_result.fetchall()]
        
        # If no favorites found or no CPF, return empty result
        if not favorite_contract_ids:
            return {
                "data": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "pages": 0
            }

    # Parse sorting parameters
    order_clauses = []
    if sort:
        try:
            sort_criteria = json.loads(sort)
            for sort_item in sort_criteria:
                if len(sort_item) == 2:
                    column, direction = sort_item
                    column_mapping = {
                        "numero": "c.numero",
                        "ano": "EXTRACT(YEAR FROM c.vigencia_inicio)",
                        "fornecedor": "f.nome",
                        "valor": "c.valor_inicial::numeric",
                        "vigencia_fim": "c.vigencia_fim",
                        "objeto": "c.objeto",
                        "valor_empenhado": "(SELECT COALESCE(SUM(e.empenhado::numeric), 0) FROM contratoempenhos ce LEFT JOIN empenhos e ON ce.empenho_id = e.id WHERE ce.contrato_id = c.id)",
                        "valor_pago": "(SELECT COALESCE(SUM(e.pago::numeric), 0) FROM contratoempenhos ce LEFT JOIN empenhos e ON ce.empenho_id = e.id WHERE ce.contrato_id = c.id)"
                    }
                    
                    if column in column_mapping:
                        if column == "numero":
                            # For numero sorting, sort by number first, then by year
                            direction_str = direction.upper() if direction.upper() in ["ASC", "DESC"] else "ASC"
                            order_clauses.append(f"c.numero {direction_str}")
                            order_clauses.append(f"EXTRACT(YEAR FROM c.vigencia_inicio) {direction_str}")
                        else:
                            db_column = column_mapping[column]
                            direction_str = direction.upper() if direction.upper() in ["ASC", "DESC"] else "ASC"
                            order_clauses.append(f"{db_column} {direction_str}")
        except (json.JSONDecodeError, ValueError, KeyError):
            order_clauses = ["c.vigencia_inicio DESC"]
    
    if not order_clauses:
        order_clauses = ["c.vigencia_inicio DESC"]

    order_by = "ORDER BY " + ", ".join(order_clauses)

    # Build WHERE conditions
    where_conditions = ["c.unidade_id = ANY(:unit_ids)", "c.deleted_at IS NULL"]
    
    # Add contract date filter: only contracts started after 2021-01-01
    where_conditions.append("c.vigencia_inicio >= DATE '2021-01-01'")
    
    # Add favorites filter if needed
    if favoritos and favorite_contract_ids:
        where_conditions.append("c.id = ANY(:favorite_ids)")
    
    if tipo and tipo != "normal":
        if tipo == "vigente":
            where_conditions.append("c.vigencia_fim >= CURRENT_DATE")
        elif tipo == "finalizado":
            where_conditions.append("c.vigencia_fim < CURRENT_DATE")
        elif tipo == "critico":
            where_conditions.append("c.vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days'")

    # Process new filter system parameters
    if status_filters:
        status_list = [s.strip() for s in status_filters.split(',') if s.strip()]
        if status_list:
            status_conditions = []
            for status in status_list:
                if status == "vigentes":
                    status_conditions.append("c.vigencia_fim >= CURRENT_DATE")
                elif status == "finalizados":
                    status_conditions.append("c.vigencia_fim < CURRENT_DATE")
                elif status == "criticos":
                    status_conditions.append("c.vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '120 days'")
                elif status == "120dias":
                    status_conditions.append("c.vigencia_fim BETWEEN CURRENT_DATE + INTERVAL '91 days' AND CURRENT_DATE + INTERVAL '120 days'")
                elif status == "90dias":
                    status_conditions.append("c.vigencia_fim BETWEEN CURRENT_DATE + INTERVAL '46 days' AND CURRENT_DATE + INTERVAL '90 days'")
                elif status == "45dias":
                    status_conditions.append("c.vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days'")
                elif status == "mais120":
                    status_conditions.append("c.vigencia_fim > CURRENT_DATE + INTERVAL '120 days'")
                elif status == "pf":
                    status_conditions.append("LENGTH(REPLACE(REPLACE(REPLACE(f.cnpj_cpf, '.', ''), '-', ''), '/', '')) = 11")
                elif status == "pj":
                    status_conditions.append("LENGTH(REPLACE(REPLACE(REPLACE(f.cnpj_cpf, '.', ''), '-', ''), '/', '')) = 14")
            
            if status_conditions:
                where_conditions.append(f"({' OR '.join(status_conditions)})")

    if search_filters:
        search_list = [s.strip() for s in search_filters.split(',') if s.strip()]
        if search_list:
            search_conditions = []
            for search_term in search_list:
                search_conditions.append(f"(c.objeto ILIKE '%{search_term}%' OR f.nome ILIKE '%{search_term}%' OR c.numero ILIKE '%{search_term}%')")
            where_conditions.append(f"({' OR '.join(search_conditions)})")

    # Handle both year_filters and ano_filters (frontend uses 'ano')
    year_filter_param = year_filters or ano_filters
    if year_filter_param:
        year_list = [y.strip() for y in year_filter_param.split(',') if y.strip().isdigit()]
        if year_list:
            year_conditions = [f"EXTRACT(YEAR FROM c.vigencia_inicio) = {year}" for year in year_list]
            where_conditions.append(f"({' OR '.join(year_conditions)})")

    if processo_filters:
        processo_list = [p.strip() for p in processo_filters.split(',') if p.strip()]
        if processo_list:
            processo_conditions = [f"c.processo ILIKE '%{processo}%'" for processo in processo_list]
            where_conditions.append(f"({' OR '.join(processo_conditions)})")

    if uasg_filters:
        uasg_list = [u.strip() for u in uasg_filters.split(',') if u.strip()]
        if uasg_list:
            uasg_conditions = [f"u.codigo = '{uasg}'" for uasg in uasg_list]
            where_conditions.append(f"({' OR '.join(uasg_conditions)})")

    where_clause = "WHERE " + " AND ".join(where_conditions)

    # ==== STEP 1: Get count first (fastest query) ====
    count_query = f"""
        SELECT COUNT(*)
        FROM contratos c
        LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
        LEFT JOIN unidades u ON c.unidade_id = u.id
        {where_clause}
    """
    
    count_params = {"unit_ids": unit_ids}
    if favoritos and favorite_contract_ids:
        count_params["favorite_ids"] = favorite_contract_ids
    
    count_result = await db_contratos.execute(text(count_query), count_params)
    total_records = count_result.scalar() or 0
    
    if total_records == 0:
        return {
            "data": [],
            "total": 0,
            "page": page,
            "limit": limit,
            "pages": 0
        }

    # ==== STEP 2: Get basic contract info with pagination ====
    # Calculate offset from page number
    offset = (page - 1) * limit
    
    main_query = f"""
        SELECT
            c.id,
            c.numero,
            c.processo,
            c.tipo_id,
            c.fornecedor_id,
            c.unidade_id,
            u.codigo AS uasg_codigo,
            u.nomeresumido AS uasg_nome,
            f.cpf_cnpj_idgener,
            f.nome AS fornecedor_nome,
            c.objeto,
            c.vigencia_inicio,
            c.vigencia_fim,
            c.valor_inicial,
            c.valor_global,
            c.justificativa_contrato_inativo_id,
            ci.descricao AS tipo_descricao,
            EXTRACT(YEAR FROM c.vigencia_inicio)::int AS ano
            FROM contratos c
            LEFT JOIN fornecedores f ON c.fornecedor_id = f.id
            LEFT JOIN codigoitens ci ON ci.id = c.tipo_id
            LEFT JOIN unidades u ON c.unidade_id = u.id
        {where_clause}
        {order_by}
        LIMIT :limit OFFSET :offset
    """

    main_params = {
        "unit_ids": unit_ids,
        "limit": limit,
        "offset": offset
    }
    if favoritos and favorite_contract_ids:
        main_params["favorite_ids"] = favorite_contract_ids

    result = await db_contratos.execute(text(main_query), main_params)
    contracts = result.mappings().fetchall()
    
    if not contracts:
        return {
            "data": [],
            "total": total_records,
            "page": page,
            "limit": limit,
            "pages": (total_records + limit - 1) // limit
        }

    # Get contract IDs for subsequent queries
    contract_ids = [contract.id for contract in contracts]

    # ==== STEP 3: Get empenho aggregations for these contracts ====
    empenho_query = """
        SELECT 
            ce.contrato_id,
            COALESCE(SUM(e.empenhado::numeric), 0) AS total_valor_empenhado,
            COALESCE(SUM(e.pago::numeric), 0) AS total_valor_pago,
            COUNT(DISTINCT ce.id) AS total_empenhos,
            e.naturezadespesa_id,
            nd.descricao AS naturezadespesa_descricao
        FROM contratoempenhos ce
        LEFT JOIN empenhos e ON ce.empenho_id = e.id
        LEFT JOIN naturezadespesa nd ON e.naturezadespesa_id = nd.id
        WHERE ce.contrato_id = ANY(:contract_ids)
        GROUP BY ce.contrato_id, e.naturezadespesa_id, nd.descricao
    """
    
    empenho_result = await db_contratos.execute(text(empenho_query), {"contract_ids": contract_ids})
    empenho_data = {}
    
    for row in empenho_result.mappings():
        contract_id = row.contrato_id
        if contract_id not in empenho_data:
            empenho_data[contract_id] = {
                "total_valor_empenhado": 0,
                "total_valor_pago": 0,
                "total_empenhos": 0,
                "naturezadespesa_id": None,
                "naturezadespesa_descricao": None
            }
        
        empenho_data[contract_id]["total_valor_empenhado"] += float(row.total_valor_empenhado or 0)
        empenho_data[contract_id]["total_valor_pago"] += float(row.total_valor_pago or 0)
        empenho_data[contract_id]["total_empenhos"] += int(row.total_empenhos or 0)
        
        # Keep the first naturezadespesa_id and description found
        if empenho_data[contract_id]["naturezadespesa_id"] is None:
            empenho_data[contract_id]["naturezadespesa_id"] = row.naturezadespesa_id
            empenho_data[contract_id]["naturezadespesa_descricao"] = row.naturezadespesa_descricao

    # ==== STEP 4: Get aditivos count for these contracts ====
    aditivos_query = """
        SELECT 
            contrato_id,
            COUNT(*) AS aditivos_count
        FROM contratohistorico
        WHERE contrato_id = ANY(:contract_ids)
          AND tipo_id <> 60
        GROUP BY contrato_id
    """
    
    aditivos_result = await db_contratos.execute(text(aditivos_query), {"contract_ids": contract_ids})
    aditivos_data = {row.contrato_id: row.aditivos_count for row in aditivos_result}

    # ==== STEP 5: Get responsaveis for these contracts ====
    responsaveis_query = """
        SELECT DISTINCT
            cr.contrato_id,
            cr.user_id AS responsavel_user_id,
            u.name AS responsavel_name
        FROM contratoresponsaveis cr
        LEFT JOIN users u ON cr.user_id = u.id
        WHERE cr.contrato_id = ANY(:contract_ids)
          AND cr.situacao = true
          AND cr.deleted_at IS NULL
        ORDER BY cr.contrato_id, u.name
    """
    
    responsaveis_result = await db_contratos.execute(text(responsaveis_query), {"contract_ids": contract_ids})
    responsaveis_data = {}
    
    # Group responsaveis by contract_id
    for row in responsaveis_result:
        contract_id = row.contrato_id
        if contract_id not in responsaveis_data:
            responsaveis_data[contract_id] = []
        
        if row.responsavel_name:  # Only add if name exists
            responsaveis_data[contract_id].append({
                "user_id": row.responsavel_user_id,
                "name": row.responsavel_name
            })

    # ==== STEP 6: Get favorite status for these contracts ====
    favorite_contracts = set()
    cpf = request.session.get('cpf')
    if cpf:
        favorite_query = """
            SELECT id_contrato
            FROM contrato_favorito
            WHERE cpf = :cpf AND id_contrato = ANY(:contract_ids)
        """
        favorite_result = await db_blocok.execute(text(favorite_query), {"cpf": cpf, "contract_ids": contract_ids})
        favorite_contracts = {row.id_contrato for row in favorite_result.fetchall()}

    # ==== STEP 7: Format the response data ====
    data = []
    for contract in contracts:
        contract_id = contract.id
        
        # Get data from separate queries
        empenho_info = empenho_data.get(contract_id, {
            "total_valor_empenhado": 0,
            "total_valor_pago": 0,
            "total_empenhos": 0,
            "naturezadespesa_id": None,
            "naturezadespesa_descricao": None
        })
        
        aditivos_count = aditivos_data.get(contract_id, 0)
        responsaveis_list = responsaveis_data.get(contract_id, [])
        
        # Calculate remaining days
        vigencia_fim = contract.vigencia_fim
        dias_restantes = (vigencia_fim - datetime.now().date()).days if vigencia_fim else 0
        
        # Determine contract status
        status = "vigente"
        if dias_restantes < 0:
            status = "finalizado"
        elif dias_restantes <= 45:
            status = "critico"
        elif dias_restantes <= 90:
            status = "alerta"
        
        # Get FontAwesome icon for naturezadespesa
        fontawesome_icon = get_fontawesome_icon(empenho_info["naturezadespesa_id"])

        # Get favorite status for this contract
        is_favorite = contract.id in favorite_contracts
        favorite_info = {
            "is_favorite": is_favorite,
            "favorite_icon": "red" if is_favorite else "gray", 
            "favorite_status": "red" if is_favorite else "gray",
            "favorite_action": "Remove" if is_favorite else "Adicionar",
            "favorite_title": "Remover dos favoritos" if is_favorite else "Adicionar aos favoritos"
        }
        
        data.append({
            "id": contract.id,
            "numero": contract.numero[:-5] if contract.numero else contract.numero,
            "ano": contract.ano,
            "processo": contract.processo,
            "tipo_id": contract.tipo_id,
            "justificativa_contrato_inativo_id": contract.justificativa_contrato_inativo_id,
            "fornecedor_id": contract.fornecedor_id,
            "fornecedor_nome": contract.fornecedor_nome,
            "fornecedor_cnpj": contract.cpf_cnpj_idgener,
            "objeto": contract.objeto,
            "vigencia_inicio": contract.vigencia_inicio.strftime("%Y-%m-%d") if contract.vigencia_inicio else None,
            "vigencia_fim": contract.vigencia_fim.strftime("%Y-%m-%d") if contract.vigencia_fim else None,
            "valor_inicial": float(contract.valor_inicial or 0),
            "valor_global": float(contract.valor_global or 0),
            "total_valor_empenhado": empenho_info["total_valor_empenhado"],
            "total_valor_pago": empenho_info["total_valor_pago"],
            "total_empenhos": empenho_info["total_empenhos"],
            "naturezadespesa_id": empenho_info["naturezadespesa_id"],
            "naturezadespesa_descricao": empenho_info["naturezadespesa_descricao"],
            "aditivos_count": aditivos_count,
            "responsaveis": responsaveis_list,
            "dias_restantes": dias_restantes,
            "status": status,
            "fontawesome_icon": fontawesome_icon,
            # UASG information for this contract
            "uasg_codigo": contract.uasg_codigo,
            "uasg_nome": contract.uasg_nome,
            # Favorite status information
            "is_favorite": favorite_info["is_favorite"],
            "favorite_icon": favorite_info["favorite_icon"],
            "favorite_status": favorite_info["favorite_status"],
            "favorite_action": favorite_info["favorite_action"],
            "favorite_title": favorite_info["favorite_title"]
        })

    # Calculate pagination info
    total_pages = (total_records + limit - 1) // limit

    return {
        "data": data,
        "total": total_records,
        "page": page,
        "limit": limit,
        "pages": total_pages,
        "start": start,
        "filters": {
            "uasgs": target_uasgs,
            "favoritos": favoritos,
            "tipo": tipo,
            "sort": sort
        }
    }

def get_favorite_status(contract_id: int, cpf: str = None) -> Dict[str, Any]:
    """
    Get favorite status for a contract based on CPF.
    
    Returns:
        Dict containing favorite status information
    """
    if not cpf:
        return {
            "is_favorite": False,
            "favorite_icon": "gray", 
            "favorite_status": "gray",
            "favorite_action": "Adicionar",
            "favorite_title": "Adicionar aos favoritos"
        }
    
    # This will be checked in the main query - for now return False as default
    # The actual check is done in the main endpoint function
    return {
        "is_favorite": False,
        "favorite_icon": "gray", 
        "favorite_status": "gray",
        "favorite_action": "Adicionar",
        "favorite_title": "Adicionar aos favoritos"
    }

@router.get("/dashboard/contrato/{contract_id}/aditivos")
async def get_contract_aditivos(
    contract_id: int,
    request: Request,
    db: AsyncSession = Depends(get_session_contratos)
) -> List[Dict[str, Any]]:
    """
    Get the additives of a specific contract.
    
    - URL: /contrato/{contract_id}/aditivos
    - Authorization: Checks user's session UASGs.
    - Error Handling: Returns 404 if not found or 403 if not authorized.
    - Formatting: Dates and currency are formatted.
    """
    # 1. Authorization: Check user's session for authorized UASGs
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida para o usuário.")

    # Get unit IDs for the user's UASGs
    user_unit_ids = await get_unidades_by_codigo(db, uasgs, return_type="ids")
    if not user_unit_ids:
        raise HTTPException(status_code=403, detail="Nenhuma unidade correspondente às UASGs do usuário foi encontrada.")

    # 2. Data Fetching: Parameterized query to prevent SQL injection
    query = text("""
        SELECT
            ch.valor_global,
            ch.valor_inicial,
            ch.vigencia_inicio,
            ch.vigencia_fim,
            ch.objeto,
            LOWER(ch.observacao) AS observacao,
            ch.tipo_id,
            LOWER(ci.descricao) AS tipo_descricao,
            ch.novo_valor_global
        FROM contratohistorico ch
        LEFT JOIN codigoitens ci ON ch.tipo_id = ci.id
        WHERE ch.contrato_id = :contract_id
          AND ch.unidade_id = ANY(:user_unit_ids)
          AND ch.tipo_id <> 60  -- Exclude type 60 (cancellation)
        ORDER BY ch.vigencia_inicio ASC;
    """)
    
    result = await db.execute(query, {"contract_id": contract_id, "user_unit_ids": user_unit_ids})
    historico_records = result.mappings().fetchall()

    # 3. Error Handling: Check if any records were found
    if not historico_records:
        # To give a more specific error, check if the contract exists at all
        contract_exists_result = await db.execute(
            text("SELECT 1 FROM contratos WHERE id = :contract_id"),
            {"contract_id": contract_id}
        )
        if contract_exists_result.scalar_one_or_none():
            # Contract exists, but user doesn't have access to its history
            raise HTTPException(status_code=403, detail="Acesso negado aos aditivos deste contrato.")
        else:
            # Contract does not exist
            raise HTTPException(status_code=404, detail="Contrato não encontrado.")

    # 4. Formatting: Prepare the response data
    aditivos_list = []
    for record in historico_records:
        aditivos_list.append({
            "valor_global": float(record.valor_global) if record.valor_global is not None else None,
            "valor_inicial": float(record.valor_inicial) if record.valor_inicial is not None else None,
            "vigencia_inicio": record.vigencia_inicio.strftime("%d/%m/%Y") if record.vigencia_inicio else None,
            "vigencia_fim": record.vigencia_fim.strftime("%d/%m/%Y") if record.vigencia_fim else None,
            "objeto": record.objeto.lower() if record.objeto else None,
            "observacao": record.observacao.lower() if record.observacao else None,
            "tipo_id": record.tipo_id,
            "tipo_descricao": record.tipo_descricao,
            "novo_valor_global": float(record.novo_valor_global) if record.novo_valor_global is not None else None,
        })

    return aditivos_list

@router.get("/dashboard/contrato/{contract_id}/responsaveis")
async def get_contract_responsaveis(
    contract_id: int,
    request: Request,
    db_contratos: AsyncSession = Depends(get_session_contratos)
) -> List[Dict[str, Any]]:
    """
    Get responsaveis data for a specific contract.
    
    Args:
        contract_id: The contract ID
        request: HTTP request object for session access
        db_contratos: Database session for contracts
        
    Returns:
        List of responsaveis with their details
        
    Example:
        - URL: /contrato/{contract_id}/responsaveis
        - Response: [{"user_id": 123, "name": "João Silva"}, ...]
    """
    # 1. Permission check: Get UASGs from user session
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida para o usuário")

    # 2. Get unit IDs for the user's UASGs
    user_unit_ids = await get_unidades_by_codigo(db_contratos, uasgs, return_type="ids")
    if not user_unit_ids:
        raise HTTPException(status_code=403, detail="Nenhuma unidade correspondente às UASGs do usuário")

    # 3. Verify access: Check if contract exists and user has access to it
    contract_access_query = """
        SELECT 1 
        FROM contratos 
        WHERE id = :contract_id AND unidade_id = ANY(:unit_ids)
    """
    contract_access_result = await db_contratos.execute(
        text(contract_access_query),
        {"contract_id": contract_id, "unit_ids": user_unit_ids}
    )
    
    if not contract_access_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Acesso negado aos responsáveis deste contrato.")

    # 4. Query responsaveis for this contract
    responsaveis_query = """
        SELECT DISTINCT ON (cr.user_id)
            cr.user_id AS responsavel_user_id,
            u.name AS responsavel_name,
            cr.telefone_fixo AS responsavel_telefone_fixo,
            cr.telefone_celular AS responsavel_telefone_celular
        FROM contratoresponsaveis cr
        LEFT JOIN users u ON cr.user_id = u.id
        WHERE cr.contrato_id = :contract_id 
        AND cr.situacao = true
        AND cr.deleted_at IS NULL
        AND u.name IS NOT NULL
        ORDER BY cr.user_id, u.name ASC
    """
    
    responsaveis_result = await db_contratos.execute(
        text(responsaveis_query),
        {"contract_id": contract_id}
    )
    
    # 5. Formatting: Prepare the response data
    responsaveis_list = []
    seen_user_ids = set()  # Track user_ids to avoid duplicates
    
    for record in responsaveis_result:
        if record.responsavel_name and record.responsavel_user_id not in seen_user_ids:
            responsaveis_list.append({
                "user_id": record.responsavel_user_id,
                "name": record.responsavel_name.strip(),
                "telefone_fixo": record.responsavel_telefone_fixo.strip() if record.responsavel_telefone_fixo else None,
                "telefone_celular": record.responsavel_telefone_celular.strip() if record.responsavel_telefone_celular else None
            })
            seen_user_ids.add(record.responsavel_user_id)

    return responsaveis_list

@router.post("/dashboard/contrato/{contract_id}/favorito")
async def toggle_contrato_favorito(
    contract_id: int,
    request: Request,
    db_contratos: AsyncSession = Depends(get_session_contratos),
    db_blocok: AsyncSession = Depends(get_session_blocok)
) -> Dict[str, Any]:
    """
    Toggle favorite status for a contract.
    
    Returns the new favorite status.
    """
    # Get CPF from session
    cpf = request.session.get('cpf')
    if not cpf:
        raise HTTPException(status_code=401, detail="CPF não encontrado na sessão")
    
    # Check if contract exists and user has access to it
    uasgs = get_uasgs_str(request)
    if not uasgs:
        raise HTTPException(status_code=403, detail="UASG não definida para o usuário")

    # Get unit IDs for the user's UASGs
    user_unit_ids = await get_unidades_by_codigo(db_contratos, uasgs, return_type="ids")
    if not user_unit_ids:
        raise HTTPException(status_code=403, detail="Nenhuma unidade correspondente às UASGs do usuário")

    # Check if contract exists and user has access
    contract_check = await db_contratos.execute(
        text("SELECT 1 FROM contratos WHERE id = :contract_id AND unidade_id = ANY(:unit_ids)"),
        {"contract_id": contract_id, "unit_ids": user_unit_ids}
    )
    if not contract_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Contrato não encontrado ou sem acesso")
    
    # Check if already favorited (using blocok database)
    existing_favorite = await db_blocok.execute(
        text("SELECT 1 FROM contrato_favorito WHERE cpf = :cpf AND id_contrato = :contract_id"),
        {"cpf": cpf, "contract_id": contract_id}
    )
    
    is_favorite = existing_favorite.scalar_one_or_none() is not None
    
    if is_favorite:
        # Remove from favorites (using blocok database)
        await db_blocok.execute(
            text("DELETE FROM contrato_favorito WHERE cpf = :cpf AND id_contrato = :contract_id"),
            {"cpf": cpf, "contract_id": contract_id}
        )
        await db_blocok.commit()
        new_status = False
    else:
        # Add to favorites (using blocok database)
        await db_blocok.execute(
            text("INSERT INTO contrato_favorito (cpf, id_contrato) VALUES (:cpf, :contract_id)"),
            {"cpf": cpf, "contract_id": contract_id}
        )
        await db_blocok.commit()
        new_status = True
    
    return {
        "success": True,
        "is_favorite": new_status,
        "favorite_icon": "red" if new_status else "gray",
        "favorite_status": "red" if new_status else "gray",
        "favorite_action": "Remove" if new_status else "Adicionar",
        "favorite_title": "Remover dos favoritos" if new_status else "Adicionar aos favoritos"
    }