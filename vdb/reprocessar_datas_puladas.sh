#!/bin/bash
# Este script roda com flock para evitar múltiplas execuções simultâneas
# ./reprocessar_datas_puladas.sh & ; tail -f clone_financeiro_table_size.log
LOCKFILE=/tmp/lock_reprocessar_datas.lock

flock -n "$LOCKFILE" /bin/bash <<'EOF'
#!/bin/bash
echo "🛠️ Iniciando reprocessamento de datas puladas..."

echo "🔁 Iniciando 20250730..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250730"

echo "🔁 Iniciando 20250731..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250731"

echo "🔁 Iniciando 20250801..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250801"

echo "🔁 Iniciando 20250802..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250802"

echo "🔁 Iniciando 20250803..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250803"

echo "🔁 Iniciando 20250804..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250804"

echo "🔁 Iniciando 20250805..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250805"

EOF
