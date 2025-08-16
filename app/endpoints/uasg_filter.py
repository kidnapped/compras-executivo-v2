import logging
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List, Optional

from app.core.templates import templates
from app.utils.static_loader import collect_static_files
from app.core import config as app_config
from app.utils.session_utils import get_uasgs_str, get_usuario_id
from app.db.session import get_session_contratos
from app.utils.spa_utils import spa_route_handler, get_page_scripts, add_spa_context

logger = logging.getLogger(__name__)

router = APIRouter()

# Renderiza a página do filtro UASG
@router.get("/uasg-filter", response_class=HTMLResponse)
async def render_uasg_filter(request: Request, search: Optional[str] = Query(None)):
    """
    Renderiza a página de filtro UASG
    """
    # Criar contexto
    context = {
        "request": request,
        "search": search,
        "template_name": "outros-templates"
    }
    
    # Adicionar contexto SPA
    context = add_spa_context(context, request)
    
    # Usar o handler SPA
    return spa_route_handler(
        template_name="uasg_filter.html",
        context=context,
        templates=templates,
        request=request,
        title="Filtro UASG - Compras Executivo",
        scripts=get_page_scripts("uasg-filter")
    )

# Endpoint para buscar dados UASG com filtros
@router.get("/uasg-filter/data")
async def get_uasg_data(
    request: Request,
    user_id: Optional[int] = Query(None, description="User ID to filter by"),
    valor_min: Optional[float] = Query(None, description="Minimum contract value"),
    valor_max: Optional[float] = Query(None, description="Maximum contract value"), 
    has_contracts: Optional[bool] = Query(None, description="Filter units with any contracts"),
    active_contracts: Optional[bool] = Query(None, description="Filter units with active contracts"),
    interval_days: Optional[int] = Query(None, description="Days until contract end"),
    search_term: Optional[str] = Query(None, description="Search term for UASG name or code"),
    group_by_agency: Optional[bool] = Query(False, description="Group results by superior agency"),
    db: AsyncSession = Depends(get_session_contratos)
) -> Dict[str, Any]:
    """
    Busca dados de UASG com filtros aplicados
    
    Filtros disponíveis:
    - user_id: ID do usuário (se não fornecido, usa o da sessão)
    - valor_min/valor_max: Filtro por valor dos contratos
    - has_contracts: Apenas unidades que têm contratos (qualquer período)
    - active_contracts: Apenas unidades com contratos ativos (vigentes hoje)
    - interval_days: Dias até o fim do contrato
    - search_term: Busca por nome ou código da UASG
    - group_by_agency: Agrupa resultados por órgão superior
    """
    try:
        # Always get user_id from session
        session_user_id = get_usuario_id(request)
        if session_user_id is None:
            # Fallback to hardcoded value for development/testing
            session_user_id = request.session.get("usuario_id", 198756)
        user_id = session_user_id
        logger.info(f"Using user_id from session: {user_id}")
        # Base query structure
        base_query = """
            SELECT 
                COUNT(c.id) as contract_count,
                u2.unidade_id,
                u3.codigosiafi,
                u3.gestao,
                u3.nome,
                u3.codigo,
                u.id as user_id,
                SUM(CASE WHEN c.valor_global::numeric IS NOT NULL THEN c.valor_global::numeric ELSE 0 END) as total_value
            FROM users u 
            LEFT JOIN unidadesusers u2 ON u2.user_id = u.id 
            LEFT JOIN unidades u3 ON u3.id = u2.unidade_id
        """
        
        # Build WHERE conditions
        where_conditions = []
        params = {}
        
        # Always apply user ID filter (from session or provided)
        where_conditions.append("u.id = :user_id")
        params["user_id"] = user_id
        
        # Contract join condition based on filters
        if has_contracts or active_contracts or valor_min is not None or valor_max is not None or interval_days is not None:
            base_query += " JOIN contratos c ON c.unidade_id = u3.id"
            
            # Filter for any contracts (has_contracts)
            if has_contracts and not active_contracts:
                # If interval_days is specified with has_contracts, filter by contracts ending within the interval
                if interval_days is not None:
                    where_conditions.append("c.vigencia_fim IS NOT NULL")
                    where_conditions.append(f"c.vigencia_fim <= CURRENT_DATE + INTERVAL '{interval_days} days'")
                    where_conditions.append("c.vigencia_fim >= CURRENT_DATE")  # Only future contracts
            
            # Filter for active contracts (active_contracts)
            if active_contracts:
                where_conditions.append("c.vigencia_fim IS NOT NULL")
                where_conditions.append("c.vigencia_fim >= CURRENT_DATE")
                where_conditions.append("c.vigencia_inicio <= CURRENT_DATE")
                
                # If interval_days is specified with active_contracts, limit to contracts ending soon
                if interval_days is not None:
                    where_conditions.append(f"c.vigencia_fim <= CURRENT_DATE + INTERVAL '{interval_days} days'")
            
            # If only interval_days is specified (without other contract filters)
            if interval_days is not None and not has_contracts and not active_contracts:
                where_conditions.append("c.vigencia_fim IS NOT NULL")
                where_conditions.append(f"c.vigencia_fim <= CURRENT_DATE + INTERVAL '{interval_days} days'")
                where_conditions.append("c.vigencia_fim >= CURRENT_DATE")  # Only future contracts
            
            # Value filters
            if valor_min is not None:
                where_conditions.append("c.valor_global::numeric >= :valor_min")
                params["valor_min"] = valor_min
                
            if valor_max is not None:
                where_conditions.append("c.valor_global::numeric <= :valor_max")
                params["valor_max"] = valor_max
        else:
            base_query += " LEFT JOIN contratos c ON c.unidade_id = u3.id"
        
        # Search term filter
        if search_term:
            where_conditions.append("""
                (u3.nome ILIKE :search_term 
                 OR u3.codigo::text ILIKE :search_term
                 OR u3.codigosiafi::text ILIKE :search_term)
            """)
            params["search_term"] = f"%{search_term}%"
        
        # Build final query
        if where_conditions:
            base_query += " WHERE " + " AND ".join(where_conditions)
        
        base_query += """
            GROUP BY u2.unidade_id, u3.codigosiafi, u3.gestao, u3.nome, u3.codigo, u.id
            ORDER BY u3.nome
        """
        
        logger.info(f"Executing UASG filter query with params: {params}")
        
        # Execute query
        result = await db.execute(text(base_query), params)
        rows = result.mappings().fetchall()
        
        # Format response data
        uasg_data = []
        for row in rows:
            uasg_item = {
                "unidade_id": row.get("unidade_id"),
                "codigo": row.get("codigo"),
                "codigosiafi": row.get("codigosiafi"),
                "gestao": row.get("gestao"),
                "nome": row.get("nome"),
                "user_id": row.get("user_id"),
                "contract_count": row.get("contract_count", 0),
                "total_value": float(row.get("total_value", 0)) if row.get("total_value") else 0.0
            }
            uasg_data.append(uasg_item)
        
        # Group by agency if requested
        if group_by_agency:
            grouped_data = group_uasgs_by_agency(uasg_data)
            return {
                "success": True,
                "data": grouped_data,
                "total_records": len(uasg_data),  # Total individual UASGs
                "total_groups": len(grouped_data),  # Total groups
                "grouped": True,
                "filters_applied": {
                    "user_id": user_id,
                    "valor_min": valor_min,
                    "valor_max": valor_max,
                    "has_contracts": has_contracts,
                    "active_contracts": active_contracts,
                    "interval_days": interval_days,
                    "search_term": search_term,
                    "group_by_agency": group_by_agency
                }
            }
        
        return {
            "success": True,
            "data": uasg_data,
            "total_records": len(uasg_data),
            "grouped": False,
            "filters_applied": {
                "user_id": user_id,
                "valor_min": valor_min,
                "valor_max": valor_max,
                "has_contracts": has_contracts,
                "active_contracts": active_contracts,
                "interval_days": interval_days,
                "search_term": search_term,
                "group_by_agency": group_by_agency
            }
        }
        
    except Exception as e:
        logger.error(f"Error in get_uasg_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching UASG data: {str(e)}")

def group_uasgs_by_agency(uasg_data: List[Dict]) -> List[Dict]:
    """
    Groups UASG data by superior agency (gestao)
    """
    from collections import defaultdict
    
    groups = defaultdict(list)
    
    # Group UASGs by gestao
    for uasg in uasg_data:
        gestao = uasg.get("gestao") or "Sem Órgão Superior"
        groups[gestao].append(uasg)
    
    # Format grouped data
    grouped_data = []
    for gestao, uasgs in groups.items():
        # Sort UASGs within each group by codigo (UASG number) from lowest to highest
        uasgs.sort(key=lambda x: int(x.get("codigo", 0)) if x.get("codigo") and str(x.get("codigo")).isdigit() else 999999)
        
        # Calculate totals for the group
        total_contracts = sum(uasg.get("contract_count", 0) for uasg in uasgs)
        total_value = sum(uasg.get("total_value", 0) for uasg in uasgs)
        
        # Get agency name from first UASG (they should all have the same gestao)
        agency_name = uasgs[0].get("nome", "Nome não disponível") if uasgs else "Desconhecido"
        
        group_item = {
            "gestao": gestao,
            "agency_name": agency_name,
            "uasg_count": len(uasgs),
            "total_contracts": total_contracts,
            "total_value": total_value,
            "uasgs": uasgs,
            "is_group": True
        }
        grouped_data.append(group_item)
    
    # Sort by number of UASGs in descending order (most UASGs first)
    grouped_data.sort(key=lambda x: x["uasg_count"], reverse=True)
    
    return grouped_data

# Endpoint para buscar UASGs específicas por códigos
@router.get("/uasg-filter/search")
async def search_uasg_by_codes(
    request: Request,
    codes: Optional[str] = Query(None, description="Comma-separated UASG codes"),
    db: AsyncSession = Depends(get_session_contratos)
) -> Dict[str, Any]:
    """
    Busca UASGs específicas por códigos
    """
    try:
        if not codes:
            # Get UASGs from user session
            uasgs = get_uasgs_str(request)
            if not uasgs:
                return {"success": False, "message": "No UASG codes provided", "data": []}
            codes_list = uasgs
        else:
            codes_list = [code.strip() for code in codes.split(",")]
        
        query = """
            SELECT 
                u.id,
                u.codigo,
                u.codigosiafi,
                u.gestao,
                u.nomeresumido,
                u.nome,
                COUNT(c.id) as active_contracts
            FROM unidades u
            LEFT JOIN contratos c ON c.unidade_id = u.id 
                AND c.vigencia_fim >= CURRENT_DATE
                AND c.vigencia_inicio <= CURRENT_DATE
            WHERE u.codigo = ANY(:codes)
            GROUP BY u.id, u.codigo, u.codigosiafi, u.gestao, u.nomeresumido, u.nome
            ORDER BY u.nomeresumido
        """
        
        result = await db.execute(text(query), {"codes": codes_list})
        rows = result.mappings().fetchall()
        
        uasg_data = []
        for row in rows:
            uasg_item = {
                "id": row.get("id"),
                "codigo": row.get("codigo"),
                "codigosiafi": row.get("codigosiafi"),
                "gestao": row.get("gestao"),
                "nomeresumido": row.get("nomeresumido"),
                "nome": row.get("nome"),
                "active_contracts": row.get("active_contracts", 0)
            }
            uasg_data.append(uasg_item)
        
        return {
            "success": True,
            "data": uasg_data,
            "total_records": len(uasg_data),
            "searched_codes": codes_list
        }
        
    except Exception as e:
        logger.error(f"Error in search_uasg_by_codes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching UASG codes: {str(e)}")
