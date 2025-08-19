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
    USE_ALIAS_LOGIN: bool = True

    # Encontro de Contas - For development
    ENCONTRO_CONTAS_EMULATION_MODE: bool = True

    # VDB EMULATION - For development
    VDB_TEIID_EMULATION_MODE: bool = True
    VDB_TEIID_JSON_MOCK_DIR: str = str(Path(__file__).resolve().parents[2] / "app" / "java" / "json_mock")

    # VDB Configuration - DaaS SERPRO Teiid
    VDB_TEIID_HOST: str = "daas.serpro.gov.br"
    VDB_TEIID_PORT: int = 31000
    VDB_TEIID_USER: str = "70267715153"
    VDB_TEIID_PASSWORD: str = "t#Hlbr*tr8"
    VDB_TRUSTSTORE_PATH: str = "/home/ec2-user/java/"
    VDB_TRUSTSTORE_FILE: str = "daas.serpro.gov.br.jks"
    VDB_TRUSTSTORE_TYPE: str = "JKS"
    
    # VDB Names
    VDB_CONTRATOS_NAME: str = "ContratosGovBr_usr_ComprasExecutivo"
    VDB_FINANCEIRO_NAME: str = "DWTG_Colunar_Afinco"
    VDB_FINANCEIRO_SCHEMA: str = "DWTG_Colunar_Afinco_VBL"
    
    # VDB JDBC URLs
    VDB_CONTRATOS_JDBC_URL: str = f"jdbc:teiid:{VDB_CONTRATOS_NAME}@mms://{VDB_TEIID_HOST}:{VDB_TEIID_PORT}"
    VDB_FINANCEIRO_JDBC_URL: str = f"jdbc:teiid:{VDB_FINANCEIRO_NAME}@mms://{VDB_TEIID_HOST}:{VDB_TEIID_PORT};fetchSize=2000;socketTimeout=7200000"
    
    # VDB JDBC Driver
    VDB_TEIID_DRIVER: str = "org.teiid.jdbc.TeiidDriver"
    VDB_POSTGRES_DRIVER: str = "org.postgresql.Driver"
    
    # VDB Local PostgreSQL targets (reusing existing configs)
    VDB_LOCAL_POSTGRES_HOST: str = "localhost"
    VDB_LOCAL_POSTGRES_PORT: int = 5432
    VDB_LOCAL_POSTGRES_USER: str = "postgres"
    VDB_LOCAL_POSTGRES_PASSWORD: str = "postgres"
    VDB_LOCAL_CONTRATOS_DB: str = "contratos"
    VDB_LOCAL_FINANCEIRO_DB: str = "financeiro"
    
    # Java VDB Configuration
    VDB_JAVA_DIR: str = str(Path(__file__).resolve().parents[2] / "app" / "java")
    VDB_JAR_DIR: str = str(Path(__file__).resolve().parents[2] / "app" / "vdb")
    VDB_JAR_FILE: str = "jboss-dv-6.3.0-teiid-jdbc.jar"
    VDB_POSTGRESQL_JAR: str = "postgresql-42.7.2.jar"
    VDB_KEYSTORE_FILE: str = "daas.serpro.gov.br.jks"

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

