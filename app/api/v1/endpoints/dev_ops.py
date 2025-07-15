from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from app.core.templates import templates

router = APIRouter()

# Renderiza a página do dev-ops
@router.get("/dev-ops", response_class=HTMLResponse)
async def render_dev_ops(request: Request):
    return templates.TemplateResponse("dev-ops.html", {
        "request": request
    })
