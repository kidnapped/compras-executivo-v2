from pydantic_settings import BaseSettings
from pathlib import Path
from typing import ClassVar
import os
from dotenv import load_dotenv

load_dotenv()  # Carrega variáveis do .env

class Settings(BaseSettings):
    # Projeto
    PROJECT_NAME: str = "Compras Executivo"
    APP_PORT: int = 80

    # Banco de dados
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_DB_CONTRATOS: str = "contratos"
    POSTGRES_DB_FINANCEIRO: str = "financeiro"
    POSTGRES_DB_BLOCOK: str = "blocok"

    # Segurança
    JWT_SECRET: str = "I3rAbN6WoxQ8dyjUmZKtfMEPl71uVvBHng0aAeqFhOJ9CTswbrYi5qXczkLu2DRX"
    SECRET_KEY: str = "Gk3s8V@92lsP3$1xXj29P!aAqT4fD9vW7uBzP0LmQ2kL%8nC"

    # Configurações adicionais
    PATH_COMMON: str = str(Path(__file__).resolve().parents[2] / "ws-pentagono" / "Common")
    REPAIR_MODE: bool = False
    API_ENV: str = os.getenv("ENVIRONMENT", "development")
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 80

    MAX_LOGIN_ATTEMPTS: ClassVar[int] = 5

    GOVBR_ENV: str = "homolog"  # ou "prod"
    GOVBR_HOMO_AUTH_URL: str = "https://sso.staging.acesso.gov.br"
    GOVBR_PROD_AUTH_URL: str = "https://sso.acesso.gov.br"
    GOVBR_HOMO_CLIENT_ID: str = "h-www.comprasexecutivo.sistema.gov.br"
    GOVBR_HOMO_SECRET: str = "BvqXVCOx2dt49HfVSiDNr5DQGnBRlgXo6NpKOXHEBfIdospIIOYl2KJL7H-qLEqQkO6617Eq8a3PGcZmJ5sEnQ"
    GOVBR_PROD_CLIENT_ID: str = "SEU_CLIENT_ID_PRODUCAO"
    GOVBR_PROD_SECRET: str = "SEU_CLIENT_SECRET_PRODUCAO"

    REDIRECT_URI: str = "https://www.comprasexecutivo.sistema.gov.br/login/callback"

    USE_GOVBR_LOGIN: bool = False

    @property
    def GOVBR_BASE_URL(self):
        return self.GOVBR_HOMO_AUTH_URL if self.GOVBR_ENV == "homolog" else self.GOVBR_PROD_AUTH_URL

    @property
    def GOVBR_CLIENT_ID(self):
        return self.GOVBR_HOMO_CLIENT_ID if self.GOVBR_ENV == "homolog" else self.GOVBR_PROD_CLIENT_ID

    @property
    def GOVBR_SECRET(self):
        return self.GOVBR_HOMO_SECRET if self.GOVBR_ENV == "homolog" else self.GOVBR_PROD_SECRET

settings = Settings()

