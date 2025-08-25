from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response, JSONResponse
from starlette.templating import Jinja2Templates
from app.core.config import settings
import logging

logger = logging.getLogger("comprasexec.auth")
templates = Jinja2Templates(directory="app/templates")

class AuthSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)  # ✅ Isso garante que self.app está definido corretamente

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        public_paths = (
            path.startswith("/static")
            or path.startswith("/favicon")
            or path.startswith("/login")
            or path.startswith("/logout")
            or path.startswith("/vdb")
            or path.startswith("/login/success")
            or path.startswith("/login/callback")
        )

        if settings.REPAIR_MODE and not (public_paths or path.startswith("/admin")):
            return templates.TemplateResponse("app/repair.html", {"request": request}, status_code=503)

        if not public_paths:
            if "session" not in request.scope:
                print("⚠️ Sessão não disponível no request.scope")
                raise RuntimeError("🚨 SessionMiddleware não está instalado ou está na ordem correta!")

            session = request.session
            logger.debug("🔐 Sessão atual: %s", session)
            
            # Debug logging
            cpf = session.get("cpf")

            if not cpf:
                # Check if this is an AJAX/API request
                is_ajax = (
                    request.headers.get("X-Requested-With") == "XMLHttpRequest" or
                    request.headers.get("Accept", "").startswith("application/json") or
                    "application/json" in request.headers.get("Content-Type", "") or
                    path.startswith("/api/") or
                    (path.startswith("/dashboard/contrato/") and path.endswith("/favorito") and request.method == "POST")
                )
                
                if is_ajax:
                    return JSONResponse(
                        content={"error": "Authentication required", "detail": "Sessão expirada"}, 
                        status_code=401
                    )
                else:
                    return RedirectResponse(url="/login")

        if settings.USE_GOVBR_LOGIN and path == "/login":
            response = templates.TemplateResponse("login_gov.html", {"request": request, "settings": settings})
            response.headers["X-Internal-Redirect"] = "true"
            return response

        # Forçar login gov.br mesmo quando USE_GOVBR_LOGIN = False
        if path == "/login" and request.query_params.get("force_govbr"):
            response = templates.TemplateResponse("login_gov.html", {"request": request, "settings": settings})
            response.headers["X-Internal-Redirect"] = "true"
            return response

        return await call_next(request)
