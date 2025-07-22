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

-- Check index sizes after creation
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes 
WHERE tablename IN ('contratoempenhos', 'empenhos')
ORDER BY pg_relation_size(indexrelid) DESC;
