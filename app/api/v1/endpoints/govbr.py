from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from app.core.config import settings
import secrets
from jose import jwt

router = APIRouter()
oauth = OAuth()

oauth.register(
    name="govbr",
    client_id=settings.GOVBR_CLIENT_ID,
    client_secret=settings.GOVBR_SECRET,
    authorize_url=f"{settings.GOVBR_BASE_URL}/authorize",
    access_token_url=f"{settings.GOVBR_BASE_URL}/token",
    client_kwargs={
        "scope": "openid profile email",
        "code_challenge_method": "S256"
    }
)

@router.get("/login/govbr")
async def login_com_govbr(request: Request):
    # Proteção CSRF via state
    state = secrets.token_urlsafe(16)
    request.session["oauth_state"] = state

    redirect_uri = settings.REDIRECT_URI
    return await oauth.govbr.authorize_redirect(request, redirect_uri, state=state)

@router.get("/login/govbr/callback")
async def retorno_do_govbr(request: Request):
    expected_state = request.session.pop("oauth_state", None)
    received_state = request.query_params.get("state")

    if expected_state != received_state:
        raise HTTPException(status_code=400, detail="Estado inválido. Possível ataque CSRF.")

    try:
        token = await oauth.govbr.authorize_access_token(request)
    except Exception as e:
        print(f"Erro na troca de token: {e}")
        return RedirectResponse(url="/login?error=oauth")

    userinfo = token.get("userinfo") or {}
    cpf = userinfo.get("cpf") or token.get("cpf")

    if not cpf:
        try:
            id_token = token.get("id_token")
            decoded = jwt.get_unverified_claims(id_token)
            cpf = decoded.get("sub")
        except Exception as e:
            print(f"Erro ao extrair CPF do ID Token: {e}")
            return RedirectResponse(url="/login?error=id_token")

    # Armazenar na sessão
    request.session["cpf"] = cpf
    request.session["access_token"] = token.get("access_token")
    request.session["id_token"] = token.get("id_token")
    request.session['uasgs'] = [393003] # TODO TEM QUE FAZER A REGRA DA UASG

    return RedirectResponse(url="/dashboard")
