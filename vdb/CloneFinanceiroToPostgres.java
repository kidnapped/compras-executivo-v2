/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 CloneFinanceiroToPostgres.java
 *
 * Sincroniza tabelas do DaaS SERPRO (via Teiid) para banco local PostgreSQL,
 * usando datas do campo `DT_CARGA_C`, controladas por `tables_financeiro.txt`.
 * A sincronização é incremental e atualiza automaticamente o arquivo de controle.
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres.java
 *
 * ▶️ Execução em segundo plano:
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres </dev/null &>/dev/null & disown
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres --ignore-delete </dev/null &>/dev/null & disown
 *
 * 📂 Log:
 *   tail -f clone_financeiro.log
 *
 * 🛑 Parar o processo:
 *   pkill -f CloneFinanceiroToPostgres
 * ───────────────────────────────────────────────────────────────────────────────
 */

import java.sql.*;
import java.nio.file.*;
import java.util.*;
import java.io.*;
import java.time.*;
import java.time.format.DateTimeFormatter;

public class CloneFinanceiroToPostgres {
    public static void main(String[] args) throws Exception {
        System.out.println("Iniciando CloneFinanceiroToPostgres...");
        boolean ignoreDelete = Arrays.asList(args).contains("--ignore-delete");

        while (true) {
            try {
                PrintStream log = new PrintStream(new FileOutputStream("clone_financeiro.log", true));
                System.setOut(log);
                System.setErr(log);
                System.out.println(timestamp() + " 📝 Log iniciado em: " + LocalDateTime.now());

                String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";
                System.setProperty("javax.net.ssl.trustStore", truststorePath);
                System.setProperty("javax.net.ssl.trustStoreType", "JKS");

                System.out.println(timestamp() + " 🔌 Conectando ao Teiid...");
                Class.forName("org.teiid.jdbc.TeiidDriver");
                Connection daasConn = DriverManager.getConnection(
                        "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000;fetchSize=2000;socketTimeout=7200000",
                        "70267715153", "t#Hlbr*tr8");
                System.out.println(timestamp() + " ✅ Conectado ao Teiid.");

                System.out.println(timestamp() + " 🔌 Conectando ao PostgreSQL...");
                Class.forName("org.postgresql.Driver");
                Connection pgConn = DriverManager.getConnection(
                        "jdbc:postgresql://localhost:5432/financeiro", "postgres", "postgres");
                System.out.println(timestamp() + " ✅ Conectado ao PostgreSQL.");

                Path tablesPath = Paths.get("tables_financeiro.txt");
                List<String> linhas = Files.readAllLines(tablesPath);
                Map<String, LocalDate> tabelaDataInicio = new LinkedHashMap<>();

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
                LocalDate hoje = LocalDate.now();
                LocalDate ontem = hoje.minusDays(1);

                for (String linha : linhas) {
                    String trimmed = linha.trim();
                    if (trimmed.isEmpty() || trimmed.startsWith("#"))
                        continue;

                    String[] partes = trimmed.split("=");
                    String tabela = partes[0].trim();
                    LocalDate dataInicial = null;
                    if (partes.length > 1 && partes[1].matches("\\d{8}")) {
                        dataInicial = LocalDate.parse(partes[1], formatter);
                    }
                    tabelaDataInicio.put(tabela, dataInicial);
                }

                for (Map.Entry<String, LocalDate> entrada : tabelaDataInicio.entrySet()) {
                    String tabela = entrada.getKey();
                    LocalDate ultimaData = entrada.getValue();

                    if (ultimaData != null && ultimaData.equals(ontem)) {
                        System.out.println(timestamp() + " ✅ Nenhuma nova data para " + tabela + " até "
                                + ontem.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                        continue;
                    }

                    System.out.println(timestamp() + " 📂 Sincronizando: " + tabela);
                    List<String> colunas = new ArrayList<>();

                    try {
                        System.out.println(timestamp() + " 📄 Obtendo metadados das colunas da tabela " + tabela);
                        ResultSet rsCols = daasConn.getMetaData().getColumns(null, "DWTG_Colunar_Afinco_VBL", tabela,
                                null);
                        while (rsCols.next()) {
                            colunas.add(rsCols.getString("COLUMN_NAME"));
                        }
                        rsCols.close();
                    } catch (Exception e) {
                        System.err.println(
                                timestamp() + " ❌ Falha ao buscar colunas da tabela " + tabela + " — pulando.");
                        e.printStackTrace();
                        continue;
                    }

                    if (colunas.isEmpty()) {
                        System.err.println(timestamp() + " ❌ Nenhuma coluna encontrada em " + tabela + " — pulando.");
                        continue;
                    }

                    boolean tabelaExiste = false;
                    try (ResultSet tablesPG = pgConn.getMetaData().getTables(null, null, tabela.toLowerCase(),
                            new String[] { "TABLE" })) {
                        tabelaExiste = tablesPG.next();
                    }

                    if (!tabelaExiste) {
                        StringBuilder createSql = new StringBuilder("CREATE TABLE " + tabela + " (");
                        for (int i = 0; i < colunas.size(); i++) {
                            String colName = colunas.get(i);
                            createSql.append(colName).append(" TEXT");
                            if (i < colunas.size() - 1)
                                createSql.append(", ");
                        }
                        createSql.append(")");

                        try (Statement stmtCreate = pgConn.createStatement()) {
                            stmtCreate.execute(createSql.toString());
                            System.out.println(timestamp() + " 🖕 Tabela " + tabela + " criada.");
                        } catch (SQLException ex) {
                            if (ex.getMessage().toLowerCase().contains("already exists")) {
                                System.out.println(
                                        timestamp() + " ℹ️ Tabela " + tabela + " já existe — ignorando criação.");
                            } else {
                                throw ex;
                            }
                        }
                    }

                    String queryDatas = "SELECT DISTINCT DT_CARGA_C FROM DWTG_Colunar_Afinco_VBL." + tabela;
                    List<String> datasValidas = new ArrayList<>();
                    try (Statement stmtDatas = daasConn.createStatement();
                            ResultSet rsDatas = stmtDatas.executeQuery(queryDatas)) {
                        System.out.println(timestamp() + " 🔎 Executando consulta de datas disponíveis...");
                        while (rsDatas.next()) {
                            String dataStr = rsDatas.getString(1);
                            if (dataStr != null && dataStr.matches("\\d{8}")) {
                                LocalDate data = LocalDate.parse(dataStr, formatter);
                                if ((ultimaData == null || data.isAfter(ultimaData)) && !data.isAfter(ontem)) {
                                    datasValidas.add(dataStr);
                                }
                            }
                        }
                    } catch (Exception ex) {
                        System.err.println(timestamp() + " ❌ Erro ao obter datas disponíveis da tabela " + tabela);
                        ex.printStackTrace();
                        continue;
                    }
                    Collections.sort(datasValidas);

                    if (datasValidas.isEmpty()) {
                        System.out.println(timestamp() + " ✅ Nenhuma nova data para " + tabela + " até "
                                + ontem.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                        tabelaDataInicio.put(tabela, ontem);
                        atualizarArquivoTabela(tablesPath, tabelaDataInicio, formatter);
                        continue;
                    }

                    System.out.println(timestamp() + " 📆 Datas disponíveis para " + tabela + ": " + datasValidas.size()
                            + " datas até " + ontem.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

                    boolean apagarNecessario = true;
                    String checagemSQL = "SELECT COUNT(*) FROM " + tabela + " WHERE DT_CARGA_C >= ?";
                    try (PreparedStatement checkStmt = pgConn.prepareStatement(checagemSQL)) {
                        checkStmt.setString(1, datasValidas.get(0));
                        try (ResultSet rsCheck = checkStmt.executeQuery()) {
                            if (rsCheck.next() && rsCheck.getInt(1) == 0) {
                                apagarNecessario = false;
                                System.out.println(timestamp() + " ℹ️  Nenhum dado com DT_CARGA_C >= "
                                        + datasValidas.get(0) + " encontrado em " + tabela + " — skip do DELETE.");
                            }
                        }
                    }

                    for (String dataStr : datasValidas) {
                        System.out.println(timestamp() + " 📄 Buscando registros de " + dataStr);

                        if (apagarNecessario && !ignoreDelete) {
                            System.out.println(
                                    timestamp() + " 🖑 Apagando registros antigos de " + dataStr + " em " + tabela);
                            try (PreparedStatement deleteStmt = pgConn
                                    .prepareStatement("DELETE FROM " + tabela + " WHERE DT_CARGA_C = ?")) {
                                deleteStmt.setString(1, dataStr);
                                deleteStmt.executeUpdate();
                            }
                            System.out.println(
                                    timestamp() + " ✅ Registros antigos apagados de " + dataStr + " em " + tabela);
                        }

                        String countQuery = "SELECT COUNT(*) FROM DWTG_Colunar_Afinco_VBL." + tabela
                                + " WHERE DT_CARGA_C = '" + dataStr + "'";
                        try (Statement stmtCount = daasConn.createStatement();
                                ResultSet rsCount = stmtCount.executeQuery(countQuery)) {
                            if (rsCount.next()) {
                                int total = rsCount.getInt(1);
                                System.out.println(timestamp() + " 📊 Total de registros a importar: " + total);
                            }
                        }

                        StringBuilder selectQueryBuilder = new StringBuilder("SELECT ");
                        for (int i = 0; i < colunas.size(); i++) {
                            selectQueryBuilder.append("CAST(").append(colunas.get(i)).append(" AS STRING)");
                            if (i < colunas.size() - 1)
                                selectQueryBuilder.append(", ");
                        }
                        selectQueryBuilder.append(" FROM DWTG_Colunar_Afinco_VBL.").append(tabela)
                                .append(" WHERE DT_CARGA_C = '").append(dataStr).append("'");
                        String selectQuery = selectQueryBuilder.toString();

                        System.out.println(timestamp() + " ⚙️ Executando query no Teiid...");
                        Statement stmtDaaS = daasConn.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE,
                                ResultSet.CONCUR_READ_ONLY);
                        stmtDaaS.setFetchSize(50);
                        ResultSet rs = stmtDaaS.executeQuery(selectQuery);

                        System.out.println(timestamp() + " ✅ Consulta finalizada. Iniciando importação...");

                        StringBuilder insertSql = new StringBuilder("INSERT INTO " + tabela + " (");
                        insertSql.append(String.join(", ", colunas));
                        insertSql.append(") VALUES (");
                        insertSql.append("?,".repeat(colunas.size()));
                        insertSql.setLength(insertSql.length() - 1);
                        insertSql.append(")");

                        PreparedStatement psPG = pgConn.prepareStatement(insertSql.toString());
                        int insertCount = 0;
                        while (rs.next()) {
                            for (int i = 0; i < colunas.size(); i++) {
                                Object valor = rs.getObject(i + 1);
                                psPG.setString(i + 1, valor != null ? valor.toString() : null);
                            }
                            psPG.addBatch();
                            insertCount++;
                            if (insertCount % 500 == 0) {
                                psPG.executeBatch();
                                System.out.println(timestamp() + " 📅 " + insertCount + " registros inseridos em "
                                        + tabela + " para " + dataStr);
                            }
                        }
                        if (insertCount % 500 != 0)
                            psPG.executeBatch();
                        rs.close();
                        psPG.close();
                        stmtDaaS.close();
                        System.out.println(timestamp() + " ✅ " + insertCount + " registros inseridos em " + tabela
                                + " para " + dataStr);

                        LocalDate dataAtual = LocalDate.parse(dataStr, formatter);
                        tabelaDataInicio.put(tabela, dataAtual);
                        atualizarArquivoTabela(tablesPath, tabelaDataInicio, formatter);
                    }
                }

                daasConn.close();
                pgConn.close();
                System.out.println(timestamp() + " 🎉 Sincronizacao concluida com sucesso.");
                break;

            } catch (Exception e) {
                System.err.println(timestamp() + " ❌ ERRO FATAL: Encerrando execução.");
                e.printStackTrace();
                String msg = e.getMessage();
                if (msg != null && msg.toLowerCase().contains("connection timed out")) {
                    System.out.println(timestamp() + " ⏳ Timeout detectado — tentando novamente em 30 segundos...");
                    Thread.sleep(30_000);
                    continue;
                }
                break;
            }
        }
    }

    private static void atualizarArquivoTabela(Path path, Map<String, LocalDate> mapa, DateTimeFormatter formatter) {
        try {
            List<String> orig = Files.readAllLines(path);
            List<String> novasLinhas = new ArrayList<>();

            for (String line : orig) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) { // mantém linhas vazias ou comentadas
                    novasLinhas.add(line);
                    continue;
                }

                String tabela = trimmed.split("=")[0].trim(); // tabela da linha original
                LocalDate data = mapa.get(tabela); // data atual no mapa

                if (data != null) {
                    novasLinhas.add(tabela + "=" + formatter.format(data)); // regrava com a data atual
                } else {
                    novasLinhas.add(tabela); // regrava sem data
                }
            }

            // acrescenta tabelas novas que não existiam no arquivo
            for (Map.Entry<String, LocalDate> e : mapa.entrySet()) {
                boolean jaExiste = orig.stream().anyMatch(l -> l.trim().startsWith(e.getKey()));
                if (!jaExiste) {
                    if (e.getValue() != null) {
                        novasLinhas.add(e.getKey() + "=" + formatter.format(e.getValue()));
                    } else {
                        novasLinhas.add(e.getKey());
                    }
                }
            }

            Files.write(path, novasLinhas);
        } catch (IOException e) {
            System.err.println(timestamp() + " ❌ Erro ao atualizar tables_financeiro.txt: " + e.getMessage());
        }

    }

    private static String timestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss"));
    }
}
