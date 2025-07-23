from fastapi import APIRouter, Request, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import text
from app.core.config import settings
from app.core.templates import templates
from app.db.session import get_async_session, get_session_contratos, get_session_blocok
import time

router = APIRouter()

# Tentativas por IP
login_attempts = {}

@router.get("/login", response_class=HTMLResponse)
async def login_form(request: Request):
    next_url = request.query_params.get("next") or "/inicio"
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
        cpf_logged = row[0]
        request.session["cpf"] = cpf_logged
        
        # Se CPF for tudo zero, usar valores padrão
        if cpf_logged == "00000000000":  # CPF sem formatação do banco
            print("🔧 USANDO VALORES PADRÃO PARA CPF DE TESTE")
            request.session["uasgs"] = [393003]  # Array de UASGs
            request.session["usuario_id"] = 198756  # Valor único
            request.session["usuario_role"] = "Consulta Global"  # Valor único
            request.session["usuario_scope"] = "global"  # Valor único
            request.session["usuario_name"] = "Desenvolvedor"  # Nome padrão
            request.session["usuario_email"] = "teste@comprasexecutivo.sistema.gov.br"  # Email padrão
            print(f"✅ SESSÃO CONFIGURADA: uasgs={request.session['uasgs']}, usuario_id={request.session['usuario_id']}")
        else:
            print(f"🔍 BUSCANDO DADOS PARA CPF: {cpf_logged}")
            # Buscar dados no banco "contratos"
            # O banco contratos pode usar CPF formatado, então vamos tentar ambos os formatos
            cpf_formatted = f"{cpf_logged[:3]}.{cpf_logged[3:6]}.{cpf_logged[6:9]}-{cpf_logged[9:]}"
            print(f"📋 CPF formatado para busca: {cpf_formatted}")
            
            async for contratos_session in get_session_contratos():
                # Buscar UASGs - tentar primeiro com CPF formatado
                stmt_uasgs = text("""
                    SELECT u3.codigosiafi 
                    FROM users u 
                    JOIN unidadesusers u2 ON u.id = u2.user_id
                    JOIN unidades u3 ON u2.unidade_id = u3.id
                    WHERE u.cpf = :cpf
                """)
                
                # Tentar primeiro com CPF formatado
                result_uasgs = await contratos_session.execute(stmt_uasgs, {
                    "cpf": cpf_formatted
                })
                uasgs_rows = result_uasgs.fetchall()
                
                # Se não encontrar, tentar sem formatação
                if not uasgs_rows:
                    print("❌ Não encontrou com CPF formatado, tentando sem formatação...")
                    result_uasgs = await contratos_session.execute(stmt_uasgs, {
                        "cpf": cpf_logged
                    })
                    uasgs_rows = result_uasgs.fetchall()
                
                uasgs = [row[0] for row in uasgs_rows] if uasgs_rows else []
                request.session["uasgs"] = uasgs
                print(f"🏢 UASGs encontradas: {uasgs}")
                
                # Buscar usuario_id - usar mesmo CPF que funcionou acima
                cpf_for_search = cpf_formatted if uasgs else cpf_logged
                stmt_user_id = text("""
                    SELECT id, name, email FROM users WHERE cpf = :cpf LIMIT 1
                """)
                result_user_id = await contratos_session.execute(stmt_user_id, {
                    "cpf": cpf_for_search
                })
                user_id_row = result_user_id.fetchone()
                if user_id_row:
                    usuario_id = user_id_row[0]
                    usuario_name = user_id_row[1]
                    usuario_email = user_id_row[2]
                else:
                    usuario_id = None
                    usuario_name = None
                    usuario_email = None
                
                request.session["usuario_id"] = usuario_id  # Valor único, não array
                request.session["usuario_name"] = usuario_name
                request.session["usuario_email"] = usuario_email
                print(f"👤 Usuario ID encontrado: {usuario_id}")
                print(f"👤 Nome do usuário: {usuario_name}")
                print(f"📧 Email do usuário: {usuario_email}")
                
                # Buscar roles
                stmt_roles = text("""
                    SELECT r.name 
                    FROM model_has_roles mhr
                    JOIN roles r ON mhr.role_id = r.id
                    JOIN users u ON mhr.model_id::numeric = u.id
                    WHERE u.cpf = :cpf
                """)
                result_roles = await contratos_session.execute(stmt_roles, {
                    "cpf": cpf_for_search
                })
                roles_rows = result_roles.fetchall()
                roles = [row[0] for row in roles_rows] if roles_rows else []
                # Se tiver múltiplas roles, pegar a primeira ou concatenar
                request.session["usuario_role"] = roles[0] if roles else None  # Valor único
                print(f"🎭 Roles encontradas: {roles}, usando: {request.session['usuario_role']}")
            
            # Buscar scope no banco "blocok"
            async for blocok_session in get_session_blocok():
                scopes = []
                # Usar a role que foi armazenada na sessão
                current_role = request.session.get("usuario_role")
                if current_role:
                    stmt_scope = text("""
                        SELECT abrangencia FROM perfil_acesso WHERE perfil = :perfil
                    """)
                    result_scope = await blocok_session.execute(stmt_scope, {
                        "perfil": current_role
                    })
                    scope_rows = result_scope.fetchall()
                    for scope_row in scope_rows:
                        if scope_row[0] not in scopes:
                            scopes.append(scope_row[0])
                
                # Se tiver múltiplos scopes, pegar o primeiro ou concatenar
                request.session["usuario_scope"] = scopes[0] if scopes else None  # Valor único
                print(f"🎯 Scopes encontrados: {scopes}, usando: {request.session['usuario_scope']}")

        print("💾 SESSÃO FINAL GRAVADA:")
        print(f"  cpf={request.session.get('cpf')}")
        print(f"  uasgs={request.session.get('uasgs')}")
        print(f"  usuario_id={request.session.get('usuario_id')}")
        print(f"  usuario_name={request.session.get('usuario_name')}")
        print(f"  usuario_email={request.session.get('usuario_email')}")
        print(f"  usuario_role={request.session.get('usuario_role')}")
        print(f"  usuario_scope={request.session.get('usuario_scope')}")
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
        "error": "CPF ou senha incorretos.",
        "next": request.query_params.get("next") or "/inicio"
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
    
    return templates.TemplateResponse("inicio.html", {
        "request": request,
        "cpf": cpf
    })

@router.get("/bloqueado", response_class=HTMLResponse)
async def render_dashboard(request: Request):
    return templates.TemplateResponse("bloqueado.html", {
        "request": request
    })

@router.get("/suporte", response_class=HTMLResponse)
async def render_suporte(request: Request):
    return templates.TemplateResponse("suporte.html", {
        "request": request
    })

@router.get("/ajuda", response_class=HTMLResponse)
async def render_ajuda(request: Request):
    return templates.TemplateResponse("ajuda.html", {
        "request": request
    })

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
        "settings": settings
    })
