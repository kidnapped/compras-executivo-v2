from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def build_database_url(db_name: str) -> str:
    return (
        f"postgresql+asyncpg://{settings.POSTGRES_USER}:"
        f"{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}/{db_name}"
    )

async def get_async_session(database: str = None):
    db_name = database or settings.POSTGRES_DB_BLOCOK
    engine = create_async_engine(
        build_database_url(db_name),
        echo=False,
        future=True
    )
    async_session = sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    async with async_session() as session:
        yield session

async def get_session_contratos():
    async for session in get_async_session(settings.POSTGRES_DB_CONTRATOS):
        yield session

async def get_session_financeiro():
    async for session in get_async_session(settings.POSTGRES_DB_FINANCEIRO):
        yield session

async def get_session_blocok():
    async for session in get_async_session(settings.POSTGRES_DB_BLOCOK):
        yield session