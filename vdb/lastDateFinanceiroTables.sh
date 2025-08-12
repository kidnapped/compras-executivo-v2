#!/bin/bash
#
# chmod +x lastDateFinanceiroTables.sh ; nohup ./lastDateFinanceiroTables.sh >/dev/null 2>&1 & disown
# cat lastDateFinanceiroTables.txt
 
OUT_FILE="lastDateFinanceiroTables.txt"

# Zerar o arquivo de saída
> "$OUT_FILE"

# Verificar conexão com o PostgreSQL
if ! psql -h localhost -U postgres -d financeiro -c "SELECT 1" >/dev/null 2>&1; then
    echo "Erro: Não foi possível conectar ao PostgreSQL" >&2
    exit 1
fi

# Obter lista de tabelas com a coluna dt_carga_c no schema public do banco financeiro
TABLES=$(psql -h localhost -U postgres -d financeiro -qAt -c "SELECT quote_ident(table_name) FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'dt_carga_c' ORDER BY table_name;")

if [ -z "$TABLES" ]; then
    echo "Nenhuma tabela com coluna dt_carga_c encontrada" >&2
    exit 0
fi

# Processar cada tabela
for TABLE in $TABLES; do
    # Remover aspas extras se houver
    CLEAN_TABLE=$(echo "$TABLE" | tr -d '"')
    
    echo "Processando tabela: $CLEAN_TABLE" >&2
    
    # Executar consulta para obter a maior dt_carga_c
    RESULT=$(psql -h localhost -U postgres -d financeiro -qAt -c "SELECT '$CLEAN_TABLE' || E'\t' || COALESCE((SELECT MAX(dt_carga_c) FROM public.$TABLE WHERE dt_carga_c ~ '^\\d{8}\$'), '');")
    
    # Adicionar resultado ao arquivo
    echo "$RESULT" >> "$OUT_FILE"
done

echo "Processamento concluído. Resultados em $OUT_FILE" >&2