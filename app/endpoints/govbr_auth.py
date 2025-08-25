from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx
import base64
import json
from typing import Optional
from app.core.config import settings
import logging

logger = logging.getLogger("comprasexec.govbr")

router = APIRouter()

class TokenRequest(BaseModel):
    code: str
    code_verifier: str
    redirect_uri: str

class TokenResponse(BaseModel):
    access_token: str
    id_token: str
    token_type: str
    expires_in: int

@router.post("/govbr/token")
async def trocar_codigo_por_tokens(request: Request, token_request: TokenRequest):
    """
    Troca o código de autorização por tokens de acesso conforme documentação gov.br
    """
    try:
        # Preparar dados para a requisição
        token_data = {
            "grant_type": "authorization_code",
            "code": token_request.code,
            "redirect_uri": token_request.redirect_uri,
            "code_verifier": token_request.code_verifier
        }
        
        # Preparar headers
        client_credentials = f"{settings.GOVBR_CLIENT_ID}:{settings.GOVBR_SECRET}"
        client_credentials_b64 = base64.b64encode(client_credentials.encode()).decode()
        
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {client_credentials_b64}"
        }
        
        # Fazer requisição para o gov.br
        token_url = f"{settings.GOVBR_BASE_URL}/token"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data=token_data,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Erro ao trocar código por tokens: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Erro na autenticação gov.br: {response.status_code}"
                )
            
            tokens = response.json()
            
            # Validar se recebeu os tokens necessários
            if "access_token" not in tokens or "id_token" not in tokens:
                logger.error("Tokens necessários não recebidos do gov.br")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tokens de acesso não recebidos"
                )
            
            return tokens
            
    except httpx.RequestError as e:
        logger.error(f"Erro de conexão com gov.br: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Erro de conexão com o serviço gov.br"
        )
    except Exception as e:
        logger.error(f"Erro inesperado ao trocar tokens: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )

@router.get("/govbr/userinfo")
async def obter_informacoes_usuario(request: Request):
    """
    Obtém informações do usuário usando o access token
    """
    try:
        # Extrair token do header Authorization
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de acesso não fornecido"
            )
        
        access_token = authorization.split(" ")[1]
        
        # Fazer requisição para obter informações do usuário
        userinfo_url = f"{settings.GOVBR_BASE_URL}/userinfo"
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                userinfo_url,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Erro ao obter informações do usuário: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Erro ao obter informações do usuário"
                )
            
            user_info = response.json()
            
            # Extrair informações do ID token se disponível
            id_token = request.headers.get("X-ID-Token")
            if id_token:
                try:
                    # Decodificar ID token (sem validação de assinatura para este exemplo)
                    # Em produção, deve-se validar a assinatura usando a chave pública do gov.br
                    id_payload = decode_jwt_payload(id_token)
                    user_info.update(id_payload)
                except Exception as e:
                    logger.warning(f"Erro ao decodificar ID token: {str(e)}")
            
            return user_info
            
    except httpx.RequestError as e:
        logger.error(f"Erro de conexão com gov.br: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Erro de conexão com o serviço gov.br"
        )
    except Exception as e:
        logger.error(f"Erro inesperado ao obter informações do usuário: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )

@router.get("/govbr/foto")
async def obter_foto_usuario(request: Request):
    """
    Obtém a foto do usuário do gov.br
    """
    try:
        # Extrair token do header Authorization
        authorization = request.headers.get("Authorization")
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de acesso não fornecido"
            )
        
        access_token = authorization.split(" ")[1]
        
        # Fazer requisição para obter a foto
        foto_url = f"{settings.GOVBR_BASE_URL}/userinfo/picture"
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                foto_url,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code != 200:
                logger.error(f"Erro ao obter foto do usuário: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Foto do usuário não encontrada"
                )
            
            # Retornar a foto em base64
            content_type = response.headers.get("Content-Type", "image/jpeg")
            foto_b64 = base64.b64encode(response.content).decode()
            
            return {
                "foto": f"data:{content_type};base64,{foto_b64}",
                "content_type": content_type
            }
            
    except httpx.RequestError as e:
        logger.error(f"Erro de conexão com gov.br: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Erro de conexão com o serviço gov.br"
        )
    except Exception as e:
        logger.error(f"Erro inesperado ao obter foto: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )

def decode_jwt_payload(token: str) -> dict:
    """
    Decodifica o payload de um JWT sem validar a assinatura
    ATENÇÃO: Em produção, sempre validar a assinatura!
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Token JWT inválido")
        
        # Decodificar payload
        payload_b64 = parts[1]
        # Adicionar padding se necessário
        payload_b64 += '=' * (4 - len(payload_b64) % 4)
        payload_bytes = base64.b64decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        return payload
        
    except Exception as e:
        logger.error(f"Erro ao decodificar JWT: {str(e)}")
        return {}

@router.post("/govbr/login")
async def processar_login_govbr(request: Request, token_request: TokenRequest):
    """
    Processa o login após receber os tokens do gov.br e atualiza a sessão
    """
    try:
        # Trocar código por tokens
        tokens = await trocar_codigo_por_tokens(request, token_request)
        
        # Obter informações do usuário
        access_token = tokens.get("access_token")
        id_token = tokens.get("id_token")
        
        if not access_token or not id_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tokens necessários não encontrados"
            )
        
        # Decodificar ID token para obter CPF
        id_payload = decode_jwt_payload(id_token)
        cpf = id_payload.get("sub") or id_payload.get("cpf")
        
        if not cpf:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CPF não encontrado nos dados do usuário"
            )
        
        # Atualizar sessão
        request.session["cpf"] = cpf
        request.session["access_token"] = access_token
        request.session["id_token"] = id_token
        request.session["uasgs"] = [393003]  # TODO: Implementar lógica real de UASG
        
        # Retornar informações do usuário
        user_info = {
            "cpf": cpf,
            "name": id_payload.get("name"),
            "email": id_payload.get("email"),
            "phone_number": id_payload.get("phone_number"),
            "email_verified": id_payload.get("email_verified"),
            "phone_number_verified": id_payload.get("phone_number_verified")
        }
        
        return {
            "success": True,
            "user_info": user_info,
            "redirect_url": "/minha-conta"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado ao processar login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )

@router.post("/govbr/logout")
async def logout_govbr(request: Request):
    """
    Realiza logout no gov.br
    """
    try:
        # URL de logout do gov.br
        logout_url = f"{settings.GOVBR_BASE_URL}/logout"
        
        # URL de retorno após logout
        post_logout_redirect_uri = request.url_for("login_form")
        
        logout_redirect = f"{logout_url}?post_logout_redirect_uri={post_logout_redirect_uri}"
        
        return {"logout_url": logout_redirect}
        
    except Exception as e:
        logger.error(f"Erro ao fazer logout: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno do servidor"
        )
