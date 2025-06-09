import java.sql.*;
import java.util.*;

public class DetectaCampoProblematico {
    public static void main(String[] args) {
        String tabela = "WD_DOC_OB";
        String dataAlvo = "20250517";
        String valorProcurado = "224, 27";

        try {
            String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            Class.forName("org.teiid.jdbc.TeiidDriver");

            Connection conn = DriverManager.getConnection(
                "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000",
                "70267715153", "t#Hlbr*tr8"
            );

            // Descobre os nomes das colunas da tabela
            List<String> colunas = new ArrayList<>();
            ResultSet rsCols = conn.getMetaData().getColumns(null, "DWTG_Colunar_Afinco_VBL", tabela, null);
            while (rsCols.next()) {
                colunas.add(rsCols.getString("COLUMN_NAME"));
            }
            rsCols.close();

            System.out.println("🔍 Verificando colunas da tabela " + tabela + " para o valor: " + valorProcurado);

            for (String coluna : colunas) {
                String query = String.format(
                    "SELECT \"%s\" FROM DWTG_Colunar_Afinco_VBL.%s WHERE DT_CARGA_C = '%s' AND \"%s\" LIKE '%%%s%%'",
                    coluna, tabela, dataAlvo, coluna, valorProcurado
                );
                try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(query)) {
                    if (rs.next()) {
                        System.out.printf("⚠️  Valor '%s' encontrado na coluna: %s\n", valorProcurado, coluna);
                    }
                } catch (Exception e) {
                    System.err.printf("Erro ao verificar coluna %s: %s\n", coluna, e.getMessage());
                }
            }

            conn.close();
            System.out.println("✅ Verificação concluída.");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
