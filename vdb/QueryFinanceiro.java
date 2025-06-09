import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class QueryFinanceiro {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Erro: Nenhuma query fornecida.");
            return;
        }

        String query = args[0];
        String outputFormat = args.length > 1 ? args[1] : "";  // --json ou --csv

        String url = "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000";
        String user = "70267715153";
        String password = "t#Hlbr*tr8";
        String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";

        try {
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            Class.forName("org.teiid.jdbc.TeiidDriver");
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement stmt = conn.createStatement();

            ResultSet rs = stmt.executeQuery(query);
            int columnCount = rs.getMetaData().getColumnCount();

            if (outputFormat.equals("--json")) {
                System.out.print("[");
                boolean firstRow = true;
                while (rs.next()) {
                    if (!firstRow) System.out.print(",");
                    System.out.print("{");
                    for (int i = 1; i <= columnCount; i++) {
                        String col = rs.getMetaData().getColumnName(i);
                        String val = rs.getString(i);
                        System.out.print("\"" + col + "\":\"" + (val != null ? val : "") + "\"");
                        if (i < columnCount) System.out.print(",");
                    }
                    System.out.print("}");
                    firstRow = false;
                }
                System.out.println("]");
            } else if (outputFormat.equals("--csv")) {
                // Cabeçalho
                for (int i = 1; i <= columnCount; i++) {
                    System.out.print(rs.getMetaData().getColumnName(i));
                    if (i < columnCount) System.out.print(",");
                }
                System.out.println();

                // Linhas
                while (rs.next()) {
                    for (int i = 1; i <= columnCount; i++) {
                        String val = rs.getString(i);
                        System.out.print(val != null ? val.replace(",", " ") : "");
                        if (i < columnCount) System.out.print(",");
                    }
                    System.out.println();
                }
            } else {
                // Formato padrão com pipe (|) e cabeçalho
                for (int i = 1; i <= columnCount; i++) {
                    System.out.print(rs.getMetaData().getColumnName(i));
                    if (i < columnCount) System.out.print(" | ");
                }
                System.out.println();

                while (rs.next()) {
                    for (int i = 1; i <= columnCount; i++) {
                        String value = rs.getString(i);
                        System.out.print(value != null ? value : "");
                        if (i < columnCount) System.out.print(" | ");
                    }
                    System.out.println();
                }
            }

            rs.close();
            stmt.close();
            conn.close();

        } catch (Exception e) {
            System.out.println("Erro:");
            e.printStackTrace(System.out);
        }
    }
}
