from sqlalchemy import text
from app.db.session import get_session_contratos

class IndicadorNaturezaDespesaDAO:
    @staticmethod
    def get_naturezas_by_unidade(unidade_id):
        """
        Retorna as naturezas de despesa distintas para uma unidade específica
        
        Args:
            unidade_id (int): ID da unidade
            
        Returns:
            list: Lista de dicionários com natureza_id e natureza_descricao
        """
        query = text("""
            SELECT DISTINCT
                nd.id    AS natureza_id,
                nd.descricao AS natureza_descricao
            FROM contratos c
            JOIN contratoempenhos ce  ON ce.contrato_id = c.id
            JOIN empenhos e           ON e.id = ce.empenho_id
            LEFT JOIN naturezadespesa nd ON nd.id = e.naturezadespesa_id
            WHERE c.unidade_id = :unidade_id
              AND e.naturezadespesa_id IS NOT NULL
            ORDER BY nd.descricao
        """)
        
        with get_session_contratos() as session:
            result = session.execute(query, {"unidade_id": unidade_id})
            return [dict(row._mapping) for row in result.fetchall()]