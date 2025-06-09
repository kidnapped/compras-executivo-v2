from fastapi import APIRouter, Request, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse
from starlette.templating import Jinja2Templates
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_async_session
import time

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

# Tentativas por IP
login_attempts = {}

@router.get("/login", response_class=HTMLResponse)
async def login_form(request: Request):
    next_url = request.query_params.get("next") or "/dashboard"
    return templates.TemplateResponse("login.html", {
        "request": request,
        "next": next_url
    })

@router.post("/login")
async def login(request: Request, cpf: str = Form(...), senha: str = Form(...)):
    client_ip = request.client.host
    now = time.time()
    window = 300
    max_attempts = 5

    # print("🔒 NOVA TENTATIVA DE LOGIN")
    # print(f"📍 IP: {client_ip}")
    # print(f"🧾 HEADERS: {request.headers}")
    # print(f"📦 FORM: cpf={cpf}, senha={'*' * len(senha)}")
    # print(f"📂 SESSÃO INICIAL: {request.session}")

    attempts = login_attempts.get(client_ip, [])
    attempts = [ts for ts in attempts if now - ts < window]

    if len(attempts) >= max_attempts:
        print("⛔️ IP bloqueado temporariamente por excesso de tentativas")
        return templates.TemplateResponse("login.html", {
            "request": request,
            "error": "Muitas tentativas. Tente novamente mais tarde."
        })

    # Verifica no banco
    async for session in get_async_session():
        stmt = text("""
            SELECT cpf FROM usuario
            WHERE cpf = :cpf AND senha = crypt(:senha, senha)
              AND ativo IS TRUE
            LIMIT 1
        """)
        result = await session.execute(stmt, {
            "cpf": cpf.replace(".", "").replace("-", ""),
            "senha": senha
        })
        row = result.fetchone()

    if row:
        print("✅ LOGIN VALIDADO NO BANCO")
        request.session["cpf"] = row[0]
        request.session["uasgs"] = [393003]
        # print("💾 SESSÃO GRAVADA:")
        # print(f"  cpf={request.session.get('cpf')}")
        # print(f"  uasgs={request.session.get('uasgs')}")
        # print(f"📦 SESSÃO COMPLETA: {request.session}")

        login_attempts[client_ip] = []

        next_url = request.query_params.get("next") or "/dashboard"
        print(f"🔁 REDIRECIONANDO PARA /login/success?next={next_url}")
        return RedirectResponse(url=f"/login/success?next={next_url}", status_code=status.HTTP_303_SEE_OTHER)

    # Se falhar
    attempts.append(now)
    login_attempts[client_ip] = attempts
    print("❌ LOGIN FALHOU")
    return templates.TemplateResponse("login.html", {
        "request": request,
        "error": "CPF ou senha incorretos.",
        "next": request.query_params.get("next") or "/dashboard"
    })

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)

@router.get("/login/success")
async def login_success(request: Request):
    print("🔍 LOGIN SUCCESS - SESSION ATUAL:", request.session)
    cpf = request.session.get("cpf")
    if not cpf:
        return RedirectResponse(url="/login")

    next_url = request.query_params.get("next") or "/dashboard"

    # Aqui futuramente colocar regras com base no CPF, perfil, etc.
    return RedirectResponse(url=next_url)
