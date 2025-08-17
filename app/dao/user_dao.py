from sqlalchemy import text
from app.db.session import get_session_contratos
from typing import List, Dict, Any, Optional


class UserUnidadeOrgao:
    """Classe para representar uma unidade e órgão de um usuário"""
    def __init__(self, orgao_id: int, unidade_id: int):
        self.orgao_id = orgao_id
        self.unidade_id = unidade_id

    def to_dict(self) -> Dict[str, Any]:
        """Converte o objeto para dicionário"""
        return {
            "orgao_id": self.orgao_id,
            "unidade_id": self.unidade_id
        }


async def get_user_unidades_orgaos(user_id: int) -> List[UserUnidadeOrgao]:
    """
    Busca todas as unidades e órgãos conectados a um usuário específico
    
    Args:
        user_id: ID do usuário
        
    Returns:
        List[UserUnidadeOrgao]: Lista de unidades e órgãos associados ao usuário
    """
    try:
        async for session in get_session_contratos():
            stmt = text("""
                -- All unidade_id connected to the órgãos of a given user
                WITH user_orgaos AS (
                  SELECT DISTINCT u.orgao_id
                  FROM unidadesusers pu
                  JOIN unidades u ON u.id = pu.unidade_id
                  WHERE pu.user_id = :user_id
                )
                SELECT DISTINCT
                  u.orgao_id,
                  u.id AS unidade_id
                FROM unidades u
                JOIN user_orgaos o ON o.orgao_id = u.orgao_id
                ORDER BY u.orgao_id, u.id
            """)
            
            result = await session.execute(stmt, {"user_id": user_id})
            rows = result.fetchall()
            
            return [UserUnidadeOrgao(orgao_id=row[0], unidade_id=row[1]) for row in rows]
            
    except Exception as e:
        print(f"⚠️ Erro ao buscar unidades e órgãos do usuário {user_id}: {e}")
        return []


async def get_user_unidades_orgaos_dict(user_id: int) -> List[Dict[str, Any]]:
    """
    Busca todas as unidades e órgãos conectados a um usuário específico e retorna como dicionário
    
    Args:
        user_id: ID do usuário
        
    Returns:
        List[Dict[str, Any]]: Lista de dicionários com unidades e órgãos associados ao usuário
    """
    unidades_orgaos = await get_user_unidades_orgaos(user_id)
    return [item.to_dict() for item in unidades_orgaos]


async def get_user_orgaos_only(user_id: int) -> List[int]:
    """
    Busca apenas os IDs dos órgãos únicos conectados a um usuário específico
    
    Args:
        user_id: ID do usuário
        
    Returns:
        List[int]: Lista de IDs únicos dos órgãos associados ao usuário
    """
    try:
        async for session in get_session_contratos():
            stmt = text("""
                SELECT DISTINCT u.orgao_id
                FROM unidadesusers pu
                JOIN unidades u ON u.id = pu.unidade_id
                WHERE pu.user_id = :user_id
                ORDER BY u.orgao_id
            """)
            
            result = await session.execute(stmt, {"user_id": user_id})
            rows = result.fetchall()
            
            return [row[0] for row in rows]
            
    except Exception as e:
        print(f"⚠️ Erro ao buscar órgãos do usuário {user_id}: {e}")
        return []


async def get_user_unidades_only(user_id: int) -> List[int]:
    """
    Busca apenas os IDs das unidades diretamente conectadas a um usuário específico
    
    Args:
        user_id: ID do usuário
        
    Returns:
        List[int]: Lista de IDs das unidades diretamente associadas ao usuário
    """
    try:
        async for session in get_session_contratos():
            stmt = text("""
                SELECT DISTINCT pu.unidade_id
                FROM unidadesusers pu
                WHERE pu.user_id = :user_id
                ORDER BY pu.unidade_id
            """)
            
            result = await session.execute(stmt, {"user_id": user_id})
            rows = result.fetchall()
            
            return [row[0] for row in rows]
            
    except Exception as e:
        print(f"⚠️ Erro ao buscar unidades do usuário {user_id}: {e}")
        return []
