import logging
from fastapi import APIRouter, Request, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List, Optional

from app.utils.static_loader import collect_static_files
from app.core import config as app_config
from app.utils.session_utils import get_uasgs_str
from app.db.session import get_session_contratos

logger = logging.getLogger(__name__)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Renderiza a página do filtro UASG
@router.get("/uasg-filter", response_class=HTMLResponse)
async def render_uasg_filter(request: Request, search: Optional[str] = Query(None)):
    """
    Renderiza a página de filtro UASG
    """
    dev_css_files, dev_js_modules, dev_js_files = collect_static_files()
    return templates.TemplateResponse(
        "uasg_filter.html", 
        {
            "request": request,
            "search": search,
            "dev_css_files": dev_css_files,
            "dev_js_modules": dev_js_modules,
            "dev_js_files": dev_js_files, 
            "config": app_config
        }
    )
