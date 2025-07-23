from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from app.core.templates import templates

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
    
    return templates.TemplateResponse("minha_conta.html", {
        "request": request,
        "user_data": user_data
    })
