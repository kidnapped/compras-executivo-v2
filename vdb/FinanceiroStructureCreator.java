/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 FinanceiroStructureCreator.java
 *
 * Lista todas as tabelas do VDB financeiro (DWTG_Colunar_Afinco_VBL) no DaaS SERPRO
 * e gera um arquivo `FinanceiroStructureCreator.txt` contendo:
 *   - Nome de cada tabela
 *   - Lista completa das colunas
 *   - Até 10 registros aleatórios por tabela
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar FinanceiroStructureCreator.java
 *
 * ▶️ Execução em segundo plano:
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar FinanceiroStructureCreator </dev/null &>/dev/null & disown ; tail -f FinanceiroStructureCreator.txt
 *   tail -f FinanceiroStructureCreator.txt
 *
 * 📂 Saída:
 *   FinanceiroStructureCreator.txt (estrutura e exemplos das tabelas)
 *
 * 🛑 Parar o processo:
 *   pkill -f FinanceiroStructureCreator
 * ───────────────────────────────────────────────────────────────────────────────
 */

import java.sql.*;
import java.io.*;
import java.time.LocalDateTime;

public class FinanceiroStructureCreator {
    public static void main(String[] args) {
        PrintWriter writer = null;
        try {
            // Cria arquivo no início
            writer = new PrintWriter(new FileWriter("FinanceiroStructureCreator.txt", false));
            writer.println("======================================================");
            writer.println("📄 Estrutura e Amostras das Tabelas do VDB Financeiro");
            writer.println("Gerado em: " + LocalDateTime.now());
            writer.println("======================================================\n");
            writer.flush(); // Atualiza no arquivo imediatamente

            // Status inicial
            writer.println("[INFO] Iniciando processo...");
            writer.flush();

            // Configuração TLS
            writer.println("[INFO] Configurando truststore...");
            writer.flush();
            String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            // Conectar ao Teiid
            writer.println("[INFO] Conectando ao Teiid...");
            writer.flush();
            Class.forName("org.teiid.jdbc.TeiidDriver");
            Connection daasConn = DriverManager.getConnection(
                "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000;fetchSize=500",
                "70267715153", "t#Hlbr*tr8"
            );
            writer.println("[OK] Conectado ao Teiid.\n");
            writer.flush();

            // Buscar todas as tabelas
            writer.println("[INFO] Buscando lista de tabelas...");
            writer.flush();
            DatabaseMetaData metaData = daasConn.getMetaData();
            ResultSet tables = metaData.getTables(null, "DWTG_Colunar_Afinco_VBL", "%", new String[] { "TABLE" });

            while (tables.next()) {
                String tableName = tables.getString("TABLE_NAME");
                writer.println("─────────────────────────────────────────────");
                writer.println("[PROCESSANDO] Tabela: " + tableName);
                writer.flush();

                // Obter colunas
                writer.println("➤ Colunas:");
                ResultSet cols = metaData.getColumns(null, "DWTG_Colunar_Afinco_VBL", tableName, "%");
                int colCount = 0;
                StringBuilder colNames = new StringBuilder();
                while (cols.next()) {
                    String colName = cols.getString("COLUMN_NAME");
                    writer.println("   - " + colName);
                    colNames.append(colName).append(", ");
                    colCount++;
                }
                cols.close();
                writer.flush();

                if (colNames.length() > 2) {
                    colNames.setLength(colNames.length() - 2);
                }

                // Mostrar amostras
                writer.println("\n➤ Amostras (10 registros):");
                writer.flush();
                if (colCount == 0) {
                    writer.println("⚠️ Nenhuma coluna encontrada.\n");
                    writer.flush();
                    continue;
                }

                try (Statement stmt = daasConn.createStatement()) {
                    String query = "SELECT " + colNames + " FROM DWTG_Colunar_Afinco_VBL." + tableName +
                                   " ORDER BY RAND() LIMIT 10";
                    ResultSet rs = stmt.executeQuery(query);

                    writer.println(String.join(" | ", colNames.toString().split(", ")));
                    writer.println("--------------------------------------------");
                    writer.flush();

                    while (rs.next()) {
                        StringBuilder row = new StringBuilder();
                        for (int i = 1; i <= colCount; i++) {
                            Object val = rs.getObject(i);
                            row.append(val != null ? val.toString() : "NULL").append(" | ");
                        }
                        row.setLength(row.length() - 3);
                        writer.println(row);
                        writer.flush();
                    }
                    writer.println();
                    rs.close();
                } catch (Exception e) {
                    writer.println("⚠️ Erro ao obter amostras: " + e.getMessage());
                    writer.flush();
                }
            }

            tables.close();
            daasConn.close();
            writer.println("✔ Estrutura completa gerada com sucesso!");
            writer.flush();
            System.out.println("✅ Arquivo 'FinanceiroStructureCreator.txt' sendo atualizado (acompanhe com tail -f)");

        } catch (Exception e) {
            if (writer != null) {
                writer.println("❌ Erro: " + e.getMessage());
                writer.flush();
            }
            e.printStackTrace();
        } finally {
            if (writer != null) writer.close();
        }
    }
}
