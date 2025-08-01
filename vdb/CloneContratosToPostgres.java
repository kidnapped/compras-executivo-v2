/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 CloneContratosToPostgres.java
 *
 * Sincroniza tabelas do DaaS SERPRO (via Teiid) para banco local PostgreSQL,
 * com base nos nomes listados em `tables_contratos.txt`. A sincronização é 
 * incremental, usando a maior chave primária (`id` ou colunas terminadas com `_id`).
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneContratosToPostgres.java
 *
 * ▶️ Execução em segundo plano:
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneContratosToPostgres </dev/null &>/dev/null & disown ; tail -f clone_contratos.log
 *
 * 📂 Log:
 *   tail -f clone_contratos.log
 *
 * 🛑 Parar o processo:
 *   pkill -f CloneContratosToPostgres
 * ───────────────────────────────────────────────────────────────────────────────
 */


import java.sql.*;
import java.nio.file.*;
import java.util.*;
import java.io.*;

public class CloneContratosToPostgres {

    public static void main(String[] args) throws Exception {
        PrintStream log = null;
        try {
            log = new PrintStream(new FileOutputStream("clone_contratos.log", true));
            System.setOut(log);
            System.setErr(log);
            System.out.println("🚀 [START] Execução CloneContratosToPostgres");
        } catch (Exception ex) {
            ex.printStackTrace();
            return;
        }

        long inicioGlobal = System.currentTimeMillis();

        try {
            System.out.println("📅 [INFO] Data de execução: " + new java.util.Date());

            // SSL Config
            String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";
            System.setProperty("javax.net.ssl.trustStore", truststorePath);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");
            System.out.println("🔐 [INFO] Truststore configurado: " + truststorePath);

            // Drivers
            Class.forName("org.teiid.jdbc.TeiidDriver");
            Class.forName("org.postgresql.Driver");
            System.out.println("✅ [INFO] Drivers carregados com sucesso");

            // Conexões
            Connection daasConn = DriverManager.getConnection(
                "jdbc:teiid:ContratosGovBr_usr_ComprasExecutivo@mms://daas.serpro.gov.br:31000",
                "70267715153", "t#Hlbr*tr8"
            );
            Connection pgConn = DriverManager.getConnection(
                "jdbc:postgresql://localhost:5432/contratos", "postgres", "postgres"
            );

            List<String> tabelas = Files.readAllLines(Paths.get("tables_contratos.txt"));
            System.out.println("📂 [INFO] Total de tabelas na lista: " + tabelas.size());

            for (String tabela : tabelas) {
                tabela = tabela.trim();
                if (tabela.isEmpty()) continue;

                long inicioTabela = System.currentTimeMillis();
                System.out.println("\n🔄 [SYNC] Iniciando sincronização da tabela: " + tabela);

                Statement stmtDaaS = daasConn.createStatement();
                stmtDaaS.setFetchSize(0); // Evitar streaming no metadata
                String sqlMeta = "SELECT * FROM ContratosGovBr_usr_ComprasExecutivo_VBL." + tabela + " LIMIT 1";
                ResultSet rsMeta = stmtDaaS.executeQuery(sqlMeta);
                ResultSetMetaData meta = rsMeta.getMetaData();

                int colCount = meta.getColumnCount();
                List<String> colunas = new ArrayList<>();
                List<String> tipos = new ArrayList<>();
                for (int i = 1; i <= colCount; i++) {
                    colunas.add(meta.getColumnName(i));
                    tipos.add(meta.getColumnTypeName(i).toUpperCase());
                }
                rsMeta.close();

                // Modelo de INSERT
                StringBuilder insertSql = new StringBuilder("INSERT INTO " + tabela + " (");
                for (int i = 0; i < colunas.size(); i++) {
                    insertSql.append(colunas.get(i));
                    if (i < colunas.size() - 1) insertSql.append(", ");
                }
                insertSql.append(") VALUES (");
                for (int i = 0; i < colunas.size(); i++) {
                    insertSql.append("?");
                    if (i < colunas.size() - 1) insertSql.append(", ");
                }
                insertSql.append(")");

                PreparedStatement psPG = null;
                try {
                    psPG = pgConn.prepareStatement(insertSql.toString());
                } catch (SQLException ex) {
                    tratarErroEstrutura(ex, tabela, colunas, tipos);
                }

                // Consulta completa
                ResultSet rsData = stmtDaaS.executeQuery("SELECT * FROM ContratosGovBr_usr_ComprasExecutivo_VBL." + tabela);
                int count = 0;

                while (rsData.next()) {
                    for (int i = 0; i < colunas.size(); i++) {
                        psPG.setObject(i + 1, rsData.getObject(i + 1));
                    }
                    psPG.addBatch();
                    if (++count % 500 == 0) {
                        try {
                            psPG.executeBatch();
                            psPG.clearBatch();
                        } catch (SQLException ex) {
                            tratarErroEstrutura(ex, tabela, colunas, tipos);
                        }
                    }
                }

                if (count % 500 != 0) {
                    try {
                        psPG.executeBatch();
                    } catch (SQLException ex) {
                        tratarErroEstrutura(ex, tabela, colunas, tipos);
                    }
                }

                psPG.close();
                rsData.close();
                stmtDaaS.close();

                System.out.println("✅ [FIM] Tabela: " + tabela + " | Registros: " + count +
                                   " | Tempo: " + (System.currentTimeMillis() - inicioTabela) / 1000 + "s");
            }

            daasConn.close();
            pgConn.close();
            System.out.println("🏁 [DONE] Sincronização concluída em " +
                               (System.currentTimeMillis() - inicioGlobal) / 1000 + "s");

        } catch (Exception e) {
            tratarErroGeral(e);
        }
    }

    private static void tratarErroEstrutura(SQLException ex, String tabela, List<String> colunas, List<String> tipos) {
        String msg = ex.getMessage();
        System.err.println("❌ [ERRO SQL] " + msg);

        if (msg.contains("column") && msg.contains("does not exist")) {
            String col = extrairColuna(msg);
            int idx = colunas.indexOf(col);
            String tipoPg = "TEXT";
            if (idx >= 0) {
                tipoPg = mapearTipoPg(tipos.get(idx));
            }
            System.err.println("\n💡 [AJUSTE] Coluna ausente detectada:");
            System.err.println("ALTER TABLE " + tabela + " ADD COLUMN " + col + " " + tipoPg + ";");
            System.err.println("⚠ Execute o comando no PostgreSQL e rode novamente.");
        }

        ex.printStackTrace();
        System.exit(1);
    }

    private static void tratarErroGeral(Exception e) {
        System.err.println("❌ [FATAL] " + e.getMessage());
        e.printStackTrace();
        System.exit(1);
    }

    private static String extrairColuna(String msg) {
        int start = msg.indexOf("\"");
        int end = msg.indexOf("\"", start + 1);
        if (start > 0 && end > start) {
            return msg.substring(start + 1, end);
        }
        return "coluna_desconhecida";
    }

    private static String mapearTipoPg(String tipoTeiid) {
        switch (tipoTeiid) {
            case "STRING": case "VARCHAR": case "CHAR":
                return "TEXT";
            case "INTEGER": case "INT": case "INT4":
                return "INTEGER";
            case "BIGINT": case "INT8":
                return "BIGINT";
            case "DOUBLE": case "FLOAT": case "FLOAT8":
                return "DOUBLE PRECISION";
            case "DECIMAL": case "NUMERIC":
                return "NUMERIC";
            case "BOOLEAN":
                return "BOOLEAN";
            case "DATE":
                return "DATE";
            case "TIMESTAMP":
                return "TIMESTAMP";
            default:
                return "TEXT";
        }
    }
}

