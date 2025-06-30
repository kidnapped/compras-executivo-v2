#!/bin/bash
# Este script roda com flock para evitar múltiplas execuções simultâneas
LOCKFILE=/tmp/lock_reprocessar_datas.lock

flock -n "$LOCKFILE" /bin/bash <<'EOF'
#!/bin/bash
echo "🛠️ Iniciando reprocessamento de datas puladas..."

echo "🔁 Iniciando 20250607..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250607"

echo "🔁 Iniciando 20250608..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250608"

echo "🔁 Iniciando 20250609..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250609"

echo "🔁 Iniciando 20250610..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250610"

echo "🔁 Iniciando 20250611..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250611"

echo "🔁 Iniciando 20250612..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250612"

echo "🔁 Iniciando 20250613..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250613"

echo "🔁 Iniciando 20250614..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250614"

echo "🔁 Iniciando 20250615..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250615"

echo "🔁 Iniciando 20250616..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250616"

echo "🔁 Iniciando 20250617..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250617"

echo "🔁 Iniciando 20250618..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250618"

echo "🔁 Iniciando 20250619..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250619"

echo "🔁 Iniciando 20250620..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250620"

echo "🔁 Iniciando 20250621..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250621"

echo "🔁 Iniciando 20250622..."
java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroTabelaData WD_DOCUMENTO "20250622"


EOF
