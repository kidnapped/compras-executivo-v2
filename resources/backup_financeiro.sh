#!/bin/bash
set -e

# Data no formato YYYY-MM-DD
BASE_DIR="$(date +%F)/financeiro"

# Se a pasta já existir, aborta
if [ -d "$BASE_DIR" ]; then
    echo "❌ A pasta '$BASE_DIR' já existe. Backup abortado."
    exit 1
fi

mkdir -p "$BASE_DIR"

# 0) Copia o INI para o diretório do backup
INI_SRC="/home/ec2-user/compras-executivo/vdb/CloneFinanceiroToPostgres.ini"
if [ -f "$INI_SRC" ]; then
    cp -p "$INI_SRC" "$BASE_DIR/"
else
    echo "⚠️ Aviso: INI não encontrado em $INI_SRC; seguindo sem copiar."
fi

# 1) Dump do schema (DDL)
pg_dump -U postgres -d financeiro -s > "$BASE_DIR/schema.sql"

# 2) Dump dos dados -> CSV com HEADER, compactado
psql -U postgres -d financeiro -Atc "
SELECT quote_ident(schemaname)||'.'||quote_ident(tablename)
FROM pg_tables
WHERE schemaname='public'
" | while read -r tbl; do
    out="$BASE_DIR/$(echo "$tbl" | tr '.' '_').csv.gz"
    echo "Exportando $tbl para $out"
    psql -U postgres -d financeiro -c "\copy $tbl TO PROGRAM 'gzip > \"$out\"' CSV HEADER"
done

