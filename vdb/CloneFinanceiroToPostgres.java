/*
* ───────────────────────────────────────────────────────────────────────────────
* 📄 CloneFinanceiroToPostgres.java
*
* Sincroniza tabelas do DaaS SERPRO (via Teiid) para banco local PostgreSQL,
* usando datas do campo `DT_CARGA_C`, controladas por `CloneFinanceiroToPostgres.ini`.
* A sincronização é incremental e atualiza automaticamente o arquivo de controle.
*
* 🔧 Compilação:
*   javac -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres.java
*
* ▶️ Execução em segundo plano:
*   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres </dev/null &>/dev/null & disown
*   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres --ignore-delete </dev/null &>/dev/null & disown ; tail -f CloneFinanceiroToPostgres.log
*   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres --tables WD_DOCUMENTO,WD_ORGAO </dev/null &>/dev/null & disown
*   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres --ignore-delete --tables WD_DOCUMENTO </dev/null &>/dev/null & disown
*   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres --exclude-tables WD_LOG,WD_TEMP </dev/null &>/dev/null & disown
*   nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres --ignore-delete --exclude-tables WD_LOG </dev/null &>/dev/null & disown
*
* 🎯 Parâmetros:
*   --ignore-delete: Não apaga registros existentes antes de inserir novos
*   --tables TABELA1,TABELA2: Processa apenas as tabelas especificadas (separadas por vírgula)
*                              Se não informado, processa todas as tabelas do arquivo .ini
*   --exclude-tables TABELA1,TABELA2: Exclui as tabelas especificadas do processamento
*   
*   ⚠️  IMPORTANTE: --tables e --exclude-tables são mutuamente exclusivos!
*
* 📂 Log:
*   tail -f CloneFinanceiroToPostgres.log
*
* 🛑 Parar o processo:
*   pkill -f CloneFinanceiroToPostgres
* ───────────────────────────────────────────────────────────────────────────────
*/

// Comentado para não quebrar a compilação
// nohup java -cp .:jboss-dv-6.3.0-teiid-jdbc.jar:postgresql-42.7.2.jar CloneFinanceiroToPostgres --exclude-tables WD_LOG,WD_TEMP </dev/null &>/dev/null & disown

import java.sql.*;
import java.nio.file.*;
import java.util.*;
import java.io.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

public class CloneFinanceiroToPostgres {
    
    // Classe para armazenar configurações de uma tabela
    static class TabelaConfig {
        String nome;
        LocalDate lastDtCargaC;
        List<String> columns;
        String rules;
        
        TabelaConfig(String nome) {
            this.nome = nome;
            this.columns = new ArrayList<>();
        }
    }
    
    // Classe para armazenar configurações do environment
    static class EnvironmentConfig {
        Duration lastTimeElapsed;
        LocalDateTime lastRunInitDate;
        LocalDateTime lastRunEndDate;
        String lastRunParameters;
        String lastRunStatus;
        
        EnvironmentConfig() {
            this.lastTimeElapsed = Duration.ZERO;
            this.lastRunInitDate = LocalDateTime.now();
            this.lastRunEndDate = LocalDateTime.now();
            this.lastRunParameters = "";
            this.lastRunStatus = "";
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("Iniciando CloneFinanceiroToPostgres...");
        boolean ignoreDelete = Arrays.asList(args).contains("--ignore-delete");
        
        // Capturar parâmetros da execução atual
        String parametrosExecucao = String.join(" ", args);
        
        // Declarar variáveis fora do try para serem acessíveis no catch e shutdown hook
        final Path[] tablesPathRef = new Path[1];
        final EnvironmentConfig[] envConfigRef = new EnvironmentConfig[1];
        @SuppressWarnings("unchecked")
        final Map<String, TabelaConfig>[] tabelasConfigRef = new Map[1];
        final LocalDateTime[] inicioExecucaoRef = new LocalDateTime[1];
        final AtomicBoolean normalExit = new AtomicBoolean(false);
        
        // Adicionar shutdown hook para capturar cancelamento (Ctrl+C, kill, etc.)
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try {
                if (tablesPathRef[0] == null || envConfigRef[0] == null || tabelasConfigRef[0] == null) return;
                if (normalExit.get()) return; // já finalizou normal (success/erro)
                String st = envConfigRef[0].lastRunStatus;
                if (st != null && !"running".equalsIgnoreCase(st)) return; // já setou success/erro
                System.err.println(timestamp() + " ⚠️ PROCESSO CANCELADO - Atualizando status...");
                LocalDateTime fimExecucao = LocalDateTime.now();
                envConfigRef[0].lastTimeElapsed = Duration.between(inicioExecucaoRef[0], fimExecucao);
                envConfigRef[0].lastRunInitDate = inicioExecucaoRef[0];
                envConfigRef[0].lastRunEndDate = fimExecucao;
                envConfigRef[0].lastRunParameters = parametrosExecucao;
                envConfigRef[0].lastRunStatus = "cancelled";
                atualizarArquivoConfiguracao(tablesPathRef[0], envConfigRef[0], tabelasConfigRef[0]);
                System.err.println(timestamp() + " ✅ Status atualizado para 'cancelled'");
            } catch (Exception e) {
                System.err.println(timestamp() + " ❌ Erro ao atualizar status de cancelamento: " + e.getMessage());
            }
        }));
        
        // Parse --tables parameter
        Set<String> tabelasEspecificas = null;
        for (int i = 0; i < args.length; i++) {
            if ("--tables".equals(args[i]) && i + 1 < args.length) {
                String tabelasParam = args[i + 1];
                tabelasEspecificas = new HashSet<>();
                for (String tabela : tabelasParam.split(",")) {
                    tabelasEspecificas.add(tabela.trim());
                }
                System.out.println("Tabelas especificadas: " + tabelasEspecificas);
                break;
            }
        }

        // Parse --exclude-tables parameter
        Set<String> tabelasExcluidas = null;
        for (int i = 0; i < args.length; i++) {
            if ("--exclude-tables".equals(args[i]) && i + 1 < args.length) {
                String tabelasParam = args[i + 1];
                tabelasExcluidas = new HashSet<>();
                for (String tabela : tabelasParam.split(",")) {
                    tabelasExcluidas.add(tabela.trim());
                }
                System.out.println("Tabelas excluídas: " + tabelasExcluidas);
                break;
            }
        }

        // Validar conflito entre --tables e --exclude-tables
        if (tabelasEspecificas != null && tabelasExcluidas != null) {
            System.err.println("❌ ERRO: Não é possível usar --tables e --exclude-tables ao mesmo tempo!");
            System.err.println("   Use apenas um dos parâmetros:");
            System.err.println("   --tables TABELA1,TABELA2    (processa apenas as tabelas especificadas)");
            System.err.println("   --exclude-tables TABELA1,TABELA2    (exclui as tabelas especificadas)");
            System.exit(1);
        }

        // Declarar variáveis fora do try para serem acessíveis no catch
        Path tablesPath = null;
        EnvironmentConfig envConfig = null;
        Map<String, TabelaConfig> tabelasConfig = null;

        while (true) {
            LocalDateTime inicioExecucao = LocalDateTime.now();
            inicioExecucaoRef[0] = inicioExecucao;
            try {
                // Zerar o log no início (false = sobrescrever, não append)
                PrintStream log = new PrintStream(new FileOutputStream("CloneFinanceiroToPostgres.log", false));
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

                tablesPath = Paths.get("CloneFinanceiroToPostgres.ini");
                tablesPathRef[0] = tablesPath;
                
                // Ler configurações do arquivo INI no novo formato
                envConfig = new EnvironmentConfig();
                tabelasConfig = lerArquivoConfiguracao(tablesPath, envConfig);
                
                // Atualizar referências para o shutdown hook
                envConfigRef[0] = envConfig;
                tabelasConfigRef[0] = tabelasConfig;

                // Definir status como "running" logo no início
                envConfig.lastRunParameters = parametrosExecucao;
                envConfig.lastRunStatus = "running";
                envConfig.lastRunInitDate = inicioExecucao;
                atualizarArquivoConfiguracao(tablesPath, envConfig, tabelasConfig);

                // Validar se as tabelas especificadas existem no arquivo .ini
                if (tabelasEspecificas != null) {
                    Set<String> tabelasInexistentes = new HashSet<>();
                    for (String tabelaEspecificada : tabelasEspecificas) {
                        if (!tabelasConfig.containsKey(tabelaEspecificada)) {
                            tabelasInexistentes.add(tabelaEspecificada);
                        }
                    }
                    
                    if (!tabelasInexistentes.isEmpty()) {
                        System.err.println(timestamp() + " ❌ ERRO: As seguintes tabelas especificadas em --tables não existem no arquivo .ini:");
                        for (String tabela : tabelasInexistentes) {
                            System.err.println(timestamp() + "   - " + tabela);
                        }
                        System.err.println(timestamp() + " 📋 Tabelas disponíveis no arquivo .ini:");
                        for (String tabela : tabelasConfig.keySet()) {
                            System.err.println(timestamp() + "   - " + tabela);
                        }
                        throw new IllegalArgumentException("Tabelas especificadas não encontradas no arquivo .ini");
                    }
                }

                // Validar se as tabelas excluídas existem no arquivo .ini
                if (tabelasExcluidas != null) {
                    Set<String> tabelasInexistentes = new HashSet<>();
                    for (String tabelaExcluida : tabelasExcluidas) {
                        if (!tabelasConfig.containsKey(tabelaExcluida)) {
                            tabelasInexistentes.add(tabelaExcluida);
                        }
                    }
                    
                    if (!tabelasInexistentes.isEmpty()) {
                        System.err.println(timestamp() + " ❌ ERRO: As seguintes tabelas especificadas em --exclude-tables não existem no arquivo .ini:");
                        for (String tabela : tabelasInexistentes) {
                            System.err.println(timestamp() + "   - " + tabela);
                        }
                        System.err.println(timestamp() + " 📋 Tabelas disponíveis no arquivo .ini:");
                        for (String tabela : tabelasConfig.keySet()) {
                            System.err.println(timestamp() + "   - " + tabela);
                        }
                        throw new IllegalArgumentException("Tabelas especificadas em --exclude-tables não encontradas no arquivo .ini");
                    }
                }

                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd");
                LocalDate hoje = LocalDate.now();
                LocalDate ontem = hoje.minusDays(1);

                // Informar quantas tabelas serão processadas
                int tabelasParaProcessar = 0;
                for (TabelaConfig t : tabelasConfig.values()) {
                    boolean incluir = true;
                    
                    // Verificar se deve incluir baseado em --tables
                    if (tabelasEspecificas != null) {
                        incluir = tabelasEspecificas.contains(t.nome);
                    }
                    
                    // Verificar se deve excluir baseado em --exclude-tables
                    if (tabelasExcluidas != null) {
                        incluir = !tabelasExcluidas.contains(t.nome);
                    }
                    
                    if (incluir) {
                        tabelasParaProcessar++;
                    }
                }
                
                if (tabelasEspecificas != null) {
                    System.out.println(timestamp() + " 📋 Processando " + tabelasParaProcessar + " de " + 
                        tabelasConfig.size() + " tabelas disponíveis (especificadas em --tables)");
                } else if (tabelasExcluidas != null) {
                    System.out.println(timestamp() + " 📋 Processando " + tabelasParaProcessar + " de " + 
                        tabelasConfig.size() + " tabelas disponíveis (excluindo " + tabelasExcluidas.size() + " tabelas)");
                } else {
                    System.out.println(timestamp() + " 📋 Processando todas as " + tabelasConfig.size() + " tabelas");
                }

                for (TabelaConfig tabelaConfig : tabelasConfig.values()) {
                    String tabela = tabelaConfig.nome;
                    
                    // Filtrar tabelas se --tables foi especificado
                    if (tabelasEspecificas != null && !tabelasEspecificas.contains(tabela)) {
                        System.out.println(timestamp() + " ⏭️ Pulando tabela " + tabela + " (não especificada em --tables)");
                        continue;
                    }
                    
                    // Filtrar tabelas se --exclude-tables foi especificado
                    if (tabelasExcluidas != null && tabelasExcluidas.contains(tabela)) {
                        System.out.println(timestamp() + " ⏭️ Pulando tabela " + tabela + " (excluída por --exclude-tables)");
                        continue;
                    }
                    
                    LocalDate ultimaData = tabelaConfig.lastDtCargaC;

                    if (ultimaData != null && ultimaData.equals(ontem)) {
                        System.out.println(timestamp() + " ✅ Nenhuma nova data para " + tabela + " até "
                                + ontem.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                        continue;
                    }

                    System.out.println(timestamp() + " 📂 Sincronizando: " + tabela);
                    List<String> colunas = new ArrayList<>();

                    // Verificar se columns está especificado na configuração
                    if (tabelaConfig.columns.isEmpty() || 
                        (tabelaConfig.columns.size() == 1 && "*".equals(tabelaConfig.columns.get(0)))) {
                        // Se não especificado ou "*", buscar todas as colunas
                        try {
                            System.out.println(timestamp() + " 📄 Obtendo metadados das colunas da tabela " + tabela);
                            ResultSet rsCols = daasConn.getMetaData().getColumns(null, "DWTG_Colunar_Afinco_VBL", tabela, null);
                            while (rsCols.next()) {
                                colunas.add(rsCols.getString("COLUMN_NAME"));
                            }
                            rsCols.close();
                        } catch (Exception e) {
                            System.err.println(timestamp() + " ❌ Falha ao buscar colunas da tabela " + tabela + " — pulando.");
                            e.printStackTrace();
                            continue;
                        }
                    } else {
                        // Usar colunas especificadas na configuração
                        
                        // Garantir que não há duplicatas
                        Set<String> colunasUnicas = new LinkedHashSet<>(tabelaConfig.columns);
                        colunas.addAll(colunasUnicas);
                        
                        // Garantir que DT_CARGA_C esteja sempre incluída
                        if (!colunas.contains("DT_CARGA_C")) {
                            colunas.add("DT_CARGA_C");
                            System.out.println(timestamp() + " ⚠️ Adicionando DT_CARGA_C automaticamente à lista de colunas");
                        }
                        
                        System.out.println(timestamp() + " 📄 Usando colunas especificadas: " + String.join(", ", colunas));
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
                        
                        if (ultimaData != null) {
                            System.out.println(timestamp() + " 📅 Mantendo last_dt_carga_c atual: " 
                                + ultimaData.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                        } else {
                            System.out.println(timestamp() + " ⚠️ Nenhuma data encontrada anteriormente para " + tabela);
                        }
                        
                        atualizarArquivoConfiguracao(tablesPath, envConfig, tabelasConfig);
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
                                System.out.println(timestamp() + " ℹ️  Nenhum dado local encontrado para " + datasValidas.get(0) + " em " + tabela + " — skip do DELETE.");
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
                        
                        // Aplicar regras de filtro se especificadas
                        if (tabelaConfig.rules != null && !tabelaConfig.rules.trim().isEmpty()) {
                            String filtroAdicional = converterRegraParaSQL(tabelaConfig.rules);
                            if (filtroAdicional != null && !filtroAdicional.trim().isEmpty()) {
                                selectQueryBuilder.append(" AND NOT (").append(filtroAdicional).append(")");
                                System.out.println(timestamp() + " 🔍 Aplicando filtro: " + filtroAdicional);
                            }
                        }
                        
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
                        tabelaConfig.lastDtCargaC = dataAtual;
                        // Atualizar APENAS esta tabela no INI (e ENVIRONMENT)
                        atualizarArquivoConfiguracao(tablesPath, envConfig, tabelasConfig, Collections.singleton(tabela));
                    }
                }

                daasConn.close();
                pgConn.close();
                
                // Atualizar informações do environment
                LocalDateTime fimExecucao = LocalDateTime.now();
                envConfig.lastTimeElapsed = Duration.between(inicioExecucao, fimExecucao);
                envConfig.lastRunInitDate = inicioExecucao;
                envConfig.lastRunEndDate = fimExecucao;
                envConfig.lastRunParameters = parametrosExecucao;
                envConfig.lastRunStatus = "success";
                atualizarArquivoConfiguracao(tablesPath, envConfig, tabelasConfig);
                
                System.out.println(timestamp() + " 🎉 Sincronizacao concluida com sucesso.");
                normalExit.set(true);
                break;

            } catch (Exception e) {
                System.err.println(timestamp() + " ❌ ERRO FATAL: Encerrando execução.");
                e.printStackTrace();
                
                // Atualizar status como erro
                try {
                    LocalDateTime fimExecucao = LocalDateTime.now();
                    envConfig.lastTimeElapsed = Duration.between(inicioExecucao, fimExecucao);
                    envConfig.lastRunInitDate = inicioExecucao;
                    envConfig.lastRunEndDate = fimExecucao;
                    envConfig.lastRunParameters = parametrosExecucao;
                    envConfig.lastRunStatus = "error";
                    atualizarArquivoConfiguracao(tablesPath, envConfig, tabelasConfig);
                } catch (Exception ex) {
                    System.err.println(timestamp() + " ❌ Erro adicional ao atualizar status: " + ex.getMessage());
                }
                
                String msg = e.getMessage();
                if (msg != null && msg.toLowerCase().contains("connection timed out")) {
                    System.out.println(timestamp() + " ⏳ Timeout detectado — tentando novamente em 30 segundos...");
                    Thread.sleep(30_000);
                    continue;
                }
                normalExit.set(true);
                break;
            }
        }
    }

    // Método para ler o arquivo de configuração no novo formato
    private static Map<String, TabelaConfig> lerArquivoConfiguracao(Path path, EnvironmentConfig envConfig) throws IOException {
        Map<String, TabelaConfig> tabelas = new LinkedHashMap<>();
        List<String> linhas = Files.readAllLines(path, StandardCharsets.UTF_8);
        
        TabelaConfig tabelaAtual = null;
        DateTimeFormatter lastDtCargaCFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter datetimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        for (String linha : linhas) {
            String trimmed = linha.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("#") || trimmed.startsWith(";")) continue;
            
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                String secao = trimmed.substring(1, trimmed.length() - 1);
                if ("ENVIRONMENT".equals(secao)) {
                    tabelaAtual = null; // Indica que estamos na seção environment
                } else {
                    tabelaAtual = new TabelaConfig(secao);
                    tabelas.put(secao, tabelaAtual);
                }
            } else if (trimmed.contains("=")) {
                String[] partes = trimmed.split("=", 2);
                String chave = partes[0].trim();
                String valor = partes.length > 1 ? partes[1].trim() : "";
                
                if (tabelaAtual == null) {
                    // Seção ENVIRONMENT
                    switch (chave) {
                        case "last_time_elapsed":
                            if (!valor.isEmpty()) {
                                String[] tempoPartes = valor.split(":");
                                if (tempoPartes.length >= 3) {
                                    try {
                                        long horas = Long.parseLong(tempoPartes[0]);
                                        long minutos = Long.parseLong(tempoPartes[1]);
                                        double segundos = Double.parseDouble(tempoPartes[2]);
                                        envConfig.lastTimeElapsed = Duration.ofHours(horas)
                                            .plusMinutes(minutos)
                                            .plusNanos((long)(segundos * 1_000_000_000));
                                    } catch (NumberFormatException e) {
                                        // Ignorar erro de parse
                                    }
                                }
                            }
                            break;
                        case "last_run_init_date":
                            if (!valor.isEmpty()) {
                                try {
                                    envConfig.lastRunInitDate = LocalDateTime.parse(valor, datetimeFormatter);
                                } catch (Exception e) {
                                    // Ignorar erro de parse
                                }
                            }
                            break;
                        case "last_run_end_date":
                            if (!valor.isEmpty()) {
                                try {
                                    envConfig.lastRunEndDate = LocalDateTime.parse(valor, datetimeFormatter);
                                } catch (Exception e) {
                                    // Ignorar erro de parse
                                }
                            }
                            break;
                        case "last_run_parameters":
                            envConfig.lastRunParameters = valor;
                            break;
                        case "last_run_status":
                            envConfig.lastRunStatus = valor;
                            break;
                    }
                } else {
                    // Seção de tabela
                    switch (chave) {
                        case "last_dt_carga_c":
                        case "last_run_date": // Backward compatibility
                            if (!valor.isEmpty() && valor.matches("\\d{4}-\\d{2}-\\d{2}")) {
                                try {
                                    tabelaAtual.lastDtCargaC = LocalDate.parse(valor, lastDtCargaCFormatter);
                                } catch (Exception e) {
                                    // Ignorar erro de parse
                                }
                            }
                            break;
                        case "columns":
                            if (!valor.isEmpty()) {
                                if ("*".equals(valor)) {
                                    tabelaAtual.columns.add("*");
                                } else {
                                    String[] colunas = valor.split(",");
                                    for (String col : colunas) {
                                        tabelaAtual.columns.add(col.trim());
                                    }
                                }
                            }
                            break;
                        case "rules":
                            if (!valor.isEmpty()) {
                                tabelaAtual.rules = valor;
                            }
                            break;
                    }
                }
            }
        }
        
        return tabelas;
    }
    
    // Método para converter regras do formato "if (...) skip" para SQL
    private static String converterRegraParaSQL(String regra) {
        if (regra == null || regra.trim().isEmpty()) return null;
        
        // Exemplo: "if (id_doc_dar == -9 && id_doc_darf == -9 && id_doc_gps == -9 && id_doc_ob == -9) skip"
        regra = regra.trim();
        if (regra.startsWith("if") && regra.contains("skip")) {
            int inicioCondicao = regra.indexOf('(');
            int fimCondicao = regra.lastIndexOf(')');
            if (inicioCondicao != -1 && fimCondicao != -1 && fimCondicao > inicioCondicao) {
                String condicao = regra.substring(inicioCondicao + 1, fimCondicao);
                // Converter operadores
                condicao = condicao.replace("&&", " AND ");
                condicao = condicao.replace("||", " OR ");
                condicao = condicao.replace("==", " = ");
                condicao = condicao.replace("!=", " <> ");
                return condicao;
            }
        }
        
        return null;
    }
    
    // ===== ATUALIZAÇÃO CIRÚRGICA DO INI =====

    // Wrapper: mantém assinaturas antigas atualizando apenas ENVIRONMENT
    private static void atualizarArquivoConfiguracao(Path path, EnvironmentConfig env, Map<String, TabelaConfig> tabelas) {
        atualizarArquivoConfiguracao(path, env, tabelas, null);
    }

    // Novo método: atualiza ENVIRONMENT e opcionalmente apenas as tabelas informadas
    private static void atualizarArquivoConfiguracao(Path path,
                                                        EnvironmentConfig env,
                                                        Map<String, TabelaConfig> tabelas,
                                                        Set<String> tabelasModificadas) {
        try {
            List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
            boolean changed = false;

            // Atualizar sempre ENVIRONMENT
            changed |= upsertEnvironment(lines, env);

            // Atualizar somente as tabelas pedidas
            if (tabelasModificadas != null && !tabelasModificadas.isEmpty()) {
                for (String tabela : tabelasModificadas) {
                    TabelaConfig cfg = tabelas.get(tabela);
                    if (cfg != null && cfg.lastDtCargaC != null) {
                        changed |= upsertTableLastDt(lines, tabela, cfg.lastDtCargaC);
                    }
                }
            }

            if (changed) {
                Files.write(path, lines, StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            System.err.println(timestamp() + " ❌ Erro ao atualizar INI: " + e.getMessage());
        }
    }

    private static boolean upsertEnvironment(List<String> lines, EnvironmentConfig env) {
        boolean anyChange = false;
        int[] range = findSectionRange(lines, "ENVIRONMENT");
        if (range == null) return false;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // Sempre atualizar no início: init/params/status
        anyChange |= upsertKeyInRange(lines, range, "last_run_init_date", "last_run_init_date = " + env.lastRunInitDate.format(dtf));
        anyChange |= upsertKeyInRange(lines, range, "last_run_parameters", "last_run_parameters = " + (env.lastRunParameters == null ? "" : env.lastRunParameters));
        anyChange |= upsertKeyInRange(lines, range, "last_run_status", "last_run_status = " + (env.lastRunStatus == null ? "" : env.lastRunStatus));

        // Atualizar end/elapsed só quando não está 'running'
        if (!"running".equalsIgnoreCase(env.lastRunStatus)) {
            anyChange |= upsertKeyInRange(lines, range, "last_run_end_date", "last_run_end_date = " + env.lastRunEndDate.format(dtf));
            long totalSeconds = env.lastTimeElapsed.getSeconds();
            long hours = totalSeconds / 3600;
            long minutes = (totalSeconds % 3600) / 60;
            long seconds = totalSeconds % 60;
            long nanos = env.lastTimeElapsed.getNano();
            double fractionalSeconds = seconds + (nanos / 1_000_000_000.0);
            String elapsed = String.format("last_time_elapsed = %02d:%02d:%09.6f", hours, minutes, fractionalSeconds);
            anyChange |= upsertKeyInRange(lines, range, "last_time_elapsed", elapsed);
        }

        return anyChange;
    }

    private static boolean upsertTableLastDt(List<String> lines, String section, LocalDate date) {
        int[] range = findSectionRange(lines, section);
        if (range == null) return false;

        String newLine = "last_dt_carga_c = " + date.toString(); // yyyy-MM-dd
        // Substituir last_dt_carga_c se existir
        int idx = findKeyIndexInRange(lines, range, "last_dt_carga_c");
        if (idx >= 0) {
            if (!lines.get(idx).trim().equals(newLine)) {
                lines.set(idx, newLine);
                return true;
            }
            return false;
        }
        // Substituir legacy last_run_date se existir
        idx = findKeyIndexInRange(lines, range, "last_run_date");
        if (idx >= 0) {
            if (!lines.get(idx).trim().equals(newLine)) {
                lines.set(idx, newLine);
                return true;
            }
            return false;
        }
        // Inserir logo após o cabeçalho da seção
        lines.add(range[0] + 1, newLine);
        return true;
    }

    private static int[] findSectionRange(List<String> lines, String sectionName) {
        int start = -1;
        for (int i = 0; i < lines.size(); i++) {
            String t = lines.get(i).trim();
            if (t.startsWith("[") && t.endsWith("]")) {
                String sec = t.substring(1, t.length() - 1);
                if (sec.equals(sectionName)) {
                    start = i;
                    break;
                }
            }
        }
        if (start == -1) return null;
        int end = lines.size();
        for (int j = start + 1; j < lines.size(); j++) {
            String t = lines.get(j).trim();
            if (t.startsWith("[") && t.endsWith("]")) {
                end = j;
                break;
            }
        }
        return new int[]{start, end}; // [inclusiveHeaderIndex, exclusiveEnd]
    }

    private static int findKeyIndexInRange(List<String> lines, int[] range, String key) {
        for (int i = range[0] + 1; i < range[1]; i++) {
            String t = lines.get(i).trim();
            if (t.startsWith(key) && t.contains("=")) {
                return i;
            }
        }
        return -1;
    }

    private static boolean upsertKeyInRange(List<String> lines, int[] range, String key, String fullLine) {
        int idx = findKeyIndexInRange(lines, range, key);
        if (idx >= 0) {
            if (!lines.get(idx).trim().equals(fullLine)) {
                lines.set(idx, fullLine);
                return true;
            }
            return false;
        }
        // Inserir chave ausente logo após o header da seção
        lines.add(range[0] + 1, fullLine);
        return true;
    }

    private static String timestamp() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("uuuu-MM-dd HH:mm:ss"));
    }
}
