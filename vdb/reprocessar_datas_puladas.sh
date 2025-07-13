#!/bin/bash
# Este script roda com flock para evitar múltiplas execuções simultâneas
LOCKFILE=/tmp/lock_reprocessar_datas.lock

flock -n "$LOCKFILE" /bin/bash <<'EOF'
#!/bin/bash
echo "🛠️ Iniciando reprocessamento de datas puladas..."

echo "🔁 Iniciando 20250623..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250623"

echo "🔁 Iniciando 20250624..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250624"

echo "🔁 Iniciando 20250625..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250625"

echo "🔁 Iniciando 20250626..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250626"

echo "🔁 Iniciando 20250627..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250627"

echo "🔁 Iniciando 20250628..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250628"

echo "🔁 Iniciando 20250629..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250629"

echo "🔁 Iniciando 20250630..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250630"

echo "🔁 Iniciando 20250701..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250701"

EOF
