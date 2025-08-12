import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class QueryFinanceiro {
    public static void main(String[] args) {
        if (args.length < 7) {
            System.out.println("Erro: Parâmetros insuficientes.");
            System.out.println("Uso: java QueryFinanceiro <query> <jdbcUrl> <user> <password> <truststorePath> <truststoreFile> <truststoreType>");
            return;
        }

        String query = args[0];
        String jdbcUrl = args[1];
        String user = args[2];
        String password = args[3];
        String truststorePath = args[4];
        String truststoreFile = args[5];
        String truststoreType = args[6];

        try {
            // Configure SSL truststore
            System.setProperty("javax.net.ssl.trustStore", truststorePath + "/" + truststoreFile);
            System.setProperty("javax.net.ssl.trustStoreType", truststoreType);

            // Load driver and connect
            Class.forName("org.teiid.jdbc.TeiidDriver");
            Connection conn = DriverManager.getConnection(jdbcUrl, user, password);
            Statement stmt = conn.createStatement();

            // Execute query
            ResultSet rs = stmt.executeQuery(query);
            int columnCount = rs.getMetaData().getColumnCount();

            // Print header
            for (int i = 1; i <= columnCount; i++) {
                System.out.print(rs.getMetaData().getColumnName(i));
                if (i < columnCount) System.out.print(" | ");
            }
            System.out.println();

            // Print data rows
            while (rs.next()) {
                for (int i = 1; i <= columnCount; i++) {
                    String value = rs.getString(i);
                    System.out.print(value != null ? value : "");
                    if (i < columnCount) System.out.print(" | ");
                }
                System.out.println();
            }

            // Clean up
            rs.close();
            stmt.close();
            conn.close();

        } catch (Exception e) {
            System.out.println("Erro:");
            e.printStackTrace(System.out);
        }
    }
}
