from datetime import date, timedelta, datetime
from typing import Any, Dict, List, Optional
import json
import random

from babel.dates import format_date
from fastapi import APIRouter, Depends, Request, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.templates import templates
from app.utils.session_utils import get_uasgs_str
from app.db.session import get_session_contratos
from app.utils.static_loader import collect_static_files
from app.core import config as app_config

import logging

logger = logging.getLogger(__name__)

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
async def render_dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "show_renewal_column": settings.DASHBOARD_SHOW_RENEWAL_COLUMN
    })

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
        ano DESC LIMIT 6

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
    FROM contratos c
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
    limit: Optional[int] = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_session_contratos)
) -> Dict[str, Any]:
    """
    Get contracts list with pagination, filtering and sorting
    
    Parameters:
    - sort: JSON array of sorting criteria, e.g., [["ano","DESC"],["numero","DESC"]]
    - uasgs: JSON array of UASG codes, e.g., ["393003"]
    - favoritos: Boolean to filter favorites only
    - tipo: Contract type filter
    - page: Page number (1-based)
    - start: Start offset (0-based)
    - limit: Number of items per page
    """
    
    # Get UASGs from URL parameter or fallback to session
    target_uasgs = []
    if uasgs:
        try:
            target_uasgs = json.loads(uasgs)
        except json.JSONDecodeError:
            target_uasgs = [uasgs]  # Single UASG as string
    else:
        # Fallback to session UASGs
        session_uasgs = get_uasgs_str(request)
        if not session_uasgs:
            raise HTTPException(status_code=403, detail="UASG não definida")
        target_uasgs = session_uasgs

    # Get unit IDs from UASG codes
    result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasgs)"),
        {"uasgs": target_uasgs}
    )
    unit_ids = [row.id for row in result.fetchall()]
    
    if not unit_ids:
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
                    # Map frontend column names to database columns
                    column_mapping = {
                        "numero": "c.numero",
                        "ano": "EXTRACT(YEAR FROM c.vigencia_inicio)",
                        "fornecedor": "f.nome",
                        "valor": "c.valor_inicial",
                        "vigencia_fim": "c.vigencia_fim",
                        "objeto": "c.objeto"
                    }
                    
                    if column in column_mapping:
                        db_column = column_mapping[column]
                        direction = direction.upper() if direction.upper() in ["ASC", "DESC"] else "ASC"
                        order_clauses.append(f"{db_column} {direction}")
        except (json.JSONDecodeError, ValueError, KeyError):
            # Default sorting if parsing fails
            order_clauses = ["c.vigencia_inicio DESC"]
    
    if not order_clauses:
        order_clauses = ["c.vigencia_inicio DESC"]

    order_by = "ORDER BY " + ", ".join(order_clauses)

    # Build WHERE conditions
    where_conditions = ["c.unidade_id = ANY(:unit_ids)", "c.deleted_at IS NULL"]
    
    # Add favorites filter if requested
    if favoritos:
        # Note: You'll need to implement favorites logic based on your database schema
        # This is a placeholder - adjust according to your favorites table/logic
        where_conditions.append("EXISTS (SELECT 1 FROM user_favorites uf WHERE uf.contrato_id = c.id AND uf.user_id = :user_id)")
    
    # Add contract type filter
    if tipo and tipo != "normal":
        # Adjust this condition based on your business logic for contract types
        if tipo == "vigente":
            where_conditions.append("c.vigencia_fim >= CURRENT_DATE")
        elif tipo == "finalizado":
            where_conditions.append("c.vigencia_fim < CURRENT_DATE")
        elif tipo == "critico":
            where_conditions.append("c.vigencia_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '45 days'")

    where_clause = "WHERE " + " AND ".join(where_conditions)

    # Main query with all joins and aggregations
    main_query = f"""
        SELECT
            c.id,
            c.numero,
            c.processo,
            c.tipo_id,
            c.fornecedor_id,
            f.cpf_cnpj_idgener,
            f.nome AS fornecedor_nome,
            c.objeto,
            c.vigencia_inicio,
            c.vigencia_fim,
            c.valor_inicial,
            c.valor_global,
            c.justificativa_contrato_inativo_id,
            COALESCE(SUM(e.empenhado::numeric), 0) AS total_valor_empenhado,
            COALESCE(SUM(e.pago::numeric), 0) AS total_valor_pago,
            COUNT(DISTINCT ce.id) AS total_empenhos,
            COUNT(DISTINCT ch.id) AS aditivos_count,
            STRING_AGG(DISTINCT u.name, ', ') AS responsaveis,
            EXTRACT(YEAR FROM c.vigencia_inicio)::int AS ano
        FROM
            contratos c
        LEFT JOIN fornecedores f
            ON c.fornecedor_id = f.id
        LEFT JOIN contratoempenhos ce
            ON c.id = ce.contrato_id
        LEFT JOIN empenhos e
            ON ce.empenho_id = e.id
        LEFT JOIN contratohistorico ch
            ON c.id = ch.contrato_id
            AND ch.tipo_id <> 60
        LEFT JOIN contratoresponsaveis cr
            ON c.id = cr.contrato_id
        LEFT JOIN users u
            ON cr.user_id = u.id
        {where_clause}
        GROUP BY
            c.id,
            c.numero,
            c.processo,
            c.tipo_id,
            c.fornecedor_id,
            f.cpf_cnpj_idgener,
            f.nome,
            c.objeto,
            c.vigencia_inicio,
            c.vigencia_fim,
            c.valor_inicial,
            c.valor_global,
            c.justificativa_contrato_inativo_id
        {order_by}
        LIMIT :limit OFFSET :offset
    """

    # Count query for total records
    count_query = f"""
        SELECT COUNT(DISTINCT c.id)
        FROM
            contratos c
        LEFT JOIN fornecedores f
            ON c.fornecedor_id = f.id
        {where_clause}
    """

    # Execute count query
    count_params = {"unit_ids": unit_ids}
    if favoritos:
        # Add user_id parameter if favorites filter is used
        # You'll need to get the user_id from the request/session
        count_params["user_id"] = 1  # Placeholder - implement proper user identification
    
    count_result = await db.execute(text(count_query), count_params)
    total_records = count_result.scalar() or 0

    # Execute main query
    main_params = {
        "unit_ids": unit_ids,
        "limit": limit,
        "offset": start
    }
    if favoritos:
        main_params["user_id"] = 1  # Placeholder - implement proper user identification

    result = await db.execute(text(main_query), main_params)
    contracts = result.mappings().fetchall()

    # Format the response data
    data = []
    for contract in contracts:
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
        
        # implement call a function to get fontawsomicone from naturezadespesa_lookup_fa.json
        # fontawesome_icon = get_fontawesome_icon(contract.naturezadespesa_id)

        # Get favorite status for this contract
        favorite_info = get_random_favorite_status(contract.id)
        
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
            "total_valor_empenhado": float(contract.total_valor_empenhado or 0),
            "total_valor_pago": float(contract.total_valor_pago or 0),
            "total_empenhos": contract.total_empenhos or 0,
            "aditivos_count": contract.aditivos_count or 0,
            "responsaveis": contract.responsaveis,
            "dias_restantes": dias_restantes,
            "status": status,
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

def get_random_favorite_status(contract_id: int) -> Dict[str, Any]:
    """
    Generate random favorite status for a contract.
    Later this will be replaced with actual database lookup.
    
    Returns:
        Dict containing favorite status information
    """
    # Use contract_id as seed for consistent results per contract
    random.seed(contract_id)
    is_favorite = random.choice([True, False, False, False])  # 25% chance of being favorite
    
    return {
        "is_favorite": is_favorite,
        "favorite_icon": "red" if is_favorite else "gray", 
        "favorite_status": "red" if is_favorite else "gray",
        "favorite_action": "Remove" if is_favorite else "Adicionar",
        "favorite_title": "Remover dos favoritos" if is_favorite else "Adicionar aos favoritos"
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
    user_units_result = await db.execute(
        text("SELECT id FROM unidades WHERE codigo = ANY(:uasgs)"),
        {"uasgs": uasgs}
    )
    user_unit_ids = [row.id for row in user_units_result.fetchall()]
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


