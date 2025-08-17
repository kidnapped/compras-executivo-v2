export default {
  // Variável para controlar execuções múltiplas
  lastAutoInitTime: 0,
  isInitializing: false,
  
  // Método único para inicialização completa via SPA
  indicadores_initComplete() {
    console.log('🔧 indicadores_initComplete() chamado via SPA');
    
    // Evitar execução dupla
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log('⚠️ indicadores_initComplete() ignorado - muito recente (debounce)');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log('⚠️ indicadores_initComplete() ignorado - já está inicializando');
      return;
    }
    
    this.lastAutoInitTime = now;
    this.isInitializing = true;
    
    // Verifica se estamos na página correta
    const indicadoresPage = document.querySelector('.indicadores-page');
    console.log('🔍 Elemento .indicadores-page encontrado:', !!indicadoresPage);
    
    if (indicadoresPage) {
      console.log('✅ Página de indicadores detectada - iniciando componentes...');
      
      setTimeout(() => {
        console.log('🔧 Inicializando componentes dos indicadores...');
        
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
          
          console.log('✅ Todos os componentes dos indicadores foram inicializados!');
        } catch (error) {
          console.error('❌ Erro ao inicializar componentes dos indicadores:', error);
        } finally {
          this.isInitializing = false;
        }
      }, 100);
    } else {
      console.log('⚠️ Página de indicadores não detectada - elemento .indicadores-page não encontrado');
      this.isInitializing = false;
    }
  },

  // Método para inicialização automática quando o módulo é carregado
  autoInit() {
    console.log('🔧 Indicadores.autoInit() chamado');
    
    // Evitar execuções múltiplas muito próximas (debounce de 1 segundo)
    const now = Date.now();
    if (now - this.lastAutoInitTime < 1000) {
      console.log('⚠️ autoInit() ignorado - muito recente (debounce)');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializing) {
      console.log('⚠️ autoInit() ignorado - já está inicializando');
      return;
    }
    
    this.lastAutoInitTime = now;
    this.isInitializing = true;
    
    // Verifica se estamos na página correta procurando pelo elemento principal
    const indicadoresPage = document.querySelector('.indicadores-page');
    console.log('🔍 Elemento .indicadores-page encontrado:', !!indicadoresPage);
    
    if (indicadoresPage) {
      console.log('✅ Página de indicadores detectada - iniciando componentes...');
      
      // Se encontrou o elemento, inicializa automaticamente
      setTimeout(() => {
        console.log('🔧 Inicializando componentes dos indicadores...');
        
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
          
          console.log('✅ Todos os componentes dos indicadores foram inicializados!');
        } catch (error) {
          console.error('❌ Erro ao inicializar componentes dos indicadores:', error);
        } finally {
          this.isInitializing = false;
        }
      }, 100); // Pequeno delay para garantir que todos os elementos estejam carregados
    } else {
      console.log('⚠️ Página de indicadores não detectada - elemento .indicadores-page não encontrado');
      this.isInitializing = false;
    }
  },

  // Nova função para inicializar o breadcrumb dinamicamente
  indicadores_initBreadcrumb() {
    console.log('🔧 Inicializando breadcrumb dos indicadores...');
    
    // Verifica se o módulo breadcrumb está disponível
    if (typeof App !== "undefined" && App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic) {
      const breadcrumbItems = [
        {title: 'Página Inicial', icon: 'fas fa-home', url: '/inicio'},
        {title: 'Indicadores', icon: 'fas fa-tachometer-alt', url: ''}
      ];
      
      App.breadcrumb.breadcrumb_createDynamic(breadcrumbItems, 'indicadores-breadcrumb-dynamic-container');
      console.log('✅ Breadcrumb Indicadores initialized dynamically');
    } else {
      console.warn('❌ Breadcrumb module not available - App:', typeof App, 'breadcrumb:', App?.breadcrumb ? 'exists' : 'missing');
      console.warn('⏳ Retrying in 500ms...');
      // Retry after a short delay if breadcrumb is not available yet
      setTimeout(() => {
        this.indicadores_initBreadcrumb();
      }, 500);
    }
  },

  // Nova função para inicializar o tópico de visão geral dinamicamente
  initTopicoVisaoGeral() {
    console.log('🔧 Inicializando tópico Visão Geral...');
    
    // Verifica se o módulo topico está disponível
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Visão Geral dos Contratos',
        description: 'Panorama executivo dos indicadores principais',
        icon: 'fas fa-chart-line',
        tags: [
          {
            text: 'Atualizado',
            type: 'success',
            icon: 'fas fa-sync-alt',
            title: 'Dados sincronizados hoje'
          },
        ],
        actions: [
          {
            icon: 'fas fa-filter',
            text: 'Filtros',
            title: 'Configurar filtros de visualização',
            onclick: 'App.indicadores.indicadores_showFilters()',
            type: 'secondary'
          },
          {
            icon: 'fas fa-cog',
            text: 'Configurar',
            title: 'Configurações do dashboard',
            onclick: 'App.indicadores.indicadores_showSettings()',
            type: 'secondary'
          }
        ]
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-visao-geral-container');
      console.log('✅ Topico Visão Geral initialized dynamically');
    } else {
      console.warn('❌ Topico module not available - App:', typeof App, 'topico:', App?.topico ? 'exists' : 'missing');
      console.warn('⏳ Retrying in 500ms...');
      // Retry after a short delay if topico is not available yet
      setTimeout(() => {
        this.initTopicoVisaoGeral();
      }, 500);
    }
  },

  // SEÇÃO 2: WHY - Análise de Processos
  initTopicoAnaliseProcessos() {
    // Verifica se o módulo topico está disponível
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Análise de Processos',
        description: 'Entenda os motivos e padrões das contratações',
        icon: 'fas fa-search',
        tags: [
          {
            text: 'Processos',
            type: 'warning',
            icon: 'fas fa-cogs',
            title: 'Análise de processos licitatórios'
          },
        ],
        actions: [
          {
            icon: 'fas fa-filter',
            text: 'Filtros',
            title: 'Configurar filtros de análise',
            onclick: 'App.indicadores.indicadores_showFiltersAnaliseProcessos()',
            type: 'secondary'
          },
          {
            icon: 'fas fa-cog',
            text: 'Configurar',
            title: 'Configurações da análise',
            onclick: 'App.indicadores.indicadores_showSettingsAnaliseProcessos()',
            type: 'secondary'
          }
        ]
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-analise-processos-container');
      console.log('Topico Análise de Processos initialized dynamically');
    } else {
      console.warn('Topico module not available - retrying in 500ms');
      // Retry after a short delay if topico is not available yet
      setTimeout(() => {
        this.initTopicoAnaliseProcessos();
      }, 500);
    }
  },

  // SEÇÃO 3: WHO - Fornecedores e Contratantes
  initTopicoFornecedoresContratantes() {
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Fornecedores e Contratantes',
        description: 'Perfil dos principais atores nas contratações',
        icon: 'fas fa-users',
        tags: [
          {
            text: 'Atores',
            type: 'info',
            icon: 'fas fa-handshake',
            title: 'Análise de fornecedores e contratantes'
          },
        ],
        actions: []
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-fornecedores-contratantes-container');
      console.log('Topico Fornecedores e Contratantes initialized dynamically');
    } else {
      setTimeout(() => {
        this.initTopicoFornecedoresContratantes();
      }, 500);
    }
  },

  // SEÇÃO 4: WHERE - Distribuição Geográfica
  initTopicoDistribuicaoGeografica() {
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Distribuição Geográfica',
        description: 'Localização e concentração das contratações',
        icon: 'fas fa-map-marked-alt',
        tags: [
          {
            text: 'Geografia',
            type: 'primary',
            icon: 'fas fa-globe-americas',
            title: 'Distribuição territorial'
          },
        ],
        actions: []
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-distribuicao-geografica-container');
      console.log('Topico Distribuição Geográfica initialized dynamically');
    } else {
      setTimeout(() => {
        this.initTopicoDistribuicaoGeografica();
      }, 500);
    }
  },

  // SEÇÃO 5: WHEN - Análise Temporal
  initTopicoAnaliseTemporal() {
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Análise Temporal',
        description: 'Cronogramas, prazos e tendências temporais',
        icon: 'fas fa-calendar-alt',
        tags: [
          {
            text: 'Temporal',
            type: 'secondary',
            icon: 'fas fa-clock',
            title: 'Análise de prazos e cronogramas'
          },
        ],
        actions: []
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-analise-temporal-container');
      console.log('Topico Análise Temporal initialized dynamically');
    } else {
      setTimeout(() => {
        this.initTopicoAnaliseTemporal();
      }, 500);
    }
  },

  // SEÇÃO 6: HOW - Métodos e Eficiência
  initTopicoMetodosEficiencia() {
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Métodos e Eficiência',
        description: 'Processos, modalidades e qualidade da execução',
        icon: 'fas fa-cogs',
        tags: [
          {
            text: 'Eficiência',
            type: 'success',
            icon: 'fas fa-tachometer-alt',
            title: 'Indicadores de eficiência processual'
          },
        ],
        actions: []
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-metodos-eficiencia-container');
      console.log('Topico Métodos e Eficiência initialized dynamically');
    } else {
      setTimeout(() => {
        this.initTopicoMetodosEficiencia();
      }, 500);
    }
  },

  // SEÇÃO 7: HOW MUCH - Análise Financeira
  initTopicoAnaliseFinanceira() {
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Análise Financeira',
        description: 'Valores, custos e impacto econômico das contratações',
        icon: 'fas fa-dollar-sign',
        tags: [
          {
            text: 'Financeiro',
            type: 'success',
            icon: 'fas fa-chart-bar',
            title: 'Análise de valores e custos'
          },
        ],
        actions: []
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-analise-financeira-container');
      console.log('Topico Análise Financeira initialized dynamically');
    } else {
      setTimeout(() => {
        this.initTopicoAnaliseFinanceira();
      }, 500);
    }
  },

  // SEÇÃO 8: INSIGHTS EXECUTIVOS
  initTopicoInsightsExecutivos() {
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Insights e Recomendações',
        description: 'Análise estratégica e sugestões de melhorias',
        icon: 'fas fa-lightbulb',
        tags: [
          {
            text: 'Estratégico',
            type: 'warning',
            icon: 'fas fa-brain',
            title: 'Insights e recomendações executivas'
          },
        ],
        actions: []
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'indicadores-topico-insights-executivos-container');
      console.log('Topico Insights Executivos initialized dynamically');
    } else {
      setTimeout(() => {
        this.initTopicoInsightsExecutivos();
      }, 500);
    }
  },

  // Função para inicializar o mapa do Brasil
  async indicadores_initMapaBrasil() {
    try {
      const containerId = 'indicadoresMapaEstadosContent';
      console.log('Iniciando carregamento do mapa do Brasil...');
      
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.warn('Container do mapa não encontrado:', containerId);
        return;
      }

      console.log('Container encontrado, aguardando loading inicial...');
      
      // Não substitui o loading - apenas aguarda um pouco para que seja visível
      // O loading já foi definido em indicadores_fillCardContent()
      
      console.log('Aguardando delay para visualização do loading...');
      
      // Delay para que o loading seja bem visível
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Buscando dados do mapa...');

      // Buscar dados do mapa
      const response = await fetch('/indicadores/mapa-estados');
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
      if (typeof echarts === 'undefined') {
        throw new Error('ECharts não está disponível globalmente');
      }

      // Verificar se brazilStatesGeoJson está disponível no window
      if (typeof window.brazilStatesGeoJson === 'undefined') {
        throw new Error('Dados geográficos do Brasil não estão disponíveis no window');
      }      // Criar container para o mapa
      container.innerHTML = `
        <div class="mapa-estados-container">
          <div id="mapa-estados-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById('mapa-estados-chart');

      // Registrar o mapa do Brasil
      echarts.registerMap("BR", window.brazilStatesGeoJson);

      // Criar mapeamento de siglas para nomes completos a partir do próprio GeoJSON
      const estadosNomes = {};
      if (window.brazilStatesGeoJson && window.brazilStatesGeoJson.features) {
        window.brazilStatesGeoJson.features.forEach(feature => {
          if (feature.properties && feature.properties.PK_sigla && feature.properties.Estado) {
            estadosNomes[feature.properties.PK_sigla] = feature.properties.Estado;
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#5F70A5',
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: 'Rawline, Arial, sans-serif'
          },
          formatter: (params) => {
            const nomeCompleto = estadosNomes[params.name] || params.name;
            const valor = typeof params.value === "number" && !isNaN(params.value) 
              ? params.value.toLocaleString('pt-BR') 
              : '0';
            
            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${nomeCompleto}
              </div>
              <div class="indicadores-tooltip-value">
                <span class="indicadores-tooltip-number">${valor}</span> contratos
              </div>
            </div>`;
          }
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
              max: 3.0
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
        resizeListener: resizeListener
      };

      console.log('Mapa do Brasil inicializado com sucesso');

    } catch (error) {
      console.error('Erro ao inicializar mapa do Brasil:', error);
      const container = document.getElementById('indicadoresMapaEstadosContent');
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
      const containerId = 'indicadoresPorRegiaoContent';
      console.log('Iniciando carregamento do gráfico de regiões...');
      
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.warn('Container do gráfico de regiões não encontrado:', containerId);
        return;
      }

      console.log('Container encontrado, aguardando loading inicial...');
      
      // Delay para que o loading seja bem visível
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Buscando dados das regiões...');

      // Buscar dados das regiões
      const response = await fetch('/indicadores/contratos-por-regiao');
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Preparar dados para o gráfico
      const chartData = (data.regioes || []).map((regiao) => ({
        name: regiao.regiao,
        value: Number(regiao.total_contratos) || 0,
      }));

      console.log('Dados do gráfico preparados:', chartData);

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
      if (typeof echarts === 'undefined') {
        throw new Error('ECharts não está disponível globalmente');
      }
      
      console.log('ECharts disponível, versão:', echarts.version || 'desconhecida');

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-grafico-regiao-container">
          <div id="indicadores-grafico-regiao-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById('indicadores-grafico-regiao-chart');
      
      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error('Elemento do gráfico não foi criado corretamente');
      }

      console.log('Container do gráfico criado:', chartDiv.offsetWidth, 'x', chartDiv.offsetHeight);

      // Aguardar o DOM estar totalmente renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn('Container tem dimensões inválidas, tentando forçar layout...');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '380px';
        chartDiv.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Configuração do gráfico de barras horizontais
      const chartOption = {
        tooltip: {
          trigger: "axis",
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#5F70A5',
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: 'Rawline, Arial, sans-serif'
          },
          axisPointer: {
            type: 'shadow'
          },
          formatter: (params) => {
            const data = params[0];
            const valor = typeof data.value === "number" && !isNaN(data.value)
              ? data.value.toLocaleString('pt-BR')
              : '0';
            
            return `<div class="indicadores-tooltip">
              <div class="indicadores-tooltip-title">
                ${data.name}
              </div>
              <div class="indicadores-tooltip-value">
                <span class="indicadores-tooltip-number">${valor}</span> contratos
              </div>
            </div>`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '5%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLabel: {
            formatter: (value) => value.toLocaleString('pt-BR'),
            fontSize: 11
          }
        },
        yAxis: {
          type: 'category',
          data: chartData.map(item => item.name),
          axisLabel: {
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        series: [
          {
            name: "Contratos por Região",
            type: "bar",
            data: chartData.map(item => ({
              name: item.name,
              value: item.value
            })),
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: (params) => {
                // Cores ordenadas da mais escura para a mais clara
                const colors = ['#8B9ED6', '#A2B2E3', '#B9C6ED', '#D0D9F6', '#E5EBFB'];
                return colors[params.dataIndex % colors.length];
              }
            },
            label: {
              show: true,
              position: 'right',
              formatter: (params) => params.value.toLocaleString('pt-BR'),
              fontSize: 11,
              fontWeight: 'bold',
              color: '#333'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ],
        backgroundColor: 'transparent'
      };

      // Inicializar o chart
      console.log('Inicializando gráfico ECharts...', chartData);
      console.log('Dimensões finais do container:', chartDiv.offsetWidth, 'x', chartDiv.offsetHeight);
      
      const chart = echarts.init(chartDiv);
      
      // Verificar se o chart foi inicializado
      if (!chart) {
        throw new Error('Falha ao inicializar o gráfico ECharts');
      }
      
      console.log('Aplicando configurações do gráfico...');
      chart.setOption(chartOption);
      
      // Forçar o redimensionamento inicial com múltiplas tentativas
      setTimeout(() => {
        chart.resize();
        console.log('Gráfico redimensionado (1ª tentativa)');
      }, 100);
      
      setTimeout(() => {
        chart.resize();
        console.log('Gráfico redimensionado (2ª tentativa)');
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
        resizeListener: resizeListener
      };

      console.log('Gráfico de regiões inicializado com sucesso');

    } catch (error) {
      console.error('Erro ao inicializar gráfico de regiões:', error);
      const container = document.getElementById('indicadoresPorRegiaoContent');
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

  // Função para inicializar o gráfico donut de contratos sem licitação
  async indicadores_initGraficoSemLicitacao() {
    try {
      const containerId = 'indicadoresSemLicitacaoContent';
      console.log('Iniciando carregamento do gráfico de contratos sem licitação...');
      
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.warn('Container do gráfico sem licitação não encontrado:', containerId);
        return;
      }

      console.log('Container encontrado, aguardando loading inicial...');
      
      // Delay para que o loading seja bem visível
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Buscando dados dos contratos sem licitação...');

      // Buscar dados dos contratos sem licitação
      const response = await fetch('/indicadores/contratos-sem-licitacao');
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Preparar dados para o gráfico donut
      const chartData = (data.tipos_contratacao || []).map((tipo) => ({
        name: tipo.tipo,
        value: Number(tipo.total_contratos) || 0,
      }));

      console.log('Dados do gráfico preparados:', chartData);

      // Verificar se há dados para exibir
      if (!chartData || chartData.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info" role="alert">
            <i class="fas fa-info-circle"></i>
            Nenhum dado de licitação encontrado
          </div>
        `;
        return;
      }

      // Verificar se echarts está disponível globalmente
      if (typeof echarts === 'undefined') {
        throw new Error('ECharts não está disponível globalmente');
      }
      
      console.log('ECharts disponível, versão:', echarts.version || 'desconhecida');

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-sem-licitacao-container">
          <div id="indicadores-sem-licitacao-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById('indicadores-sem-licitacao-chart');
      
      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error('Elemento do gráfico não foi criado corretamente');
      }

      console.log('Container do gráfico criado:', chartDiv.offsetWidth, 'x', chartDiv.offsetHeight);

      // Aguardar o DOM estar totalmente renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn('Container tem dimensões inválidas, tentando forçar layout...');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '250px';
        chartDiv.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Cores para o gráfico donut
      const colors = ['#5F70A5', '#8B9ED6', '#A2B2E3', '#B9C6ED', '#D0D9F6'];

      // Configuração do gráfico donut
      const chartOption = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#5F70A5',
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: 'Rawline, Arial, sans-serif'
          },
          formatter: (params) => {
            const valor = typeof params.value === "number" && !isNaN(params.value)
              ? params.value.toLocaleString('pt-BR')
              : '0';
            const percentual = typeof params.percent === "number" && !isNaN(params.percent)
              ? params.percent.toFixed(1)
              : '0.0';
            
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
          }
        },
        legend: {
          bottom: '5%',
          left: 'center',
          textStyle: {
            fontSize: 11,
            fontFamily: 'Rawline, Arial, sans-serif',
            color: '#333'
          },
          itemGap: 15
        },
        series: [
          {
            name: 'Contratos por Tipo de Licitação',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: false,
                fontSize: 16,
                fontWeight: 'bold',
                color: '#5F70A5',
                formatter: (params) => {
                  const valor = typeof params.value === "number" && !isNaN(params.value)
                    ? params.value.toLocaleString('pt-BR')
                    : '0';
                  return `${params.name}\n${valor}`;
                }
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            labelLine: {
              show: false
            },
            data: chartData.map((item, index) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: colors[index % colors.length]
              }
            }))
          }
        ],
        backgroundColor: 'transparent'
      };

      // Inicializar o chart
      console.log('Inicializando gráfico donut ECharts...', chartData);
      console.log('Dimensões finais do container:', chartDiv.offsetWidth, 'x', chartDiv.offsetHeight);
      
      const chart = echarts.init(chartDiv);
      
      // Verificar se o chart foi inicializado
      if (!chart) {
        throw new Error('Falha ao inicializar o gráfico ECharts');
      }
      
      console.log('Aplicando configurações do gráfico...');
      chart.setOption(chartOption);
      
      // Forçar o redimensionamento inicial com múltiplas tentativas
      setTimeout(() => {
        chart.resize();
        console.log('Gráfico donut redimensionado (1ª tentativa)');
      }, 100);
      
      setTimeout(() => {
        chart.resize();
        console.log('Gráfico donut redimensionado (2ª tentativa)');
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
        resizeListener: resizeListener
      };

      console.log('Gráfico donut de contratos sem licitação inicializado com sucesso');

    } catch (error) {
      console.error('Erro ao inicializar gráfico de contratos sem licitação:', error);
      const container = document.getElementById('indicadoresSemLicitacaoContent');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle"></i>
            Erro ao carregar o gráfico de contratos sem licitação: ${error.message}
          </div>
        `;
      }
    }
  },

  // Função para inicializar o gráfico donut de contratos com aditivos
  async indicadores_initGraficoComAditivos() {
    try {
      const containerId = 'indicadoresComAditivosContent';
      console.log('Iniciando carregamento do gráfico de contratos com aditivos...');
      
      const container = document.getElementById(containerId);
      
      if (!container) {
        console.warn('Container do gráfico com aditivos não encontrado:', containerId);
        return;
      }

      console.log('Container encontrado, aguardando loading inicial...');
      
      // Delay para que o loading seja bem visível
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Buscando dados dos contratos com aditivos...');

      // Buscar dados dos contratos com aditivos
      const response = await fetch('/indicadores/contratos-com-aditivos');
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Preparar dados para o gráfico donut
      const chartData = (data.tipos_contratacao || []).map((tipo) => ({
        name: tipo.tipo,
        value: Number(tipo.total_contratos) || 0,
      }));

      console.log('Dados do gráfico preparados:', chartData);

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
      if (typeof echarts === 'undefined') {
        throw new Error('ECharts não está disponível globalmente');
      }
      
      console.log('ECharts disponível, versão:', echarts.version || 'desconhecida');

      // Criar container para o gráfico
      container.innerHTML = `
        <div class="indicadores-com-aditivos-container">
          <div id="indicadores-com-aditivos-chart"></div>
        </div>
      `;

      const chartDiv = document.getElementById('indicadores-com-aditivos-chart');
      
      // Verificar se o elemento foi criado corretamente
      if (!chartDiv) {
        throw new Error('Elemento do gráfico não foi criado corretamente');
      }

      console.log('Container do gráfico criado:', chartDiv.offsetWidth, 'x', chartDiv.offsetHeight);

      // Aguardar o DOM estar totalmente renderizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verificar dimensões do container
      if (chartDiv.offsetWidth === 0 || chartDiv.offsetHeight === 0) {
        console.warn('Container tem dimensões inválidas, tentando forçar layout...');
        chartDiv.style.width = '100%';
        chartDiv.style.height = '250px';
        chartDiv.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Cores para o gráfico donut (tons de laranja esmaecidos, seguindo o padrão dos azuis)
      const colors = ['#D2691E', '#F4A460', '#FFB347', '#FFDAB9', '#FFF8DC'];

      // Configuração do gráfico donut
      const chartOption = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#D2691E',
          borderWidth: 2,
          borderRadius: 8,
          padding: [12, 16],
          textStyle: {
            fontSize: 14,
            fontFamily: 'Rawline, Arial, sans-serif'
          },
          formatter: (params) => {
            const valor = typeof params.value === "number" && !isNaN(params.value)
              ? params.value.toLocaleString('pt-BR')
              : '0';
            const percentual = typeof params.percent === "number" && !isNaN(params.percent)
              ? params.percent.toFixed(1)
              : '0.0';
            
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
          }
        },
        legend: {
          bottom: '5%',
          left: 'center',
          textStyle: {
            fontSize: 11,
            fontFamily: 'Rawline, Arial, sans-serif',
            color: '#333'
          },
          itemGap: 15
        },
        series: [
          {
            name: 'Contratos por Tipo de Aditivo',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: false,
                fontSize: 16,
                fontWeight: 'bold',
                color: '#D2691E',
                formatter: (params) => {
                  const valor = typeof params.value === "number" && !isNaN(params.value)
                    ? params.value.toLocaleString('pt-BR')
                    : '0';
                  return `${params.name}\n${valor}`;
                }
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            labelLine: {
              show: false
            },
            data: chartData.map((item, index) => ({
              name: item.name,
              value: item.value,
              itemStyle: {
                color: colors[index % colors.length]
              }
            }))
          }
        ],
        backgroundColor: 'transparent'
      };

      // Inicializar o chart
      console.log('Inicializando gráfico donut ECharts...', chartData);
      console.log('Dimensões finais do container:', chartDiv.offsetWidth, 'x', chartDiv.offsetHeight);
      
      const chart = echarts.init(chartDiv);
      
      // Verificar se o chart foi inicializado
      if (!chart) {
        throw new Error('Falha ao inicializar o gráfico ECharts');
      }
      
      console.log('Aplicando configurações do gráfico...');
      chart.setOption(chartOption);
      
      // Forçar o redimensionamento inicial com múltiplas tentativas
      setTimeout(() => {
        chart.resize();
        console.log('Gráfico donut aditivos redimensionado (1ª tentativa)');
      }, 100);
      
      setTimeout(() => {
        chart.resize();
        console.log('Gráfico donut aditivos redimensionado (2ª tentativa)');
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
        resizeListener: resizeListener
      };

      console.log('Gráfico donut de contratos com aditivos inicializado com sucesso');

    } catch (error) {
      console.error('Erro ao inicializar gráfico de contratos com aditivos:', error);
      const container = document.getElementById('indicadoresComAditivosContent');
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

  indicadores_init() {
    console.log('🔧 indicadores_init() chamado');
    
    // Evitar execuções múltiplas dos gráficos
    if (this.isInitializingGraphics) {
      console.log('⚠️ indicadores_init() ignorado - gráficos já estão sendo inicializados');
      return;
    }
    
    // Só inicializa se estivermos na página correta
    if (!this.indicadores_initElements()) {
      console.log('❌ Indicadores elements not found, skipping initialization');
      return;
    }
    
    console.log('✅ Elementos encontrados, inicializando cards...');
    
    // Inicializa os headers dos cards
    this.indicadores_initCardHeaders();
    this.indicadores_initCardHeadersAnaliseProcessos();
    this.indicadores_initAllOtherCardHeaders();
    
    // Preenche o conteúdo dos cards
    this.indicadores_fillCardContent();
    
    console.log('✅ Card headers e conteúdo inicializados, iniciando gráficos...');
    
    // Marcar que estamos inicializando gráficos
    this.isInitializingGraphics = true;
    
    // Inicializa o mapa do Brasil e gráfico de regiões de forma assíncrona
    setTimeout(() => {
      console.log('🗺️ Inicializando mapa do Brasil...');
      this.indicadores_initMapaBrasil();
    }, 500);
    
    // Inicializar o gráfico de regiões com delay adicional
    setTimeout(() => {
      console.log('📊 Inicializando gráfico de regiões...');
      this.indicadores_initGraficoRegiao();
    }, 1000);
    
    // Inicializar o gráfico donut de contratos sem licitação
    setTimeout(() => {
      console.log('🍩 Inicializando gráfico sem licitação...');
      this.indicadores_initGraficoSemLicitacao();
    }, 1500);
    
    // Inicializar o gráfico donut de contratos com aditivos
    setTimeout(() => {
      console.log('🍩 Inicializando gráfico com aditivos...');
      this.indicadores_initGraficoComAditivos();
      
      // Resetar flag após todos os gráficos serem inicializados
      setTimeout(() => {
        this.isInitializingGraphics = false;
        console.log('🔄 Flag de inicialização de gráficos resetada');
      }, 1000);
    }, 2000);
    
    console.log('✅ Indicadores initialized successfully');
  },

  // Nova função para preencher o conteúdo de todos os cards
  indicadores_fillCardContent() {
    // SEÇÃO 1: WHAT - Visão Geral dos Contratos
    
    // Card 1 - Total de Contratos
    document.getElementById('indicadoresTotalContratosContent').innerHTML = ``;

    // Card 2 - Contratos por Exercício  
    document.getElementById('indicadoresExercicioContent').innerHTML = ``;

    // Card 3 - Contratos Vigentes
    document.getElementById('indicadoresVigentesContent').innerHTML = ``;

    // Card 4 - Status Críticos
    document.getElementById('indicadoresCriticosContent').innerHTML = ``;

    // SEÇÃO 2: WHY - Análise de Processos

    // Card 1 - Contratos sem Licitação
    document.getElementById('indicadoresSemLicitacaoContent').innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando contratos sem licitação</h5>
        <p>Buscando dados de dispensas e inexigibilidades<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 2 - Contratos com Aditivos
    document.getElementById('indicadoresComAditivosContent').innerHTML = `
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
    document.getElementById('indicadoresTopFornecedoresContent').innerHTML = ``;

    // Card 2 - Análise por Área
    document.getElementById('indicadoresPorAreaContent').innerHTML = ``;

    // SEÇÃO 4: WHERE - Distribuição Geográfica

    // Card 1 - Mapa por Estados
    document.getElementById('indicadoresMapaEstadosContent').innerHTML = `
      <div class="indicadores-map-loading">
        <div class="indicadores-map-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h5>Carregando mapa do Brasil</h5>
        <p>Buscando dados dos estados<span class="indicadores-loading-dots"><span></span><span></span><span></span></span></p>
      </div>
    `;

    // Card 2 - Contratos por Região
    document.getElementById('indicadoresPorRegiaoContent').innerHTML = `
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
    document.getElementById('indicadoresCronogramaContent').innerHTML = ``;

    // Card 2 - Vigência e Prazos
    document.getElementById('indicadoresVigenciaPrazosContent').innerHTML = ``;

    // SEÇÃO 6: HOW - Métodos e Eficiência

    // Card 1 - Contratos com Cláusulas
    document.getElementById('indicadoresClausulasContent').innerHTML = ``;

    // Card 2 - Modalidades de Contratação
    document.getElementById('indicadoresModalidadesContent').innerHTML = ``;

    // Card 3 - Eficiência Processual
    document.getElementById('indicadoresEficienciaContent').innerHTML = ``;

    // SEÇÃO 7: HOW MUCH - Análise Financeira

    // Card 1 - Valores por Categoria
    document.getElementById('indicadoresValoresCategoriaContent').innerHTML = ``;

    // Card 2 - Evolução Financeira
    document.getElementById('indicadoresEvolucaoFinanceiraContent').innerHTML = ``;

    // SEÇÃO 8: INSIGHTS EXECUTIVOS

    // Card 1 - Alertas e Riscos
    document.getElementById('indicadoresAlertasContent').innerHTML = ``;

    // Card 2 - Oportunidades
    document.getElementById('indicadoresOportunidadesContent').innerHTML = ``;

    // Card 3 - Ações Prioritárias
    document.getElementById('indicadoresAcoesContent').innerHTML = ``;

    console.log('Card content cleared successfully');
  },

  indicadores_initElements() {
    console.log('🔍 Verificando elementos da página de indicadores...');
    
    this.container = document.querySelector('.indicadores-page');
    
    // Verifica se os elementos essenciais existem
    if (!this.container) {
      console.log('❌ Container .indicadores-page não encontrado');
      return false;
    }
    
    console.log('✅ Indicadores elements initialized successfully');
    return true;
  },

  // Nova função para inicializar os headers dos cards dinamicamente
  indicadores_initCardHeaders() {
    console.log('🔧 Inicializando card headers...');
    
    // Verifica se o módulo card header está disponível
    if (typeof App !== "undefined" && App.card_header && App.card_header.card_header_createDynamic) {
      console.log('✅ Módulo card_header disponível, criando headers...');
      
      // === Cards Principais da Página ===
      
      // Card 1 - Total de Contratos
      App.card_header.card_header_createDynamic({
        title: 'Total de Contratos',
        subtitle: 'Volume geral de contratações do sistema',
        icon: 'fas fa-file-contract',
        actions: [] // Sem botões para economizar espaço
      }, 'indicadores-total-contratos-header');

      // Card 2 - Contratos por Exercício
      App.card_header.card_header_createDynamic({
        title: 'Contratos por Exercício',
        subtitle: 'Distribuição anual das contratações por período',
        icon: 'fas fa-calendar-check',
        actions: [] // Sem botões para economizar espaço
      }, 'indicadores-exercicio-header');

      // Card 3 - Contratos Vigentes
      App.card_header.card_header_createDynamic({
        title: 'Contratos Vigentes',
        subtitle: 'Contratos ativos e em execução no momento',
        icon: 'fas fa-play-circle',
        actions: [] // Sem botões para economizar espaço
      }, 'indicadores-vigentes-header');

      // Card 4 - Status Críticos
      App.card_header.card_header_createDynamic({
        title: 'Status Críticos',
        subtitle: 'Situações que requerem atenção imediata',
        icon: 'fas fa-exclamation-triangle',
        actions: [] // Sem botões para economizar espaço
      }, 'indicadores-criticos-header');

      console.log('✅ Indicadores card headers (4 cards) initialized dynamically');
    } else {
      console.warn('❌ CardHeader module not available - App:', typeof App, 'card_header:', App?.card_header ? 'exists' : 'missing');
      console.warn('⏳ Retrying in 500ms...');
      // Retry after a short delay if card header is not available yet
      setTimeout(() => {
        this.indicadores_initCardHeaders();
      }, 500);
    }
  },

  // Nova função para inicializar os headers dos cards da Seção 2 - Análise de Processos
  indicadores_initCardHeadersAnaliseProcessos() {
    // Verifica se o módulo card header está disponível
    if (typeof App !== "undefined" && App.card_header && App.card_header.card_header_createDynamic) {
      
      // === SEÇÃO 2: WHY - Análise de Processos ===
      
      // Card 1 - Contratos sem Licitação
      App.card_header.card_header_createDynamic({
        title: 'Contratos sem Licitação',
        subtitle: 'Análise de contratações diretas e dispensas',
        icon: 'fas fa-ban',
        actions: [] // Sem botões para economizar espaço
      }, 'indicadores-sem-licitacao-header');

      // Card 2 - Contratos com Aditivos
      App.card_header.card_header_createDynamic({
        title: 'Contratos com Aditivos',
        subtitle: 'Contratos que sofreram alterações ou prorrogações',
        icon: 'fas fa-plus-circle',
        actions: [] // Sem botões para economizar espaço
      }, 'indicadores-com-aditivos-header');

      console.log('Indicadores card headers Análise de Processos (2 cards) initialized dynamically');
    } else {
      console.warn('CardHeader module not available - retrying in 500ms');
      // Retry after a short delay if card header is not available yet
      setTimeout(() => {
        this.indicadores_initCardHeadersAnaliseProcessos();
      }, 500);
    }
  },

  // Nova função para inicializar todos os outros headers dos cards dinamicamente
  indicadores_initAllOtherCardHeaders() {
    // Verifica se o módulo card header está disponível
    if (typeof App !== "undefined" && App.card_header && App.card_header.card_header_createDynamic) {
      
      // === SEÇÃO 3: WHO - Fornecedores e Contratantes ===
      
      // Card 1 - Top Fornecedores
      App.card_header.card_header_createDynamic({
        title: 'Top Fornecedores',
        subtitle: 'Ranking dos principais fornecedores por volume',
        icon: 'fas fa-crown',
        actions: []
      }, 'indicadores-top-fornecedores-header');

      // Card 2 - Análise por Área
      App.card_header.card_header_createDynamic({
        title: 'Análise por Área',
        subtitle: 'Distribuição de contratos por área de atuação',
        icon: 'fas fa-building',
        actions: []
      }, 'indicadores-por-area-header');

      // === SEÇÃO 4: WHERE - Distribuição Geográfica ===

      // Card 1 - Mapa por Estados
      App.card_header.card_header_createDynamic({
        title: 'Mapa por Estados',
        subtitle: 'Visualização geográfica da distribuição nacional',
        icon: 'fas fa-map',
        actions: []
      }, 'indicadores-mapa-estados-header');

      // Card 2 - Contratos por Região
      App.card_header.card_header_createDynamic({
        title: 'Contratos por Região',
        subtitle: 'Concentração regional das contratações',
        icon: 'fas fa-chart-pie',
        actions: []
      }, 'indicadores-por-regiao-header');

      // === SEÇÃO 5: WHEN - Análise Temporal ===

      // Card 1 - Cronograma de Vencimentos
      App.card_header.card_header_createDynamic({
        title: 'Cronograma de Vencimentos',
        subtitle: 'Prazos e datas importantes dos contratos',
        icon: 'fas fa-calendar-times',
        actions: []
      }, 'indicadores-cronograma-header');

      // Card 2 - Vigência e Prazos
      App.card_header.card_header_createDynamic({
        title: 'Vigência e Prazos',
        subtitle: 'Análise temporal da duração dos contratos',
        icon: 'fas fa-hourglass-half',
        actions: []
      }, 'indicadores-vigencia-prazos-header');

      // === SEÇÃO 6: HOW - Métodos e Eficiência ===

      // Card 1 - Contratos com Cláusulas
      App.card_header.card_header_createDynamic({
        title: 'Contratos com Cláusulas',
        subtitle: 'Análise de cláusulas especiais e condições',
        icon: 'fas fa-file-signature',
        actions: []
      }, 'indicadores-clausulas-header');

      // Card 2 - Modalidades de Contratação
      App.card_header.card_header_createDynamic({
        title: 'Modalidades de Contratação',
        subtitle: 'Distribuição por tipo de processo licitatório',
        icon: 'fas fa-list-alt',
        actions: []
      }, 'indicadores-modalidades-header');

      // Card 3 - Eficiência Processual
      App.card_header.card_header_createDynamic({
        title: 'Eficiência Processual',
        subtitle: 'Indicadores de desempenho dos processos',
        icon: 'fas fa-tachometer-alt',
        actions: []
      }, 'indicadores-eficiencia-header');

      // === SEÇÃO 7: HOW MUCH - Análise Financeira ===

      // Card 1 - Valores por Categoria
      App.card_header.card_header_createDynamic({
        title: 'Valores por Categoria',
        subtitle: 'Distribuição financeira por categoria de gasto',
        icon: 'fas fa-coins',
        actions: []
      }, 'indicadores-valores-categoria-header');

      // Card 2 - Evolução Financeira
      App.card_header.card_header_createDynamic({
        title: 'Evolução Financeira',
        subtitle: 'Tendências e crescimento dos valores contratuais',
        icon: 'fas fa-chart-line',
        actions: []
      }, 'indicadores-evolucao-financeira-header');

      // === SEÇÃO 8: INSIGHTS EXECUTIVOS ===

      // Card 1 - Alertas e Riscos
      App.card_header.card_header_createDynamic({
        title: 'Alertas e Riscos',
        subtitle: 'Situações que requerem atenção imediata',
        icon: 'fas fa-exclamation-triangle',
        actions: []
      }, 'indicadores-alertas-header');

      // Card 2 - Oportunidades
      App.card_header.card_header_createDynamic({
        title: 'Oportunidades',
        subtitle: 'Identificação de melhorias e otimizações',
        icon: 'fas fa-lightbulb',
        actions: []
      }, 'indicadores-oportunidades-header');

      // Card 3 - Ações Prioritárias
      App.card_header.card_header_createDynamic({
        title: 'Ações Prioritárias',
        subtitle: 'Recomendações de ações estratégicas urgentes',
        icon: 'fas fa-tasks',
        actions: []
      }, 'indicadores-acoes-header');

      console.log('All other Indicadores card headers (6 sections) initialized dynamically');
    } else {
      console.warn('CardHeader module not available - retrying in 500ms');
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
    console.log('Listing active contracts');
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
    console.log('Opening full map view');
    // TODO: Implementar visualização completa do mapa
  },

  compareRegions() {
    console.log('Comparing regions');
    // TODO: Implementar comparação entre regiões
  },

  // WHEN - Análise Temporal
  upcomingDeadlines() {
    console.log('Showing upcoming deadlines');
    // TODO: Implementar próximos vencimentos
  },

  temporalAnalysis() {
    console.log('Performing temporal analysis');
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
    console.log('Optimizing processes');
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
    console.log('Showing all alerts');
    // TODO: Implementar exibição de todos os alertas
  },

  prioritizeOpportunities() {
    console.log('Prioritizing opportunities');
    // TODO: Implementar priorização de oportunidades
  },

  executeActions() {
    console.log('Executing priority actions');
    // TODO: Implementar execução de ações prioritárias
  },

  // Funções adicionais do tópico
  exportExecutiveReport() {
    console.log('Exporting executive report');
    // TODO: Implementar exportação de relatório executivo completo
  },

  // Funções de ação do tópico
  indicadores_showFilters() {
    console.log('Showing Filters - Tópico Indicadores');
    // TODO: Implementar lógica para exibir filtros
  },

  indicadores_showSettings() {
    console.log('Showing Settings - Tópico Indicadores');
    // TODO: Implementar lógica para configurações do dashboard
  },

  // === Funções de ação da SEÇÃO 2: Análise de Processos ===
  
  indicadores_showFiltersAnaliseProcessos() {
    console.log('Showing Filters - Análise de Processos');
    // TODO: Implementar lógica para exibir filtros da análise de processos
  },

  indicadores_showSettingsAnaliseProcessos() {
    console.log('Showing Settings - Análise de Processos');
    // TODO: Implementar lógica para configurações da análise de processos
  }
};
