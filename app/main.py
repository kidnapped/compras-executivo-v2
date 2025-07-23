from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1.endpoints import login as login_routes
from app.api.v1.endpoints import vdb as vdb_routes
from app.api.v1.endpoints import dashboard as dashboard_routes
from app.api.v1.endpoints import govbr_auth
from app.api.v1.endpoints import kpis
from app.api.v1.endpoints import admin as admin_routes
from app.api.v1.endpoints import encontro_contas
from app.api.v1.endpoints import dev_ops
from app.api.v1.endpoints import uasg_filter
from app.api.v1.endpoints import user_account
from app.middleware.auth_session_middleware import AuthSessionMiddleware
from app.core.config import settings

app = FastAPI(
    title="Compras Executivo",
    version="1.0.0"
)

# 2. Depois o seu middleware de sessão e modo reparo
app.add_middleware(AuthSessionMiddleware)

# 1. Middleware de sessão DEVE vir antes
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="sessao_ce",
    same_site="strict" if settings.API_ENV == "production" else "lax",
    https_only=settings.API_ENV == "production",
    max_age=3600
)

# print(f"🧱 Middlewares registrados: {[m.cls.__name__ for m in app.user_middleware]}")

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
app.include_router(encontro_contas.router)
app.include_router(dev_ops.router)
app.include_router(uasg_filter.router)
app.include_router(user_account.router)
