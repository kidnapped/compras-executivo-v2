from sqlalchemy import text
from app.db.session import get_session_contratos

class IndicadorTopFornecedoresDAO:
    @staticmethod
    def get_top_fornecedores_by_unidade(unidade_id):
        """
        Retorna os top 10 fornecedores com seus contratos e naturezas de despesa para uma unidade específica
        
        Args:
            unidade_id (int): ID da unidade
            
        Returns:
            list: Lista de dicionários com informações detalhadas dos top fornecedores,
                  incluindo contratos vigentes e naturezas de despesa
        """
        query = text("""
            WITH contratos_unidade AS (
              SELECT
                c.id,
                c.numero,
                c.unidade_id,
                c.fornecedor_id,
                f.nome AS fornecedor_nome,
                -- normalize string -> numeric (as in your draft)
                c.valor_acumulado::numeric AS valor_acumulado_num,
                c.valor_global::numeric AS valor_global_num,
                c.valor_inicial::numeric AS valor_inicial_num
              FROM contratos c
              JOIN fornecedores f ON f.id = c.fornecedor_id
              WHERE c.unidade_id = :unidade_id   -- pass a single int here; use ANY(:unidade_ids::int[]) for arrays
            ),
            fornecedor_totais AS (
              SELECT fornecedor_id, SUM(valor_acumulado_num) AS total_valor_acumulado
              FROM contratos_unidade
              GROUP BY fornecedor_id
            ),
            top_fornecedores AS (
              SELECT fornecedor_id
              FROM fornecedor_totais
              ORDER BY total_valor_acumulado DESC NULLS LAST
              LIMIT 10
            ),
            joined AS (  -- all rows before deduping by natureza
              SELECT
                f.id   AS fornecedor_id,
                f.nome AS fornecedor_nome,
                c.id   AS contrato_id,
                c.vigencia_inicio,
                c.vigencia_fim,
                c.objeto,
                c.numero              AS contrato_numero,
                e.numero              AS empenho_numero,
                cu.valor_acumulado_num AS valor_acumulado,
                cu.valor_global_num    AS valor_global,
                cu.valor_inicial_num   AS valor_inicial,
                nd.id                 AS natureza_id,
                nd.descricao          AS natureza_descricao
              FROM contratos_unidade cu
              JOIN contratos c            ON c.id = cu.id
              JOIN fornecedores f         ON f.id = cu.fornecedor_id
              JOIN contratoempenhos ce    ON ce.contrato_id = c.id
              JOIN empenhos e             ON e.id = ce.empenho_id
              LEFT JOIN naturezadespesa nd ON nd.id = e.naturezadespesa_id
              JOIN top_fornecedores tf    ON tf.fornecedor_id = f.id
              WHERE e.naturezadespesa_id IS NOT NULL
                AND c.vigencia_fim > CURRENT_DATE
            ),
            distinct_natureza AS (  -- keep 1 row per fornecedor × contrato × natureza
              SELECT DISTINCT ON (fornecedor_id, contrato_id, natureza_id)
                fornecedor_id,
                fornecedor_nome,
                contrato_id,
                vigencia_inicio,
                vigencia_fim,
                objeto,
                contrato_numero,
                empenho_numero,       -- representative (first by ORDER BY below)
                valor_acumulado,
                valor_global,
                valor_inicial,
                natureza_id,
                natureza_descricao
              FROM joined
              ORDER BY fornecedor_id, contrato_id, natureza_id, empenho_numero  -- pick the earliest/lowest NE number
            )
            SELECT *
            FROM distinct_natureza
            ORDER BY fornecedor_nome, contrato_numero, natureza_descricao
        """)
        
        with get_session_contratos() as session:
            result = session.execute(query, {"unidade_id": unidade_id})
            return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    def get_top_fornecedores_summary_by_unidade(unidade_id):
        """
        Retorna um resumo dos top 10 fornecedores com valores totais para uma unidade específica
        
        Args:
            unidade_id (int): ID da unidade
            
        Returns:
            list: Lista de dicionários com fornecedor_id, fornecedor_nome e total_valor_acumulado
        """
        query = text("""
            WITH contratos_unidade AS (
              SELECT
                c.id,
                c.fornecedor_id,
                f.nome AS fornecedor_nome,
                c.valor_acumulado::numeric AS valor_acumulado_num
              FROM contratos c
              JOIN fornecedores f ON f.id = c.fornecedor_id
              WHERE c.unidade_id = :unidade_id
            ),
            fornecedor_totais AS (
              SELECT 
                fornecedor_id, 
                fornecedor_nome,
                SUM(valor_acumulado_num) AS total_valor_acumulado
              FROM contratos_unidade
              GROUP BY fornecedor_id, fornecedor_nome
            )
            SELECT 
                fornecedor_id,
                fornecedor_nome,
                total_valor_acumulado
            FROM fornecedor_totais
            ORDER BY total_valor_acumulado DESC NULLS LAST
            LIMIT 10
        """)
        
        with get_session_contratos() as session:
            result = session.execute(query, {"unidade_id": unidade_id})
            return [dict(row._mapping) for row in result.fetchall()]
