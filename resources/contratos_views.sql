
-- VIEW: Widget Próximas Atividades
CREATE MATERIALIZED VIEW ultima_vigencia_por_contrato AS
SELECT
    contrato_id,
    MAX(vigencia_fim) AS ultima_vigencia
FROM contratohistorico
WHERE vigencia_fim IS NOT NULL
GROUP BY contrato_id;


-- VIEW: Widget Últimos Lançamentos---- scripts i ran! on financeiro
CREATE INDEX idx_linha_evento_ob_inscricao_ug ON wd_linha_evento_ob (co_inscricao_1, id_ug_ne);
CREATE INDEX idx_wd_doc_ob_id_doc_ob ON wd_doc_ob (id_doc_ob);
CREATE INDEX idx_doc_ne_item_operacao_id_doc_ne ON wd_doc_ne_item_operacao (id_doc_ne);
CREATE INDEX idx_wd_doc_ne_item_id_doc_ne ON wd_doc_ne_item (id_doc_ne);
CREATE INDEX idx_deta_orca_fina_dar_id_documento_ne ON wd_deta_orca_fina_dar (id_documento_ne);
CREATE INDEX idx_deta_orca_fina_darf_id_documento_ne ON wd_deta_orca_fina_darf (id_documento_ne);
CREATE INDEX idx_deta_orca_fina_gps_id_documento_ne ON wd_deta_orca_fina_gps (id_documento_ne);
CREATE INDEX idx_wd_doc_darf_id_doc_darf ON wd_doc_darf (id_doc_darf);
CREATE INDEX idx_wd_doc_gps_id_doc_gps ON wd_doc_gps (id_doc_gps);
CREATE INDEX idx_wf_doc_ne_id_documento ON wf_doc_ne (id_documento);
CREATE INDEX idx_wd_doc_dar_id_doc_dar ON wd_doc_dar (id_doc_dar);
