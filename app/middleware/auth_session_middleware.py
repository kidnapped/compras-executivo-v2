from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response
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
            or path.startswith("/login/govbr")
            or path.startswith("/login/govbr/callback")
        )

        if settings.REPAIR_MODE and not (public_paths or path.startswith("/admin")):
            return templates.TemplateResponse("repair.html", {"request": request}, status_code=503)

        if not public_paths:
            if "session" not in request.scope:
                print("⚠️ Sessão não disponível no request.scope")
                raise RuntimeError("🚨 SessionMiddleware não está instalado ou está na ordem correta!")

            session = request.session
            logger.debug("🔐 Sessão atual: %s", session)

            if not session.get("cpf"):
                return RedirectResponse(url="/login")

        return await call_next(request)
