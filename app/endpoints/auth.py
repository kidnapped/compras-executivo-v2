from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from starlette.middleware.sessions import SessionMiddleware

from app.core.templates import templates

router = APIRouter()

USERNAME = "leo"
PASSWORD = "123"

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "template_name": "login"})

@router.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    if username == USERNAME and password == PASSWORD:
        request.session['user'] = username
        return RedirectResponse(url="/minha-conta", status_code=302)
    return templates.TemplateResponse("login.html", {"request": request, "error": "Usuário ou senha inválidos.", "template_name": "login"})

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login")
