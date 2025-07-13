#!/bin/bash

#
# Usage:
#
#   nohup ./dump_dw.sh 20250101 >dump_dw.log 2>&1 < /dev/null & disown ; tail -f dump_dw.log
#

#!/bin/bash
set -euo pipefail

DB="financeiro"
USER="postgres"
HOST="localhost"
DATA_INICIAL="${1:-20250101}"
ARQUIVO_DUMP="dump_filtrado.dump"
export PGPASSWORD="postgres"

echo "🔄 Gerando tabelas temporárias com dados filtrados..."

psql -U "$USER" -h "$HOST" -d "$DB" -At <<SQL
DO \$\$
DECLARE
  r RECORD;
  cast_expr TEXT;
  data_inicial text := '$DATA_INICIAL';
BEGIN
  -- remove tabelas temporárias antigas
  FOR r IN SELECT table_name FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name LIKE 't_export_%'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', r.table_name);
  END LOOP;

  -- cria tabelas temporárias filtradas
  FOR r IN (
    SELECT c.table_name, c.data_type
    FROM information_schema.columns c
    WHERE lower(c.column_name) = 'dt_carga_c'
      AND c.table_schema = 'public'
      AND c.table_name NOT LIKE 't_export_%'
  ) LOOP
    IF r.data_type = 'date' OR r.data_type LIKE 'timestamp%' THEN
      cast_expr := 'dt_carga_c::date';
    ELSE
      cast_expr := 'TO_DATE(dt_carga_c, ''YYYYMMDD'')';
    END IF;

    EXECUTE format(
      'CREATE UNLOGGED TABLE t_export_%I AS
       SELECT * FROM %I WHERE %s >= TO_DATE(''%s'', ''YYYYMMDD'');',
      r.table_name, r.table_name, cast_expr, data_inicial
    );
  END LOOP;
END
\$\$;
SQL

echo "📦 Gerando dump das tabelas temporárias..."

mapfile -t TABLES < <(psql -U "$USER" -h "$HOST" -d "$DB" -Atc \
  "SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 't_export_%';")

[ ${#TABLES[@]} -eq 0 ] && { echo '❌ Nenhuma tabela t_export_* encontrada'; exit 1; }

TABLE_ARGS=()
for t in "${TABLES[@]}"; do
  TABLE_ARGS+=(--table="public.\"$t\"")
done

pg_dump -U "$USER" -h "$HOST" -d "$DB" \
  --data-only --column-inserts \
  "${TABLE_ARGS[@]}" \
  --file="$ARQUIVO_DUMP"

echo "🧹 Limpando tabelas temporárias..."

psql -U "$USER" -h "$HOST" -d "$DB" -At <<'SQL'
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT table_name FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name LIKE 't_export_%'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', r.table_name);
  END LOOP;
END$$;
SQL

echo "✅ Dump gerado com sucesso: $ARQUIVO_DUMP"
