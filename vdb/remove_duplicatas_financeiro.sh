#!/bin/bash
#
# ───────────────────────────────────────────────────────────────────────────────
# 📄 remove_duplicatas_financeiro.sh
#
# Remove automaticamente registros duplicados de todas as tabelas do schema `public`
# de um banco PostgreSQL, com base em todas as colunas (exceto `ctid` e `tsvector`).
#
# ✅ Totalmente automatizado:
#   - Descobre todas as tabelas
#   - Descobre todas as colunas
#   - Executa DELETE com `IS NOT DISTINCT FROM` para lidar com NULLs corretamente
#   - Mostra total de duplicatas removidas por tabela e tempo de execução
#
# 🪵 Log:
#   tail -f remove_duplicatas_financeiro.log
#
# ▶️ Execução:
#   nohup ./remove_duplicatas_financeiro.sh </dev/null &>/dev/null & disown ; tail -f remove_duplicatas_financeiro.log
#
# 📊 Verificar se está rodando:
#   ps aux | grep remove_duplicatas_financeiro.sh | grep -v grep
#
# 🚫 Atenção:
#   - Operação destrutiva. Faça backup antes!
# ───────────────────────────────────────────────────────────────────────────────

DB="financeiro"
USER="postgres"
LOG="remove_duplicatas_financeiro.log"
SCHEMA="public"

echo "🕒 Início: $(date)" > "$LOG"

psql -U "$USER" -d "$DB" -Atc "SELECT tablename FROM pg_tables WHERE schemaname = '$SCHEMA';" | while read table; do
  echo "🔍 Tabela: $table" | tee -a "$LOG"

  cols=$(psql -U "$USER" -d "$DB" -Atc "
    SELECT string_agg(quote_ident(column_name), ', ')
    FROM information_schema.columns
    WHERE table_schema = '$SCHEMA' AND table_name = '$table'
      AND data_type NOT IN ('tsvector');")

  if [ -z "$cols" ]; then
    echo "⚠️  Nenhuma coluna encontrada ou tabela incompatível: $table" | tee -a "$LOG"
    continue
  fi

  total_before=$(psql -U "$USER" -d "$DB" -Atc "SELECT COUNT(*) FROM \"$SCHEMA\".\"$table\";")
  start=$(date +%s)

  eq_cols=$(echo "$cols" | sed 's/\([^, ]\+\)/a.\1 IS NOT DISTINCT FROM b.\1/g' | sed 's/, / AND /g')

  SQL="
    DELETE FROM $SCHEMA.\"$table\" a
    USING $SCHEMA.\"$table\" b
    WHERE a.ctid < b.ctid
      AND $eq_cols;
  "

  echo "➡️  Executando DELETE para $table..." | tee -a "$LOG"
  result=$(psql -U "$USER" -d "$DB" -c "$SQL" 2>&1)

  end=$(date +%s)
  elapsed=$((end - start))
  total_after=$(psql -U "$USER" -d "$DB" -Atc "SELECT COUNT(*) FROM \"$SCHEMA\".\"$table\";")
  diff=$((total_before - total_after))

  echo "✅ $diff duplicatas removidas de $table em ${elapsed}s" | tee -a "$LOG"
  echo "$result" >> "$LOG"
  echo "----------------------------------------" >> "$LOG"
done

echo "🏁 Fim: $(date)" | tee -a "$LOG"
