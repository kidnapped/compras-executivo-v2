from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.endpoints import login as login_routes
from app.endpoints import vdb as vdb_routes
from app.endpoints import dashboard as dashboard_routes
from app.endpoints import govbr_auth
from app.endpoints import kpis
from app.endpoints import indicadores
from app.endpoints import admin as admin_routes
from app.endpoints import encontro_contas
from app.endpoints import dev_ops
from app.endpoints import uasg_filter
from app.endpoints import user_account
from app.middleware.auth_session_middleware import AuthSessionMiddleware
from app.core.config import settings

app = FastAPI(
    title="Compras Executivo",
    version="1.0.0"
)

# IMPORTANTE: FastAPI executa middlewares em ordem INVERSA (LIFO)
# O primeiro adicionado será o último executado
# Portanto, adicionamos AuthSessionMiddleware primeiro para ser executado por último

# 1. Adicionar AuthSessionMiddleware primeiro (será executado POR ÚLTIMO)
app.add_middleware(AuthSessionMiddleware)

# 2. Adicionar SessionMiddleware por último (será executado PRIMEIRO)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="sessao_ce",
    same_site="strict" if settings.API_ENV == "production" else "lax",
    https_only=settings.API_ENV == "production",
    max_age=3600
)

# print(f"🧱 Middlewares registrados: {[m.cls.__name__ for m in app.user_middleware]}")

# Custom 404 error handler
@app.exception_handler(StarletteHTTPException)
async def custom_404_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        # Check if user is logged in
        session = getattr(request, 'session', {})
        cpf = session.get("cpf") if session else None
        
        if cpf:
            # User is logged in, redirect to /minha-conta
            return RedirectResponse(url="/minha-conta", status_code=302)
        else:
            # User is not logged in, redirect to /login
            return RedirectResponse(url="/login", status_code=302)
    
    # For other HTTP exceptions, re-raise them
    raise exc

# Arquivos estáticos
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Rota raiz
@app.get("/", response_class=HTMLResponse)
async def read_index(request: Request):
    return RedirectResponse(url="/dashboard")

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("app/static/favicon.ico")

# Rotas principais
app.include_router(login_routes.router)
app.include_router(vdb_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(govbr_auth.router, prefix="/api")
app.include_router(admin_routes.router)
app.include_router(kpis.router)
app.include_router(indicadores.router)
app.include_router(encontro_contas.router)
app.include_router(dev_ops.router)
app.include_router(uasg_filter.router)
app.include_router(user_account.router)
