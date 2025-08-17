from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from app.core.templates import templates
from app.utils.spa_utils import spa_route_handler, add_spa_context

router = APIRouter()

@router.get("/minha-conta", response_class=HTMLResponse)
async def minha_conta(request: Request):
    # Check if user is logged in
    cpf = request.session.get("cpf")
    if not cpf:
        return RedirectResponse(url="/login?next=/minha-conta")
    
    # Get user information from session
    user_data = {
        "cpf": request.session.get("cpf"),
        "nome": request.session.get("usuario_name"),
        "email": request.session.get("usuario_email"),
        "role": request.session.get("usuario_role"),
        "scope": request.session.get("usuario_scope"),
        "usuario_id": request.session.get("usuario_id"),
        "uasgs": request.session.get("uasgs", [])
    }
    
    # Criar contexto
    context = {
        "request": request,
        "user_data": user_data,
        "template_name": "outros-templates"
    }
    
    # Adicionar contexto SPA
    context = add_spa_context(context, request)
    
    # Usar o handler SPA
    return spa_route_handler(
        template_name="minha_conta.html",
        context=context,
        templates=templates,
        request=request,
        title="Minha Conta - Compras Executivo"
    )
