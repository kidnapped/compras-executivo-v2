import java.sql.*;
import java.nio.file.*;
import java.util.*;
import java.io.*;
import java.time.*;
import java.time.format.DateTimeFormatter;

public class CloneFinanceiroTabelaData {
    public static void main(String[] args) throws Exception {
        PrintStream log = new PrintStream(new FileOutputStream("clone_financeiro_table_size.log", true));
        System.setOut(log);
        System.setErr(log);

        System.out.println(timestamp() + " 📝 Log iniciado em: " + LocalDateTime.now());

        if (args.length != 2) {
            System.err.println("Uso: java CloneFinanceiroTabelaData <TABELA> <DATA_AAAAmmdd>");
            return;
        }

        String tabela = args[0];
        String dataStr = args[1];

        String truststorePath = "/home/ec2-user/java/daas.serpro.gov.br.jks";
        System.setProperty("javax.net.ssl.trustStore", truststorePath);
        System.setProperty("javax.net.ssl.trustStoreType", "JKS");

        System.out.println(timestamp() + " 🔌 Conectando ao Teiid...");
        Class.forName("org.teiid.jdbc.TeiidDriver");
        Connection daasConn = DriverManager.getConnection(
            "jdbc:teiid:DWTG_Colunar_Afinco@mms://daas.serpro.gov.br:31000;fetchSize=2000;socketTimeout=7200000",
            "70267715153", "t#Hlbr*tr8"
        );
        System.out.println(timestamp() + " ✅ Conectado ao Teiid.");

        System.out.println(timestamp() + " 🔌 Conectando ao PostgreSQL...");
        Class.forName("org.postgresql.Driver");
        Connection pgConn = DriverManager.getConnection(
            "jdbc:postgresql://localhost:5432/financeiro", "postgres", "postgres"
        );
        System.out.println(timestamp() + " ✅ Conectado ao PostgreSQL.");

        List<String> colunas = new ArrayList<>();
        System.out.println(timestamp() + " 📄 Obtendo metadados das colunas da tabela " + tabela);
        ResultSet rsCols = daasConn.getMetaData().getColumns(null, "DWTG_Colunar_Afinco_VBL", tabela, null);
        while (rsCols.next()) {
            colunas.add(rsCols.getString("COLUMN_NAME"));
        }
        rsCols.close();

        if (colunas.isEmpty()) {
            System.err.println(timestamp() + " ❌ Nenhuma coluna encontrada em " + tabela + " — abortando.");
            return;
        }

        boolean tabelaExiste = false;
        try (ResultSet tablesPG = pgConn.getMetaData().getTables(null, null, tabela.toLowerCase(), new String[] {"TABLE"})) {
            tabelaExiste = tablesPG.next();
        }

        if (!tabelaExiste) {
            StringBuilder createSql = new StringBuilder("CREATE TABLE " + tabela + " (");
            for (int i = 0; i < colunas.size(); i++) {
                createSql.append(colunas.get(i)).append(" TEXT");
                if (i < colunas.size() - 1) createSql.append(", ");
            }
            createSql.append(")");
            try (Statement stmtCreate = pgConn.createStatement()) {
                stmtCreate.execute(createSql.toString());
                System.out.println(timestamp() + " 🖕 Tabela " + tabela + " criada.");
            }
        }

        System.out.println(timestamp() + " 📄 Buscando registros de " + dataStr);
        String countQuery = "SELECT COUNT(*) FROM DWTG_Colunar_Afinco_VBL." + tabela + " WHERE DT_CARGA_C = '" + dataStr + "'";
        try (Statement stmtCount = daasConn.createStatement(); ResultSet rsCount = stmtCount.executeQuery(countQuery)) {
            if (rsCount.next()) {
                int total = rsCount.getInt(1);
                System.out.println(timestamp() + " 📊 Total de registros a importar: " + total);
            }
        }

        StringBuilder selectQueryBuilder = new StringBuilder("SELECT ");
        for (int i = 0; i < colunas.size(); i++) {
            selectQueryBuilder.append("CAST(").append(colunas.get(i)).append(" AS STRING)");
            if (i < colunas.size() - 1) selectQueryBuilder.append(", ");
        }
        selectQueryBuilder.append(" FROM DWTG_Colunar_Afinco_VBL.").append(tabela)
                          .append(" WHERE DT_CARGA_C = '").append(dataStr).append("'");

        Statement stmtDaaS = daasConn.createStatement(ResultSet.TYPE_SCROLL_INSENSITIVE, ResultSet.CONCUR_READ_ONLY);
        stmtDaaS.setFetchSize(50);
        ResultSet rs = stmtDaaS.executeQuery(selectQueryBuilder.toString());

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
                System.out.println(timestamp() + " 📅 " + insertCount + " registros inseridos.");
            }
        }
        if (insertCount % 500 != 0) psPG.executeBatch();
        rs.close();
        psPG.close();
        stmtDaaS.close();

        System.out.println(timestamp() + " ✅ " + insertCount + " registros inseridos em " + tabela + " para " + dataStr);
        daasConn.close();
        pgConn.close();
        System.out.println(timestamp() + " 🎉 Finalizado com sucesso.");
    }

    private static String timestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss"));
    }
}
