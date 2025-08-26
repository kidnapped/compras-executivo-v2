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

          // Create simple modal manager
          if (!window.App.modalManager) {
            window.App.modalManager = this.createSimpleModalManager();
          }

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
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
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
          axisPointer: { type: "shadow" },
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
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
      console.log("Iniciando carregamento do gráfico de tipos de contrato...");

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
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
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
            formatter: function (value) {
              // Show only the first word
              return value.split(" ")[0];
            },
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
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
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

  // Função para inicializar o gráfico de contratos com cláusulas
  async indicadores_initGraficoClausulas() {
    try {
      const containerId = "indicadoresClausulasContent";
      console.log(
        "Iniciando carregamento do gráfico de contratos com cláusulas..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(
          "Container do gráfico com cláusulas não encontrado:",
          containerId
        );
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados dos contratos com cláusulas...");

      // Buscar dados dos contratos com cláusulas
      const response = await fetch("/indicadores/contratos-com-clausulas");
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
            Nenhum dado de cláusulas encontrado
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
        <div class="indicadores-clausulas-container">
          <div id="indicadores-clausulas-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("indicadores-clausulas-chart");

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

      // Cores para o gráfico donut (tons de verde para cláusulas, seguindo o padrão dos azuis)
      const colors = ["#2E8B57", "#90EE90", "#98FB98", "#F0FFF0", "#FAFAFA"];

      // Configuração do gráfico donut
      const chartOption = {
        tooltip: {
          trigger: "item",
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
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
            name: "Contratos por Tipo de Cláusula",
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
                color: "#2E8B57",
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
        console.log("Gráfico donut cláusulas redimensionado (1ª tentativa)");
      }, 100);

      setTimeout(() => {
        chart.resize();
        console.log("Gráfico donut cláusulas redimensionado (2ª tentativa)");
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
        "Gráfico donut de contratos com cláusulas inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "Erro ao inicializar gráfico de contratos com cláusulas:",
        error
      );
      const container = document.getElementById("indicadoresClausulasContent");
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de contratos com cláusulas: ${error.message}
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
            backgroundColor: "#084a8a",
            textStyle: {
              color: "#ffffff",
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
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
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

  // Função para inicializar o gráfico de Contratos com Variações Significativas
  async indicadores_initContratosVariacoes() {
    try {
      const containerId = "indicadoresAlertasContent";
      console.log(
        "🔧 Iniciando carregamento do gráfico de variações de contratos..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.error("❌ Container não encontrado:", containerId);
        return;
      }

      // Ensure loading state is visible
      container.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando variações de contratos</h5>
          <p>Buscando contratos com variações significativas entre valores inicial e global<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;

      console.log("✅ Container com loading exibido, aguardando...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("📡 Buscando dados das variações de contratos...");

      // Buscar dados das variações de contratos
      const response = await fetch(
        "/indicadores/contratos-variacoes-significativas?limite_percentual=0.25&limite_registros=10"
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Raw data received:", data);

      // Preparar dados para o gráfico de barras comparativas (valor inicial vs valor global)
      const chartData = (data.contratos || []).map((contrato) => ({
        contrato_numero: contrato.contrato_numero,
        valor_inicial: contrato.valor_inicial,
        valor_global: contrato.valor_global,
        delta: contrato.delta,
        delta_pct_formatado: contrato.delta_pct_formatado,
      }));

      console.log("📊 Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhuma variação significativa encontrada
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
        <div class="indicadores-variacoes-container">
          <div id="indicadores-variacoes-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("indicadores-variacoes-chart");

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

      // Preparar dados para o gráfico de barras comparativas
      const contractLabels = chartData.map((item) => item.contrato_numero);
      const valoresIniciais = chartData.map((item) => item.valor_inicial);
      const valoresGlobais = chartData.map((item) => item.valor_global);

      // Inicializar o chart
      const chart = echarts.init(chartDiv);

      // Configuração do gráfico de barras comparativas
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
              const contractIndex = params[0].dataIndex;
              const contract = chartData[contractIndex];

              return `<div class="indicadores-tooltip">
                <div class="indicadores-tooltip-title">
                  Contrato ${contract.contrato_numero}
                </div>
                <div class="indicadores-tooltip-value">
                  <div style="margin-bottom: 4px;">
                    <span style="color: #ffffff;">●</span> Inicial: 
                    <span class="indicadores-tooltip-number">R$ ${contract.valor_inicial.toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 }
                    )}</span>
                  </div>
                  <div style="margin-bottom: 4px;">
                    <span style="color: #ffffff;">●</span> Global: 
                    <span class="indicadores-tooltip-number">R$ ${contract.valor_global.toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 }
                    )}</span>
                  </div>
                  <div style="border-top: 1px solid #eee; padding-top: 4px; margin-top: 8px;">
                    <strong>Variação: ${contract.delta_pct_formatado}</strong>
                  </div>
                </div>
              </div>`;
            }
            return "";
          },
        },
        legend: {
          data: ["Valor Inicial", "Valor Global"],
          top: "top",
          textStyle: {
            fontFamily: "Rawline, Arial, sans-serif",
            fontSize: 12,
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "10%",
          top: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: contractLabels,
          axisLabel: {
            rotate: 45,
            fontSize: 11,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
            interval: 0,
            formatter: (value) => {
              // Truncar números de contrato muito longos
              return value.length > 12 ? value.substring(0, 12) + "..." : value;
            },
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
            name: "Valor Inicial",
            type: "bar",
            data: valoresIniciais,
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
          {
            name: "Valor Global",
            type: "bar",
            data: valoresGlobais,
            itemStyle: {
              color: "#e74c3c", // Cor vermelha para destacar o aumento
              borderRadius: [4, 4, 0, 0],
            },
            barMaxWidth: 30,
            emphasis: {
              itemStyle: {
                color: "#c0392b", // Cor mais escura no hover
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
      window.indicadoresCharts["indicadoresAlertasContent"] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log(
        "✅ Gráfico de variações de contratos inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "❌ Erro ao inicializar gráfico de variações de contratos:",
        error
      );

      // Mostrar mensagem de erro no container
      const container = document.getElementById(
        "indicadoresContratosVariacoesContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar gráfico: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico de Oportunidades (Contratos sem Empenhos)
  async indicadores_initOportunidades() {
    try {
      const containerId = "indicadoresOportunidadesContent";
      console.log(
        "🔧 Iniciando carregamento do gráfico de oportunidades (contratos sem empenhos)..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.error("❌ Container não encontrado:", containerId);
        return;
      }

      // Ensure loading state is visible
      container.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando oportunidades</h5>
          <p>Buscando contratos sem empenhos associados<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;

      console.log("✅ Container com loading exibido, aguardando...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("📡 Buscando dados dos contratos sem empenhos...");

      // Buscar dados dos contratos sem empenhos
      const response = await fetch("/indicadores/contratos-sem-empenhos");

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Raw data received:", data);

      // Preparar dados para o gráfico de barras verticais (valor inicial)
      const chartData = (data.contratos || []).map((contrato) => ({
        contrato_numero: contrato.contrato_numero,
        fornecedor_nome: contrato.fornecedor_nome,
        valor_inicial: contrato.valor_inicial,
        valor_global: contrato.valor_global,
        valor_acumulado: contrato.valor_acumulado,
        valor_inicial_formatado: contrato.valor_inicial_formatado,
        valor_acumulado_formatado: contrato.valor_acumulado_formatado,
        vigencia_fim: contrato.vigencia_fim,
        objeto: contrato.objeto,
      }));

      console.log("📊 Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum contrato sem empenho encontrado
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
        <div class="indicadores-oportunidades-container">
          <div id="indicadores-oportunidades-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById(
        "indicadores-oportunidades-chart"
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

      // Preparar dados para o gráfico de barras horizontais
      const contractLabels = chartData.map((item) => item.contrato_numero);
      const valoresIniciais = chartData.map((item) => item.valor_inicial);

      // Inicializar o chart
      const chart = echarts.init(chartDiv);

      // Configuração do gráfico de barras horizontais
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
              const contractIndex = params[0].dataIndex;
              const contract = chartData[contractIndex];

              return `<div class="indicadores-tooltip">
                <div class="indicadores-tooltip-title">
                  Contrato ${contract.contrato_numero}
                </div>
                <div class="indicadores-tooltip-value">
                  <div style="margin-bottom: 4px;">
                    <strong>Fornecedor:</strong> ${contract.fornecedor_nome}
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong>Valor Inicial:</strong> 
                    <span class="indicadores-tooltip-number">${
                      contract.valor_inicial_formatado
                    }</span>
                  </div>
                  <div style="margin-bottom: 4px;">
                    <strong>Vigência até:</strong> ${new Date(
                      contract.vigencia_fim
                    ).toLocaleDateString("pt-BR")}
                  </div>
                  <div style="margin-bottom: 4px; font-size: 12px; color: #ffffff;">
                    ${
                      contract.objeto
                        ? contract.objeto.substring(0, 80) +
                          (contract.objeto.length > 80 ? "..." : "")
                        : "Sem descrição"
                    }
                  </div>
                </div>
              </div>`;
            }
            return "";
          },
        },
        grid: {
          left: "0%",
          right: "0%",
          bottom: "15%",
          top: "5%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: contractLabels,
          axisLabel: {
            rotate: 45,
            fontSize: 11,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
            interval: 0,
            formatter: (value) => {
              // Truncar números de contrato muito longos
              return value.length > 12 ? value.substring(0, 12) + "..." : value;
            },
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
            name: "Valor Inicial",
            type: "bar",
            data: valoresIniciais,
            itemStyle: {
              color: "#28a745", // Cor verde para oportunidades
              borderRadius: [4, 4, 0, 0],
            },
            barMaxWidth: 30,
            emphasis: {
              itemStyle: {
                color: "#218838", // Cor mais escura no hover
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
      window.indicadoresCharts["indicadoresOportunidadesContent"] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log(
        "✅ Gráfico de oportunidades (contratos sem empenhos) inicializado com sucesso"
      );
    } catch (error) {
      console.error("❌ Erro ao inicializar gráfico de oportunidades:", error);

      // Mostrar mensagem de erro no container
      const container = document.getElementById(
        "indicadoresOportunidadesContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar gráfico: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico de Evolução Financeira (Projeção de Valores Mensais)
  async indicadores_initEvolucaoFinanceira() {
    try {
      console.log(
        "🔧 Iniciando carregamento do gráfico de evolução financeira..."
      );

      const container = document.getElementById(
        "indicadoresEvolucaoFinanceiraContent"
      );
      if (!container) {
        console.error(
          "❌ Container indicadoresEvolucaoFinanceiraContent não encontrado"
        );
        return;
      }

      // Mostrar loading
      container.innerHTML = `
        <div class="indicadores-loading-container">
          <div class="indicadores-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <p>Carregando projeção financeira...</p>
        </div>
      `;

      // Buscar dados
      const response = await fetch("/indicadores/projecao-valores-mensais");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Dados de projeção financeira recebidos:", data);

      // Verificar se há dados
      if (!data.projecao_mensal || data.projecao_mensal.length === 0) {
        container.innerHTML = `
          <div class="indicadores-error">
            <i class="fas fa-info-circle"></i>
            <p>Nenhuma projeção financeira encontrada</p>
            <small>Não há contratos vigentes para os próximos meses</small>
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível
      if (typeof echarts === "undefined") {
        throw new Error("ECharts não está disponível");
      }

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-evolucao-financeira-container">
          <div id="indicadores-evolucao-financeira-chart"></div>
          <div class="indicadores-chart-footer">
            <small><i class="fas fa-info-circle"></i> Projeção baseada na duração dos contratos vigentes</small>
            <div class="indicadores-total-projetado">
              <strong>Total Projetado: ${
                data.total_valor_projetado_formatado || "R$ 0,00"
              }</strong>
            </div>
          </div>
        </div>
      `;

      const chartDiv = document.getElementById(
        "indicadores-evolucao-financeira-chart"
      );
      if (!chartDiv) {
        throw new Error("Falha ao criar container do gráfico");
      }

      // Aguardar renderização
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Preparar dados para o gráfico de linha
      const chartLabels = data.projecao_mensal.map(
        (item) => item.mes_abreviado
      );
      const chartValues = data.projecao_mensal.map(
        (item) => item.valor_previsto / 1000000
      ); // Converter para milhões

      // Inicializar gráfico
      const chart = echarts.init(chartDiv);

      const option = {
        tooltip: {
          trigger: "axis",
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
          },
          formatter: (params) => {
            const item = params[0];
            const dataIndex = item.dataIndex;
            const mesData = data.projecao_mensal[dataIndex];

            return `
              <strong>${mesData.mes_formatado}</strong><br/>
              Valor Previsto: ${mesData.valor_previsto_formatado}<br/>
              <small>Baseado em contratos vigentes</small>
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
          data: chartLabels,
          axisLabel: {
            fontSize: 12,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
            rotate: 45,
          },
          axisLine: {
            lineStyle: {
              color: "#e0e0e0",
            },
          },
        },
        yAxis: {
          type: "value",
          name: "Valor (Milhões R$)",
          nameLocation: "middle",
          nameGap: 50,
          nameTextStyle: {
            fontSize: 12,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          axisLabel: {
            formatter: (value) => `${value.toFixed(1)}M`,
            fontSize: 11,
            fontFamily: "Rawline, Arial, sans-serif",
            color: "#333",
          },
          splitLine: {
            lineStyle: {
              color: "#f0f0f0",
              type: "dashed",
            },
          },
        },
        series: [
          {
            name: "Valor Previsto",
            type: "line",
            data: chartValues,
            smooth: true,
            symbol: "circle",
            symbolSize: 8,
            lineStyle: {
              color: "#1351B4",
              width: 3,
            },
            itemStyle: {
              color: "#1351B4",
              borderColor: "#fff",
              borderWidth: 2,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: "rgba(19, 81, 180, 0.3)",
                },
                {
                  offset: 1,
                  color: "rgba(19, 81, 180, 0.05)",
                },
              ]),
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

      chart.setOption(option);

      // Redimensionamento
      setTimeout(() => {
        chart.resize();
        console.log(
          "Gráfico de evolução financeira redimensionado (1ª tentativa)"
        );
      }, 100);

      setTimeout(() => {
        chart.resize();
        console.log(
          "Gráfico de evolução financeira redimensionado (2ª tentativa)"
        );
      }, 500);

      // Listener para redimensionamento
      let resizeTimeout;
      const resizeListener = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          chart.resize();
          console.log(
            "Gráfico de evolução financeira redimensionado (responsive)"
          );
        }, 150);
      };

      window.addEventListener("resize", resizeListener);

      // Armazenar referência para cleanup
      if (!window.indicadoresCharts) window.indicadoresCharts = {};
      window.indicadoresCharts["indicadoresEvolucaoFinanceiraContent"] = {
        chart: chart,
        resizeListener: resizeListener,
      };

      console.log("✅ Gráfico de evolução financeira inicializado com sucesso");
    } catch (error) {
      console.error(
        "❌ Erro ao inicializar gráfico de evolução financeira:",
        error
      );
      const container = document.getElementById(
        "indicadoresEvolucaoFinanceiraContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="indicadores-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar projeção financeira</p>
            <small>${error.message}</small>
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico de Valores por Categoria (Distribuição Financeira)
  async indicadores_initValoresPorCategoria() {
    try {
      const containerId = "indicadoresValoresCategoriaContent";
      console.log(
        "Iniciando carregamento do gráfico de valores por categoria..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(
          "Container do gráfico de valores por categoria não encontrado:",
          containerId
        );
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados de valores por categoria...");

      // Buscar dados de valores por categoria
      const response = await fetch("/indicadores/contratos-por-categoria");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o gráfico donut - usar valor acumulado em vez de quantidade de contratos
      const chartData = (data.categorias || []).map((categoria) => ({
        name: categoria.categoria_nome || "Sem categoria",
        value: Number(categoria.total_valor_acumulado) || 0,
        formatted: categoria.total_valor_acumulado_formatado || "R$ 0,00",
        percentage: categoria.pct_total_acumulado_formatado || "0.00%",
        contracts: categoria.total_contratos || 0,
      }));

      console.log("Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado de valores por categoria encontrado
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
        <div class="indicadores-valores-categoria-container">
          <div id="indicadores-valores-categoria-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById(
        "indicadores-valores-categoria-chart"
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

      // Cores para o gráfico donut (tons de verde esmaecidos, seguindo o padrão)
      const colors = [
        "#2E8B57",
        "#3CB371",
        "#90EE90",
        "#98FB98",
        "#F0FFF0",
        "#8FBC8F",
        "#9ACD32",
        "#ADFF2F",
      ];

      // Configuração do gráfico donut
      const chartOption = {
        tooltip: {
          trigger: "item",
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
          },
          formatter: (params) => {
            const dataIndex = params.dataIndex;
            const originalData = chartData[dataIndex];

            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${params.name}
              </div>
              <div class="indicadores-tooltip-value">
                <span class="indicadores-tooltip-number">${originalData.formatted}</span>
                <br>
                <span class="indicadores-tooltip-percent">${originalData.percentage}</span> do total
                <br>
                <small>${originalData.contracts} contratos</small>
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
            name: "Valores por Categoria",
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "40%"],
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
                color: "#2E8B57",
                formatter: (params) => {
                  const dataIndex = params.dataIndex;
                  const originalData = chartData[dataIndex];
                  return `${params.name}\n${originalData.formatted}`;
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

      // Adicionar responsividade
      window.addEventListener("resize", () => {
        if (chart && !chart.isDisposed()) {
          chart.resize();
        }
      });

      console.log(
        "✅ Gráfico de valores por categoria inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "❌ Erro ao inicializar gráfico de valores por categoria:",
        error
      );

      // Mostrar mensagem de erro no container
      const container = document.getElementById(
        "indicadoresValoresCategoriaContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar valores por categoria
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico de Eficiência Processual (Contratos com Responsáveis)
  async indicadores_initEficiencia() {
    try {
      const containerId = "indicadoresEficienciaContent";
      console.log(
        "🔧 Iniciando carregamento do gráfico de eficiência processual..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.error("❌ Container não encontrado:", containerId);
        return;
      }

      // Ensure loading state is visible
      container.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando eficiência processual</h5>
          <p>Analisando contratos com responsáveis<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("🔧 Buscando dados de contratos com responsáveis...");

      // Buscar dados do endpoint
      const response = await fetch("/indicadores/contratos-com-responsaveis");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o gráfico donut
      const chartData = (data.tipos_responsabilidade || []).map((tipo) => ({
        name: tipo.tipo,
        value: Number(tipo.total_contratos) || 0,
      }));

      console.log("📊 Dados do gráfico preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado de responsabilidade encontrado
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
        <div class="indicadores-eficiencia-container">
          <div id="indicadores-eficiencia-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("indicadores-eficiencia-chart");

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

      // Cores para o gráfico donut (tons de roxo para eficiência)
      const colors = ["#6A5ACD", "#9370DB", "#DDA0DD", "#E6E6FA", "#F8F8FF"];

      // Configuração do gráfico donut
      const chartOption = {
        tooltip: {
          trigger: "item",
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
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
            name: "Contratos por Responsabilidade",
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
                color: "#6A5ACD",
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
        console.log("Gráfico donut eficiência redimensionado (1ª tentativa)");
      }, 100);

      setTimeout(() => {
        chart.resize();
        console.log("Gráfico donut eficiência redimensionado (2ª tentativa)");
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
        "Gráfico donut de eficiência processual inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "Erro ao inicializar gráfico de eficiência processual:",
        error
      );
      const container = document.getElementById("indicadoresEficienciaContent");
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de eficiência processual: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico de distribuição de carga de trabalho (Top Responsáveis)
  async indicadores_initModalidades() {
    try {
      const containerId = "indicadoresModalidadesContent";
      console.log(
        "Iniciando carregamento do gráfico de distribuição de carga de trabalho..."
      );

      const container = document.getElementById(containerId);

      if (!container) {
        console.warn(
          "Container do gráfico modalidades não encontrado:",
          containerId
        );
        return;
      }

      console.log("Container encontrado, aguardando loading inicial...");

      // Delay para que o loading seja bem visível
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Buscando dados de distribuição de carga de trabalho...");

      // Buscar dados dos top responsáveis
      const response = await fetch("/indicadores/top-responsaveis");
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();

      // Preparar dados para o gráfico de barras
      const chartData = (data.responsaveis || []).map((responsavel) => ({
        name: responsavel.responsavel_nome,
        value: Number(responsavel.contratos_qtd) || 0,
      }));

      console.log("Dados de distribuição de carga preparados:", chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum responsável encontrado
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
        <div class="indicadores-modalidades-container">
          <div id="indicadores-modalidades-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById("indicadores-modalidades-chart");

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
        chartDiv.style.height = "300px";
        chartDiv.style.display = "block";
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Preparar dados para o gráfico de barras horizontais
      const chartLabels = chartData.map((item) => item.name);
      const chartValues = chartData.map((item) => item.value);

      // Cores para o gráfico de barras (tons de azul governo)
      const colors = [
        "#1351B4",
        "#0E4B99",
        "#5F70A5",
        "#8B9ED6",
        "#A2B2E3",
        "#C4D3F0",
        "#E3EAFC",
        "#F1F5FE",
        "#F8FAFF",
        "#FFFFFF",
      ];

      // Configuração do gráfico de barras horizontais
      const chartOption = {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
          },
          formatter: (params) => {
            const param = params[0];
            const valor =
              typeof param.value === "number" && !isNaN(param.value)
                ? param.value.toLocaleString("pt-BR")
                : "0";

            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${param.name}
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
          data: chartLabels,
          axisLabel: {
            fontSize: 11,
            fontWeight: "normal",
            formatter: (value) => {
              // Truncar nomes muito longos
              return value.length > 20 ? value.substring(0, 17) + "..." : value;
            },
          },
        },
        series: [
          {
            name: "Contratos por Responsável",
            type: "bar",
            data: chartData.map((item, index) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: colors[index % colors.length],
                borderRadius: [0, 4, 4, 0],
              },
            })),
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
        console.log("Gráfico modalidades redimensionado (1ª tentativa)");
      }, 100);

      setTimeout(() => {
        chart.resize();
        console.log("Gráfico modalidades redimensionado (2ª tentativa)");
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
        "Gráfico de distribuição de carga de trabalho inicializado com sucesso"
      );
    } catch (error) {
      console.error(
        "Erro ao inicializar gráfico de distribuição de carga:",
        error
      );
      const container = document.getElementById(
        "indicadoresModalidadesContent"
      );
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar gráfico de distribuição de carga: ${error.message}
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

      // Create calendar HTML structure with two months
      calendarContainer.innerHTML = `
        <div class="indicadores-calendar-header">
          <button id="indicadores-prev-month" type="button"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="indicadores-months-display">
            <h3 id="indicadores-current-month-year">Janeiro 2025</h3>
            <h3 id="indicadores-next-month-year">Fevereiro 2025</h3>
          </div>
          <button id="indicadores-next-month" type="button"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
        <div class="indicadores-dual-calendar">
          <div class="indicadores-month-container">
            <div class="indicadores-weekdays">
              <div><span class="weekday-full">Segunda</span><span class="weekday-short">Seg</span></div>
              <div><span class="weekday-full">Terça</span><span class="weekday-short">Ter</span></div>
              <div><span class="weekday-full">Quarta</span><span class="weekday-short">Qua</span></div>
              <div><span class="weekday-full">Quinta</span><span class="weekday-short">Qui</span></div>
              <div><span class="weekday-full">Sexta</span><span class="weekday-short">Sex</span></div>
              <div><span class="weekday-full">Sábado</span><span class="weekday-short">Sáb</span></div>
              <div><span class="weekday-full">Domingo</span><span class="weekday-short">Dom</span></div>
            </div>
            <div class="indicadores-days" id="indicadores-calendar-days-current">
              <!-- Current month days will be populated by JavaScript -->
            </div>
          </div>
          <div class="indicadores-month-container">
            <div class="indicadores-weekdays">
              <div><span class="weekday-full">Segunda</span><span class="weekday-short">Seg</span></div>
              <div><span class="weekday-full">Terça</span><span class="weekday-short">Ter</span></div>
              <div><span class="weekday-full">Quarta</span><span class="weekday-short">Qua</span></div>
              <div><span class="weekday-full">Quinta</span><span class="weekday-short">Qui</span></div>
              <div><span class="weekday-full">Sexta</span><span class="weekday-short">Sex</span></div>
              <div><span class="weekday-full">Sábado</span><span class="weekday-short">Sáb</span></div>
              <div><span class="weekday-full">Domingo</span><span class="weekday-short">Dom</span></div>
            </div>
            <div class="indicadores-days" id="indicadores-calendar-days-next">
              <!-- Next month days will be populated by JavaScript -->
            </div>
          </div>
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

      // Render initial calendar (both months)
      this.renderDualCalendar(
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
          this.renderDualCalendar(
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
          this.renderDualCalendar(
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
            prorrogavel: contract.prorrogavel,
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

  // Render dual calendar for two consecutive months
  renderDualCalendar(date, contracts) {
    const currentMonthYear = document.getElementById(
      "indicadores-current-month-year"
    );
    const nextMonthYear = document.getElementById(
      "indicadores-next-month-year"
    );

    if (!currentMonthYear || !nextMonthYear) {
      console.error("❌ Elementos do calendário não encontrados");
      return;
    }

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

    // Current month
    const currentDate = new Date(date);

    // Next month
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + 1);

    // Set headers
    currentMonthYear.textContent = `${
      monthsFull[currentDate.getMonth()]
    } ${currentDate.getFullYear()}`;

    nextMonthYear.textContent = `${
      monthsFull[nextDate.getMonth()]
    } ${nextDate.getFullYear()}`;

    // Render current month
    this.renderSingleMonth(
      currentDate,
      contracts,
      "indicadores-calendar-days-current"
    );

    // Render next month
    this.renderSingleMonth(
      nextDate,
      contracts,
      "indicadores-calendar-days-next"
    );
  },

  // Render calendar for a specific month (updated to work with dual calendar)
  renderSingleMonth(date, contracts, containerId) {
    const calendarDays = document.getElementById(containerId);

    if (!calendarDays) {
      console.error(`❌ Container ${containerId} não encontrado`);
      return;
    }

    // Clear previous calendar
    calendarDays.innerHTML = "";

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

  // Legacy render calendar function (kept for compatibility)
  renderCalendar(date, contracts) {
    // For backward compatibility, use the dual calendar approach
    this.renderDualCalendar(date, contracts);
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
  showContractModal(contract, context = null) {
    console.log("🔧 showContractModal called with contract:", contract);
    console.log("📊 Contract details:", contract.details);
    console.log("📅 Contract date:", contract.date);
    console.log("🏷️ Contract name:", contract.name);
    console.log("🔄 Context:", context);

    // Ensure modal manager is available
    if (!window.App) window.App = {};
    if (!window.App.modalManager) {
      console.log("📦 Creating new modal manager...");
      window.App.modalManager = this.createSimpleModalManager();
    }

    console.log("✅ Modal manager available:", !!window.App.modalManager);
    const modalManager = window.App.modalManager;

    // Format contract details
    const formatCurrency = (value) => {
      if (!value || value === 0 || isNaN(value)) return "N/A";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        return new Date(dateString).toLocaleDateString("pt-BR");
      } catch (error) {
        console.warn("Error formatting date:", dateString, error);
        return dateString;
      }
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

    console.log("📊 Days until expiration:", daysUntilExpiration);

    // Create modal content
    const modalContent = `
      <div class="contract-modal-content">
        <!-- Priority Badge Header -->
        <div class="contract-header">
          <span class="contract-priority-badge" style="
            background-color: ${getPriorityColor(contract.priority)};
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          ">
            <i class="fas fa-exclamation-triangle" style="font-size: 12px;"></i>
            ${getPriorityText(contract.priority)}
          </span>
          <div class="contract-expiry-date" style="
            background-color: ${
              daysUntilExpiration <= 30 ? "#fff5f5" : "#f0f9ff"
            };
            color: ${daysUntilExpiration <= 30 ? "#e74c3c" : "#1351B4"};
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid ${
              daysUntilExpiration <= 30 ? "#fecaca" : "#bfdbfe"
            };
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-align: right;
          ">
            <i class="fas fa-calendar-alt" style="font-size: 12px;"></i>
            <div>
              <div style="font-weight: 500; font-size: 12px; opacity: 0.8;">Data de Vencimento</div>
              <div style="font-weight: 600; font-size: 13px;">
                ${formatDate(contract.date)}
                ${
                  daysUntilExpiration > 0
                    ? `(${daysUntilExpiration} dias restantes)`
                    : "(Vencido)"
                }
              </div>
            </div>
          </div>
        </div>
        
        <!-- Contract Summary Card -->
        <div class="contract-summary-card" style="
          margin-top: 20px; 
          padding: 20px; 
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px; 
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        ">
          <h5 style="
            margin: 0 0 15px 0; 
            color: #1351B4; 
            font-size: 18px; 
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            <i class="fas fa-file-contract" style="color: #1351B4;"></i>
            RESUMO DO CONTRATO
          </h5>
          
          <!-- Status and Prorrogável Row -->
          <div class="info-row" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px 0;
            flex-wrap: wrap;
            gap: 16px;
          ">
            <!-- Status Section -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              flex: 1;
              min-width: 200px;
            ">
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                color: #64748b;
                font-weight: 500;
                font-size: 14px;
              ">
                <i class="fas fa-info-circle" style="width: 16px;"></i>
                Status:
              </div>
              <div style="
                color: ${daysUntilExpiration <= 30 ? "#e74c3c" : "#059669"};
                font-weight: 600;
                font-size: 14px;
              ">
                ${
                  daysUntilExpiration > 0
                    ? `Vence em ${daysUntilExpiration} dias`
                    : "Contrato vencido"
                }
              </div>
            </div>
            
            <!-- Prorrogável Section -->
            <div style="
              display: flex;
              align-items: center;
              gap: 8px;
              flex-shrink: 0;
            ">
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                color: #64748b;
                font-weight: 500;
                font-size: 14px;
              ">
                <i class="fas fa-sync-alt" style="width: 16px;"></i>
                Prorrogável:
              </div>
              <span style="
                padding: 4px 10px; 
                border-radius: 16px; 
                font-size: 12px; 
                font-weight: 600;
                background-color: ${
                  contract.details.prorrogavel === true ? "#dcfce7" : "#fef2f2"
                };
                color: ${
                  contract.details.prorrogavel === true ? "#166534" : "#991b1b"
                };
                border: 1px solid ${
                  contract.details.prorrogavel === true ? "#bbf7d0" : "#fecaca"
                };
                display: inline-flex;
                align-items: center;
                gap: 4px;
              ">
                <i class="fas fa-${
                  contract.details.prorrogavel === true ? "check" : "times"
                }" style="font-size: 10px;"></i>
                ${contract.details.prorrogavel === true ? "Sim" : "Não"}
              </span>
            </div>
          </div>
        </div>

        <!-- Contract Details Grid -->
        <div class="contract-details-grid" style="
          margin-top: 20px;
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr;
        ">
          
          <!-- Inline Details: Unit, Initial Value, Global Value -->
          <div class="inline-details-row" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
          ">
            ${
              contract.details.unidade_id
                ? `
            <!-- Unit Details -->
            <div class="detail-card" style="
              padding: 16px;
              background-color: white;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            ">
              <div class="detail-header" style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                color: #1351B4;
                font-weight: 600;
                font-size: 14px;
              ">
                <i class="fas fa-building"></i>
                Unidade
              </div>
              <div style="color: #374151; font-size: 15px; font-weight: 500;">
                ${contract.details.unidade_id}
              </div>
            </div>
            `
                : ""
            }
            
            ${
              contract.details.valor_inicial &&
              contract.details.valor_inicial > 0
                ? `
            <!-- Initial Value -->
            <div class="detail-card" style="
              padding: 16px;
              background-color: white;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            ">
              <div class="detail-header" style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                color: #1351B4;
                font-weight: 600;
                font-size: 14px;
              ">
                <i class="fas fa-dollar-sign"></i>
                Valor Inicial
              </div>
              <div style="color: #059669; font-size: 16px; font-weight: 600;">
                ${formatCurrency(contract.details.valor_inicial)}
              </div>
            </div>
            `
                : ""
            }
            
            ${
              contract.details.valor_global && contract.details.valor_global > 0
                ? `
            <!-- Global Value -->
            <div class="detail-card" style="
              padding: 16px;
              background-color: white;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            ">
              <div class="detail-header" style="
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                color: #1351B4;
                font-weight: 600;
                font-size: 14px;
              ">
                <i class="fas fa-coins"></i>
                Valor Global
              </div>
              <div style="color: #059669; font-size: 16px; font-weight: 600;">
                ${formatCurrency(contract.details.valor_global)}
              </div>
            </div>
            `
                : ""
            }
          </div>
          
        </div>
        
        ${
          contract.details.objeto && contract.details.objeto.trim()
            ? `
        <!-- Object Description -->
        <div class="object-section" style="margin-top: 20px;">
          <div class="detail-card" style="
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          ">
            <div class="detail-header" style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
              color: #1351B4;
              font-weight: 600;
              font-size: 14px;
            ">
              <i class="fas fa-clipboard-list"></i>
              Objeto
            </div>
            <div style="
              color: #374151;
              line-height: 1.6;
              font-size: 14px;
              padding: 12px;
              background-color: #f8fafc;
              border-radius: 6px;
              border-left: 4px solid #1351B4;
            ">
              ${contract.details.objeto}
            </div>
          </div>
        </div>
        `
            : ""
        }
        
        <!-- Action Buttons -->
        <div class="contract-actions" style="
          margin-top: 25px; 
          padding-top: 20px; 
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 12px;
          justify-content: ${
            context && context.fromList ? "space-between" : "flex-end"
          };
        ">
          ${
            context && context.fromList
              ? `
          <!-- Back Button (only when opened from list) -->
          <button type="button" id="back-to-list-btn" style="
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #475569;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
          ">
            <i class="fas fa-arrow-left" style="font-size: 12px;"></i>
            Voltar à Lista
          </button>
          `
              : ""
          }
          
          <div style="display: flex; gap: 12px;">
            <button type="button" class="btn btn-primary" id="contract-details-btn" style="
              background: linear-gradient(135deg, #1351B4 0%, #0f3f8f 100%);
              border: none;
              color: white;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(19, 81, 180, 0.2);
            ">
              <i class="fas fa-external-link-alt" style="font-size: 12px;"></i>
              Ver Detalhes
            </button>
            <button type="button" onclick="window.App.modalManager.close()" style="
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              color: #64748b;
              padding: 10px 20px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              font-size: 14px;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s ease;
            ">
              <i class="fas fa-times" style="font-size: 12px;"></i>
              Fechar
            </button>
          </div>
        </div>
      </div>
      
      <style>
        .contract-modal-content {
          font-family: "Rawline", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 600px;
          margin: 0 auto;
        }
        .contract-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .info-row:last-child {
          border-bottom: none !important;
          margin-bottom: 0 !important;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .detail-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        #back-to-list-btn:hover {
          background-color: #e2e8f0;
          border-color: #94a3b8;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 768px) {
          .contract-header {
            flex-direction: column;
            align-items: stretch;
          }
          .contract-actions {
            flex-direction: column;
          }
          .detail-header {
            font-size: 13px !important;
          }
        }
      </style>
    `;

    // Set modal title and content
    console.log("📝 Opening modal first...");
    modalManager.open();

    console.log("🎬 Setting modal title and content...");
    modalManager.setTitle(`Contrato ${contract.name}`);
    modalManager.setBody(modalContent);

    console.log("✅ Modal should now be visible with content");

    // Add event listener for details button
    setTimeout(() => {
      const detailsBtn = document.getElementById("contract-details-btn");
      if (detailsBtn) {
        detailsBtn.addEventListener("click", () => {
          this.openContractDetails(contract.id);
        });
      }

      // Add event listener for back button (when opened from list)
      if (context && context.fromList) {
        const backBtn = document.getElementById("back-to-list-btn");
        if (backBtn) {
          backBtn.addEventListener("click", () => {
            // Return to the contracts list for the specific day
            this.showAllContractsForDay(
              context.allContracts,
              context.dayNumber
            );
          });
        }
      }
    }, 100);
  },

  // Show modal with all contracts for a specific day
  showAllContractsForDay(contracts, dayNumber) {
    // Ensure modal manager is available
    if (!window.App) window.App = {};
    if (!window.App.modalManager) {
      window.App.modalManager = this.createSimpleModalManager();
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

    modalManager.open();
    modalManager.setTitle(`Contratos do dia ${dayNumber}`);
    modalManager.setBody(modalContent);

    // Add event listeners after modal is opened
    setTimeout(() => {
      document
        .querySelectorAll(".contract-list-item")
        .forEach((item, index) => {
          item.addEventListener("click", () => {
            const contract = contracts[index];
            if (contract) {
              // Pass context information to indicate this was opened from the list
              this.showContractModal(contract, {
                fromList: true,
                dayNumber: dayNumber,
                allContracts: contracts,
              });
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

    // Inicializar o gráfico donut de contratos com cláusulas
    setTimeout(() => {
      console.log("🍩 Inicializando gráfico com cláusulas...");
      this.indicadores_initGraficoClausulas();
    }, 2125);

    // Inicializar o gráfico de contratos com variações significativas
    setTimeout(() => {
      console.log("📊 Inicializando gráfico de variações de contratos...");
      this.indicadores_initContratosVariacoes();
    }, 2250);

    // Inicializar o gráfico de oportunidades (contratos sem empenhos)
    setTimeout(() => {
      console.log("🔍 Inicializando gráfico de oportunidades...");
      this.indicadores_initOportunidades();
    }, 2375);

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

    // Inicializar o gráfico de evolução financeira
    setTimeout(() => {
      console.log("📈 Inicializando gráfico de evolução financeira...");
      this.indicadores_initEvolucaoFinanceira();
    }, 4400);

    // Inicializar o gráfico de valores por categoria
    setTimeout(() => {
      console.log("💰 Inicializando gráfico de valores por categoria...");
      this.indicadores_initValoresPorCategoria();
    }, 4600);

    // Inicializar o gráfico de eficiência processual
    setTimeout(() => {
      console.log("⚡ Inicializando gráfico de eficiência processual...");
      this.indicadores_initEficiencia();
    }, 4800);

    // Inicializar o gráfico de distribuição de carga de trabalho
    setTimeout(() => {
      console.log(
        "� Inicializando gráfico de distribuição de carga de trabalho..."
      );
      this.indicadores_initModalidades();
    }, 4900);

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
    const totalContratosElement = document.getElementById(
      "indicadoresTotalContratosContent"
    );
    if (totalContratosElement) {
      totalContratosElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando dados de contratos</h5>
          <p>Buscando informações atualizadas<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 2 - Contratos por Exercício
    const exercicioElement = document.getElementById(
      "indicadoresExercicioContent"
    );
    if (exercicioElement) {
      exercicioElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando contratos por exercício</h5>
          <p>Buscando dados históricos de contratos<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 3 - Contratos Vigentes
    const vigentesElement = document.getElementById(
      "indicadoresVigentesContent"
    );
    if (vigentesElement) {
      vigentesElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando valores por exercício</h5>
          <p>Buscando dados de valores por período<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 4 - Contratos por Categoria
    const categoriasElement = document.getElementById(
      "indicadoresCategoriasContent"
    );
    if (categoriasElement) {
      categoriasElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando contratos por categoria</h5>
          <p>Buscando dados de categorias<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // SEÇÃO 2: WHY - Análise de Processos

    // Card 1 - Tipos de Contrato
    const semLicitacaoElement = document.getElementById(
      "indicadoresSemLicitacaoContent"
    );
    if (semLicitacaoElement) {
      semLicitacaoElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando tipos de contrato</h5>
          <p>Buscando dados de modalidades de contratação<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 2 - Contratos com Aditivos
    const comAditivosElement = document.getElementById(
      "indicadoresComAditivosContent"
    );
    if (comAditivosElement) {
      comAditivosElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando contratos com aditivos</h5>
          <p>Buscando dados de termos aditivos e prorrogações<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 3 - Contratos com Variações Significativas
    const contratosVariacoesElement = document.getElementById(
      "indicadoresAlertasContent"
    );
    if (contratosVariacoesElement) {
      contratosVariacoesElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando variações de contratos</h5>
          <p>Buscando contratos com variações significativas entre valores inicial e global<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // SEÇÃO 3: WHO - Fornecedores e Contratantes

    // Card 1 - Top Fornecedores
    const topFornecedoresElement = document.getElementById(
      "indicadoresTopFornecedoresContent"
    );
    if (topFornecedoresElement) {
      topFornecedoresElement.innerHTML = ``;
    }

    // Card 2 - Análise por Área
    const porAreaElement = document.getElementById("indicadoresPorAreaContent");
    if (porAreaElement) {
      porAreaElement.innerHTML = ``;
    }

    // SEÇÃO 4: WHERE - Distribuição Geográfica

    // Card 1 - Mapa por Estados
    const mapaEstadosElement = document.getElementById(
      "indicadoresMapaEstadosContent"
    );
    if (mapaEstadosElement) {
      mapaEstadosElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando mapa do Brasil</h5>
          <p>Buscando dados dos estados<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 2 - Contratos por Região
    const porRegiaoElement = document.getElementById(
      "indicadoresPorRegiaoContent"
    );
    if (porRegiaoElement) {
      porRegiaoElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando dados regionais</h5>
          <p>Buscando contratos por região<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // SEÇÃO 5: WHEN - Análise Temporal

    // Card 1 - Cronograma de Vencimentos
    const cronogramaElement = document.getElementById(
      "indicadoresCronogramaContent"
    );
    if (cronogramaElement) {
      cronogramaElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando cronograma de vencimentos</h5>
          <p>Buscando dados de prazos e vencimentos<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 2 - Vigência e Prazos
    const vigenciaPrazosElement = document.getElementById(
      "indicadoresVigenciaPrazosContent"
    );
    if (vigenciaPrazosElement) {
      vigenciaPrazosElement.innerHTML = ``;
    }

    // SEÇÃO 6: HOW - Métodos e Eficiência

    // Card 1 - Contratos com Cláusulas
    const clausulasElement = document.getElementById(
      "indicadoresClausulasContent"
    );
    if (clausulasElement) {
      clausulasElement.innerHTML = ``;
    }

    // Card 2 - Distribuição de Carga de Trabalho
    const modalidadesElement = document.getElementById(
      "indicadoresModalidadesContent"
    );
    if (modalidadesElement) {
      modalidadesElement.innerHTML = `
        <div class="indicadores-loading">
          <div class="indicadores-loading-spinner"></div>
          <p>Analisando distribuição de carga de trabalho<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 3 - Eficiência Processual
    const eficienciaElement = document.getElementById(
      "indicadoresEficienciaContent"
    );
    if (eficienciaElement) {
      eficienciaElement.innerHTML = ``;
    }

    // SEÇÃO 7: HOW MUCH - Análise Financeira

    // Card 1 - Valores por Categoria
    const valoresCategoriaElement = document.getElementById(
      "indicadoresValoresCategoriaContent"
    );
    if (valoresCategoriaElement) {
      valoresCategoriaElement.innerHTML = ``;
    }

    // Card 2 - Evolução Financeira
    const evolucaoFinanceiraElement = document.getElementById(
      "indicadoresEvolucaoFinanceiraContent"
    );
    if (evolucaoFinanceiraElement) {
      evolucaoFinanceiraElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando evolução financeira</h5>
          <p>Buscando projeção de valores mensais<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // SEÇÃO 8: INSIGHTS EXECUTIVOS

    // Card 1 - Alertas e Riscos
    const alertasElement = document.getElementById("indicadoresAlertasContent");
    if (alertasElement) {
      alertasElement.innerHTML = ``;
    }

    // Card 2 - Oportunidades
    const oportunidadesElement = document.getElementById(
      "indicadoresOportunidadesContent"
    );
    if (oportunidadesElement) {
      oportunidadesElement.innerHTML = `
        <div class="indicadores-map-loading">
          <div class="indicadores-map-loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <h5>Carregando oportunidades</h5>
          <p>Buscando contratos sem empenhos associados<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
        </div>
      `;
    }

    // Card 3 - Ações Prioritárias
    const acoesElement = document.getElementById("indicadoresAcoesContent");
    if (acoesElement) {
      acoesElement.innerHTML = ``;
    }

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

      // Card 3 - Contratos com Variações Significativas
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos com Variações Significativas",
          subtitle:
            "Análise comparativa entre valores inicial e global dos contratos",
          icon: "fas fa-chart-bar",
          actions: [], // Sem botões para economizar espaço
        },
        "indicadores-contratos-variacoes-header"
      );

      console.log(
        "Indicadores card headers Análise de Processos (3 cards) initialized dynamically"
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
          subtitle:
            "Visualização geográfica da distribuição nacional contratos → unidades → municipios",
          icon: "fas fa-map",
          actions: [],
        },
        "indicadores-mapa-estados-header"
      );

      // Card 2 - Contratos por Região
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos por Região",
          subtitle:
            "Concentração regional das contratações contratos → unidades → municipios",
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
          title: "Distribuição de Carga de Trabalho",
          subtitle: "Top responsáveis com maior número de contratos",
          icon: "fas fa-users-cog",
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
          title: "Projeção de Valores Mensais",
          subtitle: "Previsão dos valores contratuais para os próximos 6 meses",
          icon: "fas fa-chart-line",
          actions: [],
        },
        "indicadores-evolucao-financeira-header"
      );

      // === SEÇÃO 8: INSIGHTS EXECUTIVOS ===

      // Card 1 - Alertas e Riscos
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos com Variações Significativas",
          subtitle: "Contratos com aumentos ≥ 25% entre valor inicial e global",
          icon: "fas fa-chart-line",
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

  // Simple modal manager for agenda functions
  createSimpleModalManager() {
    let currentModal = null;
    let modalCounter = 0;

    const manager = {
      initialize() {
        console.log("Simple modal manager initialized");
      },

      open() {
        console.log("🚀 Modal manager open() called");

        // Create modal elements if they don't exist
        if (currentModal) {
          console.log("📦 Closing existing modal");
          this.close();
        }

        modalCounter++;
        const modalId = `simple-modal-${modalCounter}`;

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
            <h3 id="${modalId}-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #333;">Modal Title</h3>
            <button id="${modalId}-close" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px; color: #666; border-radius: 4px;">✕</button>
          </div>
          <div id="${modalId}-body" style="padding: 20px;">Modal content</div>
        `;

        scrim.appendChild(modalContent);
        document.body.appendChild(scrim);

        // Add close event listeners
        scrim.addEventListener("click", (e) => {
          if (e.target === scrim) {
            this.close();
          }
        });

        const closeBtn = document.getElementById(`${modalId}-close`);
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            this.close();
          });
        }

        // Prevent body scrolling
        document.body.style.overflow = "hidden";

        currentModal = { scrim, modalId };
        console.log("✅ Modal opened successfully with ID:", modalId);
      },

      close() {
        if (
          currentModal &&
          currentModal.scrim &&
          currentModal.scrim.parentNode
        ) {
          currentModal.scrim.parentNode.removeChild(currentModal.scrim);
          currentModal = null;
          document.body.style.overflow = "";
        }
      },

      setTitle(title) {
        if (currentModal) {
          const titleEl = document.getElementById(
            `${currentModal.modalId}-title`
          );
          if (titleEl) titleEl.textContent = title;
        }
      },

      setBody(content) {
        if (currentModal) {
          const bodyEl = document.getElementById(
            `${currentModal.modalId}-body`
          );
          if (bodyEl) bodyEl.innerHTML = content;
        }
      },
    };

    // Auto-initialize
    manager.initialize();
    return manager;
  },
};
