/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 ComparadorTabelasTeiidFinanceiroPostgres.java
 *
 * Conecta ao DaaS SERPRO (via Teiid) e ao PostgreSQL local, compara a quantidade
 * de registros de cada tabela do schema `DWTG_Colunar_Afinco_VBL` com a tabela
 * correspondente no banco `financeiro`, exibindo tudo formatado no console.
 *
 * Se for passado o nome de uma tabela como argumento, compara apenas essa.
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar ComparadorTabelasTeiidFinanceiroPostgres.java
 *
 * ▶️ Execução em segundo plano:
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar ComparadorTabelasTeiidFinanceiroPostgres >comparador_teiid_pg.log 2>&1 & disown ; tail -f comparador_teiid_pg.log
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar ComparadorTabelasTeiidFinanceiroPostgres WF_DOC_NE >comparador_teiid_pg.log 2>&1 & disown ; tail -f comparador_teiid_pg.log
 *
 * 📂 Acompanhar execução (caso redirecionado para arquivo):
 *   tail -f comparador_teiid_pg.log
 *
 * 🛑 Parar o processo:
 *   pkill -f ComparadorTabelasTeiidFinanceiroPostgres
 * ───────────────────────────────────────────────────────────────────────────────
 */

import java.sql.*;
import java.util.*;

public class ComparadorTabelasTeiidFinanceiroPostgres {
    public static void main(String[] args) {
        String tabelaFiltro = (args.length > 0) ? args[0].toUpperCase() : null;
        Connection teiidConn = null;
        Connection pgConn = null;

        try {
            String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            Class.forName("org.teiid.jdbc.TeiidDriver");
            teiidConn = DriverManager.getConnection(
                "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000;fetchSize=1000;socketTimeout=600000",
                "70267715153", "t#Hlbr*tr8"
            );

            Class.forName("org.postgresql.Driver");
            pgConn = DriverManager.getConnection(
                "jdbc:postgresql://localhost:5432/financeiro", "postgres", "postgres"
            );

            List<String> tabelas = new ArrayList<>();

            if (tabelaFiltro != null) {
                tabelas.add(tabelaFiltro);
            } else {
                ResultSet rs = teiidConn.getMetaData().getTables(null, "DWTG_Colunar_Afinco_VBL", "%", new String[]{"TABLE"});
                while (rs.next()) tabelas.add(rs.getString("TABLE_NAME"));
                rs.close();
                Collections.sort(tabelas);
            }

            System.out.printf("%-45s %15s %15s%n", "Tabela", "Teiid", "PostgreSQL");
            System.out.println("=".repeat(80));

            for (String tabela : tabelas) {
                int qtdTeiid = contar(teiidConn, "DWTG_Colunar_Afinco_VBL." + tabela);
                int qtdPG = contar(pgConn, "\"" + tabela.toLowerCase() + "\"");

                if (qtdPG == -1) continue; // ignora tabela ausente no PostgreSQL

                System.out.printf("%-45s %15s %15s%n",
                    tabela,
                    (qtdTeiid >= 0 ? String.format("%,d", qtdTeiid) : "erro"),
                    String.format("%,d", qtdPG)
                );
            }

        } catch (Exception e) {
            System.err.println("Erro geral: " + e.getMessage());
            e.printStackTrace();
        } finally {
            try { if (teiidConn != null) teiidConn.close(); } catch (Exception ignored) {}
            try { if (pgConn != null) pgConn.close(); } catch (Exception ignored) {}
        }
    }

    private static int contar(Connection conn, String tabela) {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + tabela)) {
            return rs.next() ? rs.getInt(1) : -1;
        } catch (Exception e) {
            return -1;
        }
    }
}
