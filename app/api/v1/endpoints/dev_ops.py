from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any
from pydantic import BaseModel

from app.core.templates import templates
from app.db.session import get_session_contratos

router = APIRouter()

# Pydantic model for setting UASG
class SetUasgRequest(BaseModel):
    codigo: int

# Pydantic model for CPF validation request
class ValidateCpfRequest(BaseModel):
    cpf: str

# Renderiza a página do dev-ops
@router.get("/dev-ops", response_class=HTMLResponse)
async def render_dev_ops(request: Request):
    return templates.TemplateResponse("dev-ops.html", {
        "request": request
    })

# Endpoint para buscar unidades organizacionais
@router.get("/dev-ops/unidades")
async def search_unidades(
    search: str = Query(..., min_length=2, description="Termo de busca (mínimo 2 caracteres)"),
    limit: int = Query(50, ge=1, le=100, description="Limite de resultados"),
    db: AsyncSession = Depends(get_session_contratos)
) -> List[Dict[str, Any]]:
    """
    Busca unidades organizacionais com base no termo de pesquisa.
    Retorna uma lista com código e nome resumido das unidades.
    """
    try:
        # Query to search for units based on codigo or nomeresumido
        search_term = f"%{search}%"
        query = text("""
            SELECT codigo, nomeresumido 
            FROM unidades 
            WHERE UPPER(CAST(codigo AS TEXT)) LIKE UPPER(:search_term)
               OR UPPER(nomeresumido) LIKE UPPER(:search_term)
            ORDER BY 
                CASE 
                    WHEN UPPER(CAST(codigo AS TEXT)) LIKE UPPER(:search_exact) THEN 1
                    WHEN UPPER(nomeresumido) LIKE UPPER(:search_exact) THEN 2
                    WHEN UPPER(CAST(codigo AS TEXT)) LIKE UPPER(:search_start) THEN 3
                    WHEN UPPER(nomeresumido) LIKE UPPER(:search_start) THEN 4
                    ELSE 5
                END,
                codigo
            LIMIT :limit
        """)
        
        result = await db.execute(query, {
            "search_term": search_term,
            "search_exact": search,
            "search_start": f"{search}%",
            "limit": limit
        })
        
        unidades = result.fetchall()
        
        return [
            {
                "codigo": row.codigo,
                "nomeresumido": row.nomeresumido,
                "display": f"{row.codigo} - {row.nomeresumido}"
            }
            for row in unidades
        ]
        
    except Exception as e:
        # Log the error and return empty list
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error searching unidades: {e}")
        return []

# Endpoint para atualizar a UASG na sessão
@router.post("/dev-ops/set-uasg")
async def set_session_uasg(
    request: Request,
    uasg_data: SetUasgRequest
):
    """
    Atualiza a UASG na sessão do usuário.
    """
    try:
        # Verifica se o usuário está logado
        if not request.session.get("cpf"):
            return JSONResponse(
                status_code=401,
                content={"success": False, "message": "Usuário não está logado"}
            )
        
        # Atualiza a sessão
        request.session["uasgs"] = [uasg_data.codigo]
        
        return JSONResponse(content={
            "success": True, 
            "message": f"UASG {uasg_data.codigo} foi definida como padrão para sua sessão",
            "uasg": uasg_data.codigo
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error setting UASG in session: {e}")
        
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Erro interno do servidor"}
        )

# Endpoint para limpar a UASG da sessão
@router.post("/dev-ops/clear-uasg")
async def clear_session_uasg(request: Request):
    """
    Remove a UASG da sessão do usuário.
    """
    try:
        # Verifica se o usuário está logado
        if not request.session.get("cpf"):
            return JSONResponse(
                status_code=401,
                content={"success": False, "message": "Usuário não está logado"}
            )
        
        # Remove a UASG da sessão
        if "uasgs" in request.session:
            del request.session["uasgs"]
        
        return JSONResponse(content={
            "success": True, 
            "message": "UASG removida da sessão com sucesso"
        })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error clearing UASG from session: {e}")
        
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Erro interno do servidor"}
        )

# Endpoint para validar CPF no banco de dados
@router.post("/dev-ops/validate-cpf")
async def validate_cpf_database(
    request: Request,
    cpf_data: ValidateCpfRequest,
    db: AsyncSession = Depends(get_session_contratos)
):
    """
    Valida CPF no banco de dados e retorna informações do usuário se encontrado.
    """
    try:
        # Verifica se o usuário está logado
        if not request.session.get("cpf"):
            return JSONResponse(
                status_code=401,
                content={"success": False, "message": "Usuário não está logado"}
            )
        
        # Limpa o CPF removendo caracteres não numéricos
        clean_cpf = ''.join(filter(str.isdigit, cpf_data.cpf))
        
        # Valida o formato do CPF (deve ter 11 dígitos)
        if len(clean_cpf) != 11:
            return JSONResponse(content={
                "success": False,
                "valid_format": False,
                "message": "CPF deve ter 11 dígitos",
                "cpf": cpf_data.cpf
            })
        
        # Aplica formatação padrão do CPF para busca no banco
        formatted_cpf = f"{clean_cpf[:3]}.{clean_cpf[3:6]}.{clean_cpf[6:9]}-{clean_cpf[9:]}"
        
        # Query para buscar o usuário no banco de dados
        query = text("""
            SELECT
                u.id,
                u.cpf,
                u.name,
                u.email,
                u.ugprimaria
            FROM users AS u
            LEFT JOIN unidadesusers AS uu
                ON u.id = uu.user_id
            WHERE
                u.cpf = :cpf
            LIMIT 1
        """)
        
        result = await db.execute(query, {"cpf": formatted_cpf})
        user = result.fetchone()
        
        if user:
            return JSONResponse(content={
                "success": True,
                "valid_format": True,
                "exists_in_database": True,
                "cpf": formatted_cpf,
                "user_info": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "ugprimaria": user.ugprimaria
                },
                "message": f"CPF encontrado no sistema - {user.name}"
            })
        else:
            return JSONResponse(content={
                "success": True,
                "valid_format": True,
                "exists_in_database": False,
                "cpf": formatted_cpf,
                "message": "CPF válido, mas não encontrado no sistema"
            })
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error validating CPF: {e}")
        
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Erro interno do servidor"}
        )
