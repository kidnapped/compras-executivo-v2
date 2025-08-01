#!/bin/bash
# Este script roda com flock para evitar múltiplas execuções simultâneas
LOCKFILE=/tmp/lock_reprocessar_datas.lock

flock -n "$LOCKFILE" /bin/bash <<'EOF'
#!/bin/bash
echo "🛠️ Iniciando reprocessamento de datas puladas..."

echo "🔁 Iniciando 20250715..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250715"

echo "🔁 Iniciando 20250716..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250716"

echo "🔁 Iniciando 20250717..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250717"

echo "🔁 Iniciando 20250718..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250718"

echo "🔁 Iniciando 20250719..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250719"

echo "🔁 Iniciando 20250720..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250720"

echo "🔁 Iniciando 20250721..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250721"

echo "🔁 Iniciando 20250722..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250722"

echo "🔁 Iniciando 20250723..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250723"

echo "🔁 Iniciando 20250724..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250724"

echo "🔁 Iniciando 20250725..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250725"

echo "🔁 Iniciando 20250726..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250726"

echo "🔁 Iniciando 20250727..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250727"

echo "🔁 Iniciando 20250728..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250728"

echo "🔁 Iniciando 20250729..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250729"

EOF
