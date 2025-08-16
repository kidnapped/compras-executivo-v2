from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP
from sqlalchemy.sql import func
from app.db.base_class import Base

class CpfAlias(Base):
    __tablename__ = "cpf_alias"

    id = Column(Integer, primary_key=True, index=True)
    cpf = Column(String(14), nullable=False, index=True, comment="CPF usado para fazer login (pode ser fictício)")
    senha = Column(String(255), nullable=False, comment="Senha do alias")
    alias = Column(String(14), nullable=False, index=True, comment="CPF real que será usado no sistema")
    ativo = Column(Boolean, default=True, comment="Se o alias está ativo")
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now())
    atualizado_em = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    descricao = Column(String(255), comment="Descrição opcional do alias")
