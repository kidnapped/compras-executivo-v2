from fastapi import APIRouter, Request, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from app.core.config import settings
from app.core.templates import templates
from app.core.config_menu import get_menu_for_scope
from app.dao.login_dao import login as dao_login
from app.utils.spa_utils import spa_route_handler, add_spa_context
import time
import pathlib
import re

router = APIRouter()

# Tentativas por IP
login_attempts = {}

@router.get("/login", response_class=HTMLResponse)
async def login_form(request: Request):
    next_url = request.query_params.get("next") or "/inicio"
    return templates.TemplateResponse("login.html", {
        "request": request,
        "next": next_url,
        "template_name": "login"
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
            "error": "Muitas tentativas. Tente novamente mais tarde.",
            "template_name": "login"
        })

    # Usar o DAO para autenticação
    login_result = await dao_login(cpf, senha)

    if login_result.success:
        print("✅ LOGIN VALIDADO NO BANCO")
        user_data = login_result.user_data
        
        # Configurar sessão com os dados do usuário
        request.session["cpf"] = user_data["cpf"]
        request.session["uasgs"] = user_data["uasgs"]
        request.session["usuario_id"] = user_data["usuario_id"]
        request.session["usuario_role"] = user_data["usuario_role"]
        request.session["usuario_scope"] = user_data["usuario_scope"]
        request.session["usuario_name"] = user_data["usuario_name"]
        request.session["usuario_email"] = user_data["usuario_email"]
        
        # Configurar menu baseado no scope
        user_scope = user_data["usuario_scope"]
        if user_scope:
            request.session["menu"] = get_menu_for_scope(user_scope)
            print(f"🍽️ MENU CONFIGURADO para scope '{user_scope}': {len(request.session['menu'])} itens")
        else:
            # Se não tem scope, usar menu padrão (unidade)
            request.session["menu"] = get_menu_for_scope("unidade")
            print(f"🍽️ MENU PADRÃO CONFIGURADO: {len(request.session['menu'])} itens")

        print("💾 SESSÃO FINAL GRAVADA:")
        print(f"  cpf={request.session.get('cpf')}")
        print(f"  uasgs={request.session.get('uasgs')}")
        print(f"  usuario_id={request.session.get('usuario_id')}")
        print(f"  usuario_name={request.session.get('usuario_name')}")
        print(f"  usuario_email={request.session.get('usuario_email')}")
        print(f"  usuario_role={request.session.get('usuario_role')}")
        print(f"  usuario_scope={request.session.get('usuario_scope')}")
        print(f"  menu_items={len(request.session.get('menu', []))} itens")
        print(f"📦 SESSÃO COMPLETA: {dict(request.session)}")

        login_attempts[client_ip] = []

        next_url = request.query_params.get("next") or "/inicio"
        print(f"🔁 REDIRECIONANDO PARA /login/success?next={next_url}")
        return RedirectResponse(url=f"/login/success?next={next_url}", status_code=status.HTTP_303_SEE_OTHER)

    # Se falhar
    attempts.append(now)
    login_attempts[client_ip] = attempts
    print("❌ LOGIN FALHOU")
    return templates.TemplateResponse("login.html", {
        "request": request,
        "error": login_result.error or "CPF ou senha incorretos.",
        "next": request.query_params.get("next") or "/inicio",
        "template_name": "login"
    })

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/login", status_code=status.HTTP_303_SEE_OTHER)

@router.get("/inicio", response_class=HTMLResponse)
async def inicio(request: Request):
    # Check if user is logged in
    cpf = request.session.get("cpf")
    if not cpf:
        return RedirectResponse(url="/login?next=/inicio")
    
    # Criar contexto
    context = {
        "request": request,
        "cpf": cpf,
        "template_name": "inicio"
    }
    
    # Adicionar contexto SPA
    context = add_spa_context(context, request)
    
    # Usar o handler SPA
    return spa_route_handler(
        template_name="app/inicio.html",
        context=context,
        templates=templates,
        request=request,
        title="Início - Compras Executivo"
    )

@router.get("/bloqueado", response_class=HTMLResponse)
async def render_dashboard(request: Request):
    return templates.TemplateResponse("app/bloqueado.html", {
        "request": request,
        "template_name": "outros-templates"
    })

@router.get("/suporte", response_class=HTMLResponse)
async def render_suporte(request: Request):
    context = {
        "request": request,
        "template_name": "outros-templates"
    }
    
    context = add_spa_context(context, request)
    
    return spa_route_handler(
        template_name="suporte.html",
        context=context,
        templates=templates,
        request=request,
        title="Suporte - Compras Executivo"
    )

@router.get("/ajuda", response_class=HTMLResponse)
async def render_ajuda(request: Request):
    context = {
        "request": request,
        "template_name": "outros-templates"
    }
    
    context = add_spa_context(context, request)
    
    return spa_route_handler(
        template_name="ajuda.html",
        context=context,
        templates=templates,
        request=request,
        title="Ajuda - Compras Executivo"
    )

@router.get("/login/success")
async def login_success(request: Request):
    print("🔍 LOGIN SUCCESS - SESSION ATUAL:", request.session)
    cpf = request.session.get("cpf")
    if not cpf:
        return RedirectResponse(url="/login")

    next_url = request.query_params.get("next") or "/inicio"

    # Aqui futuramente colocar regras com base no CPF, perfil, etc.
    return RedirectResponse(url=next_url)

@router.get("/login/callback", response_class=HTMLResponse)
async def govbr_callback(request: Request):
    """
    Endpoint de callback para o retorno da autenticação gov.br
    """
    return templates.TemplateResponse("govbr_callback.html", {
        "request": request,
        "settings": settings,
        "template_name": "outros-templates"
    })

@router.get("/login/page_loader", response_class=HTMLResponse)
async def page_loader(request: Request):
    """Preview of the Page Loader from base.html"""
    base_html_path = pathlib.Path(__file__).parent.parent / "templates" / "app" / "base.html"
    loading_css_path = pathlib.Path(__file__).parent.parent / "static" / "css" / "app" / "loading.css"
    
    with open(base_html_path, "r", encoding="utf-8") as f:
        base_html_content = f.read()
    
    # Read the CSS file
    css_content = ""
    if loading_css_path.exists():
        with open(loading_css_path, "r", encoding="utf-8") as f:
            css_content = f.read()
    
    # Extract the Page Loader HTML
    loader_html_match = re.search(r'<!-- Page Loader -->([\s\S]*?)</div>\s*</div>', base_html_content)
    
    if loader_html_match:
        loader_html = loader_html_match.group(0)
        
        complete_html = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Loader Preview</title>
    <style>
        {css_content}
    </style>
</head>
<body>
    {loader_html}
</body>
</html>
"""
        return HTMLResponse(content=complete_html)
    else:
        return HTMLResponse(content="<div>Page Loader HTML not found in base.html</div>")
