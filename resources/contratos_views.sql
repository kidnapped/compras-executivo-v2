
-- VIEW: Widget Próximas Atividades
CREATE MATERIALIZED VIEW ultima_vigencia_por_contrato AS
SELECT
    contrato_id,
    MAX(vigencia_fim) AS ultima_vigencia
FROM contratohistorico
WHERE vigencia_fim IS NOT NULL
GROUP BY contrato_id;
