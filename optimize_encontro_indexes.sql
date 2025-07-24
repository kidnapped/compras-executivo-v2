-- Performance Optimization Indexes for Encontro de Contas
-- Run these on your contratos database

-- 1. MOST IMPORTANT: Composite index for contratoempenhos lookup
-- This will dramatically speed up the main query
CREATE INDEX IF NOT EXISTS idx_contratoempenhos_lookup 
ON contratoempenhos (contrato_id, unidadeempenho_id, empenho_id, fornecedor_id);

-- 2. Index for empenho number filtering  
-- This will speed up empenho number searches
CREATE INDEX IF NOT EXISTS idx_empenhos_numero 
ON empenhos (numero);

-- 3. Supporting indexes (if they don't already exist)
-- These ensure efficient joins
CREATE INDEX IF NOT EXISTS idx_empenhos_id 
ON empenhos (id);

CREATE INDEX IF NOT EXISTS idx_contratoempenhos_empenho_id 
ON contratoempenhos (empenho_id);

-- 4. Optional: Individual column indexes for fallback queries
CREATE INDEX IF NOT EXISTS idx_contratoempenhos_contrato_id 
ON contratoempenhos (contrato_id);

CREATE INDEX IF NOT EXISTS idx_contratoempenhos_unidadeempenho_id 
ON contratoempenhos (unidadeempenho_id);

--index financeiro
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

CREATE INDEX IF NOT EXISTS idx_contratoempenhos_lookup 
ON contratoempenhos (contrato_id, unidadeempenho_id, empenho_id, fornecedor_id);