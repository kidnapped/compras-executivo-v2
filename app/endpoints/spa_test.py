"""
Endpoint de teste para SPA
"""
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from app.core.templates import templates
from app.utils.spa_utils import spa_route_handler, add_spa_context

router = APIRouter()

@router.get("/spa-test", response_class=HTMLResponse)
async def spa_test(request: Request):
    """Endpoint de teste para verificar funcionamento do SPA"""
    
    context = {
        "request": request,
        "template_name": "outros-templates",
        "test_message": "SPA está funcionando!"
    }
    
    context = add_spa_context(context, request)
    
    return spa_route_handler(
        template_name="spa_test.html",
        context=context,
        templates=templates,
        request=request,
        title="Teste SPA - Compras Executivo"
    )
