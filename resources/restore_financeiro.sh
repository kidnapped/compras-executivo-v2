#!/bin/bash
set -euo pipefail

# --- 1) Verifica argumento ---
if [ $# -ne 1 ]; then
  echo "❌ Uso: $0 YYYYMMDD"
  exit 1
fi

DATE="$1"
BASE_DIR="${DATE}/financeiro"

# --- 2) Verifica se a pasta existe ---
if [ ! -d "$BASE_DIR" ]; then
  echo "❌ Pasta não encontrada: $BASE_DIR"
  exit 1
fi

# --- 3) Restaura schema ---
if [ ! -f "$BASE_DIR/schema.sql" ]; then
  echo "❌ Arquivo $BASE_DIR/schema.sql não encontrado"
  exit 1
fi
echo "📜 Aplicando schema..."
psql -U postgres -d financeiro -f "$BASE_DIR/schema.sql"

# --- 4) Restaura tabelas ---
shopt -s nullglob
for f in "$BASE_DIR"/public_*.csv.gz; do
  tbl="$(basename "$f" .csv.gz)"
  tbl="${tbl#public_}"  # remove prefixo public_
  echo "⬇️  Restaurando public.$tbl de $f"
  psql -U postgres -d financeiro -c "TRUNCATE public.\"$tbl\";"
  psql -U postgres -d financeiro -c "\copy public.\"$tbl\" FROM PROGRAM 'gzip -dc \"$f\"' CSV HEADER"
done
shopt -u nullglob

# --- 5) Atualiza estatísticas ---
echo "📈 ANALYZE..."
psql -U postgres -d financeiro -c "ANALYZE;"

echo "✅ Restauração finalizada."

