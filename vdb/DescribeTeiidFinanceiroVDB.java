/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 DescribeTeiidFinanceiroVDB.java
 *
 * Lista todas as tabelas e colunas do VDB `DWTG_Colunar_Afinco` no DaaS SERPRO
 * via Teiid JDBC. A saída é formatada de forma clara e simples.
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar DescribeTeiidFinanceiroVDB.java
 *
 * ▶️ Execução:
 *   java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar DescribeTeiidFinanceiroVDB
 *
 * 🛑 Parar o processo em segundo plano (se aplicável):
 *   pkill -f DescribeTeiidFinanceiroVDB
 * ───────────────────────────────────────────────────────────────────────────────
 */

import java.sql.*;
import java.util.*;

public class DescribeTeiidFinanceiroVDB {
    public static void main(String[] args) throws Exception {
        // Configuração do truststore SSL
        System.setProperty("javax.net.ssl.trustStore", "/home/ec2-user/java/daas.serpro.gov.br.jks");
        System.setProperty("javax.net.ssl.trustStoreType", "JKS");

        // Driver e conexão Teiid
        Class.forName("org.teiid.jdbc.TeiidDriver");
        Connection conn = DriverManager.getConnection(
            "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000;fetchSize=1000;socketTimeout=600000",
            "70267715153", "t#Hlbr*tr8"
        );

        DatabaseMetaData meta = conn.getMetaData();
        ResultSet tables = meta.getTables(null, "DWTG_Colunar_Afinco_VBL", "%", new String[]{"TABLE"});

        while (tables.next()) {
            String table = tables.getString("TABLE_NAME");
            System.out.println("📋 " + table);

            ResultSet cols = meta.getColumns(null, "DWTG_Colunar_Afinco_VBL", table, "%");
            while (cols.next()) {
                String column = cols.getString("COLUMN_NAME");
                System.out.println("\t🔹 " + column);
            }
            cols.close();
            System.out.println();
        }

        tables.close();
        conn.close();
    }
}
