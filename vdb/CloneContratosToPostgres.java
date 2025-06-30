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
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneContratosToPostgres </dev/null &>/dev/null & disown
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
            System.out.println("🚀 Início da execução CloneContratosToPostgres");
        } catch (Exception ex) {
            ex.printStackTrace(); // ainda vai para nohup.out
            return; // não consegue nem iniciar o log, então encerra
        }

        while (true) {
            try {
                System.out.println("📅 Data de execução: " + new java.util.Date());

                String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";
                System.setProperty("javax.net.ssl.trustStore", truststorePath);
                System.setProperty("javax.net.ssl.trustStoreType", "JKS");

                Class.forName("org.teiid.jdbc.TeiidDriver");
                Class.forName("org.postgresql.Driver");

                Connection daasConn = DriverManager.getConnection(
                    "jdbc:teiid:ContratosGovBr_usr_ComprasExecutivo@mms://daas.serpro.gov.br:31000", 
                    "70267715153", "t#Hlbr*tr8"
                );
                Connection pgConn = DriverManager.getConnection(
                    "jdbc:postgresql://localhost:5432/contratos", "postgres", "postgres"
                );

                List<String> tabelas = Files.readAllLines(Paths.get("tables_contratos.txt"));
                for (String tabela : tabelas) {
                    tabela = tabela.trim();
                    if (tabela.isEmpty()) continue;

                    System.out.println("\n🔄 Sincronizando: " + tabela);
                    Statement stmtDaaS = daasConn.createStatement();
                    stmtDaaS.setFetchSize(50);
                    ResultSet rsTest = stmtDaaS.executeQuery(
                        "SELECT * FROM ContratosGovBr_usr_ComprasExecutivo_VBL." + tabela + " LIMIT 1"
                    );
                    ResultSetMetaData meta = rsTest.getMetaData();
                    int colCount = meta.getColumnCount();

                    List<String> keyColumns = new ArrayList<>();
                    for (int i = 1; i <= colCount; i++) {
                        String col = meta.getColumnName(i);
                        if (col.equalsIgnoreCase("id")) {
                            keyColumns.clear();
                            keyColumns.add("id");
                            break;
                        } else if (col.toLowerCase().endsWith("_id")) {
                            keyColumns.add(col);
                        }
                    }
                    rsTest.close();

                    DatabaseMetaData dbMeta = pgConn.getMetaData();
                    ResultSet tablesPG = dbMeta.getTables(null, null, tabela, null);
                    if (!tablesPG.next()) {
                        StringBuilder createSql = new StringBuilder("CREATE TABLE " + tabela + " (");
                        for (int i = 1; i <= colCount; i++) {
                            String colName = meta.getColumnName(i);
                            String colType = meta.getColumnTypeName(i).toUpperCase();
                            String pgType;

                            if (colName.equalsIgnoreCase("id")) {
                                pgType = "BIGINT";
                            } else {
                                switch (colType) {
                                    case "STRING":
                                    case "VARCHAR":
                                    case "CHAR":
                                        pgType = "TEXT"; break;
                                    case "INTEGER":
                                    case "INT":
                                    case "INT4":
                                        pgType = "INTEGER"; break;
                                    case "BIGINT":
                                    case "INT8":
                                        pgType = "BIGINT"; break;
                                    case "DOUBLE":
                                    case "FLOAT":
                                    case "FLOAT8":
                                        pgType = "DOUBLE PRECISION"; break;
                                    case "DECIMAL":
                                    case "NUMERIC":
                                        pgType = "NUMERIC"; break;
                                    case "BOOLEAN":
                                        pgType = "BOOLEAN"; break;
                                    case "DATE":
                                        pgType = "DATE"; break;
                                    case "TIMESTAMP":
                                        pgType = "TIMESTAMP"; break;
                                    default:
                                        pgType = "TEXT"; break;
                                }
                            }

                            createSql.append(colName).append(" ").append(pgType);
                            if (i < colCount) createSql.append(", ");
                        }
                        createSql.append(")");

                        try (Statement stmtCreate = pgConn.createStatement()) {
                            stmtCreate.execute(createSql.toString());
                            System.out.println("📦 Tabela " + tabela + " criada.");
                        }
                    }
                    tablesPG.close();

                    String whereClause = "";
                    if (!keyColumns.isEmpty()) {
                        StringBuilder where = new StringBuilder(" WHERE ");
                        for (int i = 0; i < keyColumns.size(); i++) {
                            String col = keyColumns.get(i);
                            Statement stmt = pgConn.createStatement();
                            ResultSet rsMax = stmt.executeQuery("SELECT MAX(" + col + ") FROM " + tabela);
                            long max = 0;
                            if (rsMax.next()) max = rsMax.getLong(1);
                            rsMax.close();
                            stmt.close();

                            where.append(col).append(" > ").append(max);
                            if (i < keyColumns.size() - 1) where.append(" AND ");
                        }
                        where.append(" ORDER BY ").append(String.join(", ", keyColumns));
                        whereClause = where.toString();
                    }

                    ResultSet rs = stmtDaaS.executeQuery(
                        "SELECT * FROM ContratosGovBr_usr_ComprasExecutivo_VBL." + tabela + whereClause
                    );

                    StringBuilder insertSql = new StringBuilder("INSERT INTO " + tabela + " (");
                    for (int i = 1; i <= colCount; i++) {
                        insertSql.append(meta.getColumnName(i));
                        if (i < colCount) insertSql.append(", ");
                    }
                    insertSql.append(") VALUES (");
                    for (int i = 1; i <= colCount; i++) {
                        insertSql.append("?");
                        if (i < colCount) insertSql.append(", ");
                    }
                    insertSql.append(")");

                    PreparedStatement psPG = pgConn.prepareStatement(insertSql.toString());

                    int insertCount = 0;
                    while (rs.next()) {
                        for (int i = 1; i <= colCount; i++) {
                            try {
                                Object valor = rs.getObject(i);
                                psPG.setObject(i, valor);
                            } catch (Exception ex) {
                                String colName = meta.getColumnName(i);
                                Object valorErro = rs.getObject(i); // tentar capturar o valor que causou o erro
                                System.err.println("🛑 Erro ao setar coluna '" + colName + "' com valor: " + valorErro);
                                ex.printStackTrace();
                                throw ex; // força parada para análise
                            }
                        }
                        psPG.addBatch();
                        insertCount++;
                        if (insertCount % 500 == 0) {
                            psPG.executeBatch();
                            System.out.println("... " + insertCount + " registros inseridos em " + tabela);
                        }
                    }

                    if (insertCount % 500 != 0) {
                        psPG.executeBatch();
                    }

                    System.out.println("✅ Total " + insertCount + " registros inseridos em " + tabela);
                    rs.close();
                    stmtDaaS.close();
                    psPG.close();
                }

                daasConn.close();
                pgConn.close();
                System.out.println("🏁 Sincronização concluída com sucesso.");
                break;

            } catch (Exception e) {
                System.err.println("❌ Erro detectado: " + e.getMessage());
                e.printStackTrace();
                Thread.sleep(5000);
                System.err.println("🔁 Reiniciando conexão...");
            }
        }
    }
}
