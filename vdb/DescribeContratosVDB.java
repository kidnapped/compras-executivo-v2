import java.sql.*;
import java.util.*;

public class DescribeContratosVDB {
    public static void main(String[] args) throws Exception {
        Class.forName("org.postgresql.Driver");

        Connection conn = DriverManager.getConnection(
            "jdbc:postgresql://localhost:5432/contratos", "postgres", "postgres"
        );

        DatabaseMetaData metaData = conn.getMetaData();
        ResultSet tables = metaData.getTables(null, "public", "%", new String[]{"TABLE"});

        while (tables.next()) {
            String tableName = tables.getString("TABLE_NAME");
            System.out.println("📋 Tabela: " + tableName);

            ResultSet columns = metaData.getColumns(null, "public", tableName, "%");
            List<String> colunas = new ArrayList<>();
            while (columns.next()) {
                colunas.add(columns.getString("COLUMN_NAME"));
            }
            columns.close();

            for (String col : colunas) {
                System.out.println("    - " + col);
            }

            System.out.println(); // linha em branco entre as tabelas
        }

        tables.close();
        conn.close();
    }
}
