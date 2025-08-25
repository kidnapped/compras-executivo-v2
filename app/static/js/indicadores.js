export default {
  // Variáveis para controlar execuções múltiplas
  lastAutoInitTime: 0,
  lastInitCompleteTime: 0,
  isInitializing: false,
  isInitializingComplete: false,

  // Método único para inicialização completa via SPA
  indicadores_initComplete() {
    console.log("🔧 indicadores_initComplete() chamado via SPA");

    // Evitar execução dupla - usar controle separado do autoInit
    const now = Date.now();
    if (now - this.lastInitCompleteTime < 800) {
      console.log(
        "⚠️ indicadores_initComplete() ignorado - muito recente (debounce)"
      );
      return;
    }

    // Evitar sobreposição de execuções
    if (this.isInitializingComplete) {
      console.log(
        "⚠️ indicadores_initComplete() ignorado - já está inicializando"
      );
      return;
    }

    this.lastInitCompleteTime = now;
    this.isInitializingComplete = true;

    // Verifica se estamos na página correta
    const indicadoresPage = document.querySelector(".indicadores-page");
    console.log("🔍 Elemento .indicadores-page encontrado:", !!indicadoresPage);

    if (indicadoresPage) {
      console.log(
        "✅ Página de indicadores detectada - iniciando componentes..."
      );

      setTimeout(() => {
        console.log("🔧 Inicializando componentes dos indicadores...");

        try {
          // Initialize modal manager if not already available
          if (!window.App) window.App = {};

          // Create a simple fallback modal manager immediately
          if (!window.App.modalManager) {
            window.App.modalManager = this.createSimpleModalManager();
          }

          // Try to load the advanced modal manager asynchronously
          const ensureModalManager = async () => {
            try {
              const modalManagerModule = await import(
                "./common/modal-manager.js"
              );
              window.App.modalManager = modalManagerModule.default;
              window.App.modalManager.initialize();
              console.log(
                "✅ Advanced modal manager carregado para indicadores"
              );
            } catch (error) {
              console.warn(
                "⚠️ Falha ao carregar modal manager avançado, usando versão simples:",
                error
              );
            }
          };

          // Load advanced modal manager in background
          ensureModalManager();

          this.indicadores_initBreadcrumb();
          this.initTopicoVisaoGeral();
          this.initTopicoAnaliseProcessos();
          this.initTopicoFornecedoresContratantes();
          this.initTopicoDistribuicaoGeografica();
          this.initTopicoAnaliseTemporal();
          this.initTopicoMetodosEficiencia();
          this.initTopicoAnaliseFinanceira();
          this.initTopicoInsightsExecutivos();
          this.indicadores_init();

          console.log(
            "✅ Todos os componentes dos indicadores foram inicializados!"
          );
        } catch (error) {
          console.error(
            "❌ Erro ao inicializar componentes dos indicadores:",
            error
          );
        } finally {
          this.isInitializingComplete = false;
        }
      }, 100);
    } else {
      console.log(
        "⚠️ Página de indicadores não detectada - elemento .indicadores-page não encontrado"
      );
      this.isInitializingComplete = false;
    }
  },

  // Método para inicialização automática quando o módulo é carregado
  autoInit() {
    console.log("🔧 Indicadores.autoInit() chamado");

    // Evitar execuções múltiplas muito próximas (debounce de 1 segundo)
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log("⚠️ autoInit() ignorado - muito recente (debounce)");
      return;
    }

    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log("⚠️ autoInit() ignorado - já está inicializando");
      return;
    }

    this.lastAutoInitTime = now;
    this.isInitializing = true;

    // Função para verificar e inicializar
    const checkAndInit = () => {
      // Verifica se estamos na página correta procurando pelo elemento principal
      const indicadoresPage = document.querySelector(".indicadores-page");
      console.log(
        "🔍 Elemento .indicadores-page encontrado:",
        !!indicadoresPage
      );
      console.log("🔍 Pathname atual:", window.location.pathname);

      // Também verificar pela URL se o elemento não foi encontrado ainda
      const isIndicadoresRoute =
        window.location.pathname.includes("/indicadores");
      console.log("🔍 É rota de indicadores:", isIndicadoresRoute);

      if (indicadoresPage || isIndicadoresRoute) {
        console.log(
          "✅ Página de indicadores detectada - iniciando componentes..."
        );

        // Se encontrou o elemento ou está na rota correta, inicializa automaticamente
        setTimeout(() => {
          console.log("🔧 Inicializando componentes dos indicadores...");

          try {
            this.indicadores_initBreadcrumb();
            this.initTopicoVisaoGeral();
            this.initTopicoAnaliseProcessos();
            this.initTopicoFornecedoresContratantes();
            this.initTopicoDistribuicaoGeografica();
            this.initTopicoAnaliseTemporal();
            this.initTopicoMetodosEficiencia();
            this.initTopicoAnaliseFinanceira();
            this.initTopicoInsightsExecutivos();
            this.indicadores_init();

            console.log(
              "✅ Todos os componentes dos indicadores foram inicializados!"
            );
          } catch (error) {
            console.error(
              "❌ Erro ao inicializar componentes dos indicadores:",
              error
            );
          } finally {
            this.isInitializing = false;
          }
        }, 100); // Pequeno delay para garantir que todos os elementos estejam carregados
      } else {
        console.log("⚠️ Página de indicadores não detectada ainda");
        this.isInitializing = false;

        // Se não encontrou ainda, tentar novamente após um tempo
        setTimeout(() => {
          if (window.location.pathname.includes("/indicadores")) {
            console.log(
              "🔄 Tentando novamente a inicialização de indicadores..."
            );
            this.autoInit();
          }
        }, 500);
      }
    };

    // Executar verificação
    checkAndInit();
  },

  // Nova função para inicializar o breadcrumb dinamicamente
  indicadores_initBreadcrumb() {
    console.log("🔧 Inicializando breadcrumb dos indicadores...");

    // Verifica se o módulo breadcrumb está disponível
    if (
      typeof App !== "undefined" &&
      App.breadcrumb &&
      App.breadcrumb.breadcrumb_createDynamic
    ) {
      const breadcrumbItems = [
        { title: "Página Inicial", icon: "fas fa-home", url: "/minha-conta" },
        { title: "Indicadores", icon: "fas fa-tachometer-alt", url: "" },
      ];

      App.breadcrumb.breadcrumb_createDynamic(
        breadcrumbItems,
        "indicadores-breadcrumb-dynamic-container"
      );
      console.log("✅ Breadcrumb Indicadores initialized dynamically");
    } else {
      console.warn(
        "❌ Breadcrumb module not available - App:",
        typeof App,
        "breadcrumb:",
        App?.breadcrumb ? "exists" : "missing"
      );
      console.warn("⏳ Retrying in 500ms...");
      // Retry after a short delay if breadcrumb is not available yet
      setTimeout(() => {
        this.indicadores_initBreadcrumb();
      }, 500);
    }
  },

  // Nova função para inicializar o tópico de visão geral dinamicamente
  initTopicoVisaoGeral() {
    console.log("🔧 Inicializando tópico Visão Geral...");

    // Verifica se o módulo topico está disponível
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Visão Geral dos Contratos",
        description: "Panorama executivo dos indicadores principais",
        icon: "fas fa-chart-line",
        tags: [
          {
            text: "Atualizado",
            type: "success",
            icon: "fas fa-sync-alt",
            title: "Dados sincronizados hoje",
          },
        ],
        actions: [
          {
            icon: "fas fa-filter",
            text: "Filtros",
            title: "Configurar filtros de visualização",
            onclick: "App.indicadores.indicadores_showFilters()",
            type: "secondary",
          },
          {
            icon: "fas fa-cog",
            text: "Configurar",
            title: "Configurações do dashboard",
            onclick: "App.indicadores.indicadores_showSettings()",
            type: "secondary",
          },
        ],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-visao-geral-container"
      );
      console.log("✅ Topico Visão Geral initialized dynamically");
    } else {
      console.warn(
        "❌ Topico module not available - App:",
        typeof App,
        "topico:",
        App?.topico ? "exists" : "missing"
      );
      console.warn("⏳ Retrying in 500ms...");
      // Retry after a short delay if topico is not available yet
      setTimeout(() => {
        this.initTopicoVisaoGeral();
      }, 500);
    }
  },

  // SEÇÃO 2: WHY - Análise de Processos
  initTopicoAnaliseProcessos() {
    // Verifica se o módulo topico está disponível
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Análise de Processos",
        description: "Entenda os motivos e padrões das contratações",
        icon: "fas fa-search",
        tags: [
          {
            text: "Processos",
            type: "warning",
            icon: "fas fa-cogs",
            title: "Análise de processos licitatórios",
          },
        ],
        actions: [
          {
            icon: "fas fa-filter",
            text: "Filtros",
            title: "Configurar filtros de análise",
            onclick:
              "App.indicadores.indicadores_showFiltersAnaliseProcessos()",
            type: "secondary",
          },
          {
            icon: "fas fa-cog",
            text: "Configurar",
            title: "Configurações da análise",
            onclick:
              "App.indicadores.indicadores_showSettingsAnaliseProcessos()",
            type: "secondary",
          },
        ],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-analise-processos-container"
      );
      console.log("Topico Análise de Processos initialized dynamically");
    } else {
      console.warn("Topico module not available - retrying in 500ms");
      // Retry after a short delay if topico is not available yet
      setTimeout(() => {
        this.initTopicoAnaliseProcessos();
      }, 500);
    }
  },

  // SEÇÃO 3: WHO - Fornecedores e Contratantes
  initTopicoFornecedoresContratantes() {
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Fornecedores e Contratantes",
        description: "Perfil dos principais atores nas contratações",
        icon: "fas fa-users",
        tags: [
          {
            text: "Atores",
            type: "info",
            icon: "fas fa-handshake",
            title: "Análise de fornecedores e contratantes",
          },
        ],
        actions: [],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-fornecedores-contratantes-container"
      );
      console.log("Topico Fornecedores e Contratantes initialized dynamically");
    } else {
      setTimeout(() => {
        this.initTopicoFornecedoresContratantes();
      }, 500);
    }
  },

  // SEÇÃO 4: WHERE - Distribuição Geográfica
  initTopicoDistribuicaoGeografica() {
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Distribuição Geográfica",
        description: "Localização e concentração das contratações",
        icon: "fas fa-map-marked-alt",
        tags: [
          {
            text: "Geografia",
            type: "primary",
            icon: "fas fa-globe-americas",
            title: "Distribuição territorial",
          },
        ],
        actions: [],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-distribuicao-geografica-container"
      );
      console.log("Topico Distribuição Geográfica initialized dynamically");
    } else {
      setTimeout(() => {
        this.initTopicoDistribuicaoGeografica();
      }, 500);
    }
  },

  // SEÇÃO 5: WHEN - Análise Temporal
  initTopicoAnaliseTemporal() {
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Análise Temporal",
        description: "Cronogramas, prazos e tendências temporais",
        icon: "fas fa-calendar-alt",
        tags: [
          {
            text: "Temporal",
            type: "secondary",
            icon: "fas fa-clock",
            title: "Análise de prazos e cronogramas",
          },
        ],
        actions: [],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-analise-temporal-container"
      );
      console.log("Topico Análise Temporal initialized dynamically");
    } else {
      setTimeout(() => {
        this.initTopicoAnaliseTemporal();
      }, 500);
    }
  },

  // SEÇÃO 6: HOW - Métodos e Eficiência
  initTopicoMetodosEficiencia() {
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Métodos e Eficiência",
        description: "Processos, modalidades e qualidade da execução",
        icon: "fas fa-cogs",
        tags: [
          {
            text: "Eficiência",
            type: "success",
            icon: "fas fa-tachometer-alt",
            title: "Indicadores de eficiência processual",
          },
        ],
        actions: [],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-metodos-eficiencia-container"
      );
      console.log("Topico Métodos e Eficiência initialized dynamically");
    } else {
      setTimeout(() => {
        this.initTopicoMetodosEficiencia();
      }, 500);
    }
  },

  // SEÇÃO 7: HOW MUCH - Análise Financeira
  initTopicoAnaliseFinanceira() {
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Análise Financeira",
        description: "Valores, custos e impacto econômico das contratações",
        icon: "fas fa-dollar-sign",
        tags: [
          {
            text: "Financeiro",
            type: "success",
            icon: "fas fa-chart-bar",
            title: "Análise de valores e custos",
          },
        ],
        actions: [],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-analise-financeira-container"
      );
      console.log("Topico Análise Financeira initialized dynamically");
    } else {
      setTimeout(() => {
        this.initTopicoAnaliseFinanceira();
      }, 500);
    }
  },

  // SEÇÃO 8: INSIGHTS EXECUTIVOS
  initTopicoInsightsExecutivos() {
    if (
      typeof App !== "undefined" &&
      App.topico &&
      App.topico.topico_createDynamic
    ) {
      const topicoConfig = {
        title: "Insights e Recomendações",
        description: "Análise estratégica e sugestões de melhorias",
        icon: "fas fa-lightbulb",
        tags: [
          {
            text: "Estratégico",
            type: "warning",
            icon: "fas fa-brain",
            title: "Insights e recomendações executivas",
          },
        ],
        actions: [],
      };

      App.topico.topico_createDynamic(
        topicoConfig,
        "indicadores-topico-insights-executivos-container"
      );
      console.log("Topico Insights Executivos initialized dynamically");
    } else {
      setTimeout(() => {
        this.initTopicoInsightsExecutivos();
      }, 500);
    }
  },

  // Função para inicializar o mapa do Brasil
  async indicadores_initMapaBrasil() {
    try {
      const containerId = "indicadoresMapaEstadosContent";
      console.log("Iniciando carregamento do mapa do Brasil...");

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn("Container do mapa não encontrado:", containerId);
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Não substitui o loading - apenas aguarda um pouco para que seja visível
      // O loading já foi definido em indicadores_fillCardContent()

      console.log("Aguardando delay para visualização do loading...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados do mapa...");

      // Buscar dados do mapa
      const response = await fetch("/indicadores/mapa-estados");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o mapa
      const mapData = (data.estados || []).map((estado) => ({
        name: estado.uf,
        value: Number(estado.total_contratos) || 0,
      }));

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      // Verificar se brazilStatesGeoJson está disponível no window
      if (typeof window.brazilStatesGeoJson === "undefined") {
        throw new Error(
          "Dados geográficos do Brasil não estão disponíveis no window"
        );
      } // Criar container para o mapa
      container.innerHTML = `
        <div class="mapa-estados-container">
          <div id="mapa-estados-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("mapa-estados-chart");

      // Registrar o mapa do Brasil
      echarts.registerMap("BR", window.brazilStatesGeoJson);

      // Criar mapeamento de siglas para nomes completos a partir do próprio GeoJSON
      const estadosNomes = {};
      if (window.brazilStatesGeoJson && window.brazilStatesGeoJson.features) {
        window.brazilStatesGeoJson.features.forEach((feature) => {
          if (
            feature.properties &&
            feature.properties.PK_sigla &&
            feature.properties.Estado
          ) {
            estadosNomes[feature.properties.PK_sigla] =
              feature.properties.Estado;
          }
        });
      }

      // Calcular valores min/max
      const valuesArray = mapData.map((d) => d.value);
      const minValue = valuesArray.length ? Math.min(...valuesArray) : 0;
      const maxValue = valuesArray.length ? Math.max(...valuesArray) : 0;

      // Configuração do mapa
      const mapOption = {
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#5F70A5",
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: "Rawline, Arial, sans-serif",
          },
          formatter: (params) => {
            const nomeCompleto = estadosNomes[params.name] || params.name;
            const valor =
              typeof params.value === "number" && !isNaN(params.value)
                ? params.value.toLocaleString("pt-BR")
                : "0";

            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${nomeCompleto}
              </div>
              <div class="indicadores-tooltip-value">
                <span class="indicadores-tooltip-number">${valor}</span> contratos
              </div>
            </div>`;
          },
        },
        visualMap: {
          min: minValue,
          max: maxValue,
          left: "left",
          top: "top",
          text: ["Alto", "Baixo"],
          inRange: {
            color: ["#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
          },
          calculable: true,
        },
        series: [
          {
            name: "Contratos por Estado",
            type: "map",
            map: "BR",
            nameProperty: "PK_sigla",
            roam: true,
            scaleLimit: {
              min: 0.8,
              max: 3.0,
            },
            aspectScale: 0.9,
            zoom: 1.3,
            center: [-55, -15],
            label: {
              show: true,
              fontSize: 8,
              color: "#000",
              formatter: (params) => `${params.name}\n${params.value || 0}`,
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 10,
                fontWeight: "bold",
              },
            },
            data: mapData,
          },
        ],
      };

      // Inicializar o chart
      const chart = echarts.init(chartDiv);
      chart.setOption(mapOption);

      // Listener para redimensionamento
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (chart && !chart.isDisposed()) {
            chart.resize();
          }
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts[containerId] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log("Mapa do Brasil inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar mapa do Brasil:", error);
      const container = document.getElementById(
        "indicadoresMapaEstadosContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o mapa: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico de contratos por região
  async indicadores_initGraficoRegiao() {
    try {
      const containerId = "indicadoresPorRegiaoContent";
      console.log("Iniciando carregamento do gráfico de regiões...");

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(
          "Container do gráfico de regiões não encontrado:",
          containerId
        );
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados das regiões...");

      // Buscar dados das regiões
      const response = await fetch("/indicadores/contratos-por-regiao");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o gráfico
      const chartData = (data.regioes || []).map((regiao) => ({
        name: regiao.regiao,
        value: Number(regiao.total_contratos) || 0,
      }));

      console.log("Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado regional encontrado
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      console.log(
        "ECharts disponível, versão:",
        echarts.version || "desconhecida"
      );

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-grafico-regiao-container">
          <div id="indicadores-grafico-regiao-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById(
        "indicadores-grafico-regiao-chart"
      );

      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error("Elemento do gráfico não foi criado corretamente");
      }

      console.log(
        "Container do gráfico criado:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      // Aguardar o DOM estar totalmente renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn(
          "Container tem dimensões inválidas, tentando forçar layout..."
        );
        chartDiv.style.width = "100%";
        chartDiv.style.height = "380px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Configuração do gráfico de barras horizontais
      const chartOption = {
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#5F70A5",
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: "Rawline, Arial, sans-serif",
          },
          axisPointer: {
            type: "shadow",
          },
          formatter: (params) => {
            const data = params[0];
            const valor =
              typeof data.value === "number" && !isNaN(data.value)
                ? data.value.toLocaleString("pt-BR")
                : "0";

            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${data.name}
              </div>
              <div class="indicadores-tooltip-value">
                <span class="indicadores-tooltip-number">${valor}</span> contratos
              </div>
            </div>`;
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          top: "5%",
          containLabel: true,
        },
        xAxis: {
          type: "value",
          axisLabel: {
            formatter: (value) => value.toLocaleString("pt-BR"),
            fontSize: 11,
          },
        },
        yAxis: {
          type: "category",
          data: chartData.map((item) => item.name),
          axisLabel: {
            fontSize: 12,
            fontWeight: "bold",
          },
        },
        series: [
          {
            name: "Contratos por Região",
            type: "bar",
            data: chartData.map((item) => ({
              name: item.name,
              value: item.value,
            })),
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: (params) => {
                // Cores ordenadas da mais escura para a mais clara
                const colors = [
                  "#8B9ED6",
                  "#A2B2E3",
                  "#B9C6ED",
                  "#D0D9F6",
                  "#E5EBFB",
                ];
                return colors[params.dataIndex % colors.length];
              },
            },
            label: {
              show: true,
              position: "right",
              formatter: (params) => params.value.toLocaleString("pt-BR"),
              fontSize: 11,
              fontWeight: "bold",
              color: "#333",
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
        backgroundColor: "transparent",
      };

      // Inicializar o chart
      console.log("Inicializando gráfico ECharts...", chartData);
      console.log(
        "Dimensões finais do container:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      const chart = echarts.init(chartDiv);

      // Verificar se o chart foi inicializado
      if (!chart) {
        throw new Error("Falha ao inicializar o gráfico ECharts");
      }

      console.log("Aplicando configurações do gráfico...");
      chart.setOption(chartOption);

      // Forçar o redimensionamento inicial com múltiplas tentativas
      setTimeout(() => {
        chart.resize();
        console.log("Gráfico redimensionado (1ª tentativa)");
      }, 100);

      setTimeout(() => {
        chart.resize();
        console.log("Gráfico redimensionado (2ª tentativa)");
      }, 500);

      // Listener para redimensionamento
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (chart && !chart.isDisposed()) {
            chart.resize();
          }
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts[containerId] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log("Gráfico de regiões inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar gráfico de regiões:", error);
      const container = document.getElementById("indicadoresPorRegiaoContent");
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de regiões: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico de barras de tipos de contrato
  async indicadores_initGraficoSemLicitacao() {
    try {
      const containerId = "indicadoresSemLicitacaoContent";
      console.log(
        "Iniciando carregamento do gráfico de tipos de contrato..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(
          "Container do gráfico de tipos de contrato não encontrado:",
          containerId
        );
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados dos tipos de contrato...");

      // Buscar dados dos tipos de contrato
      const response = await fetch("/indicadores/contratos-por-tipo");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o gráfico donut
      const chartData = (data.tipos_contratacao || []).map((tipo) => ({
        name: tipo.tipo,
        value: Number(tipo.total_contratos) || 0,
      }));

      console.log("Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum tipo de contrato encontrado
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      console.log(
        "ECharts disponível, versão:",
        echarts.version || "desconhecida"
      );

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-exercicio-container">
          <div id="indicadores-sem-licitacao-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById(
        "indicadores-sem-licitacao-chart"
      );

      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error("Elemento do gráfico não foi criado corretamente");
      }

      console.log(
        "Container do gráfico criado:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      // Aguardar o DOM estar totalmente renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn(
          "Container tem dimensões inválidas, tentando forçar layout..."
        );
        chartDiv.style.width = "100%";
        chartDiv.style.height = "250px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error("Elemento do gráfico não foi criado corretamente");
      }

      console.log(
        "Container do gráfico criado:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      // Aguardar o DOM estar totalmente renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn(
          "Container tem dimensões inválidas, tentando forçar layout..."
        );
        chartDiv.style.width = "100%";
        chartDiv.style.height = "250px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Preparar dados para o gráfico de barras
      const chartLabels = chartData.map((item) => item.name);
      const chartValues = chartData.map((item) => item.value);

      // Cores para o gráfico de barras
      const colors = ["#1351B4", "#0E4B99", "#5F70A5", "#8B9ED6", "#A2B2E3"];

      // Configuração do gráfico de barras
      const chartOption = {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#1351B4",
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          formatter: (params) => {
            if (params && params.length > 0) {
              const param = params[0];
              const valor =
                typeof param.value === "number" && !isNaN(param.value)
                  ? param.value.toLocaleString("pt-BR")
                  : "0";

              return `<div class="indicadores-tooltip">
                <div class="indicadores-tooltip-title">
                  ${param.axisValue}
                </div>
                <div class="indicadores-tooltip-value">
                  <span class="indicadores-tooltip-number">${valor}</span> contratos
                </div>
              </div>`;
            }
            return "";
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          top: "8%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: chartLabels,
          axisLabel: {
            rotate: 45,
            fontSize: 10,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
            interval: 0, // Show all labels
          },
          axisLine: {
            lineStyle: {
              color: "#e0e0e0",
            },
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
        series: [
          {
            name: "Contratos por Tipo",
            type: "bar",
            data: chartValues.map((value, index) => ({
              value: value,
              itemStyle: {
                color: colors[index % colors.length],
                borderRadius: [4, 4, 0, 0],
              },
            })),
            barMaxWidth: 40,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
          },
        ],
        backgroundColor: "transparent",
      };

      // Inicializar o chart
      console.log("Inicializando gráfico de barras ECharts...", chartData);
      console.log(
        "Dimensões finais do container:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      const chart = echarts.init(chartDiv);

      // Verificar se o chart foi inicializado
      if (!chart) {
        throw new Error("Falha ao inicializar o gráfico ECharts");
      }

      console.log("Aplicando configurações do gráfico...");
      chart.setOption(chartOption);

      // Forçar o redimensionamento inicial com múltiplas tentativas
      setTimeout(() => {
        if (chart && !chart.isDisposed()) {
          chart.resize();
          console.log("Gráfico de barras redimensionado (1ª tentativa)");
        }
      }, 100);

      setTimeout(() => {
        if (chart && !chart.isDisposed()) {
          chart.resize();
          console.log("Gráfico de barras redimensionado (2ª tentativa)");
        }
      }, 500);

      // Listener para redimensionamento
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (chart && !chart.isDisposed()) {
            chart.resize();
          }
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts[containerId] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log(
        "Gráfico de barras de tipos de contrato inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "Erro ao inicializar gráfico de barras de tipos de contrato:",
        error
      );
      const container = document.getElementById(
        "indicadoresSemLicitacaoContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de barras de tipos de contrato: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico donut de contratos com aditivos
  async indicadores_initGraficoComAditivos() {
    try {
      const containerId = "indicadoresComAditivosContent";
      console.log(
        "Iniciando carregamento do gráfico de contratos com aditivos..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(
          "Container do gráfico com aditivos não encontrado:",
          containerId
        );
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados dos contratos com aditivos...");

      // Buscar dados dos contratos com aditivos
      const response = await fetch("/indicadores/contratos-com-aditivos");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o gráfico donut
      const chartData = (data.tipos_contratacao || []).map((tipo) => ({
        name: tipo.tipo,
        value: Number(tipo.total_contratos) || 0,
      }));

      console.log("Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado de aditivos encontrado
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      console.log(
        "ECharts disponível, versão:",
        echarts.version || "desconhecida"
      );

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-com-aditivos-container">
          <div id="indicadores-com-aditivos-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById(
        "indicadores-com-aditivos-chart"
      );

      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error("Elemento do gráfico não foi criado corretamente");
      }

      console.log(
        "Container do gráfico criado:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      // Aguardar o DOM estar totalmente renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn(
          "Container tem dimensões inválidas, tentando forçar layout..."
        );
        chartDiv.style.width = "100%";
        chartDiv.style.height = "250px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Cores para o gráfico donut (tons de laranja esmaecidos, seguindo o padrão dos azuis)
      const colors = ["#D2691E", "#F4A460", "#FFB347", "#FFDAB9", "#FFF8DC"];

      // Configuração do gráfico donut
      const chartOption = {
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#D2691E",
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: "Rawline, Arial, sans-serif",
          },
          formatter: (params) => {
            const valor =
              typeof params.value === "number" && !isNaN(params.value)
                ? params.value.toLocaleString("pt-BR")
                : "0";
            const percentual =
              typeof params.percent === "number" && !isNaN(params.percent)
                ? params.percent.toFixed(1)
                : "0.0";

            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${params.name}
              </div>
              <div class="indicadores-tooltip-value">
                <span class="indicadores-tooltip-number">${valor}</span> contratos
                <br>
                <span class="indicadores-tooltip-percent">${percentual}%</span> do total
              </div>
            </div>`;
          },
        },
        legend: {
          bottom: "5%",
          left: "center",
          textStyle: {
            fontSize: 11,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          itemGap: 15,
        },
        series: [
          {
            name: "Contratos por Tipo de Aditivo",
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: false,
                fontSize: 16,
                fontWeight: "bold",
                color: "#D2691E",
                formatter: (params) => {
                  const valor =
                    typeof params.value === "number" && !isNaN(params.value)
                      ? params.value.toLocaleString("pt-BR")
                      : "0";
                  return `${params.name}\n${valor}`;
                },
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
            labelLine: {
              show: false,
            },
            data: chartData.map((item, index) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: colors[index % colors.length],
              },
            })),
          },
        ],
        backgroundColor: "transparent",
      };

      // Inicializar o chart
      console.log("Inicializando gráfico donut ECharts...", chartData);
      console.log(
        "Dimensões finais do container:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      const chart = echarts.init(chartDiv);

      // Verificar se o chart foi inicializado
      if (!chart) {
        throw new Error("Falha ao inicializar o gráfico ECharts");
      }

      console.log("Aplicando configurações do gráfico...");
      chart.setOption(chartOption);

      // Forçar o redimensionamento inicial com múltiplas tentativas
      setTimeout(() => {
        chart.resize();
        console.log("Gráfico donut aditivos redimensionado (1ª tentativa)");
      }, 100);

      setTimeout(() => {
        chart.resize();
        console.log("Gráfico donut aditivos redimensionado (2ª tentativa)");
      }, 500);

      // Listener para redimensionamento
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (chart && !chart.isDisposed()) {
            chart.resize();
          }
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts[containerId] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log(
        "Gráfico donut de contratos com aditivos inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "Erro ao inicializar gráfico de contratos com aditivos:",
        error
      );
      const container = document.getElementById(
        "indicadoresComAditivosContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de contratos com aditivos: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico donut de contratos por área/categoria
  async indicadores_initGraficoPorArea() {
    try {
      const containerId = "indicadoresPorAreaContent";
      console.log("Iniciando carregamento do gráfico de contratos por área...");

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(
          "Container do gráfico por área não encontrado:",
          containerId
        );
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados dos contratos por área...");

      // Buscar dados dos contratos por área
      const response = await fetch("/indicadores/contratos-por-area");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o gráfico donut
      const chartData = (data.categorias || []).map((categoria) => ({
        name: categoria.categoria_nome,
        value: Number(categoria.total_contratos) || 0,
      }));

      console.log("Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado de contratos por área encontrado
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      console.log(
        "ECharts disponível, versão:",
        echarts.version || "desconhecida"
      );

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-por-area-container">
          <div id="indicadores-por-area-chart chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("indicadores-por-area-chart");

      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error("Elemento do gráfico não foi criado corretamente");
      }

      console.log(
        "Container do gráfico criado:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      // Aguardar o DOM estar totalmente renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn(
          "Container tem dimensões inválidas, tentando forçar layout..."
        );
        chartDiv.style.width = "100%";
        chartDiv.style.height = "250px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Cores para o gráfico donut (tons de verde esmaecidos, seguindo o padrão dos azuis e laranjas)
      const colors = [
        "#228B22",
        "#32CD32",
        "#90EE90",
        "#98FB98",
        "#F0FFF0",
        "#8FBC8F",
        "#9ACD32",
        "#ADFF2F",
        "#7CFC00",
        "#7FFF00",
      ];

      // Configuração do gráfico donut
      const chartOption = {
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#228B22",
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: "Rawline, Arial, sans-serif",
          },
          formatter: (params) => {
            const valor =
              typeof params.value === "number" && !isNaN(params.value)
                ? params.value.toLocaleString("pt-BR")
                : "0";
            const percentual =
              typeof params.percent === "number" && !isNaN(params.percent)
                ? params.percent.toFixed(1)
                : "0.0";

            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${params.name}
              </div>
              <div class="indicadores-tooltip-value">
                <span class="indicadores-tooltip-number">${valor}</span> contratos
                <br>
                <span class="indicadores-tooltip-percent">${percentual}%</span> do total
              </div>
            </div>`;
          },
        },
        legend: {
          bottom: "5%",
          left: "center",
          textStyle: {
            fontSize: 11,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          itemGap: 15,
        },
        series: [
          {
            name: "Contratos por Área/Categoria",
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: false,
                fontSize: 16,
                fontWeight: "bold",
                color: "#228B22",
                formatter: (params) => {
                  const valor =
                    typeof params.value === "number" && !isNaN(params.value)
                      ? params.value.toLocaleString("pt-BR")
                      : "0";
                  return `${params.name}\n${valor}`;
                },
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: "rgba(0, 0, 0, 0.5)",
              },
            },
            labelLine: {
              show: false,
            },
            data: chartData.map((item, index) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: colors[index % colors.length],
              },
            })),
          },
        ],
        backgroundColor: "transparent",
      };

      // Inicializar o chart
      console.log("Inicializando gráfico donut ECharts...", chartData);
      console.log(
        "Dimensões finais do container:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      const chart = echarts.init(chartDiv);

      // Verificar se o chart foi inicializado
      if (!chart) {
        throw new Error("Falha ao inicializar o gráfico ECharts");
      }

      console.log("Aplicando configurações do gráfico...");
      chart.setOption(chartOption);

      // Forçar o redimensionamento inicial com múltiplas tentativas
      setTimeout(() => {
        chart.resize();
        console.log("Gráfico donut por área redimensionado (1ª tentativa)");
      }, 100);

      setTimeout(() => {
        chart.resize();
        console.log("Gráfico donut por área redimensionado (2ª tentativa)");
      }, 500);

      // Listener para redimensionamento
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (chart && !chart.isDisposed()) {
            chart.resize();
          }
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts[containerId] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log(
        "Gráfico donut de contratos por área inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "Erro ao inicializar gráfico de contratos por área:",
        error
      );
      const container = document.getElementById("indicadoresPorAreaContent");
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de contratos por área: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o card de Total de Contratos
  async indicadores_initTotalContratos() {
    try {
      console.log("🔧 Inicializando card de total de contratos...");

      // Buscar dados do endpoint
      const response = await fetch("/dashboard/contratos");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Dados total contratos recebidos:", data);

      // Configurar container
      const container = document.getElementById(
        "indicadoresTotalContratosContent"
      );
      if (!container) {
        console.error(
          "❌ Container indicadoresTotalContratosContent não encontrado"
        );
        return;
      }

      // Obter data e hora atual para o footer
      const now = new Date();
      const timeString = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Renderizar o card de contratos
      container.innerHTML = `
        <div class="indicadores-total-contratos-card">
          <div class="indicadores-total-contracts">
            <div><i class="fas fa-file-contract"></i> Total</div>
            <span>${data.quantidade_total || 0}</span>
          </div>
          
          <div class="indicadores-status-grid">
            <div class="indicadores-status-item">
              <div class="indicadores-status-value vigentes">${
                data.vigentes || 0
              }</div>
              <div class="indicadores-status-label">Vigentes</div>
            </div>
            <div class="indicadores-status-item">
              <div class="indicadores-status-value finalizados">${
                data.finalizados || 0
              }</div>
              <div class="indicadores-status-label">Finalizados</div>
            </div>
            <div class="indicadores-status-item">
              <div class="indicadores-status-value criticos">${
                data.criticos || 0
              }</div>
              <div class="indicadores-status-label">Críticos</div>
            </div>
          </div>
          
          <div class="indicadores-time-grid">
            <div class="indicadores-time-item">
              <div class="indicadores-time-value days-120">${
                data.dias120 || 0
              }</div>
              <div class="indicadores-time-label">120 dias</div>
            </div>
            <div class="indicadores-time-item">
              <div class="indicadores-time-value days-90">${
                data.dias90 || 0
              }</div>
              <div class="indicadores-time-label">90 dias</div>
            </div>
            <div class="indicadores-time-item">
              <div class="indicadores-time-value days-45">${
                data.dias45 || 0
              }</div>
              <div class="indicadores-time-label">45 dias</div>
            </div>
            <div class="indicadores-time-item">
              <div class="indicadores-time-value others">${
                data.outros || 0
              }</div>
              <div class="indicadores-time-label">Outros</div>
            </div>
          </div>
          
        </div>
      `;

      console.log("✅ Card de total de contratos inicializado com sucesso");
    } catch (error) {
      console.error(
        "❌ Erro ao inicializar card de total de contratos:",
        error
      );

      // Mostrar mensagem de erro no container
      const container = document.getElementById(
        "indicadoresTotalContratosContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="indicadores-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar dados de contratos</p>
            <small>Verifique a conexão e tente novamente</small>
          </div>
        `;
      }
    }
  },

  // Função para inicializar o card de Top Fornecedores
  async indicadores_initTopFornecedores() {
    try {
      console.log("🔧 Inicializando card de top fornecedores...");

      // Buscar dados do endpoint
      const response = await fetch("/indicadores/top-fornecedores");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Dados top fornecedores recebidos:", data);

      // Configurar container
      const container = document.getElementById(
        "indicadoresTopFornecedoresContent"
      );
      if (!container) {
        console.error(
          "❌ Container indicadoresTopFornecedoresContent não encontrado"
        );
        return;
      }

      // Processar dados para o gráfico
      const processedData = (data.fornecedores || []).map((f) => {
        const supplierName =
          f.fornecedor_nome || `Fornecedor ${f.fornecedor_id}`;
        const truncatedName =
          supplierName.length > 15
            ? supplierName.substring(0, 15) + "..."
            : supplierName;

        return {
          ...f,
          valueInMillions: (f.valor_total_contratos || 0) / 1000000,
          labelOnly: truncatedName,
          fullName: supplierName,
        };
      });

      // Criar o gráfico de barras
      const chartContainer = document.createElement("div");
      chartContainer.id = "indicadores-top-fornecedores-chart";
      chartContainer.style.width = "100%";
      chartContainer.style.height = "300px";

      // Renderizar o card
      container.innerHTML = `
        <div class="indicadores-top-fornecedores-card">
          <div class="indicadores-chart-header">
            <div class="indicadores-chart-title">
              <i class="fas fa-building"></i> ${
                data.titulo || "Top Fornecedores"
              }
            </div>
            <div class="indicadores-chart-subtitle">${
              data.subtitulo || "Top 10 fornecedores por valor"
            }</div>
          </div>
          <div class="indicadores-chart-container">
            ${chartContainer.outerHTML}
          </div>
          <div class="indicadores-chart-footer">
            <small><i class="fas fa-info-circle"></i> Valores em milhões de reais</small>
          </div>
        </div>
      `;

      // Inicializar o gráfico ECharts
      const chartElement = document.getElementById(
        "indicadores-top-fornecedores-chart"
      );
      if (chartElement && processedData.length > 0) {
        const chart = echarts.init(chartElement);

        const option = {
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "shadow",
            },
            formatter: (params) => {
              const dataIndex = params[0].dataIndex;
              const supplier = processedData[dataIndex];
              return `
                <strong>${supplier.fullName}</strong><br/>
                Valor Total: R$ ${(
                  supplier.valor_total_contratos / 1000000
                ).toFixed(2)} milhões<br/>
                Total de Contratos: ${supplier.total_contratos}
              `;
            },
          },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "15%",
            top: "10%",
            containLabel: true,
          },
          xAxis: {
            type: "category",
            data: processedData.map((f) => f.labelOnly),
            axisLabel: {
              rotate: 30,
              fontSize: 11,
              interval: 0,
              formatter: (value) => value,
            },
          },
          yAxis: {
            type: "value",
            name: "Valor (Milhões R$)",
            nameLocation: "middle",
            nameGap: 50,
            axisLabel: {
              formatter: (value) => `${value.toFixed(1)}M`,
            },
          },
          series: [
            {
              name: "Valor Total",
              type: "bar",
              data: processedData.map((f) => f.valueInMillions),
              itemStyle: {
                color: "#1351b4",
                borderRadius: [4, 4, 0, 0],
              },
              label: {
                show: false,
              },
            },
          ],
        };

        chart.setOption(option);

        // Adicionar responsividade
        window.addEventListener("resize", () => {
          chart.resize();
        });

        // Armazenar referência do gráfico para cleanup
        container._chart = chart;
      }

      console.log("✅ Card de top fornecedores inicializado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao inicializar card de top fornecedores:", error);

      // Mostrar mensagem de erro no container
      const container = document.getElementById(
        "indicadoresTopFornecedoresContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="indicadores-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar dados de fornecedores</p>
            <small>Verifique a conexão e tente novamente</small>
          </div>
        `;
      }
    }
  },

  // Função para inicializar o card de Contratos por Categoria
  async indicadores_initCategoria() {
    try {
      console.log("🔧 Inicializando card de contratos por categoria...");

      // Buscar dados do endpoint
      const response = await fetch("/indicadores/contratos-por-area");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Dados contratos por categoria recebidos:", data);

      // Configurar container
      const container = document.getElementById("indicadoresCategoriasContent");
      if (!container) {
        console.error(
          "❌ Container indicadoresCategoriasContent não encontrado"
        );
        return;
      }

      // Processar dados para o gráfico
      const processedData = (data.categorias || []).map((categoria) => ({
        name: categoria.categoria_nome || `Categoria ${categoria.categoria_id}`,
        value: Number(categoria.total_contratos) || 0,
      }));

      // Verificar se há dados para exibir
      if (!processedData || processedData.length === 0) {
        container.innerHTML = `
          <div class="indicadores-error">
            <i class="fas fa-info-circle"></i>
            <p>Nenhum dado de categorias encontrado</p>
            <small>Verifique os filtros e tente novamente</small>
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      // Renderizar o conteúdo do card
      container.innerHTML = `
        <div id="indicadores-categorias-chart" style="width: 100%; height: 300px;"></div>
      `;

      // Inicializar o gráfico ECharts
      const chartElement = document.getElementById(
        "indicadores-categorias-chart"
      );
      if (chartElement && processedData.length > 0) {
        const chart = echarts.init(chartElement);

        // Cores para o gráfico (tons de verde seguindo o padrão)
        const colors = [
          "#228B22",
          "#32CD32",
          "#90EE90",
          "#98FB98",
          "#F0FFF0",
          "#8FBC8F",
          "#9ACD32",
          "#ADFF2F",
          "#7CFC00",
          "#7FFF00",
        ];

        const option = {
          tooltip: {
            trigger: "item",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#228B22",
            borderWidth: 2,
            borderRadius: 8,
            padding: [12, 16],
            textStyle: {
              fontSize: 14,
              fontFamily: "Rawline, Arial, sans-serif",
            },
            formatter: (params) => {
              const valor =
                typeof params.value === "number" && !isNaN(params.value)
                  ? params.value.toLocaleString("pt-BR")
                  : "0";
              const percentual =
                typeof params.percent === "number" && !isNaN(params.percent)
                  ? params.percent.toFixed(1)
                  : "0.0";

              return `
                <div class="indicadores-tooltip">
                  <div class="indicadores-tooltip-title">${params.name}</div>
                  <div class="indicadores-tooltip-value">
                    <span class="indicadores-tooltip-number">${valor}</span> contratos<br>
                    <span class="indicadores-tooltip-percent">${percentual}%</span> do total
                  </div>
                </div>
              `;
            },
          },
          legend: {
            show: false, // Ocultar legenda para economizar espaço no card pequeno
          },
          series: [
            {
              name: "Contratos por Categoria",
              type: "pie",
              radius: ["40%", "70%"],
              center: ["50%", "45%"],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 6,
                borderColor: "#fff",
                borderWidth: 2,
              },
              label: {
                show: false,
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#228B22",
                  formatter: (params) => {
                    const valor =
                      typeof params.value === "number" && !isNaN(params.value)
                        ? params.value.toLocaleString("pt-BR")
                        : "0";
                    return `${params.name}\n${valor}`;
                  },
                },
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: "rgba(0, 0, 0, 0.5)",
                },
              },
              labelLine: {
                show: false,
              },
              data: processedData.map((item, index) => ({
                name: item.name,
                value: item.value,
                itemStyle: {
                  color: colors[index % colors.length],
                },
              })),
            },
          ],
          backgroundColor: "transparent",
        };

        chart.setOption(option);

        // Adicionar responsividade
        window.addEventListener("resize", () => {
          chart.resize();
        });

        // Armazenar referência do gráfico para cleanup
        container._chart = chart;
      }

      console.log(
        "✅ Card de contratos por categoria inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "❌ Erro ao inicializar card de contratos por categoria:",
        error
      );

      // Mostrar mensagem de erro no container
      const container = document.getElementById("indicadoresCategoriasContent");
      if (container) {
        container.innerHTML = `
          <div class="indicadores-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar dados de categorias</p>
            <small>Verifique a conexão e tente novamente</small>
          </div>
        `;
      }
    }
  },

  // Função para inicializar o card de Contratos por Exercício
  async indicadores_initExercicio() {
    try {
      console.log("🔧 Inicializando card de contratos por exercício...");

      // Buscar dados do endpoint
      const response = await fetch("/dashboard/contratos-por-exercicio");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Dados contratos por exercício recebidos:", data);

      // Configurar container
      const container = document.getElementById("indicadoresExercicioContent");
      if (!container) {
        console.error(
          "❌ Container indicadoresExercicioContent não encontrado"
        );
        return;
      }

      // Verificar se há dados para exibir
      if (!data.anos || !data.valores || data.anos.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado de exercícios encontrado
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      console.log(
        "ECharts disponível, versão:",
        echarts.version || "desconhecida"
      );

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-exercicio-container">
          <div id="indicadores-exercicio-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("indicadores-exercicio-chart");

      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error("Elemento do gráfico não foi criado corretamente");
      }

      console.log(
        "Container do gráfico criado:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      // Aguardar o DOM estar totalmente renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn(
          "Container tem dimensões inválidas, tentando forçar layout..."
        );
        chartDiv.style.width = "100%";
        chartDiv.style.height = "250px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Inicializar o gráfico
      const chart = echarts.init(chartDiv);

      // Configuração do gráfico de barras
      const chartOption = {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#1351B4",
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          formatter: (params) => {
            if (params && params.length > 0) {
              const param = params[0];
              const valor =
                typeof param.value === "number" && !isNaN(param.value)
                  ? param.value.toLocaleString("pt-BR")
                  : "0";

              return `<div class="indicadores-tooltip">
                <div class="indicadores-tooltip-title">
                  Ano ${param.axisValue}
                </div>
                <div class="indicadores-tooltip-value">
                  <span class="indicadores-tooltip-number">${valor}</span> contratos
                </div>
              </div>`;
            }
            return "";
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "10%",
          top: "8%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: data.anos,
          axisLabel: {
            rotate: 45,
            fontSize: 11,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          axisLine: {
            lineStyle: {
              color: "#e0e0e0",
            },
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
        series: [
          {
            name: "Contratos",
            type: "bar",
            data: data.valores,
            itemStyle: {
              color: "#1351B4", // Cor azul do design system gov.br
              borderRadius: [4, 4, 0, 0],
            },
            barMaxWidth: 30,
            emphasis: {
              itemStyle: {
                color: "#0E4B99", // Cor mais escura no hover
              },
            },
          },
        ],
      };

      // Aplicar configuração
      chart.setOption(chartOption);

      // Setup de responsividade
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (chart && !chart.isDisposed()) {
            chart.resize();
          }
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts["indicadoresExercicioContent"] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log(
        "✅ Gráfico de contratos por exercício inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "❌ Erro ao inicializar gráfico de contratos por exercício:",
        error
      );

      // Mostrar mensagem de erro no container
      const container = document.getElementById("indicadoresExercicioContent");
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de contratos por exercício: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o card de Contratos Vigentes (valores por exercício)
  async indicadores_initVigentes() {
    try {
      console.log("🔧 Inicializando card de contratos vigentes...");

      // Buscar dados do endpoint
      const response = await fetch("/dashboard/valores-por-exercicio");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Dados valores por exercício recebidos:", data);

      // Configurar container
      const container = document.getElementById("indicadoresVigentesContent");
      if (!container) {
        console.error("❌ Container indicadoresVigentesContent não encontrado");
        return;
      }

      // Verificar se há dados para exibir
      if (!data.anos || !data.coluna || data.anos.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado de valores encontrado
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível globalmente");
      }

      console.log(
        "ECharts disponível, versão:",
        echarts.version || "desconhecida"
      );

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-vigentes-container">
          <div id="indicadores-vigentes-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("indicadores-vigentes-chart");

      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error("Elemento do gráfico não foi criado corretamente");
      }

      console.log(
        "Container do gráfico criado:",
        chartDiv.offsetWidth,
        "x",
        chartDiv.offsetHeight
      );

      // Aguardar o DOM estar totalmente renderizado
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn(
          "Container tem dimensões inválidas, tentando forçar layout..."
        );
        chartDiv.style.width = "100%";
        chartDiv.style.height = "250px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Inicializar o gráfico
      const chart = echarts.init(chartDiv);

      // Configuração do gráfico de barras (valores por exercício)
      const chartOption = {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
          },
          formatter: (params) => {
            if (params && params.length > 0) {
              let tooltip = `${params[0].axisValue}<br/>`;

              // Valor de contratos (barra)
              if (params[0]) {
                const valorContratos =
                  typeof params[0].value === "number" && !isNaN(params[0].value)
                    ? params[0].value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 0,
                      })
                    : "R$ 0";
                tooltip += `<strong>Contratos: ${valorContratos}</strong>`;
              }

              return tooltip;
            }
            return "";
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "10%",
          top: "8%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: data.anos,
          axisLabel: {
            rotate: 45,
            fontSize: 11,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          axisLine: {
            lineStyle: {
              color: "#e0e0e0",
            },
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
        },
        series: [
          {
            name: "Contratos",
            type: "bar",
            data: data.coluna,
            itemStyle: {
              color: "#bbc6ea", // Cor igual ao dashboard original
            },
            barMaxWidth: 30,
          },
        ],
      };

      // Aplicar configuração
      chart.setOption(chartOption);

      // Setup de responsividade
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (chart && !chart.isDisposed()) {
            chart.resize();
          }
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts["indicadoresVigentesContent"] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log("✅ Gráfico de contratos vigentes inicializado com sucesso");
    } catch (error) {
      console.error(
        "❌ Erro ao inicializar gráfico de contratos vigentes:",
        error
      );

      // Mostrar mensagem de erro no container
      const container = document.getElementById("indicadoresVigentesContent");
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de valores: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o cronograma de vencimentos (calendário)
  async indicadores_initCronograma() {
    try {
      console.log("🔧 Inicializando cronograma de vencimentos...");

      const response = await fetch("/indicadores/cronograma-vencimentos");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Dados do cronograma carregados:", data);

      // Get container element
      const container = document.getElementById("indicadoresCronogramaContent");
      if (!container) {
        console.error("❌ Container cronograma não encontrado");
        return;
      }

      // Clear loading content
      container.innerHTML = "";

      // Create calendar container
      const calendarContainer = document.createElement("div");
      calendarContainer.className = "indicadores-calendar-container";

      // Create calendar HTML structure
      calendarContainer.innerHTML = `
        <div class="indicadores-calendar-header">
          <button id="indicadores-prev-month" type="button"><i class="fa-solid fa-chevron-left"></i></button>
          <h3 id="indicadores-current-month-year">Janeiro 2025</h3>
          <button id="indicadores-next-month" type="button"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
        <div class="indicadores-weekdays">
          <div><span class="weekday-full">Segunda</span><span class="weekday-short">Seg</span></div>
          <div><span class="weekday-full">Terça</span><span class="weekday-short">Ter</span></div>
          <div><span class="weekday-full">Quarta</span><span class="weekday-short">Qua</span></div>
          <div><span class="weekday-full">Quinta</span><span class="weekday-short">Qui</span></div>
          <div><span class="weekday-full">Sexta</span><span class="weekday-short">Sex</span></div>
          <div><span class="weekday-full">Sábado</span><span class="weekday-short">Sáb</span></div>
          <div><span class="weekday-full">Domingo</span><span class="weekday-short">Dom</span></div>
        </div>
        <div class="indicadores-days" id="indicadores-calendar-days">
          <!-- Days will be populated by JavaScript -->
        </div>
        <div class="indicadores-calendar-legend">
          <div class="indicadores-legend-item">
            <div class="indicadores-legend-color indicadores-high-priority-color"></div>
            <span>Crítico</span>
          </div>
          <div class="indicadores-legend-item">
            <div class="indicadores-legend-color indicadores-medium-priority-color"></div>
            <span>Médio</span>
          </div>
          <div class="indicadores-legend-item">
            <div class="indicadores-legend-color indicadores-low-priority-color"></div>
            <span>Baixo</span>
          </div>
          <div class="indicadores-legend-item">
            <div class="indicadores-legend-color indicadores-default-priority-color"></div>
            <span>Normal</span>
          </div>
        </div>
      `;

      container.appendChild(calendarContainer);

      // Process contract data from backend
      const contractsData = this.processContractData(data.calendar_data || []);

      // Initialize calendar state
      this.calendarState = {
        currentDate: new Date(), // Start with current date
        contractsData: contractsData,
        monthlyData: this.calculateMonthlyContractCounts(contractsData),
      };

      // Render initial calendar
      this.renderCalendar(
        this.calendarState.currentDate,
        this.calendarState.contractsData
      );

      // Add event listeners for navigation
      document
        .getElementById("indicadores-prev-month")
        .addEventListener("click", () => {
          this.calendarState.currentDate.setMonth(
            this.calendarState.currentDate.getMonth() - 1
          );
          this.renderCalendar(
            this.calendarState.currentDate,
            this.calendarState.contractsData
          );
        });

      document
        .getElementById("indicadores-next-month")
        .addEventListener("click", () => {
          this.calendarState.currentDate.setMonth(
            this.calendarState.currentDate.getMonth() + 1
          );
          this.renderCalendar(
            this.calendarState.currentDate,
            this.calendarState.contractsData
          );
        });

      console.log("✅ Cronograma de vencimentos inicializado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao carregar cronograma de vencimentos:", error);
      const container = document.getElementById("indicadoresCronogramaContent");
      if (container) {
        container.innerHTML = `
          <div class="indicadores-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar cronograma de vencimentos</p>
            <small>Tente novamente mais tarde</small>
          </div>
        `;
      }
    }
  },

  // Process contract data from backend format
  processContractData(calendarData) {
    const contracts = [];

    calendarData.forEach(([date, count, contractsList]) => {
      contractsList.forEach((contract) => {
        // Determine priority based on days until expiration
        const contractDate = new Date(contract.data_fim);
        const today = new Date();
        const daysUntilExpiration = Math.ceil(
          (contractDate - today) / (1000 * 60 * 60 * 24)
        );

        let priority = "default";
        if (daysUntilExpiration <= 45) {
          priority = "high";
        } else if (daysUntilExpiration <= 90) {
          priority = "medium";
        } else if (daysUntilExpiration <= 120) {
          priority = "low";
        }

        contracts.push({
          id: contract.contrato_id,
          name: contract.contrato_numero || `Contrato ${contract.contrato_id}`,
          date: contract.data_fim,
          priority: priority,
          details: {
            numero: contract.contrato_numero,
            unidade_id: contract.unidade_id,
            valor_inicial: contract.valor_inicial,
            valor_global: contract.valor_global,
            objeto: contract.objeto,
          },
        });
      });
    });

    return contracts;
  },

  // Calculate monthly contract counts for heatmap
  calculateMonthlyContractCounts(contracts) {
    const counts = {};
    const currentYear = new Date().getFullYear();

    // Initialize with zeros for all months
    for (let i = 0; i < 12; i++) {
      const monthKey = `${currentYear}-${(i + 1).toString().padStart(2, "0")}`;
      counts[monthKey] = 0;
    }

    // Count contracts for each month
    contracts.forEach((contract) => {
      const contractDate = new Date(contract.date);
      if (contractDate.getFullYear() === currentYear) {
        const monthKey = `${currentYear}-${(contractDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
        if (counts[monthKey] !== undefined) {
          counts[monthKey]++;
        }
      }
    });

    return counts;
  },

  // Generate heatmap color based on contract count
  getHeatmapColor(count, maxCount) {
    if (maxCount === 0) return "#f0f0f0";

    const intensity = Math.min(count / maxCount, 1);

    // Use government blue color scale
    const baseColor = [19, 81, 180]; // #1351B4
    const white = [255, 255, 255];

    const red = Math.floor(white[0] + (baseColor[0] - white[0]) * intensity);
    const green = Math.floor(white[1] + (baseColor[1] - white[1]) * intensity);
    const blue = Math.floor(white[2] + (baseColor[2] - white[2]) * intensity);

    return `rgb(${red}, ${green}, ${blue})`;
  },

  // Render calendar for a specific month
  renderCalendar(date, contracts) {
    const calendarDays = document.getElementById("indicadores-calendar-days");
    const currentMonthYear = document.getElementById(
      "indicadores-current-month-year"
    );

    if (!calendarDays || !currentMonthYear) {
      console.error("❌ Elementos do calendário não encontrados");
      return;
    }

    // Clear previous calendar
    calendarDays.innerHTML = "";

    // Brazilian month names
    const monthsFull = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    // Set current month and year in header
    currentMonthYear.textContent = `${
      monthsFull[date.getMonth()]
    } ${date.getFullYear()}`;

    // Create a new date for the first day of the month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday-based index (0 = Monday, 1 = Tuesday, etc.)
    const firstDayIndex = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayIndex;
    const prevMonthLastDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      0
    ).getDate();

    // Today's date for highlighting
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    // Group contracts by date
    const contractsByDate = {};
    contracts.forEach((contract) => {
      const contractDate = contract.date;
      if (!contractsByDate[contractDate]) {
        contractsByDate[contractDate] = [];
      }
      contractsByDate[contractDate].push(contract);
    });

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const dayNumber = prevMonthLastDay - i;
      const dayElement = this.createDayElement(dayNumber, true, false, []);
      calendarDays.appendChild(dayElement);
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
      const dateString = currentDate.toISOString().split("T")[0];
      const isToday = dateString === todayString;
      const dayContracts = contractsByDate[dateString] || [];

      const dayElement = this.createDayElement(i, false, isToday, dayContracts);
      calendarDays.appendChild(dayElement);
    }

    // Calculate how many days from next month to show (to fill the calendar grid)
    const totalCells = 35; // 5 rows x 7 days (never more than 5 rows)
    const currentCells = daysFromPrevMonth + daysInMonth;

    // Ensure we never exceed 35 total cells (5 rows)
    let daysFromNextMonth = 0;

    if (currentCells < totalCells) {
      daysFromNextMonth = totalCells - currentCells;
    } else if (currentCells > totalCells) {
      // If we have more than 35 cells, we need to reduce previous month days
      // This handles edge cases where a month might naturally need 6 rows
      const excessDays = currentCells - totalCells;

      // Remove excess days by not showing some previous month days
      // Clear existing previous month days and re-add the correct amount
      const allDays = calendarDays.children;
      const daysToRemove = Math.min(excessDays, daysFromPrevMonth);

      // Remove excess previous month days from the beginning
      for (let i = 0; i < daysToRemove; i++) {
        if (
          allDays[0] &&
          allDays[0].classList.contains("indicadores-other-month")
        ) {
          calendarDays.removeChild(allDays[0]);
        }
      }

      daysFromNextMonth = 0; // No next month days needed
    }

    // Add days from next month (only if needed to fill exactly 5 rows)
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const dayElement = this.createDayElement(i, true, false, []);
      calendarDays.appendChild(dayElement);
    }

    // Final safety check: ensure we have exactly 35 cells or fewer
    while (calendarDays.children.length > totalCells) {
      calendarDays.removeChild(calendarDays.lastChild);
    }
  },

  // Create a day element for the calendar
  createDayElement(dayNumber, isOtherMonth, isToday, contracts) {
    const dayElement = document.createElement("div");
    dayElement.className = "indicadores-day";

    if (isOtherMonth) {
      dayElement.classList.add("indicadores-other-month");
    }

    if (isToday) {
      dayElement.classList.add("indicadores-today");
    }

    // Add day number
    const dayNumberElement = document.createElement("div");
    dayNumberElement.className = "indicadores-day-number";
    dayNumberElement.textContent = dayNumber;
    dayElement.appendChild(dayNumberElement);

    // Add contracts for this day (max 3 visible, then show "xx more")
    const maxVisible = 3;
    const visibleContracts = contracts.slice(0, maxVisible);
    const remainingContracts = contracts.slice(maxVisible);

    // Add visible contracts
    visibleContracts.forEach((contract) => {
      const contractElement = this.createContractElement(contract);
      dayElement.appendChild(contractElement);
    });

    // Add "xx more" element if there are additional contracts
    if (remainingContracts.length > 0) {
      const moreElement = document.createElement("div");
      moreElement.className = "indicadores-contract indicadores-contract-more";
      moreElement.textContent = `+${remainingContracts.length} mais`;
      moreElement.style.cursor = "pointer";
      moreElement.style.fontWeight = "bold";
      moreElement.style.backgroundColor = "#f8f9fa";
      moreElement.style.borderLeft = "2px solid #6c757d";

      // Add click handler to show all contracts for this day
      moreElement.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showAllContractsForDay(contracts, dayNumber);
      });

      dayElement.appendChild(moreElement);
    }

    return dayElement;
  },

  // Create a contract element with click handler
  createContractElement(contract) {
    const contractElement = document.createElement("div");
    contractElement.className = `indicadores-contract indicadores-contract-${contract.priority}`;
    contractElement.textContent = contract.name;
    contractElement.style.cursor = "pointer";

    // Add click handler to open modal with contract details
    contractElement.addEventListener("click", (e) => {
      e.stopPropagation();
      this.showContractModal(contract);
    });

    // Add hover effect
    contractElement.addEventListener("mouseenter", () => {
      contractElement.style.transform = "translateY(-1px)";
      contractElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    });

    contractElement.addEventListener("mouseleave", () => {
      contractElement.style.transform = "translateY(0)";
      contractElement.style.boxShadow = "none";
    });

    return contractElement;
  },

  // Show modal with contract details
  showContractModal(contract) {
    // Check if modal manager is available
    if (!window.App || !window.App.modalManager) {
      console.error("Modal manager not available");
      // Fallback to alert with more details
      const contractDate = new Date(contract.date);
      const today = new Date();
      const daysUntilExpiration = Math.ceil(
        (contractDate - today) / (1000 * 60 * 60 * 24)
      );

      alert(
        `Contrato: ${
          contract.name
        }\nVencimento: ${contractDate.toLocaleDateString("pt-BR")}\n${
          daysUntilExpiration > 0
            ? `${daysUntilExpiration} dias restantes`
            : "Vencido"
        }\n${
          contract.details.objeto
            ? `\nObjeto: ${contract.details.objeto.substring(0, 100)}...`
            : ""
        }`
      );
      return;
    }

    const modalManager = window.App.modalManager;

    // Format contract details
    const formatCurrency = (value) => {
      if (!value) return "N/A";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("pt-BR");
    };

    const getPriorityText = (priority) => {
      const priorities = {
        high: "Crítico",
        medium: "Médio",
        low: "Baixo",
        default: "Normal",
      };
      return priorities[priority] || "Normal";
    };

    const getPriorityColor = (priority) => {
      const colors = {
        high: "#e74c3c",
        medium: "#f39c12",
        low: "#2ecc71",
        default: "#1351B4",
      };
      return colors[priority] || "#1351B4";
    };

    // Calculate days until expiration
    const contractDate = new Date(contract.date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil(
      (contractDate - today) / (1000 * 60 * 60 * 24)
    );

    // Create modal content
    const modalContent = `
      <div class="contract-modal-content">
        <div class="contract-header">
          <div class="contract-title">
            <h4 style="margin: 0; color: #1351B4;">${contract.name}</h4>
            <span class="contract-priority" style="
              background-color: ${getPriorityColor(contract.priority)};
              color: white;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            ">${getPriorityText(contract.priority)}</span>
          </div>
        </div>
        
        <div class="contract-details" style="margin-top: 20px;">
          <div class="detail-row" style="margin-bottom: 15px;">
            <strong>📅 Data de Vencimento:</strong>
            <span style="color: ${
              daysUntilExpiration <= 30 ? "#e74c3c" : "#333"
            };">
              ${formatDate(contract.date)}
              ${
                daysUntilExpiration > 0
                  ? `(${daysUntilExpiration} dias restantes)`
                  : "(Vencido)"
              }
            </span>
          </div>
          
          ${
            contract.details.unidade_id
              ? `
          <div class="detail-row" style="margin-bottom: 15px;">
            <strong>🏢 Unidade:</strong>
            <span>${contract.details.unidade_id}</span>
          </div>
          `
              : ""
          }
          
          ${
            contract.details.valor_inicial
              ? `
          <div class="detail-row" style="margin-bottom: 15px;">
            <strong>💰 Valor Inicial:</strong>
            <span>${formatCurrency(contract.details.valor_inicial)}</span>
          </div>
          `
              : ""
          }
          
          ${
            contract.details.valor_global
              ? `
          <div class="detail-row" style="margin-bottom: 15px;">
            <strong>💸 Valor Global:</strong>
            <span>${formatCurrency(contract.details.valor_global)}</span>
          </div>
          `
              : ""
          }
          
          ${
            contract.details.objeto
              ? `
          <div class="detail-row" style="margin-bottom: 15px;">
            <strong>📋 Objeto:</strong>
            <div style="margin-top: 5px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 3px solid #1351B4;">
              ${contract.details.objeto}
            </div>
          </div>
          `
              : ""
          }
        </div>
        
        <div class="contract-actions" style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd;">
          <button type="button" class="btn btn-primary" id="contract-details-btn" style="
            background-color: #1351B4;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
          ">Ver Detalhes</button>
          <button type="button" class="btn btn-secondary" onclick="window.App.modalManager.close()" style="
            background-color: #6c757d;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
          ">Fechar</button>
        </div>
      </div>
      
      <style>
        .contract-modal-content {
          font-family: "Rawline", Arial, sans-serif;
        }
        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .contract-title {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .detail-row strong {
          color: #1351B4;
          font-size: 14px;
        }
        .btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      </style>
    `;

    // Set modal title and content
    modalManager.setTitle(`Contrato ${contract.name}`);
    modalManager.setBody(modalContent);
    modalManager.open();

    // Add event listener for details button
    setTimeout(() => {
      const detailsBtn = document.getElementById("contract-details-btn");
      if (detailsBtn) {
        detailsBtn.addEventListener("click", () => {
          this.openContractDetails(contract.id);
        });
      }
    }, 100);
  },

  // Show modal with all contracts for a specific day
  showAllContractsForDay(contracts, dayNumber) {
    // Check if modal manager is available
    if (!window.App || !window.App.modalManager) {
      console.error("Modal manager not available");
      // Fallback to alert with contracts list
      const contractsList = contracts
        .map((contract) => {
          const contractDate = new Date(contract.date);
          const today = new Date();
          const daysUntilExpiration = Math.ceil(
            (contractDate - today) / (1000 * 60 * 60 * 24)
          );
          return `• ${contract.name} (${
            daysUntilExpiration > 0
              ? `${daysUntilExpiration} dias restantes`
              : "Vencido"
          })`;
        })
        .join("\n");

      alert(
        `${contracts.length} contrato(s) vencem no dia ${dayNumber}:\n\n${contractsList}`
      );
      return;
    }

    const modalManager = window.App.modalManager;

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("pt-BR");
    };

    const getPriorityText = (priority) => {
      const priorities = {
        high: "Crítico",
        medium: "Médio",
        low: "Baixo",
        default: "Normal",
      };
      return priorities[priority] || "Normal";
    };

    const getPriorityColor = (priority) => {
      const colors = {
        high: "#e74c3c",
        medium: "#f39c12",
        low: "#2ecc71",
        default: "#1351B4",
      };
      return colors[priority] || "#1351B4";
    };

    // Create contracts list
    const contractsList = contracts
      .map((contract, index) => {
        const contractDate = new Date(contract.date);
        const today = new Date();
        const daysUntilExpiration = Math.ceil(
          (contractDate - today) / (1000 * 60 * 60 * 24)
        );

        return `
        <div class="contract-list-item" style="
          padding: 12px;
          margin-bottom: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 4px solid ${getPriorityColor(contract.priority)};
        " data-contract-index="${index}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h5 style="margin: 0; color: #1351B4; font-size: 16px;">${
              contract.name
            }</h5>
            <span style="
              background-color: ${getPriorityColor(contract.priority)};
              color: white;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: bold;
            ">${getPriorityText(contract.priority)}</span>
          </div>
          <div style="color: #666; font-size: 14px;">
            📅 Vence em: ${formatDate(contract.date)}
            ${
              daysUntilExpiration > 0
                ? `(${daysUntilExpiration} dias)`
                : "(Vencido)"
            }
          </div>
          ${
            contract.details.objeto
              ? `
            <div style="color: #888; font-size: 12px; margin-top: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${contract.details.objeto.substring(0, 80)}${
                  contract.details.objeto.length > 80 ? "..." : ""
                }
            </div>
          `
              : ""
          }
        </div>
      `;
      })
      .join("");

    const modalContent = `
      <div class="contracts-day-modal">
        <div style="margin-bottom: 20px;">
          <p style="color: #666; margin: 0;">
            <strong>${contracts.length}</strong> contrato(s) vencem no dia <strong>${dayNumber}</strong>
          </p>
        </div>
        
        <div class="contracts-list">
          ${contractsList}
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
          <button type="button" onclick="window.App.modalManager.close()" style="
            background-color: #6c757d;
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
          ">Fechar</button>
        </div>
      </div>
      
      <style>
        .contract-list-item:hover {
          background-color: #f8f9fa;
          border-color: #1351B4;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      </style>
    `;

    // Make contracts accessible globally for modal interactions
    window.indicadoresCalendar = this;
    window.indicadoresCurrentContracts = contracts;

    modalManager.setTitle(`Contratos do dia ${dayNumber}`);
    modalManager.setBody(modalContent);
    modalManager.open();

    // Add event listeners after modal is opened
    setTimeout(() => {
      document
        .querySelectorAll(".contract-list-item")
        .forEach((item, index) => {
          item.addEventListener("click", () => {
            const contract = contracts[index];
            if (contract) {
              this.showContractModal(contract);
            }
          });
        });
    }, 100);
  },

  // Helper method to open contract details (can be extended later)
  openContractDetails(contractId) {
    // For now, just close the modal and could navigate to contract details page
    if (window.App && window.App.modalManager) {
      window.App.modalManager.close();
    }

    // TODO: Implement navigation to contract details page
    console.log(`Opening contract details for ID: ${contractId}`);
    // Example: window.location.href = `/contratos/${contractId}`;
  },

  // Create a simple modal manager for immediate use
  createSimpleModalManager() {
    let currentModal = null;

    return {
      initialize() {
        console.log("Simple modal manager initialized");
      },

      open() {
        // Create modal elements if they don't exist
        if (currentModal) {
          this.close();
        }

        // Create scrim
        const scrim = document.createElement("div");
        scrim.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 10998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        `;

        // Create modal content
        const modalContent = document.createElement("div");
        modalContent.style.cssText = `
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          width: 100%;
          max-width: 800px;
        `;

        modalContent.innerHTML = `
          <div style="padding: 16px 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa;">
            <h3 id="simple-modal-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">Modal Title</h3>
            <button id="simple-modal-close" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px; color: #666; border-radius: 4px;">✕</button>
          </div>
          <div id="simple-modal-body" style="padding: 20px;">Modal content</div>
        `;

        scrim.appendChild(modalContent);
        document.body.appendChild(scrim);

        // Add close event listeners
        scrim.addEventListener("click", (e) => {
          if (e.target === scrim) {
            this.close();
          }
        });

        document
          .getElementById("simple-modal-close")
          .addEventListener("click", () => {
            this.close();
          });

        // Prevent body scrolling
        document.body.style.overflow = "hidden";

        currentModal = scrim;
      },

      close() {
        if (currentModal && currentModal.parentNode) {
          currentModal.parentNode.removeChild(currentModal);
          currentModal = null;
          document.body.style.overflow = "";
        }
      },

      setTitle(title) {
        const titleEl = document.getElementById("simple-modal-title");
        if (titleEl) titleEl.textContent = title;
      },

      setBody(content) {
        const bodyEl = document.getElementById("simple-modal-body");
        if (bodyEl) bodyEl.innerHTML = content;
      },
    };
  },

  indicadores_init() {
    console.log("🔧 indicadores_init() chamado");

    // Evitar execuções múltiplas dos gráficos
    if (this.isInitializingGraphics) {
      console.log(
        "⚠️ indicadores_init() ignorado - gráficos já estão sendo inicializados"
      );
      return;
    }

    // Só inicializa se estivermos na página correta
    if (!this.indicadores_initElements()) {
      console.log("❌ Indicadores elements not found, skipping initialization");
      return;
    }

    console.log("✅ Elementos encontrados, inicializando cards...");

    // Inicializa os headers dos cards
    this.indicadores_initCardHeaders();
    this.indicadores_initCardHeadersAnaliseProcessos();
    this.indicadores_initAllOtherCardHeaders();

    // Preenche o conteúdo dos cards
    this.indicadores_fillCardContent();

    console.log(
      "✅ Card headers e conteúdo inicializados, iniciando gráficos..."
    );

    // Marcar que estamos inicializando gráficos
    this.isInitializingGraphics = true;

    // Inicializa o mapa do Brasil e gráfico de regiões de forma assíncrona
    setTimeout(() => {
      console.log("🗺️ Inicializando mapa do Brasil...");
      this.indicadores_initMapaBrasil();
    }, 500);

    // Inicializar o gráfico de regiões com delay adicional
    setTimeout(() => {
      console.log("📊 Inicializando gráfico de regiões...");
      this.indicadores_initGraficoRegiao();
    }, 1000);

    // Inicializar o gráfico de barras de tipos de contrato
    setTimeout(() => {
      console.log("🍩 Inicializando gráfico tipos de contrato...");
      this.indicadores_initGraficoSemLicitacao();
    }, 1500);

    // Inicializar o gráfico donut de contratos com aditivos
    setTimeout(() => {
      console.log("🍩 Inicializando gráfico com aditivos...");
      this.indicadores_initGraficoComAditivos();
    }, 2000);

    // Inicializar o gráfico donut de contratos por área
    setTimeout(() => {
      console.log("🍩 Inicializando gráfico por área...");
      this.indicadores_initGraficoPorArea();
    }, 2500);

    // Inicializar o card de total de contratos
    setTimeout(() => {
      console.log("📊 Inicializando card total contratos...");
      this.indicadores_initTotalContratos();
    }, 3000);

    // Inicializar o card de contratos por exercício
    setTimeout(() => {
      console.log("📊 Inicializando card contratos por exercício...");
      this.indicadores_initExercicio();
    }, 3500);

    // Inicializar o card de contratos vigentes
    setTimeout(() => {
      console.log("📊 Inicializando card contratos vigentes...");
      this.indicadores_initVigentes();
    }, 4000);

    // Inicializar o card de top fornecedores
    setTimeout(() => {
      console.log("🏢 Inicializando card top fornecedores...");
      this.indicadores_initTopFornecedores();
    }, 4250);

    // Inicializar o card de contratos por categoria
    setTimeout(() => {
      console.log("📊 Inicializando card contratos por categoria...");
      this.indicadores_initCategoria();
    }, 4375);

    // Inicializar o cronograma de vencimentos
    setTimeout(() => {
      console.log("📅 Inicializando cronograma de vencimentos...");
      this.indicadores_initCronograma();

      // Resetar flag após todos os gráficos serem inicializados
      setTimeout(() => {
        this.isInitializingGraphics = false;
        console.log("🔄 Flag de inicialização de gráficos resetada");
      }, 1000);
    }, 4500);

    console.log("✅ Indicadores initialized successfully");
  },

  // Nova função para preencher o conteúdo de todos os cards
  indicadores_fillCardContent() {
    // SEÇÃO 1: WHAT - Visão Geral dos Contratos

    // Card 1 - Total de Contratos
    document.getElementById("indicadoresTotalContratosContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando dados de contratos</h5>
        <p>Buscando informações atualizadas<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 2 - Contratos por Exercício
    document.getElementById("indicadoresExercicioContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando contratos por exercício</h5>
        <p>Buscando dados históricos de contratos<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 3 - Contratos Vigentes
    document.getElementById("indicadoresVigentesContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando valores por exercício</h5>
        <p>Buscando dados de valores por período<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 4 - Contratos por Categoria
    document.getElementById("indicadoresCategoriasContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando contratos por categoria</h5>
        <p>Buscando dados de categorias<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // SEÇÃO 2: WHY - Análise de Processos

    // Card 1 - Tipos de Contrato
    document.getElementById("indicadoresSemLicitacaoContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando tipos de contrato</h5>
        <p>Buscando dados de modalidades de contratação<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 2 - Contratos com Aditivos
    document.getElementById("indicadoresComAditivosContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando contratos com aditivos</h5>
        <p>Buscando dados de termos aditivos e prorrogações<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // SEÇÃO 3: WHO - Fornecedores e Contratantes

    // Card 1 - Top Fornecedores
    document.getElementById("indicadoresTopFornecedoresContent").innerHTML = ``;

    // Card 2 - Análise por Área
    document.getElementById("indicadoresPorAreaContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando contratos por área</h5>
        <p>Buscando dados de categorias e áreas de contratação<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // SEÇÃO 4: WHERE - Distribuição Geográfica

    // Card 1 - Mapa por Estados
    document.getElementById("indicadoresMapaEstadosContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando mapa do Brasil</h5>
        <p>Buscando dados dos estados<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 2 - Contratos por Região
    document.getElementById("indicadoresPorRegiaoContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando dados regionais</h5>
        <p>Buscando contratos por região<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // SEÇÃO 5: WHEN - Análise Temporal

    // Card 1 - Cronograma de Vencimentos
    document.getElementById("indicadoresCronogramaContent").innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando cronograma de vencimentos</h5>
        <p>Buscando dados de prazos e vencimentos<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 2 - Vigência e Prazos
    document.getElementById("indicadoresVigenciaPrazosContent").innerHTML = ``;

    // SEÇÃO 6: HOW - Métodos e Eficiência

    // Card 1 - Contratos com Cláusulas
    document.getElementById("indicadoresClausulasContent").innerHTML = ``;

    // Card 2 - Modalidades de Contratação
    document.getElementById("indicadoresModalidadesContent").innerHTML = ``;

    // Card 3 - Eficiência Processual
    document.getElementById("indicadoresEficienciaContent").innerHTML = ``;

    // SEÇÃO 7: HOW MUCH - Análise Financeira

    // Card 1 - Valores por Categoria
    document.getElementById(
      "indicadoresValoresCategoriaContent"
    ).innerHTML = ``;

    // Card 2 - Evolução Financeira
    document.getElementById(
      "indicadoresEvolucaoFinanceiraContent"
    ).innerHTML = ``;

    // SEÇÃO 8: INSIGHTS EXECUTIVOS

    // Card 1 - Alertas e Riscos
    document.getElementById("indicadoresAlertasContent").innerHTML = ``;

    // Card 2 - Oportunidades
    document.getElementById("indicadoresOportunidadesContent").innerHTML = ``;

    // Card 3 - Ações Prioritárias
    document.getElementById("indicadoresAcoesContent").innerHTML = ``;

    console.log("Card content cleared successfully");
  },

  indicadores_initElements() {
    console.log("🔍 Verificando elementos da página de indicadores...");

    this.container = document.querySelector(".indicadores-page");

    // Verifica se os elementos essenciais existem
    if (!this.container) {
      console.log("❌ Container .indicadores-page não encontrado");
      return false;
    }

    console.log("✅ Indicadores elements initialized successfully");
    return true;
  },

  // Nova função para inicializar os headers dos cards dinamicamente
  indicadores_initCardHeaders() {
    console.log("🔧 Inicializando card headers...");

    // Verifica se o módulo card header está disponível
    if (
      typeof App !== "undefined" &&
      App.card_header &&
      App.card_header.card_header_createDynamic
    ) {
      console.log("✅ Módulo card_header disponível, criando headers...");

      // === Cards Principais da Página ===

      // Card 1 - Total de Contratos
      App.card_header.card_header_createDynamic(
        {
          title: "Total de Contratos",
          subtitle: "Volume geral de contratações do sistema",
          icon: "fas fa-file-contract",
          actions: [], // Sem botões para economizar espaço
        },
        "indicadores-total-contratos-header"
      );

      // Card 2 - Contratos por Exercício
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos por Exercício",
          subtitle: "Distribuição anual das contratações por período",
          icon: "fas fa-calendar-check",
          actions: [], // Sem botões para economizar espaço
        },
        "indicadores-exercicio-header"
      );

      // Card 3 - Valores por exercício
      App.card_header.card_header_createDynamic(
        {
          title: "Valores por Exercício",
          subtitle: "Valores totais por exercício",
          icon: "fas fa-play-circle",
          actions: [], // Sem botões para economizar espaço
        },
        "indicadores-vigentes-header"
      );

      // Card 4 - Contratos por Categoria
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos por Categoria ",
          subtitle: "Total de contratos por categoria",
          icon: "fas fa-chart-pie",
          actions: [], // Sem botões para economizar espaço
        },
        "indicadores-categorias-header"
      );

      console.log(
        "✅ Indicadores card headers (4 cards) initialized dynamically"
      );
    } else {
      console.warn(
        "❌ CardHeader module not available - App:",
        typeof App,
        "card_header:",
        App?.card_header ? "exists" : "missing"
      );
      console.warn("⏳ Retrying in 500ms...");
      // Retry after a short delay if card header is not available yet
      setTimeout(() => {
        this.indicadores_initCardHeaders();
      }, 500);
    }
  },

  // Nova função para inicializar os headers dos cards da Seção 2 - Análise de Processos
  indicadores_initCardHeadersAnaliseProcessos() {
    // Verifica se o módulo card header está disponível
    if (
      typeof App !== "undefined" &&
      App.card_header &&
      App.card_header.card_header_createDynamic
    ) {
      // === SEÇÃO 2: WHY - Análise de Processos ===

      // Card 1 - Tipos de Contrato
      App.card_header.card_header_createDynamic(
        {
          title: "Tipos de Contrato",
          subtitle: "Distribuição por modalidade de contratação",
          icon: "fas fa-list-alt",
          actions: [], // Sem botões para economizar espaço
        },
        "indicadores-sem-licitacao-header"
      );

      // Card 2 - Contratos com Aditivos
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos com Aditivos",
          subtitle: "Contratos que sofreram alterações ou prorrogações",
          icon: "fas fa-plus-circle",
          actions: [], // Sem botões para economizar espaço
        },
        "indicadores-com-aditivos-header"
      );

      console.log(
        "Indicadores card headers Análise de Processos (2 cards) initialized dynamically"
      );
    } else {
      console.warn("CardHeader module not available - retrying in 500ms");
      // Retry after a short delay if card header is not available yet
      setTimeout(() => {
        this.indicadores_initCardHeadersAnaliseProcessos();
      }, 500);
    }
  },

  // Nova função para inicializar todos os outros headers dos cards dinamicamente
  indicadores_initAllOtherCardHeaders() {
    // Verifica se o módulo card header está disponível
    if (
      typeof App !== "undefined" &&
      App.card_header &&
      App.card_header.card_header_createDynamic
    ) {
      // === SEÇÃO 3: WHO - Fornecedores e Contratantes ===

      // Card 1 - Top Fornecedores
      App.card_header.card_header_createDynamic(
        {
          title: "Top Fornecedores",
          subtitle: "Ranking dos principais fornecedores por volume",
          icon: "fas fa-crown",
          actions: [],
        },
        "indicadores-top-fornecedores-header"
      );

      // Card 2 - Análise por Área
      App.card_header.card_header_createDynamic(
        {
          title: "Análise por Área",
          subtitle: "Distribuição de contratos por área de atuação",
          icon: "fas fa-building",
          actions: [],
        },
        "indicadores-por-area-header"
      );

      // === SEÇÃO 4: WHERE - Distribuição Geográfica ===

      // Card 1 - Mapa por Estados
      App.card_header.card_header_createDynamic(
        {
          title: "Mapa por Estados",
          subtitle: "Visualização geográfica da distribuição nacional",
          icon: "fas fa-map",
          actions: [],
        },
        "indicadores-mapa-estados-header"
      );

      // Card 2 - Contratos por Região
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos por Região",
          subtitle: "Concentração regional das contratações",
          icon: "fas fa-chart-pie",
          actions: [],
        },
        "indicadores-por-regiao-header"
      );

      // === SEÇÃO 5: WHEN - Análise Temporal ===

      // Card 1 - Cronograma de Vencimentos
      App.card_header.card_header_createDynamic(
        {
          title: "Cronograma de Vencimentos",
          subtitle: "Prazos e datas importantes dos contratos",
          icon: "fas fa-calendar-times",
          actions: [],
        },
        "indicadores-cronograma-header"
      );

      // Card 2 - Vigência e Prazos
      App.card_header.card_header_createDynamic(
        {
          title: "Vigência e Prazos",
          subtitle: "Análise temporal da duração dos contratos",
          icon: "fas fa-hourglass-half",
          actions: [],
        },
        "indicadores-vigencia-prazos-header"
      );

      // === SEÇÃO 6: HOW - Métodos e Eficiência ===

      // Card 1 - Contratos com Cláusulas
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos com Cláusulas",
          subtitle: "Análise de cláusulas especiais e condições",
          icon: "fas fa-file-signature",
          actions: [],
        },
        "indicadores-clausulas-header"
      );

      // Card 2 - Modalidades de Contratação
      App.card_header.card_header_createDynamic(
        {
          title: "Modalidades de Contratação",
          subtitle: "Distribuição por tipo de processo licitatório",
          icon: "fas fa-list-alt",
          actions: [],
        },
        "indicadores-modalidades-header"
      );

      // Card 3 - Eficiência Processual
      App.card_header.card_header_createDynamic(
        {
          title: "Eficiência Processual",
          subtitle: "Indicadores de desempenho dos processos",
          icon: "fas fa-tachometer-alt",
          actions: [],
        },
        "indicadores-eficiencia-header"
      );

      // === SEÇÃO 7: HOW MUCH - Análise Financeira ===

      // Card 1 - Valores por Categoria
      App.card_header.card_header_createDynamic(
        {
          title: "Valores por Categoria",
          subtitle: "Distribuição financeira por categoria de gasto",
          icon: "fas fa-coins",
          actions: [],
        },
        "indicadores-valores-categoria-header"
      );

      // Card 2 - Evolução Financeira
      App.card_header.card_header_createDynamic(
        {
          title: "Evolução Financeira",
          subtitle: "Tendências e crescimento dos valores contratuais",
          icon: "fas fa-chart-line",
          actions: [],
        },
        "indicadores-evolucao-financeira-header"
      );

      // === SEÇÃO 8: INSIGHTS EXECUTIVOS ===

      // Card 1 - Alertas e Riscos
      App.card_header.card_header_createDynamic(
        {
          title: "Alertas e Riscos",
          subtitle: "Situações que requerem atenção imediata",
          icon: "fas fa-exclamation-triangle",
          actions: [],
        },
        "indicadores-alertas-header"
      );

      // Card 2 - Oportunidades
      App.card_header.card_header_createDynamic(
        {
          title: "Oportunidades",
          subtitle: "Identificação de melhorias e otimizações",
          icon: "fas fa-lightbulb",
          actions: [],
        },
        "indicadores-oportunidades-header"
      );

      // Card 3 - Ações Prioritárias
      App.card_header.card_header_createDynamic(
        {
          title: "Ações Prioritárias",
          subtitle: "Recomendações de ações estratégicas urgentes",
          icon: "fas fa-tasks",
          actions: [],
        },
        "indicadores-acoes-header"
      );

      console.log(
        "All other Indicadores card headers (6 sections) initialized dynamically"
      );
    } else {
      console.warn("CardHeader module not available - retrying in 500ms");
      // Retry after a short delay if card header is not available yet
      setTimeout(() => {
        this.indicadores_initAllOtherCardHeaders();
      }, 500);
    }
  },

  // === Funções específicas para os 4 cards principais ===

  // Card 1 - Total de Contratos
  refreshData(type) {
    console.log(`Refreshing data for: ${type}`);
    // TODO: Implementar atualização de dados específicos
  },

  exportData(type) {
    console.log(`Exporting data for: ${type}`);
    // TODO: Implementar exportação de dados específicos
  },

  // Card 2 - Contratos por Exercício
  showEvolution(type) {
    console.log(`Showing evolution for: ${type}`);
    // TODO: Implementar visualização de evolução
  },

  filterPeriod(type) {
    console.log(`Filtering period for: ${type}`);
    // TODO: Implementar filtro de período
  },

  // Card 3 - Contratos Vigentes
  listVigentes() {
    console.log("Listing active contracts");
    // TODO: Implementar listagem de contratos vigentes
  },

  monitorStatus(type) {
    console.log(`Monitoring status for: ${type}`);
    // TODO: Implementar monitoramento de status
  },

  // Card 4 - Status Críticos
  showAlerts(type) {
    console.log(`Showing alerts for: ${type}`);
    // TODO: Implementar exibição de alertas
  },

  actionPlan(type) {
    console.log(`Creating action plan for: ${type}`);
    // TODO: Implementar plano de ação para status críticos
  },

  // === Funções de ação para os cards adicionais (removidas do HTML mas mantidas para compatibilidade) ===

  // WHY - Análise de Processos
  analyzeCauses(type) {
    console.log(`Analyzing causes for: ${type}`);
    // TODO: Implementar análise de causas
  },

  showTrends(type) {
    console.log(`Showing trends for: ${type}`);
    // TODO: Implementar visualização de tendências
  },

  // WHO - Fornecedores e Contratantes
  showFullRanking(type) {
    console.log(`Showing full ranking for: ${type}`);
    // TODO: Implementar ranking completo
  },

  expandAnalysis(type) {
    console.log(`Expanding analysis for: ${type}`);
    // TODO: Implementar análise expandida
  },

  // WHERE - Distribuição Geográfica
  fullMapView() {
    console.log("Opening full map view");
    // TODO: Implementar visualização completa do mapa
  },

  compareRegions() {
    console.log("Comparing regions");
    // TODO: Implementar comparação entre regiões
  },

  // WHEN - Análise Temporal
  upcomingDeadlines() {
    console.log("Showing upcoming deadlines");
    // TODO: Implementar próximos vencimentos
  },

  temporalAnalysis() {
    console.log("Performing temporal analysis");
    // TODO: Implementar análise temporal
  },

  // HOW - Métodos e Eficiência
  checkQuality(type) {
    console.log(`Checking quality for: ${type}`);
    // TODO: Implementar verificação de qualidade
  },

  showDistribution(type) {
    console.log(`Showing distribution for: ${type}`);
    // TODO: Implementar visualização de distribuição
  },

  optimizeProcesses() {
    console.log("Optimizing processes");
    // TODO: Implementar otimização de processos
  },

  // HOW MUCH - Análise Financeira
  calculateROI(type) {
    console.log(`Calculating ROI for: ${type}`);
    // TODO: Implementar cálculo de ROI
  },

  showProjections(type) {
    console.log(`Showing projections for: ${type}`);
    // TODO: Implementar projeções financeiras
  },

  // Insights e Recomendações
  showAllAlerts() {
    console.log("Showing all alerts");
    // TODO: Implementar exibição de todos os alertas
  },

  prioritizeOpportunities() {
    console.log("Prioritizing opportunities");
    // TODO: Implementar priorização de oportunidades
  },

  executeActions() {
    console.log("Executing priority actions");
    // TODO: Implementar execução de ações prioritárias
  },

  // Funções adicionais do tópico
  exportExecutiveReport() {
    console.log("Exporting executive report");
    // TODO: Implementar exportação de relatório executivo completo
  },

  // Funções de ação do tópico
  indicadores_showFilters() {
    console.log("Showing Filters - Tópico Indicadores");
    // TODO: Implementar lógica para exibir filtros
  },

  indicadores_showSettings() {
    console.log("Showing Settings - Tópico Indicadores");
    // TODO: Implementar lógica para configurações do dashboard
  },

  // === Funções de ação da SEÇÃO 2: Análise de Processos ===

  indicadores_showFiltersAnaliseProcessos() {
    console.log("Showing Filters - Análise de Processos");
    // TODO: Implementar lógica para exibir filtros da análise de processos
  },

  indicadores_showSettingsAnaliseProcessos() {
    console.log("Showing Settings - Análise de Processos");
    // TODO: Implementar lógica para configurações da análise de processos
  },
};
