/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 CheckFinanceiroTableSizes.java
 *
 * Conta o número de registros de todas as tabelas no schema `DWTG_Colunar_Afinco_VBL`
 * do DaaS SERPRO (via Teiid JDBC) e gera:
 *   ✅ Arquivo de resultados: CheckFinanceiroTableSizes-YYYY-MM-DD.txt
 *   ✅ Log detalhado: CheckFinanceiroTableSizes.log
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar CheckFinanceiroTableSizes.java
 *
 * ▶️ Execução em segundo plano:
 *   echo > CheckFinanceiroTableSizes.log && nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar CheckFinanceiroTableSizes </dev/null &>/dev/null & disown ; tail -f CheckFinanceiroTableSizes.log
 *
 * 📂 Ver Resultado:
 *   cat CheckFinanceiroTableSizes-$(date +%F).txt
 *
 * 🧹 Limpar Log:
 *   echo > CheckFinanceiroTableSizes.log
 *
 * 🛑 Parar o processo:
 *   pkill -f CheckFinanceiroTableSizes
 * ───────────────────────────────────────────────────────────────────────────────
 */

import java.sql.*;
import java.util.*;
import java.io.*;
import java.text.NumberFormat;
import java.util.Locale;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class CheckFinanceiroTableSizes {
    public static void main(String[] args) {
        String url = "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000";
        String user = "70267715153";
        String password = "t#Hlbr*tr8";
        String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";

        Locale localeBR = new Locale("pt", "BR");
        NumberFormat nf = NumberFormat.getInstance(localeBR);

        LocalDate hoje = LocalDate.now();
        LocalDate ontem = hoje.minusDays(1);
        String dataAtual = hoje.toString(); // yyyy-MM-dd
        String dataOntemStr = ontem.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        String resultFileName = "CheckFinanceiroTableSizes-" + dataAtual + ".txt";
        File resultFile = new File(resultFileName);
        File logFile = new File("CheckFinanceiroTableSizes.log");

        try (
            PrintWriter resultWriter = new PrintWriter(new FileWriter(resultFile, false));
            PrintWriter logWriter = new PrintWriter(new FileWriter(logFile, false), true)
        ) {
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");

            logWriter.println("🚀 Iniciando verificação das tabelas...");
            logWriter.println("Arquivo de saída: " + resultFile.getAbsolutePath());
            logWriter.println("Arquivo de log: " + logFile.getAbsolutePath());
            logWriter.println("Filtro aplicado: DT_CARGA_C <= " + dataOntemStr);
            logWriter.println("---------------------------------------------");

            Class.forName("org.teiid.jdbc.TeiidDriver");
            Connection conn = DriverManager.getConnection(url, user, password);
            Statement stmt = conn.createStatement();

            ResultSet rsTables = conn.getMetaData().getTables(null, "DWTG_Colunar_Afinco_VBL", null, new String[]{"TABLE"});

            List<String> tabelas = new ArrayList<>();
            int maxLength = 0;

            while (rsTables.next()) {
                String tableName = rsTables.getString("TABLE_NAME");
                tabelas.add(tableName);
                if (tableName.length() > maxLength) {
                    maxLength = tableName.length();
                }
            }
            rsTables.close();

            logWriter.println("🔍 Total de tabelas encontradas: " + tabelas.size());
            resultWriter.println("#");
            resultWriter.println("# TOTAL DE REGISTROS POR TABELA - VDB FINANCEIRO");
            resultWriter.println("# Gerado em: " + dataAtual + " (até " + dataOntemStr + ")");
            resultWriter.println("#");
            resultWriter.println();

            for (String tabela : tabelas) {
                logWriter.println("⏳ Contando registros da tabela: " + tabela);
                try {
                    String query = "SELECT COUNT(*) FROM DWTG_Colunar_Afinco_VBL." + tabela +
                                   " WHERE DT_CARGA_C <= '" + dataOntemStr + "'";
                    ResultSet rsCount = stmt.executeQuery(query);
                    if (rsCount.next()) {
                        int count = rsCount.getInt(1);
                        String formattedCount = nf.format(count);
                        resultWriter.printf("%-" + maxLength + "s = %s%n", tabela, formattedCount);
                        logWriter.println("✅ " + tabela + " = " + formattedCount + " registros");
                    }
                    rsCount.close();
                } catch (Exception e) {
                    resultWriter.printf("%-" + maxLength + "s = ERRO (%s)%n", tabela, e.getMessage());
                    logWriter.println("❌ Erro ao contar tabela " + tabela + ": " + e.getMessage());
                }
            }

            stmt.close();
            conn.close();
            logWriter.println("🏁 Verificação concluída com sucesso!");
            logWriter.println("Confira os resultados no arquivo: " + resultFileName);

        } catch (Exception e) {
            try (PrintWriter logWriter = new PrintWriter(new FileWriter(logFile, true))) {
                logWriter.println("❌ ERRO FATAL:");
                e.printStackTrace(logWriter);
            } catch (IOException ioEx) {
                System.err.println("Erro ao escrever log: " + ioEx.getMessage());
            }
        }
    }
}
