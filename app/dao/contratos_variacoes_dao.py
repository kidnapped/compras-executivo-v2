from sqlalchemy import text
from app.db.session import get_session_contratos

class ContratosVariacoesDAO:
    @staticmethod
    def get_contratos_variacoes_significativas(unidade_id, limite_percentual=0.25, limite_registros=10):
        """
        Retorna contratos com variações significativas entre valor inicial e valor global
        para uma unidade específica, mostrando apenas contratos com variação >= 25%
        
        Args:
            unidade_id (int): ID da unidade
            limite_percentual (float): Limite mínimo de variação percentual (padrão: 0.25 = 25%)
            limite_registros (int): Número máximo de registros retornados (padrão: 10)
            
        Returns:
            list: Lista de dicionários com informações dos contratos com maiores variações,
                  incluindo contrato_id, contrato_numero, valores e percentuais de variação
        """
        query = text("""
            WITH conv AS (
              SELECT
                c.id,
                c.numero,
                c.unidade_id,
                c.valor_inicial::numeric AS valor_inicial,
                c.valor_global::numeric  AS valor_global
              FROM contratos c
              WHERE c.unidade_id = :unidade_id
                  and c.vigencia_inicio > '01-01-2021'
                AND c.valor_inicial IS NOT NULL
                AND c.valor_inicial <> ''
                AND c.valor_global  IS NOT NULL
                AND c.valor_global  <> ''
            )
            SELECT
              id                    AS contrato_id,
              numero                AS contrato_numero,
              unidade_id,
              valor_inicial,
              valor_global,
              (valor_global - valor_inicial)                                   AS delta,
              CASE WHEN valor_inicial > 0
                   THEN (valor_global - valor_inicial) / valor_inicial
              END                                                              AS delta_pct
            FROM conv
            WHERE valor_inicial > 0
              AND (valor_global - valor_inicial) / valor_inicial >= :limite_percentual
            ORDER BY delta_pct DESC NULLS last 
            LIMIT :limite_registros
        """)
        
        with get_session_contratos() as session:
            result = session.execute(query, {
                "unidade_id": unidade_id,
                "limite_percentual": limite_percentual,
                "limite_registros": limite_registros
            })
            return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    def get_contratos_variacoes_por_filtros(
        unidade_ids=None, 
        data_inicio=None, 
        data_fim=None,
        limite_percentual=0.25, 
        limite_registros=10
    ):
        """
        Retorna contratos com variações significativas aplicando filtros dinâmicos
        compatíveis com o sistema de filtros do frontend
        
        Args:
            unidade_ids (list): Lista de IDs das unidades (compatível com filtros)
            data_inicio (str): Data de início da vigência (formato YYYY-MM-DD)
            data_fim (str): Data de fim da vigência (formato YYYY-MM-DD)
            limite_percentual (float): Limite mínimo de variação percentual
            limite_registros (int): Número máximo de registros retornados
            
        Returns:
            list: Lista de dicionários com informações dos contratos filtrados
        """
        # Construir condições WHERE dinamicamente
        where_conditions = []
        params = {
            "limite_percentual": limite_percentual,
            "limite_registros": limite_registros
        }
        
        # Filtro por unidades (compatível com filtros múltiplos)
        if unidade_ids:
            if isinstance(unidade_ids, (list, tuple)):
                where_conditions.append("c.unidade_id = ANY(:unidade_ids)")
                params["unidade_ids"] = unidade_ids
            else:
                where_conditions.append("c.unidade_id = :unidade_id")
                params["unidade_id"] = unidade_ids
        
        # Filtros de data
        if data_inicio:
            where_conditions.append("c.vigencia_inicio >= :data_inicio")
            params["data_inicio"] = data_inicio
        else:
            # Manter o filtro padrão de 2021
            where_conditions.append("c.vigencia_inicio > '01-01-2021'")
            
        if data_fim:
            where_conditions.append("c.vigencia_fim <= :data_fim")
            params["data_fim"] = data_fim
        
        # Construir a query dinâmica
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        query = text(f"""
            WITH conv AS (
              SELECT
                c.id,
                c.numero,
                c.unidade_id,
                c.valor_inicial::numeric AS valor_inicial,
                c.valor_global::numeric  AS valor_global,
                c.vigencia_inicio,
                c.vigencia_fim
              FROM contratos c
              WHERE {where_clause}
                AND c.valor_inicial IS NOT NULL
                AND c.valor_inicial <> ''
                AND c.valor_global  IS NOT NULL
                AND c.valor_global  <> ''
            )
            SELECT
              id                    AS contrato_id,
              numero                AS contrato_numero,
              unidade_id,
              valor_inicial,
              valor_global,
              vigencia_inicio,
              vigencia_fim,
              (valor_global - valor_inicial)                                   AS delta,
              CASE WHEN valor_inicial > 0
                   THEN (valor_global - valor_inicial) / valor_inicial
              END                                                              AS delta_pct
            FROM conv
            WHERE valor_inicial > 0
              AND (valor_global - valor_inicial) / valor_inicial >= :limite_percentual
            ORDER BY delta_pct DESC NULLS last 
            LIMIT :limite_registros
        """)
        
        with get_session_contratos() as session:
            result = session.execute(query, params)
            return [dict(row._mapping) for row in result.fetchall()]

    @staticmethod
    def get_estatisticas_variacoes_por_unidade(unidade_id):
        """
        Retorna estatísticas das variações de contratos para uma unidade específica
        
        Args:
            unidade_id (int): ID da unidade
            
        Returns:
            dict: Dicionário com estatísticas de variações (média, mediana, total de contratos, etc.)
        """
        query = text("""
            WITH conv AS (
              SELECT
                c.id,
                c.numero,
                c.unidade_id,
                c.valor_inicial::numeric AS valor_inicial,
                c.valor_global::numeric  AS valor_global
              FROM contratos c
              WHERE c.unidade_id = :unidade_id
                  and c.vigencia_inicio > '01-01-2021'
                AND c.valor_inicial IS NOT NULL
                AND c.valor_inicial <> ''
                AND c.valor_global  IS NOT NULL
                AND c.valor_global  <> ''
                AND c.valor_inicial > 0
            ),
            variacoes AS (
              SELECT
                id,
                numero,
                valor_inicial,
                valor_global,
                (valor_global - valor_inicial) AS delta,
                (valor_global - valor_inicial) / valor_inicial AS delta_pct
              FROM conv
            )
            SELECT
              COUNT(*) AS total_contratos,
              COUNT(CASE WHEN delta_pct >= 0.25 THEN 1 END) AS contratos_variacao_significativa,
              AVG(delta_pct) AS media_variacao_pct,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delta_pct) AS mediana_variacao_pct,
              MAX(delta_pct) AS max_variacao_pct,
              MIN(delta_pct) AS min_variacao_pct,
              SUM(CASE WHEN delta_pct >= 0.25 THEN delta ELSE 0 END) AS total_valor_variacoes_significativas
            FROM variacoes
        """)
        
        with get_session_contratos() as session:
            result = session.execute(query, {"unidade_id": unidade_id})
            row = result.fetchone()
            return dict(row._mapping) if row else {}
