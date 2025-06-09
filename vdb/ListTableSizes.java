import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class ListTableSizes {
    public static void main(String[] args) {
        String url = "jdbc:teiid:ContratosGovBr_usr_ComprasExecutivo@mms://daas.serpro.gov.br:31000";
        String user = "70267715153";
        String password = "t#Hlbr*tr8";
        String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";

        try {
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            Class.forName("org.teiid.jdbc.TeiidDriver");
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement stmt = conn.createStatement();

            // Lista todas as tabelas acessíveis
            String listQuery = "SELECT t.schemaName, t.name FROM SYS.Tables t WHERE t.schemaName NOT LIKE 'SYS%' ORDER BY t.schemaName, t.name";
            ResultSet rs = stmt.executeQuery(listQuery);

            List<String> tabelas = new ArrayList<>();
            while (rs.next()) {
                String schema = rs.getString(1);
                String table = rs.getString(2);
                tabelas.add(schema + "." + table);
            }
            rs.close();

            System.out.println("Tabela | Linhas");
            System.out.println("---------------------");

            List<String> erros = new ArrayList<>();

            for (String tabela : tabelas) {
                try {
                    ResultSet rs2 = stmt.executeQuery("SELECT COUNT(*) FROM " + tabela);
                    if (rs2.next()) {
                        System.out.println(tabela + " | " + rs2.getString(1));
                    }
                    rs2.close();
                } catch (Exception e) {
                    erros.add(tabela);
                }
            }

            if (!erros.isEmpty()) {
                System.out.println("\n⚠️ Tabelas com erro (ignoradas):");
                for (String erroTabela : erros) {
                    System.out.println(" - " + erroTabela);
                }
            }

            stmt.close();
            conn.close();

        } catch (Exception e) {
            System.out.println("Erro geral:");
            e.printStackTrace(System.out);
        }
    }
}
