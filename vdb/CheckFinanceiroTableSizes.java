/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 CheckFinanceiroTableSizes.java
 *
 * Conta o número de registros de todas as tabelas no schema `DWTG_Colunar_Afinco_VBL`
 * do DaaS SERPRO (via Teiid JDBC) e grava os resultados no arquivo `tables_financeiro_sizes.txt`.
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar CheckFinanceiroTableSizes.java
 *
 * ▶️ Execução em segundo plano:
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar CheckFinanceiroTableSizes </dev/null &>/dev/null & disown
 *
 * 📂 Log:
 *   tail -f tables_financeiro_sizes.txt
 *
 * 🛑 Parar o processo:
 *   pkill -f CheckFinanceiroTableSizes
 * ───────────────────────────────────────────────────────────────────────────────
 */

import java.sql.*;
import java.util.*;
import java.io.*;

public class CheckFinanceiroTableSizes {
    public static void main(String[] args) {
        String url = "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000";
        String user = "70267715153";
        String password = "t#Hlbr*tr8";
        String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";

        try (PrintWriter log = new PrintWriter(new FileWriter("tables_financeiro_sizes.txt", false))) {
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            Class.forName("org.teiid.jdbc.TeiidDriver");
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement stmt = conn.createStatement();

            ResultSet rsTables = conn.getMetaData().getTables(null, "DWTG_Colunar_Afinco_VBL", null, new String[]{"TABLE"});

            List<String> tabelas = new ArrayList<>();
            while (rsTables.next()) {
                String tableName = rsTables.getString("TABLE_NAME");
                tabelas.add(tableName);
            }
            rsTables.close();

            for (String tabela : tabelas) {
                try {
                    ResultSet rsCount = stmt.executeQuery("SELECT COUNT(*) FROM DWTG_Colunar_Afinco_VBL." + tabela);
                    if (rsCount.next()) {
                        int count = rsCount.getInt(1);
                        log.println(tabela + " = " + count);
                    }
                    rsCount.close();
                } catch (Exception e) {
                    log.println("Erro ao contar registros da tabela " + tabela + ": " + e.getMessage());
                }
            }

            stmt.close();
            conn.close();

        } catch (Exception e) {
            try (PrintWriter log = new PrintWriter(new FileWriter("tables_financeiro_sizes.txt", true))) {
                log.println("Erro:");
                e.printStackTrace(log);
            } catch (IOException ioEx) {
                System.err.println("Erro ao escrever log de erro: " + ioEx.getMessage());
            }
        }
    }
}
