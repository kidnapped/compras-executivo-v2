#!/bin/bash
# Este script roda com flock para evitar múltiplas execuções simultâneas
LOCKFILE=/tmp/lock_reprocessar_datas.lock

flock -n "$LOCKFILE" /bin/bash <<'EOF'
#!/bin/bash
echo "🛠️ Iniciando reprocessamento de datas puladas..."

echo "🔁 Iniciando 20250702..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250702"

echo "🔁 Iniciando 20250703..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250703"

echo "🔁 Iniciando 20250704..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250704"

echo "🔁 Iniciando 20250705..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250705"

echo "🔁 Iniciando 20250706..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250706"

echo "🔁 Iniciando 20250707..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250707"

echo "🔁 Iniciando 20250708..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250708"

echo "🔁 Iniciando 20250709..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250709"

echo "🔁 Iniciando 20250710..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250710"

echo "🔁 Iniciando 20250711..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250711"

echo "🔁 Iniciando 20250712..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250712"

echo "🔁 Iniciando 20250713..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250713"

echo "🔁 Iniciando 20250714..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250714"

EOF
