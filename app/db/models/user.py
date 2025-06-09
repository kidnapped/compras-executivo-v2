from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base_class import Base

class User(Base):
    __tablename__ = "usuario"

    id = Column(Integer, primary_key=True, index=True)
    cpf = Column(String(14), nullable=False, unique=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True)
    senha = Column(String(255))
    origem_login = Column(String(20), nullable=False, default="govbr")
    ultimo_login = Column(TIMESTAMP(timezone=True))
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())
    ativo = Column(Boolean, default=True)
    usuario = Column(String(50), nullable=False, unique=True)
