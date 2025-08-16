/*
 * ───────────────────────────────────────────────────────────────────────────────
 * 📄 CloneContratosToPostgres.java  (versão à prova de falhas)
 *
 * - Sincroniza tabelas do DaaS SERPRO (Teiid) -> PostgreSQL local.
 * - Incremental por `id` (quando existir): lê origem com WHERE id > MAX(id) do destino.
 * - Se vier coluna nova na origem: cria automaticamente no destino (em minúsculas).
 * - Se faltar coluna no destino: ignora na inserção (usa interseção de colunas).
 * - Lotes com autocommit desativado + commit a cada 5k linhas (configurável).
 * - “Upsert”:
 *     * Preferido: ON CONFLICT (id) DO NOTHING (se houver UNIQUE/PK em id).
 *     * Sem UNIQUE/PK: fallback para INSERT ... SELECT ... WHERE NOT EXISTS (...).
 * - Log detalhado de tudo. O log é zerado no início.
 * - Ao final, valida duplicatas por `id` e registra no log.
 *
 * 🔧 Compilação:
 *   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneContratosToPostgres.java
 *
 * ▶️ Execução em segundo plano:
 *   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneContratosToPostgres </dev/null &>/dev/null & disown ; tail -f clone_contratos.log
 *
 * 🛑 Parar:
 *   pkill -f CloneContratosToPostgres
 * ───────────────────────────────────────────────────────────────────────────────
 */

import java.sql.*;
import java.nio.file.*;
import java.util.*;
import java.io.*;

public class CloneContratosToPostgres {

    // ===== CONFIG =====
    private static final String TRUSTSTORE_PATH = "/home/ec2-user/java/daas.serpro.gov.br.jks";
    private static final String TEIID_URL  = "jdbc:teiid:ContratosGovBr_usr_ComprasExecutivo@mms://daas.serpro.gov.br:31000";
    private static final String TEIID_USER = "70267715153";
    private static final String TEIID_PASS = "t#Hlbr*tr8";

    private static final String PG_URL  = "jdbc:postgresql://localhost:5432/contratos";
    private static final String PG_USER = "postgres";
    private static final String PG_PASS = "postgres";

    private static final String TABLE_LIST = "tables_contratos.txt";
    private static final String LOG_FILE   = "clone_contratos.log";

    private static final String SRC_SCHEMA = "ContratosGovBr_usr_ComprasExecutivo_VBL";
    private static final String DST_SCHEMA = "public";

    private static final int BATCH_SIZE = 5000;
    private static final int FETCH_SIZE = 2000;

    public static void main(String[] args) {
        // ZERA o log no início
        try (PrintStream log = new PrintStream(new FileOutputStream(LOG_FILE, false), true, "UTF-8")) {
            System.setOut(log);
            System.setErr(log);
            run();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void run() {
        long inicioGlobal = System.currentTimeMillis();
        try {
            System.out.println("──────────────────────────────────────────────────────────────────────────────");
            System.out.println("🚀 [START] Execução CloneContratosToPostgres");
            System.out.println("📅 [INFO] Data de execução: " + new java.util.Date());

            // SSL/Truststore para Teiid
            System.setProperty("javax.net.ssl.trustStore", TRUSTSTORE_PATH);
            System.setProperty("javax.net.ssl.trustStoreType", "JKS");
            System.out.println("🔐 [INFO] Truststore configurado: " + TRUSTSTORE_PATH);

            // Drivers
            Class.forName("org.teiid.jdbc.TeiidDriver");
            Class.forName("org.postgresql.Driver");
            System.out.println("✅ [INFO] Drivers carregados com sucesso");

            try (Connection daasConn = DriverManager.getConnection(TEIID_URL, TEIID_USER, TEIID_PASS);
                 Connection pgConn   = DriverManager.getConnection(PG_URL, PG_USER, PG_PASS)) {

                // Tuning PG
                pgConn.setAutoCommit(false);
                try (Statement s = pgConn.createStatement()) {
                    s.execute("SET search_path TO " + qi(DST_SCHEMA));
                }

                List<String> tabelas = Files.readAllLines(Paths.get(TABLE_LIST));
                System.out.println("📂 [INFO] Total de tabelas na lista: " + tabelas.size());

                for (String tabelaRaw : tabelas) {
                    String tabela = (tabelaRaw == null ? "" : tabelaRaw.trim());
                    if (tabela.isEmpty()) continue;

                    long t0 = System.currentTimeMillis();
                    System.out.println("\n🔄 [SYNC] Iniciando: " + tabela);
                    try {
                        syncTable(daasConn, pgConn, tabela);
                        System.out.println("✅ [FIM] " + tabela + " | Tempo: " + ((System.currentTimeMillis() - t0) / 1000) + "s");
                    } catch (Exception ex) {
                        System.err.println("❌ [ERRO_TABELA] " + tabela + ": " + ex.getMessage());
                        ex.printStackTrace();
                        // segue para próxima tabela
                    }
                }

                // Validação pós-sincronização: duplicatas por id
                try {
                    System.out.println("\n🧪 [VALIDAÇÃO] Duplicatas por `id` após a sincronização:");
                    logDuplicatesById(pgConn);
                    pgConn.commit();
                } catch (Exception v) {
                    System.err.println("⚠ [VALIDAÇÃO] Falhou: " + v.getMessage());
                }
            }

            System.out.println("\n🏁 [DONE] Duração total: " + ((System.currentTimeMillis() - inicioGlobal) / 1000) + "s");
            System.out.println("──────────────────────────────────────────────────────────────────────────────");

        } catch (Throwable e) {
            System.err.println("❌ [FATAL] " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void syncTable(Connection daasConn, Connection pgConn, String tabela) throws Exception {
        // 1) Metadados da origem
        List<Col> srcCols = loadSourceColumns(daasConn, tabela);
        if (srcCols.isEmpty()) {
            System.out.println("⚠ [INFO] Sem colunas na origem? Pulando " + tabela);
            return;
        }
        System.out.println("🧭 [META] Origem " + tabela + " -> colunas: " + srcCols.size());

        // 2) Colunas do destino: mapa lower -> nome real
        Map<String,String> dstColsMap = getPgColumnsMap(pgConn, tabela);
        System.out.println("🧭 [META] Destino " + tabela + " -> colunas: " + dstColsMap.size());

        // 2.1) Criar colunas novas (em minúsculas) para as que existem na origem e não no destino
        for (Col c : srcCols) {
            if (!dstColsMap.containsKey(c.name.toLowerCase())) {
                String newName = c.name.toLowerCase();         // normaliza no destino
                String pgType  = mapearTipoPg(c.typeName);
                String sql = "ALTER TABLE " + qi(DST_SCHEMA) + "." + qi(tabela)
                           + " ADD COLUMN " + qi(newName) + " " + pgType;
                try {
                    execDDL(pgConn, sql);
                    pgConn.commit();
                    System.out.println("🧱 [DDL] + coluna " + tabela + "." + newName + " " + pgType + " (criada da origem: " + c.name + ")");
                    dstColsMap.put(newName, newName);
                } catch (SQLException ex) {
                    pgConn.rollback();
                    System.err.println("⚠ [DDL] Falha ao criar coluna " + tabela + "." + newName + " (" + c.typeName + "): " + ex.getMessage());
                    // segue sem essa coluna (será ignorada)
                }
            }
        }

        // 2.2) Interseção de colunas + mapeamento src->dst (corrige case)
        List<ColMap> cols = new ArrayList<>();
        for (Col c : srcCols) {
            String key = c.name.toLowerCase();
            if (dstColsMap.containsKey(key)) {
                String dstName = dstColsMap.get(key);
                if (!dstName.equals(c.name)) {
                    System.out.println("🔁 [MAP] " + tabela + ": origem '" + c.name + "' → destino '" + dstName + "'");
                }
                cols.add(new ColMap(c.name, dstName, c.typeName));
            } else {
                System.out.println("↪ [IGNORA] " + tabela + ": coluna só na origem (não criada): " + c.name);
            }
        }
        if (cols.isEmpty()) {
            System.out.println("⚠ [INFO] Interseção de colunas vazia. Pulando " + tabela);
            return;
        }

        // 3) Incremental por id
        boolean temId = cols.stream().anyMatch(c -> c.dstName.equalsIgnoreCase("id") || c.srcName.equalsIgnoreCase("id"));
        long maxId = 0L;
        if (temId) {
            maxId = getMaxId(pgConn, tabela);
            System.out.println("🔎 [INCR] MAX(id) destino em " + tabela + " = " + maxId);
        } else {
            System.out.println("ℹ [INCR] Sem coluna `id` em " + tabela + " (carga completa).");
        }

        // 4) SELECT origem (com WHERE id > maxId, quando aplicável)
        String select = "SELECT * FROM " + qi(SRC_SCHEMA) + "." + qi(tabela);
        if (temId && maxId > 0) select += " WHERE id > " + maxId;
        System.out.println("🟦 [SQL_ORIGEM] " + select);

        // 5) Preparar upsert: ON CONFLICT (id) se possível; senão, fallback WHERE NOT EXISTS
        boolean usarOnConflict = false;
        if (temId) {
            if (hasUniqueOnId(pgConn, tabela)) {
                usarOnConflict = true;
                System.out.println("🧩 [UPSERT] UNIQUE/PK(id) detectado -> ON CONFLICT (id) DO NOTHING");
            } else {
                String idx = "ux_" + tabela + "_id";
                String ddl = "CREATE UNIQUE INDEX IF NOT EXISTS " + qi(idx)
                           + " ON " + qi(DST_SCHEMA) + "." + qi(tabela) + " (id)";
                try {
                    execDDL(pgConn, ddl);
                    pgConn.commit();
                    usarOnConflict = true;
                    System.out.println("🧩 [UPSERT] UNIQUE(id) criado -> ON CONFLICT (id) DO NOTHING");
                } catch (SQLException ix) {
                    pgConn.rollback();
                    System.out.println("↪ [UPSERT] UNIQUE(id) não criado (" + ix.getMessage() + "). Fallback para WHERE NOT EXISTS.");
                    usarOnConflict = false;
                }
            }
        }

        // 6) Montar INSERT (usa SEMPRE os nomes do destino)
        StringBuilder colsCsv = new StringBuilder();
        StringBuilder qmarks  = new StringBuilder();
        for (int i = 0; i < cols.size(); i++) {
            if (i > 0) { colsCsv.append(", "); qmarks.append(", "); }
            colsCsv.append(qi(cols.get(i).dstName));
            qmarks.append("?");
        }

        String insertSQL;
        boolean fallbackWhereNotExists = false;
        if (temId && usarOnConflict) {
            insertSQL = "INSERT INTO " + qi(DST_SCHEMA) + "." + qi(tabela)
                      + " (" + colsCsv + ") VALUES (" + qmarks + ") ON CONFLICT (id) DO NOTHING";
        } else if (temId) {
            insertSQL = "INSERT INTO " + qi(DST_SCHEMA) + "." + qi(tabela)
                      + " (" + colsCsv + ") SELECT " + qmarks
                      + " WHERE NOT EXISTS (SELECT 1 FROM " + qi(DST_SCHEMA) + "." + qi(tabela) + " WHERE id = ?)";
            fallbackWhereNotExists = true;
        } else {
            insertSQL = "INSERT INTO " + qi(DST_SCHEMA) + "." + qi(tabela)
                      + " (" + colsCsv + ") VALUES (" + qmarks + ")";
        }
        System.out.println("🟩 [SQL_DESTINO] " + insertSQL);

        // 7) Inserção em lotes
        long lidos = 0, inseridos = 0;
        try (Statement s = daasConn.createStatement(ResultSet.TYPE_FORWARD_ONLY, ResultSet.CONCUR_READ_ONLY)) {
            s.setFetchSize(FETCH_SIZE);
            try (ResultSet rs = s.executeQuery(select);
                 PreparedStatement ps = pgConn.prepareStatement(insertSQL)) {

                int batchCount = 0;

                while (rs.next()) {
                    lidos++;

                    Object idValue = null;
                    for (int i = 0; i < cols.size(); i++) {
                        Object v = rs.getObject(cols.get(i).srcName);
                        ps.setObject(i + 1, v);
                        if (cols.get(i).dstName.equalsIgnoreCase("id")) {
                            idValue = v;
                        }
                    }
                    if (fallbackWhereNotExists) {
                        ps.setObject(cols.size() + 1, idValue); // parâmetro do WHERE NOT EXISTS
                    }

                    ps.addBatch();
                    batchCount++;

                    if (batchCount >= BATCH_SIZE) {
                        inseridos += execAndCount(pgConn, ps);
                        batchCount = 0;
                    }
                }
                if (batchCount > 0) {
                    inseridos += execAndCount(pgConn, ps);
                }
            }
        } catch (SQLException ex) {
            System.err.println("❌ [INSERÇÃO] Falha em " + tabela + ": " + ex.getMessage());
            throw ex;
        }

        System.out.println("📊 [RESUMO] " + tabela + " | lidos: " + lidos + " | inseridos: " + inseridos);
    }

    // Executa batch, faz commit e retorna quantidade de "linhas consideradas" inseridas (aproximação)
    private static long execAndCount(Connection pgConn, PreparedStatement ps) throws SQLException {
        long ins = 0;
        try {
            int[] ret = ps.executeBatch();
            pgConn.commit();
            for (int r : ret) {
                // ON CONFLICT DO NOTHING retorna 0; SUCCESS_NO_INFO pode vir; contamos como "processado"
                if (r > 0 || r == Statement.SUCCESS_NO_INFO) ins++;
            }
        } catch (SQLException e) {
            pgConn.rollback();
            throw e;
        } finally {
            try { ps.clearBatch(); } catch (Exception ignore) {}
        }
        return ins;
    }

    // Metadados da origem
    private static List<Col> loadSourceColumns(Connection daasConn, String tabela) throws SQLException {
        String sql = "SELECT * FROM " + qi(SRC_SCHEMA) + "." + qi(tabela) + " LIMIT 1";
        List<Col> cols = new ArrayList<>();
        try (Statement s = daasConn.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            ResultSetMetaData m = rs.getMetaData();
            for (int i = 1; i <= m.getColumnCount(); i++) {
                String name = m.getColumnName(i);
                String type = m.getColumnTypeName(i);
                cols.add(new Col(name, (type == null ? "TEXT" : type.toUpperCase())));
            }
        }
        return cols;
    }

    // Colunas do destino: lower -> nomeReal
    private static Map<String,String> getPgColumnsMap(Connection pgConn, String tabela) throws SQLException {
        String q = "SELECT column_name FROM information_schema.columns WHERE table_schema=? AND table_name=?";
        Map<String,String> out = new HashMap<>();
        try (PreparedStatement ps = pgConn.prepareStatement(q)) {
            ps.setString(1, DST_SCHEMA);
            ps.setString(2, tabela);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String real = rs.getString(1);
                    out.put(real.toLowerCase(), real);
                }
            }
        }
        return out;
    }

    // MAX(id) do destino (0 se vazio/sem id)
    private static long getMaxId(Connection pgConn, String tabela) {
        String sql = "SELECT COALESCE(MAX(id), 0) FROM " + qi(DST_SCHEMA) + "." + qi(tabela);
        try (Statement s = pgConn.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            if (rs.next()) return rs.getLong(1);
        } catch (SQLException e) {
            System.err.println("⚠ [INCR] Falha ao obter MAX(id) de " + tabela + ": " + e.getMessage());
        }
        return 0L;
    }

    // Verifica se existe UNIQUE/PK(id)
    private static boolean hasUniqueOnId(Connection pgConn, String tabela) throws SQLException {
        String sql =
            "SELECT 1 " +
            "FROM pg_catalog.pg_index i " +
            "JOIN pg_catalog.pg_class t ON t.oid = i.indrelid " +
            "JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace " +
            "JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey) " +
            "WHERE n.nspname = ? AND t.relname = ? AND i.indisunique = TRUE " +
            "GROUP BY i.indexrelid, i.indkey " +
            "HAVING array_length(i.indkey,1) = 1 AND MIN(a.attname) = 'id'";
        try (PreparedStatement ps = pgConn.prepareStatement(sql)) {
            ps.setString(1, DST_SCHEMA);
            ps.setString(2, tabela);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    // Executa DDL (quem chama controla commit/rollback)
    private static void execDDL(Connection pgConn, String sql) throws SQLException {
        try (Statement s = pgConn.createStatement()) {
            s.execute(sql);
        }
    }

    // Validação: duplicatas por `id` em todas as tabelas que têm `id`
    private static void logDuplicatesById(Connection pgConn) throws SQLException {
        String list = "SELECT table_name FROM information_schema.columns " +
                      "WHERE table_schema=? AND column_name='id' ORDER BY table_name";
        try (PreparedStatement ps = pgConn.prepareStatement(list)) {
            ps.setString(1, DST_SCHEMA);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String t = rs.getString(1);
                    long dups = countIdDuplicates(pgConn, t);
                    if (dups > 0) {
                        System.out.println("❗ " + t + " -> duplicatas por id: " + dups);
                    } else {
                        System.out.println("✔ " + t + " -> sem duplicatas por id");
                    }
                }
            }
        }
    }

    private static long countIdDuplicates(Connection pgConn, String tabela) throws SQLException {
        String sql = "SELECT COUNT(*) - COUNT(DISTINCT id) FROM " + qi(DST_SCHEMA) + "." + qi(tabela);
        try (Statement s = pgConn.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    // Quota identificador
    private static String qi(String ident) {
        return "\"" + ident.replace("\"", "\"\"") + "\"";
        // Nota: sempre citei identificadores para lidar com case e palavras reservadas.
    }

    // Mapeia tipo do Teiid -> tipo do PostgreSQL
    private static String mapearTipoPg(String tipoTeiid) {
        if (tipoTeiid == null) return "TEXT";
        switch (tipoTeiid.toUpperCase()) {
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

    // ===== Tipos auxiliares =====
    static class Col {
        final String name;
        final String typeName;
        Col(String name, String typeName) { this.name = name; this.typeName = typeName; }
    }

    static class ColMap {
        final String srcName;  // nome na origem (Teiid)
        final String dstName;  // nome no destino (PG)
        final String typeName;
        ColMap(String srcName, String dstName, String typeName) {
            this.srcName = srcName;
            this.dstName = dstName;
            this.typeName = typeName;
        }
    }
}
