/**
 * Encontro de Contas - Complete Frontend Logic
 * Handles data loading, table rendering, row interactions, and ECharts integration
 */

export default {
  // Internal state management
  state: {
    currentContractId: null,
    selectedEmpenhoNumero: null,
    rawData: null,
    filteredData: null,
    chart: null,
    containers: {},
    isInitializing: false,
    isLoadingData: false,
  },

  // Initialize containers when needed
  encontroDeContas_initContainers() {
    // Always re-query containers for SPA navigation compatibility
    this.state.containers = {
      empenhosTable: document.querySelector("#empenhos-originais-tbody"),
      financeiroTable: document.querySelector("#financeiro-grid-tbody"),
      movimentacoesTable: document.querySelector("#movimentacoes-tbody"),
      chartContainer: document.querySelector("#grafico-financeiro-container"),
      ultimosLancamentosContainer: document.querySelector(
        "#ultimos-lancamentos-container"
      ),
      valoresTotaisChart: document.querySelector("#valores-totais-chart"),
    };
    
    console.log("📦 Containers initialized:", {
      empenhosTable: !!this.state.containers.empenhosTable,
      financeiroTable: !!this.state.containers.financeiroTable,
      movimentacoesTable: !!this.state.containers.movimentacoesTable,
      chartContainer: !!this.state.containers.chartContainer,
      ultimosLancamentosContainer: !!this.state.containers.ultimosLancamentosContainer,
      valoresTotaisChart: !!this.state.containers.valoresTotaisChart
    });
    
    return this.state.containers;
  },

  // Método único para inicialização completa via SPA
  encontroDeContas_initComplete() {
    console.log('🔧 encontroDeContas_initComplete() chamado via SPA');
    
    // Evitar execução dupla
    const now = Date.now();
    if (now - (this.lastInitCompleteTime || 0) < 800) {
      console.log('⚠️ encontroDeContas_initComplete() ignorado - muito recente (debounce)');
      return;
    }
    
    // Evitar sobreposição de execuções
    if (this.isInitializingComplete) {
      console.log('⚠️ encontroDeContas_initComplete() ignorado - já está inicializando');
      return;
    }
    
    this.lastInitCompleteTime = now;
    this.isInitializingComplete = true;
    
    // Verifica se estamos na página correta
    const encontroPage = document.querySelector('#empenhos-originais-tbody') || 
                        document.querySelector('#ultimos-lancamentos-container');
    console.log('🔍 Elementos de encontro de contas encontrados:', !!encontroPage);
    
    if (encontroPage) {
      console.log('✅ Página de encontro de contas detectada - iniciando componentes...');
      
      setTimeout(() => {
        // Inicializa o breadcrumb
        this.encontroDeContas_initBreadcrumb();
        
        // Inicializa o tópico
        this.encontroDeContas_initTopico();
        
        // Inicializa os card headers
        this.encontroDeContas_initCardHeadersMetodosEficiencia();
        
        // Preenche o conteúdo dos cards
        this.encontroDeContas_fillCardContent();
        
        // Inicializa o segundo tópico - Movimentações
        this.encontroDeContas_initTopicoMovimentacoes();
        
        // Inicializa o módulo completo
        this.encontroDeContas_fullInit();
        
        this.isInitializingComplete = false;
      }, 100);
    } else {
      console.log('⚠️ Página de encontro de contas não detectada');
      this.isInitializingComplete = false;
    }
  },

  // Initialize the encontro contas functionality
  async encontroDeContas_init() {
    console.log("🚀 Initializing Encontro de Contas...");
    
    // Verificar se já está inicializando (proteção contra dupla inicialização)
    if (this.state.isInitializing) {
      console.log("⚠️ Encontro de Contas já está sendo inicializado, ignorando");
      return;
    }
    
    // Marcar como inicializando
    this.state.isInitializing = true;
    
    try {
      // Initialize breadcrumb first
      console.log("🍞 Initializing breadcrumb...");
      this.encontroDeContas_initBreadcrumb();
      
      // Initialize topico
      console.log("📋 Initializing topico...");
      this.encontroDeContas_initTopico();
      
      // Initialize card headers
      console.log("🎯 Initializing card headers...");
      this.encontroDeContas_initCardHeadersMetodosEficiencia();
      
      // Fill card content
      console.log("🎨 Filling card content...");
      this.encontroDeContas_fillCardContent();
      
      // Initialize second topico - Movimentações
      console.log("📋 Initializing movimentações topico...");
      this.encontroDeContas_initTopicoMovimentacoes();
      
      // Initialize containers
      console.log("📦 Initializing containers...");
      const containers = this.encontroDeContas_initContainers();
      console.log("Containers found:", {
        empenhosTable: !!containers.empenhosTable,
        financeiroTable: !!containers.financeiroTable,
        movimentacoesTable: !!containers.movimentacoesTable,
        chartContainer: !!containers.chartContainer,
        ultimosLancamentosContainer: !!containers.ultimosLancamentosContainer,
        valoresTotaisChart: !!containers.valoresTotaisChart
      });
      
      // Get contract ID from URL
      this.state.currentContractId = this.encontroDeContas_getContractIdFromURL();
      console.log("📋 Contract ID from URL:", this.state.currentContractId);

      if (this.state.currentContractId) {
        console.log("🔄 Loading initial data...");
        await this.encontroDeContas_loadInitialData();
      } else {
        console.log("❌ No contract ID found");
        this.encontroDeContas_showError(
          "Nenhum ID de contrato fornecido. Adicione ?contrato=ID na URL."
        );
      }

      console.log("🎛️ Setting up event listeners...");
      this.encontroDeContas_setupEventListeners();
      console.log("✅ Encontro de Contas initialized successfully");
    } finally {
      // Reset flag de inicialização
      setTimeout(() => {
        this.state.isInitializing = false;
      }, 1000);
    }
  },

  encontroDeContas_getContractIdFromURL() {
    // Extract contract ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("contrato");
  },

  // Nova função para inicializar o breadcrumb dinamicamente
  encontroDeContas_initBreadcrumb() {
    console.log('🔧 Inicializando breadcrumb do encontro de contas...');
    
    // Verifica se o módulo breadcrumb está disponível
    if (typeof App !== "undefined" && App.breadcrumb && App.breadcrumb.breadcrumb_createDynamic) {
      const breadcrumbItems = [
        {title: 'Página Inicial', icon: 'fas fa-home', url: '/inicio'},
        {title: 'Encontro de Contas', icon: 'fas fa-calculator', url: ''}
      ];
      
      App.breadcrumb.breadcrumb_createDynamic(breadcrumbItems, 'encontro-contas-breadcrumb-dynamic-container');
      console.log('✅ Breadcrumb Encontro de Contas initialized dynamically');
    } else {
      console.warn('❌ Breadcrumb module not available - App:', typeof App, 'breadcrumb:', App?.breadcrumb ? 'exists' : 'missing');
      console.warn('⏳ Retrying in 500ms...');
      // Retry after a short delay if breadcrumb is not available yet
      setTimeout(() => {
        this.encontroDeContas_initBreadcrumb();
      }, 500);
    }
  },

  // Nova função para inicializar o tópico dinamicamente
  encontroDeContas_initTopico() {
    console.log('🔧 Inicializando tópico do encontro de contas...');
    
    // Verifica se o módulo topico está disponível
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      const topicoConfig = {
        title: 'Encontro de Contas',
        description: 'Sistema de análise e reconciliação de contratos e empenhos',
        icon: 'fas fa-calculator',
        tags: [
          {
            text: 'Financeiro',
            type: 'primary',
            icon: 'fas fa-dollar-sign',
            title: 'Análise financeira detalhada'
          },
          {
            text: 'Reconciliação',
            type: 'info',
            icon: 'fas fa-balance-scale',
            title: 'Reconciliação de dados'
          }
        ],
        actions: [
          {
            icon: 'fas fa-file-excel',
            text: 'Exportar',
            title: 'Exportar dados para Excel',
            onclick: 'App.encontroContas.encontroDeContas_exportToExcel()',
            type: 'secondary'
          },
          {
            icon: 'fas fa-sync-alt',
            text: 'Atualizar',
            title: 'Atualizar dados',
            onclick: 'App.encontroContas.encontroDeContas_refreshCards()',
            type: 'secondary'
          }
        ]
      };
      
      App.topico.topico_createDynamic(topicoConfig, 'encontro-contas-topico-container');
      console.log('✅ Topico Encontro de Contas initialized dynamically');
    } else {
      console.warn('❌ Topico module not available - App:', typeof App, 'topico:', App?.topico ? 'exists' : 'missing');
      console.warn('⏳ Retrying in 500ms...');
      // Retry after a short delay if topico is not available yet
      setTimeout(() => {
        this.encontroDeContas_initTopico();
      }, 500);
    }
  },

  encontroDeContas_initTopicoMovimentacoes() {
    console.log('🔧 Inicializando tópico de movimentações financeiras...');
    
    // Verificar se o container existe
    const container = document.getElementById('encontro-contas-movimentacoes-topico-container');
    console.log('📦 Container encontro-contas-movimentacoes-topico-container encontrado:', !!container);
    
    if (!container) {
      console.error('❌ Container encontro-contas-movimentacoes-topico-container não encontrado!');
      return;
    }
    
    // Verifica se o módulo topico está disponível
    if (typeof App !== "undefined" && App.topico && App.topico.topico_createDynamic) {
      console.log('✅ Módulo App.topico disponível, criando tópico...');
      
      const topicoConfig = {
        description: 'Análise detalhada das movimentações parciais e orçamentárias dos contratos',
        icon: 'fas fa-exchange-alt',
        tags: [
          {
            text: 'Parciais',
            type: 'warning',
            icon: 'fas fa-chart-line',
            title: 'Movimentações parciais'
          },
          {
            text: 'Orçamentárias',
            type: 'success',
            icon: 'fas fa-wallet',
            title: 'Movimentações orçamentárias'
          }
        ],
        actions: [
          {
            icon: 'fas fa-filter',
            text: 'Filtros',
            title: 'Aplicar filtros avançados',
            onclick: 'App.encontroContas.encontroDeContas_showFilters()',
            type: 'secondary'
          },
          {
            icon: 'fas fa-download',
            text: 'Baixar',
            title: 'Baixar relatório',
            onclick: 'App.encontroContas.encontroDeContas_downloadReport()',
            type: 'secondary'
          }
        ]
      };
      
      try {
        App.topico.topico_createDynamic(topicoConfig, 'encontro-contas-movimentacoes-topico-container');
        console.log('✅ Topico Movimentações Financeiras initialized dynamically');
      } catch (error) {
        console.error('❌ Erro ao criar tópico:', error);
      }
    } else {
      console.warn('❌ Topico module not available - App:', typeof App, 'topico:', App?.topico ? 'exists' : 'missing');
      console.warn('⏳ Retrying in 500ms...');
      // Retry after a short delay if topico is not available yet
      setTimeout(() => {
        this.encontroDeContas_initTopicoMovimentacoes();
      }, 500);
    }
  },

  // Nova função para inicializar os headers dos cards dos métodos e eficiência
  encontroDeContas_initCardHeadersMetodosEficiencia() {
    console.log('🔧 Inicializando card headers de métodos e eficiência...');
    
    // Verifica se o módulo card header está disponível
    if (typeof App !== "undefined" && App.card_header && App.card_header.card_header_createDynamic) {
      
      // Card 1 - Empenhos
      const empenhosHeaderConfig = {
        title: 'Empenhos',
        subtitle: 'Total de empenhos desde 2019',
        icon: 'fas fa-file-invoice-dollar'
      };
      App.card_header.card_header_createDynamic(empenhosHeaderConfig, 'encontro-contas-empenhos-header');

      // Card 2 - Valores Totais
      const valoresHeaderConfig = {
        title: 'Valores Totais',
        subtitle: 'Comparativo de valores financeiros',
        icon: 'fas fa-coins'
      };
      App.card_header.card_header_createDynamic(valoresHeaderConfig, 'encontro-contas-valores-header');

      // Card 3 - Últimos Lançamentos
      const lancamentosHeaderConfig = {
        title: 'Últimos Lançamentos',
        subtitle: 'Valores financeiro e orçamentário deste contrato',
        icon: 'fas fa-clipboard-list'
      };
      App.card_header.card_header_createDynamic(lancamentosHeaderConfig, 'encontro-contas-lancamentos-header');

      console.log('✅ Card headers Métodos e Eficiência initialized dynamically');
    } else {
      console.warn('❌ Card header module not available - App:', typeof App, 'card_header:', App?.card_header ? 'exists' : 'missing');
      console.warn('⏳ Retrying in 500ms...');
      // Retry after a short delay if card_header is not available yet
      setTimeout(() => {
        this.encontroDeContas_initCardHeadersMetodosEficiencia();
      }, 500);
    }
  },

  // Nova função para preencher o conteúdo dos cards de métodos e eficiência
  encontroDeContas_fillCardContent() {
    console.log('🎨 Limpando conteúdo dos cards...');
    
    // Card 1 - Empenhos - Limpar conteúdo
    const empenhosElement = document.getElementById('encontroContasEmpenhosContent');
    if (empenhosElement) {
      empenhosElement.innerHTML = '';
    }

    // Card 2 - Valores Totais - Limpar conteúdo
    const valoresElement = document.getElementById('encontroContasValoresContent');
    if (valoresElement) {
      valoresElement.innerHTML = '';
    }

    // Card 3 - Últimos Lançamentos - Limpar conteúdo
    const lancamentosElement = document.getElementById('encontroContasLancamentosContent');
    if (lancamentosElement) {
      lancamentosElement.innerHTML = '';
    }

    console.log('✅ Card content cleared successfully');
  },

  async encontroDeContas_loadInitialData() {
    try {
      // Verificar se já está carregando dados (proteção contra múltiplas chamadas da API)
      if (this.state.isLoadingData) {
        console.log("⚠️ Dados já estão sendo carregados, ignorando nova solicitação");
        return;
      }
      
      // Verificar se já temos dados para este contrato
      if (this.state.rawData && this.state.rawData.contrato_id === this.state.currentContractId) {
        console.log("📋 Dados já carregados para este contrato, reutilizando");
        await this.encontroDeContas_renderAllTables();
        return;
      }
      
      // Marcar como carregando
      this.state.isLoadingData = true;
      
      console.log("📡 Fetching data from API...");
      const url = `/tudo?contrato_id=${this.state.currentContractId}`;
      console.log("🌐 Request URL:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📥 Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Raw data received:", data);
      console.log("📊 Empenhos data count:", data?.empenhos_data?.length || 0);
      
      // Debug: Log the first empenho to see its structure
      if (data?.empenhos_data && data.empenhos_data.length > 0) {
        console.log("🔍 First empenho structure:", data.empenhos_data[0]);
        console.log("🔍 First empenho keys:", Object.keys(data.empenhos_data[0]));
        console.log("🔍 First empenho numero field:", data.empenhos_data[0].numero);
      }
      
      this.state.rawData = data;
      this.state.filteredData = data; // Initially, filtered data is the same as raw data

      console.log("✅ Initial data loaded:", data);

      // Render all tables with the initial data
      console.log("🎨 Rendering all tables...");
      this.encontroDeContas_renderAllTables();
      console.log("✅ Tables rendered successfully");
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      this.encontroDeContas_showError("Erro ao carregar dados do contrato. Tente novamente.");
    } finally {
      // Reset flag de carregamento
      this.state.isLoadingData = false;
    }
  },

  async encontroDeContas_loadFilteredData(empenhoNumero) {
    try {
      console.log(`🔍 Loading filtered data for empenho: ${empenhoNumero}`);

      // Create a filtered version where only the selected empenho is included
      if (this.state.rawData?.empenhos_data) {
        const filteredEmpenhos = this.state.rawData.empenhos_data.filter(
          (empenho) => {
            // Check both prefixed_numero and empenho.numero
            return empenho.prefixed_numero === empenhoNumero || 
                   empenho.empenho?.numero === empenhoNumero;
          }
        );

        this.state.filteredData = {
          ...this.state.rawData,
          empenhos_data: filteredEmpenhos,
        };

        console.log("✅ Filtered data prepared:", this.state.filteredData);

        // Re-render tables with filtered data
        this.encontroDeContas_renderAllTables();
      }
    } catch (error) {
      console.error("❌ Error filtering data:", error);
      this.encontroDeContas_showError("Erro ao filtrar dados. Tente novamente.");
    }
  },

  encontroDeContas_setupEventListeners() {
    // Handle clicks on empenho rows
    const containers = this.encontroDeContas_initContainers();
    if (containers.empenhosTable) {
      containers.empenhosTable.addEventListener("click", (e) => {
        const row = e.target.closest("tr[data-empenho-numero]");
        if (row) {
          this.encontroDeContas_handleEmpenhoRowClick(row);
        }
      });
    }
  },

  async encontroDeContas_handleEmpenhoRowClick(row) {
    const empenhoNumero = row.dataset.empenhoNumero;

    // Toggle logic
    if (this.state.selectedEmpenhoNumero === empenhoNumero) {
      // Deselect and show all data
      console.log(`🔄 Deselecting empenho: ${empenhoNumero}`);
      this.state.selectedEmpenhoNumero = null;
      this.state.filteredData = this.state.rawData; // Reset to show all data
      this.encontroDeContas_clearRowHighlight();
      this.encontroDeContas_renderAllTables();
    } else {
      // Select new empenho and filter data
      console.log(`✅ Selecting empenho: ${empenhoNumero}`);
      this.state.selectedEmpenhoNumero = empenhoNumero;
      this.encontroDeContas_highlightRow(row);
      await this.encontroDeContas_loadFilteredData(empenhoNumero);
    }
  },

  encontroDeContas_highlightRow(row) {
    this.encontroDeContas_clearRowHighlight();
    row.classList.add("selected-empenho");
    row.style.backgroundColor = "#e3f2fd";
  },

  encontroDeContas_clearRowHighlight() {
    const containers = this.encontroDeContas_initContainers();
    const selectedRows =
      containers.empenhosTable?.querySelectorAll(".selected-empenho");
    selectedRows?.forEach((row) => {
      row.classList.remove("selected-empenho");
      row.style.backgroundColor = "";
    });
  },

  encontroDeContas_renderAllTables() {
    console.log("🎨 Rendering all tables...");
    
    try {
      console.log("📋 Rendering Empenhos table...");
      try {
        this.encontroDeContas_renderEmpenhosTable();
        console.log("✅ Empenhos table rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Empenhos table:", error);
      }
      
      console.log("💰 Rendering Financeiro table...");
      try {
        this.encontroDeContas_renderFinanceiroTable();
        console.log("✅ Financeiro table rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Financeiro table:", error);
      }
      
      console.log("📊 Rendering Movimentações table...");
      try {
        this.encontroDeContas_renderMovimentacoesTable();
        console.log("✅ Movimentações table rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Movimentações table:", error);
      }
      
      console.log("🕐 Rendering Últimos Lançamentos...");
      try {
        this.encontroDeContas_renderUltimosLancamentos();
        console.log("✅ Últimos Lançamentos rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Últimos Lançamentos:", error);
      }
      
      console.log("📈 Rendering Valores Totais chart...");
      try {
        this.encontroDeContas_renderValoresTotaisChart();
        console.log("✅ Valores Totais chart rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Valores Totais chart:", error);
      }
      
      console.log("💳 Rendering Empenhos card...");
      try {
        this.encontroDeContas_renderEmpenhosCard();
        console.log("✅ Empenhos card rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Empenhos card:", error);
      }
      
      console.log("📈 Rendering Contract Analysis...");
      try {
        this.encontroDeContas_renderContractAnalysis();
        console.log("✅ Contract Analysis rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Contract Analysis:", error);
      }
      
      console.log("📊 Rendering Financial Chart...");
      try {
        this.encontroDeContas_renderChart();
        console.log("✅ Financial Chart rendered successfully");
      } catch (error) {
        console.error("❌ Error rendering Financial Chart:", error);
      }
      
      console.log("✅ All tables rendering completed (check individual logs for errors)");
    } catch (error) {
      console.error("❌ Critical error in renderAllTables:", error);
    }
  },

  encontroDeContas_renderEmpenhosTable() {
    console.log("🎯 Rendering Empenhos table...");
    
    const containers = this.encontroDeContas_initContainers();
    console.log("📦 Containers check:", {
      empenhosTable: !!containers.empenhosTable,
      rawDataExists: !!this.state.rawData,
      empenhosDataExists: !!this.state.rawData?.empenhos_data,
      empenhosCount: this.state.rawData?.empenhos_data?.length || 0
    });
    
    if (!containers.empenhosTable) {
      console.warn("❌ Empenhos table container not found!");
      return;
    }
    
    if (!this.state.rawData?.empenhos_data) {
      console.warn("❌ No empenhos data available!");
      return;
    }

    const empenhos = this.state.rawData.empenhos_data;
    console.log(`📋 Processing ${empenhos.length} empenhos...`);

    const htmlRows = empenhos
      .map((empenho, index) => {
        // Extract data using the correct structure
        const empenhoNumber = empenho.prefixed_numero || empenho.empenho?.numero || 'N/A';
        const empenhoData = empenho.empenho || {};
        
        // Only log first empenho for debugging
        if (index === 0) {
          console.log(`Processing first empenho:`, empenhoNumber);
          console.log(`Empenho data structure:`, {
            prefixed_numero: empenho.prefixed_numero,
            empenho_numero: empenhoData.numero,
            empenhado: empenhoData.empenhado,
            data_emissao: empenhoData.data_emissao
          });
        }
        
        const isRap = this.encontroDeContas_checkForRapOperations(empenho);
        const rapBadge = isRap
          ? '<span class="badge bg-warning text-dark ms-1">RAP</span>'
          : "";

        const orcamentarioTotal = this.encontroDeContas_calculateOrcamentarioTotal(empenho);
        const financasTotal = this.encontroDeContas_calculateFinancasTotal(empenho);
        const saldo = this.encontroDeContas_safeMathSubtract(orcamentarioTotal, financasTotal);

        // Log totals for first empenho
        if (index === 0) {
          console.log(`Totals for first empenho:`, {
            orcamentario: orcamentarioTotal,
            financas: financasTotal,
            saldo: saldo
          });
        }

        // Format dates - use the correct field from empenho data
        const dataEmissao = this.encontroDeContas_formatDate(empenhoData.data_emissao);

        // Calculate percentage for status
        const percentage = this.encontroDeContas_calculateStatusPercentage(
          financasTotal,
          orcamentarioTotal
        );
        const statusBadge = this.encontroDeContas_getPercentageStatusBadge(percentage.percentage);

        return `
          <tr data-empenho-numero="${empenhoNumber}" style="cursor: pointer;" 
              class="empenho-row" 
              title="Clique para filtrar por este empenho">
            <td>${index + 1}</td>
            <td>
              <span class="badge bg-primary">${empenhoData.sistema_origem || "N/A"}</span>
            </td>
            <td>
              <strong>${empenhoData.numero || empenhoNumber}</strong>
              ${rapBadge}
            </td>
            <td>${dataEmissao}</td>
            <td class="text-end">
              <strong>${this.encontroDeContas_formatCurrency(empenhoData.empenhado || 0)}</strong>
            </td>
            <td>
              <span class="badge bg-info">${empenhoData.modalidade_licitacao_siafi || "N/A"}</span>
            </td>
            <td class="text-end">
              <span class="text-primary fw-bold">
                ${this.encontroDeContas_formatCurrency(orcamentarioTotal)}
              </span>
            </td>
            <td class="text-end">
              <span class="text-success fw-bold">
                ${this.encontroDeContas_formatCurrency(financasTotal)}
              </span>
            </td>
            <td class="text-end">
              <span class="fw-bold ${saldo >= 0 ? "text-info" : "text-danger"}">
                ${this.encontroDeContas_formatCurrencyAggressive(saldo)}
              </span>
            </td>
            <td>
              <span class="badge ${statusBadge}">${percentage.display}</span>
            </td>
            <td>
              <button class="btn btn-sm btn-outline-secondary" 
                      onclick="alert('Funcionalidade em desenvolvimento')"
                      title="Ver detalhes">
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    console.log(`📝 Generated HTML for ${empenhos.length} rows`);
    containers.empenhosTable.innerHTML = htmlRows;
    console.log("✅ Empenhos table rendered successfully");
  },

  // Auto-initialization function with proper naming convention
  encontroDeContas_autoInit() {
    console.log("🔍 Checking if should auto-initialize Encontro de Contas...");
    console.log("Current pathname:", window.location.pathname);
    console.log("Looking for #empenhos-originais-tbody:", !!document.querySelector("#empenhos-originais-tbody"));
    console.log("Looking for #ultimos-lancamentos-container:", !!document.querySelector("#ultimos-lancamentos-container"));
    
    // Check if we're on the correct page
    if (this.encontroDeContas_isEncontroPage()) {
      console.log("🎯 Auto-initializing Encontro de Contas...");
      
      // Use the full initialization that includes card management
      this.encontroDeContas_fullInit();
    } else {
      console.log("❌ Not on encontro_contas page, skipping initialization");
      // Setup window API even if not on the page for potential manual calls
      this.encontroDeContas_setupWindowAPI();
    }
  },

  // Public method for manual initialization (useful for SPA routing)
  // Reset state for fresh initialization (SPA navigation compatible)
  encontroDeContas_resetState() {
    console.log("🔄 Resetting Encontro de Contas state...");
    
    // Dispose of existing charts if they exist
    if (this.state?.chart) {
      this.state.chart.dispose();
    }
    if (this.state?.valoresTotaisChart) {
      this.state.valoresTotaisChart.dispose();
    }
    
    // Remove resize handler
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
      this.resizeHandler = null;
    }
    
    // Disconnect ResizeObserver
    if (this.chartResizeObserver) {
      this.chartResizeObserver.disconnect();
      this.chartResizeObserver = null;
    }
    
    this.state = {
      currentContractId: null,
      selectedEmpenhoNumero: null,
      rawData: null,
      filteredData: null,
      chart: null,
      valoresTotaisChart: null,
      containers: {},
      isInitializing: false,
      isLoadingData: false,
    };
  },

  encontroDeContas_forceInit() {
    console.log("🔧 Force initializing Encontro de Contas...");
    // Reset state first to ensure fresh initialization
    this.encontroDeContas_resetState();
    this.encontroDeContas_init();
  },

  // Export functionality for Excel
  encontroDeContas_exportToExcel() {
    console.log("📊 Starting Excel export...");
    
    if (!this.state.rawData?.empenhos_data) {
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    try {
      // Dynamic import for SheetJS
      import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs').then((XLSX) => {
        // Prepare data for export
        const empenhosData = this.encontroDeContas_prepareEmpenhosDataForExport();
        const financeiroData = this.encontroDeContas_prepareFinanceiroDataForExport();
        const movimentacoesData = this.encontroDeContas_prepareMovimentacoesDataForExport();

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Create worksheets
        const wsEmpenhos = XLSX.utils.json_to_sheet(empenhosData);
        const wsFinanceiro = XLSX.utils.json_to_sheet(financeiroData);
        const wsMovimentacoes = XLSX.utils.json_to_sheet(movimentacoesData);

        // Format worksheets
        this.encontroDeContas_formatWorksheet(wsEmpenhos, empenhosData, 'empenhos');
        this.encontroDeContas_formatWorksheet(wsFinanceiro, financeiroData, 'financeiro');
        this.encontroDeContas_formatWorksheet(wsMovimentacoes, movimentacoesData, 'movimentacoes');

        // Add worksheets to workbook
        XLSX.utils.book_append_sheet(wb, wsEmpenhos, "Empenhos");
        XLSX.utils.book_append_sheet(wb, wsFinanceiro, "Financeiro");
        XLSX.utils.book_append_sheet(wb, wsMovimentacoes, "Movimentações");

        // Generate filename with contract ID and date
        const contractId = this.state.currentContractId || 'SemID';
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Encontro_Contas_Contrato_${contractId}_${dateStr}.xlsx`;

        // Write file
        XLSX.writeFile(wb, filename);
        
        console.log("✅ Excel export completed:", filename);
      }).catch((error) => {
        console.error("❌ Error loading XLSX library:", error);
        alert("Erro ao carregar biblioteca de exportação. Tente novamente.");
      });
    } catch (error) {
      console.error("❌ Error exporting to Excel:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    }
  },

  // Helper method placeholder - you'll need to add all the other methods here
  // For now, I'll add the essential ones for the basic functionality

  encontroDeContas_formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return "R$ 0,00";
    }
    
    const numValue = parseFloat(value);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  },

  encontroDeContas_formatCurrencyAggressive(value) {
    const result = this.encontroDeContas_formatCurrency(this.encontroDeContas_ensurePositiveZero(value));
    return result;
  },

  encontroDeContas_ensurePositiveZero(value) {
    return Object.is(value, -0) ? 0 : value;
  },

  encontroDeContas_safeMathSubtract(a, b) {
    const result = (a || 0) - (b || 0);
    return this.encontroDeContas_ensurePositiveZero(result);
  },

  encontroDeContas_formatDate(dateString) {
    if (!dateString) return "N/A";
    
    try {
      let date;
      
      // Handle different date formats
      if (dateString.length === 8) {
        // YYYYMMDD format
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        date = new Date(`${year}-${month}-${day}`);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      
      return date.toLocaleDateString("pt-BR");
    } catch {
      return "N/A";
    }
  },

  encontroDeContas_calculateOrcamentarioTotal(empenho) {
    const empenhoNumero = empenho.empenho?.numero || "Unknown";

    // Handle the new data structure with nested Orçamentário.operacoes
    const orcamentario =
      empenho.Orçamentário?.operacoes ||
      empenho.Ne_item?.operacoes ||
      empenho.Orçamentário ||
      [];

    // Ensure it's an array before calling reduce
    if (!Array.isArray(orcamentario)) {
      return 0;
    }

    // Backend now provides pre-processed va_operacao values (0 for RP operations)
    // So we can simply sum the va_operacao values without additional RP filtering
    const result = orcamentario.reduce((total, op, index) => {
      if (!op || op.va_operacao === null || op.va_operacao === undefined) {
        return total;
      }

      let value = this.encontroDeContas_safeParseFloat(op.va_operacao);

      return total + value;
    }, 0);

    // Handle negative zero
    const finalResult = result === 0 ? 0 : result;

    // Only log when negative zero is detected
    if (Object.is(result, -0)) {
      console.warn("🎯 NEGATIVE ZERO DETECTED in calculateOrcamentarioTotal:", {
        empenho: empenhoNumero,
        result: result,
        location: "calculateOrcamentarioTotal result",
      });
    }

    return finalResult;
  },

  encontroDeContas_calculateFinancasTotal(empenho, usePartialValues = false) {
    const empenhoNumero = empenho.empenho?.numero || "Unknown";

    let total = 0;

    // Handle new nested structure under Finanças
    const financas = empenho.Finanças || {};

    // DARF documents
    (financas.documentos_darf || empenho.documentos_darf || []).forEach(
      (doc, index) => {
        let documentValue = 0;

        if (
          usePartialValues &&
          doc.va_celula !== null &&
          doc.va_celula !== undefined
        ) {
          documentValue = this.encontroDeContas_safeParseFloat(doc.va_celula);
        } else {
          const juros = this.encontroDeContas_safeParseFloat(doc.va_juros);
          const receita = this.encontroDeContas_safeParseFloat(doc.va_receita);
          const multa = this.encontroDeContas_safeParseFloat(doc.va_multa);
          documentValue = juros + receita + multa;
        }

        // Apply negative value if document is cancelled (DE CANCELAMENTO status)
        if (doc.is_negative_value === true) {
          documentValue = documentValue === 0 ? 0 : -Math.abs(documentValue);
        }

        total += documentValue;
      }
    );

    // DAR documents
    (financas.documentos_dar || empenho.documentos_dar || []).forEach(
      (doc, index) => {
        let documentValue = 0;

        if (
          usePartialValues &&
          doc.va_celula !== null &&
          doc.va_celula !== undefined
        ) {
          documentValue = this.encontroDeContas_safeParseFloat(doc.va_celula);
        } else {
          const multa = this.encontroDeContas_safeParseFloat(doc.va_multa);
          const juros = this.encontroDeContas_safeParseFloat(doc.va_juros);
          const principal = this.encontroDeContas_safeParseFloat(doc.va_principal);
          documentValue = multa + juros + principal;
        }

        // Apply negative value if document is cancelled (DE CANCELAMENTO status)
        if (doc.is_negative_value === true) {
          documentValue = documentValue === 0 ? 0 : -Math.abs(documentValue);
        }

        total += documentValue;
      }
    );

    // GPS documents
    (financas.documentos_gps || empenho.documentos_gps || []).forEach(
      (doc, index) => {
        let documentValue = 0;

        if (
          usePartialValues &&
          doc.va_celula !== null &&
          doc.va_celula !== undefined
        ) {
          documentValue = this.encontroDeContas_safeParseFloat(doc.va_celula);
        } else {
          documentValue = this.encontroDeContas_safeParseFloat(doc.va_inss);
        }

        // Apply negative value if document is cancelled (DE CANCELAMENTO status)
        if (doc.is_negative_value === true) {
          documentValue = documentValue === 0 ? 0 : -Math.abs(documentValue);
        }

        total += documentValue;
      }
    );

    // OB documents (OB doesn't have va_celula, so always use va_linha_evento)
    (financas.linha_evento_ob || empenho.linha_evento_ob || []).forEach(
      (doc, index) => {
        const documentValue = this.encontroDeContas_safeParseFloat(doc.va_linha_evento);
        total += documentValue;
      }
    );

    // Handle negative zero in total
    const finalTotal = total === 0 ? 0 : total;

    // Only log when negative zero is detected
    if (Object.is(total, -0)) {
      console.warn("🎯 NEGATIVE ZERO DETECTED in calculateFinancasTotal:", {
        empenho: empenhoNumero,
        total: total,
        location: "calculateFinancasTotal result",
      });
    }

    return finalTotal;
  },

  encontroDeContas_calculateStatusPercentage(financas, orcamentario) {
    // Calculate percentage: Finanças Parciais / Orçamentário * 100
    if (!orcamentario || orcamentario === 0) {
      return {
        percentage: 0,
        display: "0%",
      };
    }

    // Handle case where financas might be null, undefined, or zero
    const financasValue = financas || 0;
    const percentage = (financasValue / orcamentario) * 100;

    return {
      percentage: percentage,
      display: `${percentage.toFixed(1)}%`,
    };
  },

  encontroDeContas_getPercentageStatusBadge(percentage) {
    // Color coding based on financial execution percentage: Finanças Parciais / Orçamentário * 100
    // Higher percentage = more of the budget has been financially processed (using partial payment values)
    if (percentage >= 80) {
      return "badge-success"; // Green: 80-100% financially processed (excellent execution)
    } else if (percentage >= 50) {
      return "badge-warning"; // Yellow: 50-79% financially processed (good execution)
    } else if (percentage >= 20) {
      return "badge-info"; // Blue: 20-49% financially processed (moderate execution)
    } else if (percentage > 0) {
      return "badge-secondary"; // Gray: 1-19% financially processed (low execution)
    } else if (percentage === 0) {
      return "badge-light"; // Light gray: 0% financially processed (no execution yet)
    } else {
      return "badge-danger"; // Red: negative percentage (unusual case)
    }
  },

  encontroDeContas_checkForRapOperations(empenho) {
    // Check in Orçamentário operations
    const orcamentario = empenho.Orçamentário || {};
    
    // Check operacoes array first (new structure)
    if (orcamentario.operacoes && Array.isArray(orcamentario.operacoes)) {
      for (const op of orcamentario.operacoes) {
        if (op.especie_operacao) {
          const especieType = op.especie_operacao.toLowerCase();
          if (especieType.includes("rp") || especieType.includes("inscricao") || especieType.includes("restos a pagar")) {
            return true;
          }
        }
      }
    }
    
    // Fallback to old structure
    for (const [key, operations] of Object.entries(orcamentario)) {
      if (Array.isArray(operations)) {
        for (const op of operations) {
          if (op.especie_operacao) {
            const especieType = op.especie_operacao.toLowerCase();
            if (especieType.includes("rp") || especieType.includes("inscricao") || especieType.includes("restos a pagar")) {
              return true;
            }
          }
        }
      }
    }

    // Check in Finanças operations
    const financas = empenho.Finanças || {};
    for (const [key, operations] of Object.entries(financas)) {
      if (Array.isArray(operations)) {
        for (const op of operations) {
          if (op.especie_operacao) {
            const especieType = op.especie_operacao.toLowerCase();
            if (especieType.includes("rp") || especieType.includes("inscricao") || especieType.includes("restos a pagar")) {
              return true;
            }
          }
        }
      }
    }

    return false;
  },

  encontroDeContas_showError(message) {
    console.error("❌ Error:", message);
    
    // Try to show error in a container if available
    const containers = this.encontroDeContas_initContainers();
    const errorContainer = containers.empenhosTable || 
                          containers.financeiroTable || 
                          containers.movimentacoesTable;
    
    if (errorContainer) {
      errorContainer.innerHTML = `
        <tr>
          <td colspan="100%" class="text-center text-danger p-4">
            <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
            <br />
            ${message}
          </td>
        </tr>
      `;
    }
  },

  // Placeholder methods - you can add the full implementations from the original file
  encontroDeContas_renderFinanceiroTable() {
    console.log("📊 Rendering Financeiro table...");
    
    const containers = this.encontroDeContas_initContainers();
    if (!containers.financeiroTable || !this.state.filteredData?.empenhos_data) {
      console.warn("❌ Financeiro table container or data not available!");
      return;
    }

    const financialRows = [];

    this.state.filteredData.empenhos_data.forEach((empenho) => {
      // Handle new nested structure under Finanças
      const financas = empenho.Finanças || {};

      // Decide OB source: prefer grouped totals if available
      const hasGroupedOB = Array.isArray(financas.ob_grouped) && financas.ob_grouped.length > 0;
      const obDocType = hasGroupedOB ? "ob_grouped" : "linha_evento_ob";
      const obData = hasGroupedOB ? financas.ob_grouped : financas.linha_evento_ob || empenho.linha_evento_ob || [];

      // Process different document types from nested structure or fallback to old structure
      const docTypes = [
        { key: "documentos_dar", data: financas.documentos_dar || empenho.documentos_dar || [] },
        { key: "documentos_darf", data: financas.documentos_darf || empenho.documentos_darf || [] },
        { key: "documentos_gps", data: financas.documentos_gps || empenho.documentos_gps || [] },
        { key: obDocType, data: obData },
      ];

      docTypes.forEach((docType) => {
        docType.data.forEach((doc) => {
          financialRows.push(this.encontroDeContas_createFinancialRow(doc, docType.key));
        });
      });
    });

    containers.financeiroTable.innerHTML = financialRows
      .map((row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${row.date}</td>
          <td>${row.documentId}</td>
          <td><a href="https://portaldatransparencia.gov.br/despesas/pagamento/${row.fullDocumentId}?ordenarPor=fase&direcao=asc" 
                 target="_blank" class="btn btn-sm btn-outline-primary">
                 <i class="fas ${row.icon}" style="color: ${row.iconColor}; font-size: 10px;"></i>
              </a></td>
          <td>${row.type}</td>
          <td>${this.encontroDeContas_formatCurrency(row.parcial)}</td>
          <td>${this.encontroDeContas_formatCurrency(row.nominal)}</td>
        </tr>
      `)
      .join("");

    console.log("✅ Financeiro table rendered successfully");
  },

  encontroDeContas_renderMovimentacoesTable() {
    console.log("📊 Rendering Movimentações table...");
    
    const containers = this.encontroDeContas_initContainers();
    if (!containers.movimentacoesTable || !this.state.filteredData?.empenhos_data) {
      console.warn("❌ Movimentações table container or data not available!");
      return;
    }

    const movimentacoes = [];

    this.state.filteredData.empenhos_data.forEach((empenho) => {
      // Handle new nested structure: Orçamentário.operacoes or fallback to old structure
      const orcamentario = empenho.Orçamentário?.operacoes || empenho.Ne_item?.operacoes || empenho.Orçamentário || [];

      if (Array.isArray(orcamentario)) {
        orcamentario.forEach((op) => {
          movimentacoes.push({
            data: this.encontroDeContas_formatDateFromOperacao(op.dt_operacao), // Use specialized formatting
            empenho: empenho.empenho?.numero,
            item: op.ds_item || this.encontroDeContas_getItemDescription(op.id_item, empenho),
            especie: op.no_operacao,
            valor: op.va_operacao_display !== undefined ? op.va_operacao_display : op.va_operacao, // Show original RP amounts
          });
        });
      }
    });

    containers.movimentacoesTable.innerHTML = movimentacoes
      .map((mov, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${mov.data}</td>
          <td>${mov.empenho || "N/A"}</td>
          <td><i class="fas fa-tag" style="color: #ff9800;"></i></td>
          <td>${mov.especie || "N/A"}</td>
          <td>${this.encontroDeContas_formatCurrency(mov.valor || 0)}</td>
        </tr>
      `)
      .join("");

    console.log("✅ Movimentações table rendered successfully");
  },

  encontroDeContas_renderUltimosLancamentos() {
    console.log("📊 Rendering Últimos Lançamentos...");
    
    const containers = this.encontroDeContas_initContainers();
    if (!containers.ultimosLancamentosContainer || !this.state.rawData?.empenhos_data) {
      console.warn("❌ Últimos lançamentos container or data not available!");
      return;
    }

    // Collect ALL documents from all empenhos (always use rawData, not filteredData)
    const allDocuments = [];

    this.state.rawData.empenhos_data.forEach((empenho) => {
      // 1. Add the empenho itself
      if (empenho.empenho) {
        const empenhoData = this.encontroDeContas_createEmpenhoLancamentoRow(empenho.empenho);
        if (empenhoData) {
          allDocuments.push(empenhoData);
        }
      }

      // 2. Add orçamentário operations
      const orcamentario = empenho.Orçamentário?.operacoes || empenho.Ne_item?.operacoes || empenho.Orçamentário || [];

      if (Array.isArray(orcamentario)) {
        orcamentario.forEach((op) => {
          const orcamentoData = this.encontroDeContas_createOrcamentarioLancamentoRow(op, empenho.empenho?.numero);
          if (orcamentoData) {
            allDocuments.push(orcamentoData);
          }
        });
      }

      // 3. Add financial documents
      const financas = empenho.Finanças || {};

      // Process different document types
      const docTypes = [
        { key: "documentos_dar", data: financas.documentos_dar || empenho.documentos_dar || [] },
        { key: "documentos_darf", data: financas.documentos_darf || empenho.documentos_darf || [] },
        { key: "documentos_gps", data: financas.documentos_gps || empenho.documentos_gps || [] },
        { key: "linha_evento_ob", data: financas.linha_evento_ob || empenho.linha_evento_ob || [] },
      ];

      docTypes.forEach((docType) => {
        docType.data.forEach((doc) => {
          const documentData = this.encontroDeContas_createUltimosLancamentosRow(doc, docType.key);
          if (documentData) {
            allDocuments.push(documentData);
          }
        });
      });
    });

    // Sort documents by date (newest first)
    allDocuments.sort((a, b) => {
      const dateA = this.encontroDeContas_parseDateForComparison(a.rawDate);
      const dateB = this.encontroDeContas_parseDateForComparison(b.rawDate);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    // Find the table-responsive div inside the container
    const tableContainer = containers.ultimosLancamentosContainer.querySelector(".table-responsive");
    if (!tableContainer) {
      console.warn("❌ Table container not found inside últimos lançamentos!");
      return;
    }

    // Create the content - show simplified list format
    const content = allDocuments.length > 0
      ? allDocuments.map((doc) => `
          <div class="lancamento-item" style="padding: 8px 16px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
            <i class="fas ${doc.icon}" style="color: ${doc.iconColor}; font-size: 14px; margin-right: 12px; width: 16px;"></i>
            <div style="flex: 1;">
              <div style="font-size: 12px; color: #666; line-height: 1.2;">
                ${doc.date}
              </div>
              <div style="font-size: 13px; font-weight: 500; color: #333; line-height: 1.3;">
                ${doc.documentId} (${doc.formattedValue})
              </div>
            </div>
          </div>
        `).join("")
      : '<div class="text-center text-muted p-3">Nenhum lançamento encontrado</div>';

    tableContainer.innerHTML = content;
    console.log("✅ Últimos lançamentos rendered successfully");
  },

  async encontroDeContas_renderValoresTotaisChart() {
    console.log("📊 Rendering Valores Totais chart...");
    
    const containers = this.encontroDeContas_initContainers();
    if (!containers.valoresTotaisChart || !this.state.rawData) {
      console.warn("❌ Valores totais chart container or data not available!");
      return;
    }

    try {
      const echarts = await window.App.getEcharts();

      // Destroy existing valores totais chart if it exists
      if (this.state.valoresTotaisChart) {
        this.state.valoresTotaisChart.dispose();
      }

      this.state.valoresTotaisChart = echarts.init(containers.valoresTotaisChart);

      // Extract values from the API response
      const totalEmpenhado = this.state.rawData.total_empenhado || 0;
      const totalOrcamentario = this.state.rawData.total_orcamentario || 0;
      const totalFinancial = this.state.rawData.total_financial_value || 0;

      // Format values for display (convert to millions for readability)
      const formatValue = (value) => {
        if (value >= 1000000) {
          return (value / 1000000).toFixed(1);
        } else if (value >= 1000) {
          return (value / 1000).toFixed(1);
        }
        return value.toFixed(2);
      };

      const getUnit = (value) => {
        if (value >= 1000000) return "M";
        if (value >= 1000) return "K";
        return "";
      };

      const chartData = [
        {
          name: "Orçamentário",
          value: formatValue(totalOrcamentario),
          originalValue: totalOrcamentario,
          unit: getUnit(totalOrcamentario),
        },
        {
          name: "Financeiro",
          value: formatValue(totalFinancial),
          originalValue: totalFinancial,
          unit: getUnit(totalFinancial),
        },
      ];

      const option = {
        title: {
          show: false,
        },
        tooltip: {
          trigger: "axis",
          formatter: function (params) {
            const item = params[0];
            const data = chartData[item.dataIndex];
            return `${data.name}<br/>R$ ${new Intl.NumberFormat("pt-BR").format(data.originalValue)}`;
          },
        },
        grid: {
          left: "10%",
          right: "10%",
          bottom: "15%",
          top: "10%",
        },
        xAxis: {
          type: "category",
          data: chartData.map((item) => item.name),
          axisLabel: {
            fontSize: 10,
            rotate: 0,
          },
        },
        yAxis: {
          type: "value",
          axisLabel: {
            fontSize: 10,
            formatter: function (value) {
              // Use proper formatting based on the actual value, not the first item's unit
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + "M";
              } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + "K";
              }
              return value.toFixed(0);
            },
          },
        },
        series: [
          {
            type: "bar",
            data: chartData.map((item) => ({
              value: item.originalValue, // Use original value, not formatted value
              itemStyle: {
                color: function (params) {
                  const colors = ["#10b981", "#3b82f6"]; // BR Design System colors
                  return colors[params.dataIndex] || "#10b981";
                },
              },
            })),
            barWidth: "50%",
            label: {
              show: true,
              position: "top",
              fontSize: 10,
              formatter: function (params) {
                const data = chartData[params.dataIndex];
                return data.value + data.unit;
              },
            },
          },
        ],
      };

      this.state.valoresTotaisChart.setOption(option);

      // Handle window resize (using a shared resize handler)
      this.encontroDeContas_setupResizeHandler();
      
      console.log("✅ Valores totais chart rendered successfully");
    } catch (error) {
      console.error("❌ Error rendering valores totais chart:", error);
    }
  },

  // ===== RESIZE HANDLER =====

  encontroDeContas_setupResizeHandler() {
    // Remove existing listener to prevent duplicates
    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
    
    // Create a new resize handler
    this.resizeHandler = () => {
      if (this.state.chart) {
        this.state.chart.resize();
      }
      if (this.state.valoresTotaisChart) {
        this.state.valoresTotaisChart.resize();
      }
    };
    
    // Add the new listener
    window.addEventListener("resize", this.resizeHandler);
    
    // Setup ResizeObserver for the chart container
    if (this.state.containers?.chartContainer && window.ResizeObserver) {
      if (this.chartResizeObserver) {
        this.chartResizeObserver.disconnect();
      }
      
      this.chartResizeObserver = new ResizeObserver((entries) => {
        if (this.state.chart) {
          this.state.chart.resize();
        }
      });
      
      this.chartResizeObserver.observe(this.state.containers.chartContainer);
    }
  },

  // ===== HELPER METHODS FOR RENDERING =====

  encontroDeContas_createFinancialRow(doc, docType) {
    const fullDocumentId = this.encontroDeContas_getFullDocumentId(doc, docType);
    const shortDocumentId = this.encontroDeContas_getDocumentId(doc, docType);

    return {
      date: this.encontroDeContas_extractDateFromFinancialDoc(doc),
      documentId: shortDocumentId,
      fullDocumentId: fullDocumentId,
      type: this.encontroDeContas_getDocumentType(docType),
      icon: this.encontroDeContas_getDocumentIcon(docType),
      iconColor: this.encontroDeContas_getDocumentIconColor(docType),
      parcial: this.encontroDeContas_getFinancialDocValue(doc, docType, "parcial"),
      nominal: this.encontroDeContas_getFinancialDocValue(doc, docType, "nominal"),
    };
  },

  encontroDeContas_createUltimosLancamentosRow(doc, docType) {
    const documentId = this.encontroDeContas_getDocumentId(doc, docType);
    const rawDate = this.encontroDeContas_extractDateFromFinancialDoc(doc);
    const formattedDate = rawDate !== "N/A" ? rawDate : "";
    const value = this.encontroDeContas_getFinancialDocValue(doc, docType, "nominal");

    if (!documentId || documentId === "N/A" || !formattedDate) {
      return null; // Skip invalid documents
    }

    return {
      date: formattedDate,
      rawDate: rawDate, // Keep raw date for sorting
      documentId: documentId,
      type: this.encontroDeContas_getDocumentType(docType),
      icon: this.encontroDeContas_getDocumentIcon(docType),
      iconColor: this.encontroDeContas_getDocumentIconColor(docType),
      value: value,
      formattedValue: this.encontroDeContas_formatCurrency(value),
      category: "financial", // For categorization
    };
  },

  encontroDeContas_createEmpenhoLancamentoRow(empenho) {
    const rawDate = empenho.data_emissao;
    const formattedDate = this.encontroDeContas_formatDate(rawDate);
    const value = empenho.empenhado || 0;

    if (!empenho.numero || !formattedDate || formattedDate === "N/A") {
      return null; // Skip invalid empenhos
    }

    return {
      date: formattedDate,
      rawDate: rawDate, // Keep raw date for sorting
      documentId: empenho.numero,
      type: "EMPENHO",
      icon: "fa-file-contract", // Contract icon for empenhos
      iconColor: "#1976d2", // Blue color
      value: value,
      formattedValue: this.encontroDeContas_formatCurrency(value),
      category: "empenho", // For categorization
    };
  },

  encontroDeContas_createOrcamentarioLancamentoRow(operacao, empenhoNumero) {
    const rawDate = operacao.dt_operacao;
    const formattedDate = this.encontroDeContas_formatDateFromOperacao(rawDate);
    const value = operacao.va_operacao || 0;

    if (!operacao.no_operacao || !formattedDate || formattedDate === "N/A") {
      return null; // Skip invalid operations
    }

    // Create a display ID combining operation type and empenho number
    const displayId = `${operacao.no_operacao}${empenhoNumero ? ` (${empenhoNumero})` : ""}`;

    return {
      date: formattedDate,
      rawDate: rawDate, // Keep raw date for sorting
      documentId: displayId,
      type: "ORÇAMENTÁRIO",
      icon: "fa-calculator", // Calculator icon for budget operations
      iconColor: "#ff9800", // Orange color
      value: value,
      formattedValue: this.encontroDeContas_formatCurrency(value),
      category: "orcamentario", // For categorization
    };
  },

  encontroDeContas_getDocumentId(doc, docType) {
    let documentId;
    switch (docType) {
      case "documentos_dar":
        documentId = doc.id_doc_dar;
        break;
      case "documentos_darf":
        documentId = doc.id_doc_darf;
        break;
      case "documentos_gps":
        documentId = doc.id_doc_gps;
        break;
      case "linha_evento_ob":
        documentId = doc.id_doc_ob;
        break;
      case "ob_grouped":
        documentId = doc.id_doc_ob;
        break;
      default:
        return "N/A";
    }

    // Remove first 11 characters from the document ID
    if (documentId && typeof documentId === "string" && documentId.length > 11) {
      return documentId.substring(11);
    }

    return documentId || "N/A";
  },

  encontroDeContas_getFullDocumentId(doc, docType) {
    // Returns the full, unmodified document ID for URL usage
    switch (docType) {
      case "documentos_dar":
        return doc.id_doc_dar || "N/A";
      case "documentos_darf":
        return doc.id_doc_darf || "N/A";
      case "documentos_gps":
        return doc.id_doc_gps || "N/A";
      case "linha_evento_ob":
        return doc.id_doc_ob || "N/A";
      case "ob_grouped":
        return doc.id_doc_ob || "N/A";
      default:
        return "N/A";
    }
  },

  encontroDeContas_getDocumentType(docType) {
    switch (docType) {
      case "documentos_dar":
        return "DAR";
      case "documentos_darf":
        return "DARF";
      case "documentos_gps":
        return "GPS";
      case "linha_evento_ob":
        return "OB";
      case "ob_grouped":
        return "OB";
      default:
        return "Outros";
    }
  },

  encontroDeContas_getDocumentIcon(docType) {
    switch (docType) {
      case "documentos_dar":
        return "fa-receipt";
      case "documentos_darf":
        return "fa-file-invoice-dollar";
      case "documentos_gps":
        return "fa-shield-alt";
      case "linha_evento_ob":
        return "fa-money-bill-wave";
      case "ob_grouped":
        return "fa-money-bill-wave";
      default:
        return "fa-file";
    }
  },

  encontroDeContas_getDocumentIconColor(docType) {
    switch (docType) {
      case "documentos_dar":
        return "#f44336";
      case "documentos_darf":
        return "#ff9800";
      case "documentos_gps":
        return "#2196f3";
      case "linha_evento_ob":
        return "#4caf50";
      case "ob_grouped":
        return "#4caf50";
      default:
        return "#666";
    }
  },

  encontroDeContas_getFinancialDocValue(doc, docType, valueType = "nominal") {
    let value = 0;

    // For partial payments, use va_celula if available
    if (valueType === "parcial" && doc.va_celula !== null && doc.va_celula !== undefined) {
      value = parseFloat(doc.va_celula) || 0;
    } else {
      // For nominal values or when va_celula is not available, use the original calculation
      switch (docType) {
        case "documentos_dar":
          value = (parseFloat(doc.va_multa) || 0) + (parseFloat(doc.va_juros) || 0) + (parseFloat(doc.va_principal) || 0);
          break;
        case "documentos_darf":
          value = (parseFloat(doc.va_juros) || 0) + (parseFloat(doc.va_receita) || 0) + (parseFloat(doc.va_multa) || 0);
          break;
        case "documentos_gps":
          value = parseFloat(doc.va_inss) || 0;
          break;
        case "linha_evento_ob":
          value = parseFloat(doc.va_linha_evento) || 0;
          break;
        case "ob_grouped":
          // For OB grouped entries: use individual value for parcial, total for nominal
          if (valueType === "parcial") {
            value = parseFloat(doc.va_linha_evento_individual) || 0;
          } else {
            // Backend provides per-OB total in va_linha_evento for grouped entries
            value = parseFloat(doc.va_linha_evento) || 0;
          }
          break;
        default:
          value = 0;
      }
    }

    // Apply negative value if document is cancelled (DE CANCELAMENTO status)
    if ((docType === "documentos_darf" || docType === "documentos_dar" || docType === "documentos_gps") && doc.is_negative_value === true) {
      value = value === 0 ? 0 : -Math.abs(value);
    }

    return value;
  },

  encontroDeContas_extractDateFromFinancialDoc(doc) {
    // Handle different document types with different date fields

    // For OB documents - use saque_bacen fields
    if (
      doc.id_ano_saque_bacen &&
      doc.id_mes_saque_bacen &&
      doc.id_dia_saque_bacen
    ) {
      const day = doc.id_dia_saque_bacen.toString().padStart(2, "0");
      const month = doc.id_mes_saque_bacen.toString().padStart(2, "0");
      const year = doc.id_ano_saque_bacen;
      return `${day}/${month}/${year}`;
    }

    // For DARF/DAR/GPS documents - use vencimento fields
    if (
      doc.id_ano_vencimento_doc &&
      doc.id_mes_vencimento_doc &&
      doc.id_dia_vencimento_doc
    ) {
      const day = doc.id_dia_vencimento_doc.toString().padStart(2, "0");
      const month = doc.id_mes_vencimento_doc.toString().padStart(2, "0");
      const year = doc.id_ano_vencimento_doc;
      return `${day}/${month}/${year}`;
    }

    // Fallback to other date fields
    return doc.dt_documento || doc.dt_operacao || "N/A";
  },

  encontroDeContas_formatDateFromOperacao(dtOperacao) {
    if (!dtOperacao) return "N/A";

    const str = String(dtOperacao);

    // Check if it's in YYYYMMDD format (8 digits)
    if (str.length === 8 && /^\d{8}$/.test(str)) {
      const year = str.substr(0, 4);
      const month = str.substr(4, 2);
      const day = str.substr(6, 2);
      return `${day}/${month}/${year}`;
    }

    // Check if it's already in DD/MM/YYYY format (Brazilian)
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmmyyyyMatch = str.match(ddmmyyyyRegex);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      // It's already in the correct format, just ensure proper padding
      const dayPadded = day.padStart(2, "0");
      const monthPadded = month.padStart(2, "0");
      return `${dayPadded}/${monthPadded}/${year}`;
    }

    // Check if it's in YYYY-MM-DD format (ISO)
    const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    const yyyymmddMatch = str.match(yyyymmddRegex);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      const dayPadded = day.padStart(2, "0");
      const monthPadded = month.padStart(2, "0");
      return `${dayPadded}/${monthPadded}/${year}`;
    }

    // If not in a recognized format, try regular date parsing as last resort
    try {
      const date = new Date(dtOperacao);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR");
      }
    } catch (error) {
      // Fall through to return original
    }

    return dtOperacao; // Return as-is if can't parse
  },

  encontroDeContas_getItemDescription(itemId, empenho) {
    // Try to find the item description from the empenho data
    const neItems = empenho.ne_item || [];
    const item = neItems.find((item) => item.id_item === itemId);
    return item ? item.ds_item : `Item ${itemId}`;
  },

  encontroDeContas_parseDateForComparison(dateString) {
    if (!dateString) return null;

    const str = String(dateString);

    try {
      // Handle YYYYMMDD format (8 digits)
      if (/^\d{8}$/.test(str)) {
        const year = str.substring(0, 4);
        const month = str.substring(4, 6);
        const day = str.substring(6, 8);
        return new Date(year, parseInt(month) - 1, parseInt(day));
      }

      // Handle DD/MM/YYYY format (Brazilian format)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const parts = str.split("/");
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }

      // Handle YYYY-MM-DD format (ISO format)
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return new Date(str);
      }

      // Try default parsing
      return new Date(str);
    } catch (error) {
      console.warn(`Failed to parse date for comparison: ${dateString}`, error);
      return null;
    }
  },

  // ===== UTILITY AND MATH HELPER METHODS =====

  encontroDeContas_formatCurrencyAggressive(value) {
    // Check for negative zero before forcing conversion
    if (Object.is(value, -0)) {
      console.warn("🎯 NEGATIVE ZERO DETECTED in formatCurrencyAggressive:", {
        value: value,
        location: "formatCurrencyAggressive input",
      });
    }

    // Check for small negative numbers that might cause issues
    if (typeof value === "number" && value < 0 && value > -0.001) {
      console.warn("🎯 SMALL NEGATIVE NUMBER DETECTED in formatCurrencyAggressive:", {
        value: value,
        location: "formatCurrencyAggressive input - small negative",
      });
    }

    // Force conversion to positive zero if any kind of zero
    if (value === 0 || value === -0 || Object.is(value, -0) || Object.is(value, 0)) {
      return "R$ 0,00";
    }
    return this.encontroDeContas_formatCurrency(value);
  },

  encontroDeContas_safeMathSubtract(a, b) {
    const numA = a || 0;
    const numB = b || 0;
    const result = numA - numB;

    // Only log when negative zero is detected
    if (Object.is(result, -0)) {
      console.warn("🎯 NEGATIVE ZERO DETECTED in safeMathSubtract:", {
        operandA: numA,
        operandB: numB,
        result: result,
        location: "safeMathSubtract calculation",
      });
    }

    // Handle negative zero and very small floating-point errors
    return result === 0 ? 0 : result;
  },

  encontroDeContas_ensurePositiveZero(value) {
    if (Object.is(value, -0)) {
      console.warn("🔍 ensurePositiveZero detected negative zero, converting to positive zero");
      return 0;
    }
    return value;
  },

  encontroDeContas_safeParseFloat(value) {
    const result = parseFloat(value) || 0;
    return Object.is(result, -0) ? 0 : result;
  },

  encontroDeContas_formatCurrencyShort(value) {
    if (value >= 1000000000) return `R$ ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  },

  encontroDeContas_calculateStatusPercentage(financas, orcamentario) {
    // Calculate percentage: Finanças Parciais / Orçamentário * 100
    if (!orcamentario || orcamentario === 0) {
      return {
        percentage: 0,
        display: "0%",
      };
    }

    // Handle case where financas might be null, undefined, or zero
    const financasValue = financas || 0;
    const percentage = (financasValue / orcamentario) * 100;

    return {
      percentage: percentage,
      display: `${percentage.toFixed(1)}%`,
    };
  },

  encontroDeContas_getPercentageStatusBadge(percentageObj) {
    const percentage = percentageObj.percentage || 0;
    // Color coding based on financial execution percentage: Finanças Parciais / Orçamentário * 100
    // Higher percentage = more of the budget has been financially processed (using partial payment values)
    if (percentage >= 80) {
      return "badge-success"; // Green: 80-100% financially processed (excellent execution)
    } else if (percentage >= 50) {
      return "badge-warning"; // Yellow: 50-79% financially processed (good execution)
    } else if (percentage >= 20) {
      return "badge-info"; // Blue: 20-49% financially processed (moderate execution)
    } else if (percentage > 0) {
      return "badge-secondary"; // Gray: 1-19% financially processed (low execution)
    } else if (percentage === 0) {
      return "badge-light"; // Light gray: 0% financially processed (no execution yet)
    } else {
      return "badge-danger"; // Red: negative percentage (unusual case)
    }
  },

  encontroDeContas_getStatusBadge(status) {
    switch (status?.toLowerCase()) {
      case "ativo":
        return "badge-success";
      case "finalizado":
        return "badge-secondary";
      case "cancelado":
        return "badge-danger";
      default:
        return "badge-primary";
    }
  },

  encontroDeContas_renderEmpenhosCard() {
    console.log("📊 Rendering Empenhos card...");
    
    if (!this.state.rawData?.empenhos_data) {
      console.warn("❌ No empenhos data available for card!");
      return;
    }

    try {
      // Use the internal EmpenhosCard component
      const empenhosCard = new this.EmpenhosCard({
        containerId: "empenhos-card",
        data: this.state.rawData.empenhos_data,
        title: "Empenhos",
        subtitle: "Total de empenhos desde 2019"
      }, this);

      console.log("✅ Empenhos card rendered with component");
    } catch (error) {
      console.error("❌ Error rendering empenhos card with component:", error);
      
      // Fallback to the old manual method
      const empenhosData = this.state.rawData.empenhos_data;
      let totalEmpenhos = 0;
      let emExecucao = 0;
      let finalizados = 0;
      let rapCount = 0;

      empenhosData.forEach((empenho) => {
        totalEmpenhos++;

        // Calculate payment percentage using the same method as the table
        const orcamentarioTotal = this.encontroDeContas_calculateOrcamentarioTotal(empenho);
        const financasTotal = this.encontroDeContas_calculateFinancasTotal(empenho);

        const percentagePaid = orcamentarioTotal > 0 ? (financasTotal / orcamentarioTotal) * 100 : 0;

        // Check for RAP operations
        const hasRapOperation = this.encontroDeContas_checkForRapOperations(empenho);

        if (hasRapOperation) {
          rapCount++;
        } else if (percentagePaid >= 100) {
          finalizados++;
        } else {
          emExecucao++;
        }
      });

      // Update DOM elements
      const totalDisplay = document.getElementById("total-empenhos-display");
      const emExecucaoDisplay = document.getElementById("em-execucao-count");
      const finalizadosDisplay = document.getElementById("finalizados-count");
      const rapDisplay = document.getElementById("rap-count");

      if (totalDisplay) totalDisplay.textContent = totalEmpenhos;
      if (emExecucaoDisplay) emExecucaoDisplay.textContent = emExecucao;
      if (finalizadosDisplay) finalizadosDisplay.textContent = finalizados;
      if (rapDisplay) rapDisplay.textContent = rapCount;

      console.log("✅ Empenhos card updated with fallback method:", {
        total: totalEmpenhos,
        emExecucao: emExecucao,
        finalizados: finalizados,
        rap: rapCount
      });
    }
  },

  encontroDeContas_renderContractAnalysis() {
    console.log("📊 Rendering Contract Analysis...");
    // Implementation would go here
  },

  async encontroDeContas_renderChart() {
    console.log("📊 Rendering Financial Chart...");
    
    const containers = this.encontroDeContas_initContainers();
    if (!containers.chartContainer || !this.state.filteredData?.empenhos_data) {
      console.warn("❌ Chart container or data not available!");
      return;
    }

    try {
      const echarts = await window.App.getEcharts();

      // Destroy existing chart
      if (this.state.chart) {
        this.state.chart.dispose();
      }

      // Initialize new chart
      this.state.chart = echarts.init(containers.chartContainer);
      
      // Ensure container has proper width immediately
      containers.chartContainer.style.width = '100%';

      const chartData = this.encontroDeContas_prepareChartData();

      const option = {
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          formatter: (params) => {
            let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param) => {
              tooltip += `${param.seriesName}: ${this.encontroDeContas_formatCurrency(param.value)}<br/>`;
            });
            return tooltip;
          },
        },
        legend: {
          data: ["Valores Orçamentários", "Valores Financeiros Parciais"],
          bottom: 10,
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: chartData.months,
          axisLabel: { rotate: 45 },
        },
        yAxis: [
          {
            type: "value",
            name: "Valores (R$)",
            axisLabel: {
              formatter: (value) => this.encontroDeContas_formatCurrencyShort(value),
            },
          },
        ],
        series: [
          {
            name: "Valores Orçamentários",
            type: "line",
            data: chartData.orcamentario,
            smooth: true, // Enable smooth curves
            lineStyle: { color: "#1976d2", width: 3 },
            itemStyle: { color: "#1976d2" },
            areaStyle: {
              color: "rgba(25, 118, 210, 0.3)", // Increased opacity for better visibility
              origin: "start", // Fill from the beginning
            },
          },
          {
            name: "Valores Financeiros Parciais",
            type: "line",
            data: chartData.financeiro,
            smooth: true, // Enable smooth curves
            lineStyle: { color: "#4caf50", width: 3 },
            itemStyle: { color: "#4caf50" },
            areaStyle: {
              color: "rgba(76, 175, 80, 0.3)", // Increased opacity for better visibility
              origin: "start", // Fill from the beginning
            },
          },
        ],
      };

      this.state.chart.setOption(option);

      // Force resize multiple times to ensure proper width
      setTimeout(() => {
        if (this.state.chart) {
          this.state.chart.resize();
        }
      }, 100);
      
      setTimeout(() => {
        if (this.state.chart) {
          this.state.chart.resize();
        }
      }, 300);
      
      setTimeout(() => {
        if (this.state.chart) {
          this.state.chart.resize();
        }
      }, 500);

      // Handle window resize (using a shared resize handler)
      this.encontroDeContas_setupResizeHandler();
      
      console.log("✅ Financial chart rendered successfully");
    } catch (error) {
      console.error("❌ Error rendering chart:", error);
    }
  },

  encontroDeContas_prepareChartData() {
    const monthlyData = new Map();

    if (!this.state.filteredData?.empenhos_data) {
      return { months: [], orcamentario: [], financeiro: [] };
    }

    this.state.filteredData.empenhos_data.forEach((empenho, index) => {
      // Process orçamentário data - check the new data structure
      const orcamentarioData = empenho.Orçamentário?.operacoes || empenho.Ne_item?.operacoes || [];

      if (Array.isArray(orcamentarioData)) {
        orcamentarioData.forEach((op, opIndex) => {
          if (op && op.dt_operacao && op.va_operacao !== null && op.va_operacao !== undefined) {
            const month = this.encontroDeContas_extractMonth(op.dt_operacao);
            let value = parseFloat(op.va_operacao) || 0;

            // Exclude RP operations from chart calculations (budget rollover to next year)
            // Operations with "RP" in no_operacao are budget transfers, not new spending
            // EXCEPTION: If this is marked as the oldest operation and contains "RP", count it at full value
            const operationType = op.no_operacao?.toString().toUpperCase() || "";
            const isRpOperation = operationType.includes("RP") || 
                                 operationType.includes("INSCRICAO") || 
                                 operationType.includes("RESTOS A PAGAR");

            // Use backend-calculated is_oldest_operation field for exception handling
            // Exception applies to ANY RP operation when it's the oldest operation
            const isOldestRpException = op.is_oldest_operation === true && isRpOperation;

            if (isRpOperation && !isOldestRpException) {
              value = 0; // Count as zero for chart to avoid double-counting budget
            }

            if (month) {
              if (!monthlyData.has(month)) {
                monthlyData.set(month, { orcamentario: 0, financeiro: 0 });
              }
              monthlyData.get(month).orcamentario += value;
            }
          }
        });
      }

      // Process financeiro data from Finanças structure
      const financas = empenho.Finanças || {};

      // Process different document types
      const docTypes = [
        { key: "documentos_dar", data: financas.documentos_dar || empenho.documentos_dar || [] },
        { key: "documentos_darf", data: financas.documentos_darf || empenho.documentos_darf || [] },
        { key: "documentos_gps", data: financas.documentos_gps || empenho.documentos_gps || [] },
        { key: "linha_evento_ob", data: financas.linha_evento_ob || empenho.linha_evento_ob || [] },
      ];

      docTypes.forEach((docType) => {
        const documents = Array.isArray(docType.data) ? docType.data : [];

        documents.forEach((doc) => {
          if (!doc) return;

          const month = this.encontroDeContas_extractMonthFromFinancialDoc(doc);
          const value = this.encontroDeContas_getFinancialDocValue(doc, docType.key, "parcial"); // Use partial values for chart

          if (month && value !== null && value !== undefined && !isNaN(value)) {
            if (!monthlyData.has(month)) {
              monthlyData.set(month, { orcamentario: 0, financeiro: 0 });
            }
            monthlyData.get(month).financeiro += value;
          }
        });
      });
    });

    // Create cumulative timeline with all months filled
    return this.encontroDeContas_createCumulativeTimeline(monthlyData);
  },

  encontroDeContas_createCumulativeTimeline(monthlyData) {
    // Get all months and sort them
    const allMonths = Array.from(monthlyData.keys()).sort();

    // Get current month for ensuring timeline extends to present
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

    if (allMonths.length === 0) {
      // If no data, create a minimal timeline with current month
      return {
        months: [currentMonth],
        orcamentario: [0],
        financeiro: [0],
      };
    }

    // Find the range from first month to current month (or last data month if later)
    const firstMonth = allMonths[0];
    const lastDataMonth = allMonths[allMonths.length - 1];

    // Use the later of lastDataMonth or currentMonth as the end
    const lastMonth = this.encontroDeContas_isMonthLater(currentMonth, lastDataMonth) ? currentMonth : lastDataMonth;

    // Generate all months in the range
    const completeMonthRange = this.encontroDeContas_generateMonthRange(firstMonth, lastMonth);

    // Create cumulative totals
    let cumulativeOrcamentario = 0;
    let cumulativeFinanceiro = 0;

    const months = [];
    const orcamentarioTotals = [];
    const financeiroTotals = [];

    completeMonthRange.forEach((month) => {
      const monthData = monthlyData.get(month) || { orcamentario: 0, financeiro: 0 };

      // Add this month's values to the running totals
      cumulativeOrcamentario += monthData.orcamentario;
      cumulativeFinanceiro += monthData.financeiro;

      months.push(month);
      orcamentarioTotals.push(cumulativeOrcamentario);
      financeiroTotals.push(cumulativeFinanceiro);
    });

    // Ensure we always have at least 2 points for a proper line
    if (months.length === 1) {
      const singleMonth = months[0];
      const nextMonth = this.encontroDeContas_getNextMonth(singleMonth);

      months.push(nextMonth);
      orcamentarioTotals.push(orcamentarioTotals[0]); // Keep same value
      financeiroTotals.push(financeiroTotals[0]); // Keep same value
    }

    return {
      months: months,
      orcamentario: orcamentarioTotals,
      financeiro: financeiroTotals,
    };
  },

  // Helper method to compare month strings (YYYY-MM format)
  encontroDeContas_isMonthLater(month1, month2) {
    const [year1, mon1] = month1.split("-").map(Number);
    const [year2, mon2] = month2.split("-").map(Number);

    if (year1 !== year2) {
      return year1 > year2;
    }
    return mon1 > mon2;
  },

  // Helper method to get next month
  encontroDeContas_getNextMonth(monthStr) {
    const [year, month] = monthStr.split("-").map(Number);
    let nextMonth = month + 1;
    let nextYear = year;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    return `${nextYear}-${nextMonth.toString().padStart(2, "0")}`;
  },

  encontroDeContas_generateMonthRange(startMonth, endMonth) {
    const months = [];
    const [startYear, startMonthNum] = startMonth.split("-").map(Number);
    const [endYear, endMonthNum] = endMonth.split("-").map(Number);

    let currentYear = startYear;
    let currentMonth = startMonthNum;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonthNum)) {
      const monthStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}`;
      months.push(monthStr);

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return months;
  },

  encontroDeContas_extractMonth(dateString) {
    if (!dateString) return null;

    const str = String(dateString);

    // Check if it's in YYYYMMDD format (8 digits) - common for orçamentário dates
    if (str.length === 8 && /^\d{8}$/.test(str)) {
      const year = str.substr(0, 4);
      const month = str.substr(4, 2);
      return `${year}-${month}`;
    }

    // Check if it's in DD/MM/YYYY format (Brazilian format)
    const ddmmyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmmyyMatch = str.match(ddmmyyRegex);
    if (ddmmyyMatch) {
      const [, day, month, year] = ddmmyyMatch;
      const monthPadded = month.padStart(2, "0");
      return `${year}-${monthPadded}`;
    }

    // Try regular date parsing (assumes MM/DD/YYYY or other standard formats)
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
      }
    } catch (error) {
      // Fall through
    }

    // If all else fails, try to extract year and month manually
    const yearMatch = str.match(/(\d{4})/);
    const monthMatch = str.match(/\/(\d{1,2})\//);
    if (yearMatch && monthMatch) {
      const year = yearMatch[1];
      const month = monthMatch[1].padStart(2, "0");
      return `${year}-${month}`;
    }

    return null;
  },

  encontroDeContas_extractMonthFromFinancialDoc(doc) {
    // For OB documents - use saque_bacen fields
    if (doc.id_ano_saque_bacen && doc.id_mes_saque_bacen) {
      const year = doc.id_ano_saque_bacen;
      const month = doc.id_mes_saque_bacen.toString().padStart(2, "0");
      return `${year}-${month}`;
    }

    // For DARF/DAR/GPS documents - use vencimento fields
    if (doc.id_ano_vencimento_doc && doc.id_mes_vencimento_doc) {
      const year = doc.id_ano_vencimento_doc;
      const month = doc.id_mes_vencimento_doc.toString().padStart(2, "0");
      return `${year}-${month}`;
    }

    // Fallback to extracting from formatted date
    const dateString = this.encontroDeContas_extractDateFromFinancialDoc(doc);
    if (dateString !== "N/A") {
      const extractedMonth = this.encontroDeContas_extractMonth(dateString);
      return extractedMonth;
    }

    return null;
  },

  encontroDeContas_formatCurrencyShort(value) {
    if (value >= 1000000000) return `R$ ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  },

  encontroDeContas_prepareEmpenhosDataForExport() {
    return this.state.rawData?.empenhos_data?.map(empenho => ({
      Numero: empenho.numero,
      Data: this.encontroDeContas_formatDate(empenho.data_emissao),
      Valor: empenho.empenhado,
      Categoria: empenho.categoria,
      Especie: empenho.especie
    })) || [];
  },

  encontroDeContas_prepareFinanceiroDataForExport() {
    return [];
  },

  encontroDeContas_prepareMovimentacoesDataForExport() {
    return [];
  },

  encontroDeContas_formatWorksheet(ws, data, sheetType) {
    // Basic formatting - can be enhanced
    return ws;
  },

  // ===== WINDOW API SETUP =====

  encontroDeContas_setupWindowAPI() {
    // Static method for HTML button access
    if (typeof window !== 'undefined') {
      window.exportToExcel = () => {
        if (window.App && window.App.encontroDeContas_exportToExcel) {
          window.App.encontroDeContas_exportToExcel();
        } else {
          alert(
            "Sistema não inicializado. Aguarde o carregamento completo da página."
          );
        }
      };

      // Add debug helper after App is loaded
      setTimeout(() => {
        if (window.App) {
          window.EncontroContasDebug = {
            getState: () => window.App.state,
            forceInit: () => window.App.encontroDeContas_init(),
            renderTables: () => window.App.encontroDeContas_renderAllTables(),
            getContainers: () => window.App.encontroDeContas_initContainers(),
            loadData: (contractId) => {
              window.App.state.currentContractId = contractId;
              return window.App.encontroDeContas_loadInitialData();
            }
          };
          console.log("🛠️ EncontroContasDebug available in window.EncontroContasDebug");
        }
      }, 2000);

      // Setup legacy EncontroInit API
      this.encontroDeContas_setupLegacyAPI();
    }
  },

  // ===== CARD GENERATOR INTEGRATION =====

  async encontroDeContas_loadCardGenerator() {
    try {
      // Return the internal CardGenerator component
      return this.CardGenerator;
    } catch (error) {
      console.error("Failed to load CardGenerator:", error);
      // Fallback to window.CardGenerator if exists
      return window.CardGenerator || this.CardGenerator;
    }
  },

  // ===== INITIALIZATION ORCHESTRATION =====

  /**
   * Enhanced initialization that includes card creation and data fetching orchestration
   */
  async encontroDeContas_fullInit() {
    try {
      console.log("🚀 Full Initialization - Encontro de Contas...");

      // Load CardGenerator first if needed
      const CardGenerator = await this.encontroDeContas_loadCardGenerator();

      if (CardGenerator) {
        console.log("✅ CardGenerator loaded successfully");
        window.CardGenerator = CardGenerator;
        
        // Also expose our internal components to window
        window.CardGenerator = this.CardGenerator;
        window.EmpenhosCard = this.EmpenhosCard;
      }

      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.encontroDeContas_onDOMReady());
      } else {
        this.encontroDeContas_onDOMReady();
      }
    } catch (error) {
      console.error("❌ Error in full initialization:", error);
    }
  },

  /**
   * Called when DOM is fully loaded
   */
  encontroDeContas_onDOMReady() {
    console.log("✅ DOM Ready - Starting encontro initialization...");

    try {
      // Only proceed if we're on the encontro page
      if (this.encontroDeContas_isEncontroPage()) {
        // Setup window API first
        this.encontroDeContas_setupWindowAPI();

        // Initialize data fetching
        this.encontroDeContas_initializeDataFetching();
      }

      console.log("✅ Encontro initialization complete");
    } catch (error) {
      console.error("❌ Error in DOM ready handler:", error);
    }
  },

  /**
   * Check if we're on the encontro de contas page
   */
  encontroDeContas_isEncontroPage() {
    return (
      window.location.pathname.includes("encontro_contas") ||
      document.querySelector("#empenhos-originais-tbody") !== null ||
      document.querySelector("#ultimos-lancamentos-container") !== null
    );
  },

  /**
   * Initialize data fetching and orchestrate the page setup
   */
  async encontroDeContas_initializeDataFetching() {
    console.log("📡 Initializing data fetching...");

    // Check if there's a contract ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get("contrato");

    if (contratoId) {
      console.log(`🔍 Found contract ID: ${contratoId}`);

      try {
        // Use the regular init method to load data
        console.log("🏗️ Initializing EncontroContas with data...");
        await this.encontroDeContas_init();
        
        console.log("✅ EncontroContas initialized with real data");
      } catch (error) {
        console.error("❌ Error loading EncontroContas with data:", error);
      }
    } else {
      console.log("ℹ️ No contract ID found, showing empty state");
      // Initialize containers and setup but don't load data
      this.encontroDeContas_initContainers();
      this.encontroDeContas_setupEventListeners();
    }
  },

  /**
   * Utility method to show loading state on a card
   */
  encontroDeContas_showCardLoading(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="100%" class="text-center" style="padding: 40px;">
            <div class="br-loading" role="progressbar">
              <div class="br-loading-text">Carregando...</div>
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Utility method to show error state on a card
   */
  encontroDeContas_showCardError(tbodyId, errorMessage = "Erro ao carregar dados") {
    const tbody = document.getElementById(tbodyId);
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="100%" class="text-center" style="padding: 40px;">
            <div class="text-danger">
              <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <br />
              ${errorMessage}
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Manual method for loading contract data (external access)
   */
  encontroDeContas_loadContractData(contratoId) {
    console.log(`📋 Loading contract data for ID: ${contratoId}`);
    this.state.currentContractId = contratoId;
    return this.encontroDeContas_loadInitialData();
  },

  /**
   * Refresh all cards and data
   */
  encontroDeContas_refreshCards() {
    console.log("🔄 Refreshing all cards...");
    if (this.encontroDeContas_isEncontroPage()) {
      this.encontroDeContas_renderAllTables();
    }
  },

  // ===== COMPATIBILITY FOR LEGACY EncontroInit API =====

  /**
   * Setup EncontroInit compatibility in window object
   */
  encontroDeContas_setupLegacyAPI() {
    if (typeof window !== 'undefined') {
      // Create compatibility object that delegates to App methods
      window.EncontroInit = {
        init: () => this.encontroDeContas_fullInit(),
        onDOMReady: () => this.encontroDeContas_onDOMReady(),
        isEncontroPage: () => this.encontroDeContas_isEncontroPage(),
        createPageCards: () => console.log("🎨 createPageCards - now handled automatically"),
        initializeDataFetching: () => this.encontroDeContas_initializeDataFetching(),
        updateCardsWithRealData: () => this.encontroDeContas_renderAllTables(),
        showCardLoading: (tbodyId) => this.encontroDeContas_showCardLoading(tbodyId),
        showCardError: (tbodyId, errorMessage) => this.encontroDeContas_showCardError(tbodyId, errorMessage),
        loadContractData: (contratoId) => this.encontroDeContas_loadContractData(contratoId),
        refreshCards: () => this.encontroDeContas_refreshCards()
      };
    }
  },

  // ===== CARD GENERATOR COMPONENT =====

  /**
   * Card Generator Component
   * Creates reusable card layouts with table structure following the project's design system
   */
  CardGenerator: {
    /**
     * Creates a complete card element with header, title, subtitle and table structure
     * @param {Object} options - Configuration options
     * @param {string} options.title - The card's main heading
     * @param {string} options.subtitle - The card's subheading
     * @param {string} options.tbodyId - The ID to assign to the tbody element
     * @param {string} [options.icon] - Icon URL (optional, defaults to doc2.png)
     * @param {Array} [options.headers] - Table headers (optional, defaults to generic headers)
     * @param {string} [options.containerClass] - Additional CSS classes for the card container
     * @returns {HTMLElement} The complete card DOM element
     */
    createCard({
      title,
      subtitle,
      tbodyId,
      icon = "/static/images/doc2.png",
      headers = [],
      containerClass = "",
    }) {
      // Validate required parameters
      if (!title || !subtitle || !tbodyId) {
        throw new Error("title, subtitle, and tbodyId are required parameters");
      }

      // Create the main card container
      const cardContainer = this._createCardContainer(containerClass);

      // Create and append the header section
      const cardHeader = this._createCardHeader(title, subtitle, icon);
      cardContainer.appendChild(cardHeader);

      // Create and append the content section with table
      const cardContent = this._createCardContent(tbodyId, headers);
      cardContainer.appendChild(cardContent);

      return cardContainer;
    },

    /**
     * Creates the main card container element
     * @param {string} containerClass - Additional CSS classes
     * @returns {HTMLElement} Card container div
     * @private
     */
    _createCardContainer(containerClass) {
      const container = document.createElement("div");
      container.className = `br-card ${containerClass}`.trim();
      return container;
    },

    /**
     * Creates the card header section with title, subtitle and icon
     * @param {string} title - Card title
     * @param {string} subtitle - Card subtitle
     * @param {string} icon - Icon URL
     * @returns {HTMLElement} Card header element
     * @private
     */
    _createCardHeader(title, subtitle, icon) {
      const header = document.createElement("div");
      header.className = "card-header";

      header.innerHTML = `
        <div class="d-flex" style="width: 100%">
          <div class="ml-3" style="flex-grow: 1">
            <div class="titulo">
              <img
                src="${this._escapeHtml(icon)}"
                alt="Ícone"
                style="height: 36px; margin: 10px 0px -10px 0px"
              />
              ${this._escapeHtml(title)}
            </div>
            <div
              style="border-bottom: 1px solid #ccc; margin: -6px 0px 0px 26px"
            ></div>
            <div class="subtitulo">
              ${this._escapeHtml(subtitle)}
            </div>
          </div>
        </div>
      `;

      return header;
    },

    /**
     * Creates the card content section with table structure
     * @param {string} tbodyId - ID for the tbody element
     * @param {Array} headers - Array of header strings
     * @returns {HTMLElement} Card content element
     * @private
     */
    _createCardContent(tbodyId, headers) {
      const content = document.createElement("div");
      content.className = "card-content";
      content.style.padding = "0";

      const tableContainer = this._createTableContainer();
      const table = this._createTable(tbodyId, headers);

      tableContainer.appendChild(table);
      content.appendChild(tableContainer);

      return content;
    },

    /**
     * Creates the table container with responsive wrapper
     * @returns {HTMLElement} Table container div
     * @private
     */
    _createTableContainer() {
      const container = document.createElement("div");
      container.className = "table-responsive";
      return container;
    },

    /**
     * Creates the table element with thead and tbody
     * @param {string} tbodyId - ID for the tbody element
     * @param {Array} headers - Array of header strings
     * @returns {HTMLElement} Table element
     * @private
     */
    _createTable(tbodyId, headers) {
      const table = document.createElement("table");
      table.className = "br-table table-hover";

      // Determine column count
      const columnCount = headers.length > 0 ? headers.length : 1;

      // Create thead if headers are provided
      if (headers.length > 0) {
        const thead = this._createTableHeader(headers);
        table.appendChild(thead);
      }

      // Create tbody with the specified ID and column count
      const tbody = this._createTableBody(tbodyId, columnCount);
      table.appendChild(tbody);

      return table;
    },

    /**
     * Creates the table header element
     * @param {Array} headers - Array of header strings
     * @returns {HTMLElement} Thead element
     * @private
     */
    _createTableHeader(headers) {
      const thead = document.createElement("thead");
      thead.style.backgroundColor = "#f8f8f8";

      const headerRow = document.createElement("tr");

      headers.forEach((headerText) => {
        const th = document.createElement("th");
        th.style.border = "none";
        th.textContent = headerText;
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      return thead;
    },

    /**
     * Creates the table body element with specified ID
     * @param {string} tbodyId - ID for the tbody element
     * @param {number} columnCount - Number of columns for proper colspan
     * @returns {HTMLElement} Tbody element
     * @private
     */
    _createTableBody(tbodyId, columnCount = 1) {
      const tbody = document.createElement("tbody");
      tbody.id = tbodyId;

      // Add a default empty state row with proper colspan
      tbody.innerHTML = `
        <tr>
          <td colspan="${columnCount}" class="text-center" style="padding: 40px;">
            <div class="text-muted">
              <i class="fas fa-inbox fa-2x mb-3"></i>
              <br />
              Aguardando dados...
            </div>
          </td>
        </tr>
      `;

      return tbody;
    },

    /**
     * Escapes HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML string
     * @private
     */
    _escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * Creates a card with predefined layouts for common use cases
     * @param {string} layout - Layout type ('simple', 'financial', 'data')
     * @param {Object} options - Configuration options
     * @returns {HTMLElement} The complete card DOM element
     */
    createPresetCard(layout, options) {
      const presets = {
        simple: {
          headers: ["#", "Data", "Descrição"],
          containerClass: "h-100",
        },
        financial: {
          headers: ["#", "Data", "Tipo", "Valor"],
          containerClass: "h-100",
        },
        data: {
          headers: ["#", "Item", "Status", "Detalhes"],
          containerClass: "h-100",
        },
      };

      const preset = presets[layout];
      if (!preset) {
        throw new Error(`Unknown layout preset: ${layout}`);
      }

      return this.createCard({
        ...options,
        headers: options.headers || preset.headers,
        containerClass: `${preset.containerClass} ${
          options.containerClass || ""
        }`.trim(),
      });
    },

    /**
     * Utility method to populate a table body with data
     * @param {string} tbodyId - ID of the tbody element to populate
     * @param {Array} data - Array of row data objects
     * @param {Function} [rowRenderer] - Optional custom row renderer function
     * @param {number} [columnCount] - Number of columns for proper empty state (auto-detected if not provided)
     */
    populateTable(tbodyId, data, rowRenderer = null, columnCount = null) {
      const tbody = document.getElementById(tbodyId);
      if (!tbody) {
        console.warn(`Table body with ID '${tbodyId}' not found`);
        return;
      }

      // Auto-detect column count if not provided
      if (columnCount === null) {
        // Try to get column count from the table header
        const table = tbody.closest("table");
        const headerRow = table?.querySelector("thead tr");
        if (headerRow) {
          columnCount = headerRow.children.length;
        } else if (data && data.length > 0) {
          // Fallback: use the number of properties in the first data object
          columnCount = Object.keys(data[0]).length;
        } else {
          columnCount = 1; // Default fallback
        }
      }

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="${columnCount}" class="text-center" style="padding: 40px;">
              <div class="text-muted">
                <i class="fas fa-inbox fa-2x mb-3"></i>
                <br />
                Nenhum dado encontrado
              </div>
            </td>
          </tr>
        `;
        return;
      }

      const rows = data
        .map((rowData, index) => {
          if (rowRenderer && typeof rowRenderer === "function") {
            return rowRenderer(rowData, index);
          }

          // Default row renderer
          return this._renderDefaultRow(rowData, index);
        })
        .join("");

      tbody.innerHTML = rows;
    },

    /**
     * Default row renderer for table data
     * @param {Object} rowData - Data for the row
     * @param {number} index - Row index
     * @returns {string} HTML string for the row
     * @private
     */
    _renderDefaultRow(rowData, index) {
      const cells = Object.values(rowData)
        .map((value) => `<td>${this._escapeHtml(String(value))}</td>`)
        .join("");

      return `<tr>${cells}</tr>`;
    },
  },

  // ===== EMPENHOS CARD COMPONENT =====

  /**
   * Empenhos Card Component
   * Creates a reusable card for displaying empenhos data with dynamic calculations
   */
  EmpenhosCard: class {
    constructor(options = {}, encontroContasContext) {
      this.encontroContasContext = encontroContasContext;
      this.options = {
        containerId: "empenhos-card",
        title: "Empenhos",
        subtitle: "Total de empenhos desde 2019",
        icon: "/static/images/doc2.png",
        ...options,
      };

      this.data = options.data || [];
      this.container = null;
      this.cardElement = null;
      this.metrics = {
        total: 0,
        emExecucao: 0,
        finalizados: 0,
        rap: 0,
        criticos: 0,
      };

      this.init();
    }

    /**
     * Initialize the component
     */
    init() {
      this.container = document.getElementById(this.options.containerId);
      if (!this.container) {
        console.error(
          `Container with ID '${this.options.containerId}' not found`
        );
        return;
      }

      this.render();
      this.setupEventListeners();
    }

    /**
     * Calculate metrics based on empenhos data
     * @param {Array} data - Array of empenhos objects
     */
    calculateMetrics(data = []) {
      this.metrics = {
        total: data.length,
        emExecucao: 0,
        finalizados: 0,
        rap: 0,
        criticos: 0,
      };

      console.log("📊 Calculating metrics for empenhos:", data.length);
      if (data.length > 0) {
        console.log("📊 First empenho structure:", data[0]);
      }

      data.forEach((empenho, index) => {
        // Calculate status the same way as in the main table: Finanças / Orçamentário * 100
        const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
        const financasTotal = this.calculateFinancasTotal(empenho);
        const status =
          orcamentarioTotal > 0 ? (financasTotal / orcamentarioTotal) * 100 : 0;
        const isFinalized = status >= 100;

        console.log(`📊 Empenho ${index + 1}:`, {
          numero: empenho.empenho?.numero,
          orcamentarioTotal: orcamentarioTotal,
          financasTotal: financasTotal,
          status: status.toFixed(1) + "%",
          isFinalized: isFinalized,
          operacao: empenho.operacao,
          hasMovimentacoes: !!empenho.movimentacoes,
          movimentacoesLength: empenho.movimentacoes?.length || 0,
        });

        if (!isFinalized) {
          this.metrics.emExecucao++;
        } else {
          this.metrics.finalizados++;
        }

        // Check for RAP (Restos a Pagar) - ONLY for non-finalized empenhos
        // Finalized empenhos (100% status) should NOT be counted as RAP
        if (!isFinalized) {
          let isRAP = false;

          // Method 1: Check operacao field
          if (empenho.operacao === "RP") {
            isRAP = true;
            console.log(
              `📊 RAP detected via operacao: ${empenho.empenho?.numero}`
            );
          }

          // Method 2: Check movimentacoes for RP operation
          if (
            empenho.movimentacoes &&
            empenho.movimentacoes.some((mov) => mov.operacao === "RP")
          ) {
            isRAP = true;
            console.log(
              `📊 RAP detected via movimentacoes: ${empenho.empenho?.numero}`
            );
          }

          // Method 3: Check orçamentário operations for "RP" in no_operacao (proven working method)
          const orcamentario =
            empenho.Orçamentário?.operacoes ||
            empenho.Ne_item?.operacoes ||
            empenho.Orçamentário ||
            [];
          if (Array.isArray(orcamentario)) {
            const hasRpOperation = orcamentario.some((op) => {
              const operationType =
                op.no_operacao?.toString().toUpperCase() || "";
              return (
                operationType.includes("RP") ||
                operationType.includes("INSCRICAO") ||
                operationType.includes("RESTOS A PAGAR")
              );
            });
            if (hasRpOperation) {
              isRAP = true;
              console.log(
                `📊 RAP detected via orcamentario no_operacao: ${empenho.empenho?.numero}`
              );
            }
          }

          // Method 4: Check if empenho number contains "RP" (case insensitive, any position)
          if (empenho.empenho?.numero && /rp/i.test(empenho.empenho.numero)) {
            isRAP = true;
            console.log(
              `📊 RAP detected via numero pattern: ${empenho.empenho?.numero}`
            );
          }

          if (isRAP) {
            this.metrics.rap++;
            console.log(
              `📊 RAP counted for non-finalized empenho: ${
                empenho.empenho?.numero
              } (status: ${status.toFixed(1)}%)`
            );
          }
        } else {
          console.log(
            `📊 Skipping RAP check for finalized empenho: ${
              empenho.empenho?.numero
            } (status: ${status.toFixed(1)}%)`
          );
        }

        // Check for críticos (status > 100%)
        if (status > 100) {
          this.metrics.criticos++;
        }
      });

      console.log("📊 Final calculated metrics:", this.metrics);
    }

    /**
     * Render the card component
     */
    render() {
      this.calculateMetrics(this.data);

      this.cardElement = this.createCardHTML();

      // Clear container and append new card
      this.container.innerHTML = "";
      this.container.appendChild(this.cardElement);
    }

    /**
     * Create the complete card HTML structure
     * @returns {HTMLElement} The card element
     */
    createCardHTML() {
      const cardDiv = document.createElement("div");
      cardDiv.className = "br-card h-100 card-contratos";
      cardDiv.id = this.options.containerId;

      cardDiv.innerHTML = `
        <div class="card-header">
          <div class="d-flex" style="width: 100%">
            <div class="ml-3" style="flex-grow: 1">
              <div class="titulo">
                <img
                  src="${this.options.icon}"
                  alt="Ícone"
                  style="height: 36px; margin: 10px 0px -10px 0px"
                />
                ${this.options.title}
              </div>
              <div
                style="border-bottom: 1px solid #ccc; margin: -6px 0px 0px 26px"
              ></div>
              <div class="subtitulo">${this.options.subtitle}</div>
            </div>

            <div
              class="ml-auto"
              style="margin: -10px -10px 0px 0px; position: relative"
            >
              <button
                class="br-button circle kpi-dropdown-btn"
                type="button"
                aria-label="Opções de visualização"
                data-card-id="${this.options.containerId}"
              >
                <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
              </button>
              <div class="empenhos-dropdown-menu" style="display: none;">
                <a href="#" class="dropdown-item" data-action="refresh">
                  <i class="fas fa-sync-alt" style="margin-right: 8px;"></i>Atualizar
                </a>
                <a href="#" class="dropdown-item" data-action="export">
                  <i class="fas fa-download" style="margin-right: 8px;"></i>Exportar
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item" data-action="details">
                  <i class="fas fa-info-circle" style="margin-right: 8px;"></i>Detalhes
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="card-content" style="padding-top: 8px">
          <div class="valor-principal" data-metric="total">${this.metrics.total}</div>
          <div class="linha">
            <div
              class="dashboard-card-filter clickable"
              data-filter="em-execucao"
              data-metric="emExecucao"
              tabindex="0"
            >
              <div>Em execução</div>
              <div class="valor-azul">${this.metrics.emExecucao}</div>
            </div>
            <div class="divider"></div>
            <div
              class="dashboard-card-filter clickable"
              data-filter="finalizados"
              data-metric="finalizados"
              tabindex="0"
            >
              <div>Finalizados</div>
              <div class="valor-azul">${this.metrics.finalizados}</div>
            </div>
            <div class="divider"></div>
            <div
              class="dashboard-card-filter clickable"
              data-filter="rap"
              data-metric="rap"
              tabindex="0"
            >
              <div>RAP</div>
              <div class="valor-vermelho">${this.metrics.rap}</div>
            </div>
            <div class="divider"></div>
            <div
              class="dashboard-card-filter clickable"
              data-filter="criticos"
              data-metric="criticos"
              tabindex="0"
            >
              <div>Críticos</div>
              <div class="valor-vermelho">${this.metrics.criticos}</div>
            </div>
          </div>
        </div>
      `;

      return cardDiv;
    }

    /**
     * Setup event listeners for card interactions
     */
    setupEventListeners() {
      if (!this.cardElement) return;

      // Filter click handlers
      const filterElements = this.cardElement.querySelectorAll(
        ".dashboard-card-filter"
      );
      filterElements.forEach((element) => {
        element.addEventListener("click", (e) => {
          this.handleFilterClick(e);
        });

        element.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.handleFilterClick(e);
          }
        });
      });

      // Dropdown button handler
      const dropdownBtn = this.cardElement.querySelector(".kpi-dropdown-btn");
      if (dropdownBtn) {
        dropdownBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleDropdown();
        });
      }

      // Dropdown menu handlers
      const dropdownItems = this.cardElement.querySelectorAll(
        ".empenhos-dropdown-menu .dropdown-item"
      );
      dropdownItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const action = e.currentTarget.dataset.action;
          this.handleDropdownAction(action);
          this.hideDropdown();
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!this.cardElement.contains(e.target)) {
          this.hideDropdown();
        }
      });
    }

    /**
     * Handle filter button clicks
     * @param {Event} event - Click event
     */
    handleFilterClick(event) {
      const filterType = event.currentTarget.dataset.filter;
      const metric = event.currentTarget.dataset.metric;

      // Add visual feedback
      this.addClickFeedback(event.currentTarget);

      // Emit custom event for parent components to handle
      const customEvent = new CustomEvent("empenhosFilterChanged", {
        detail: {
          filterType,
          metric,
          value: this.metrics[metric],
          data: this.getFilteredData(filterType),
        },
      });

      this.container.dispatchEvent(customEvent);
    }

    /**
     * Get filtered data based on filter type
     * @param {string} filterType - Type of filter to apply
     * @returns {Array} Filtered empenhos data
     */
    getFilteredData(filterType) {
      switch (filterType) {
        case "em-execucao":
          return this.data.filter((empenho) => {
            const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
            const financasTotal = this.calculateFinancasTotal(empenho);
            const status =
              orcamentarioTotal > 0
                ? (financasTotal / orcamentarioTotal) * 100
                : 0;
            return status < 100;
          });

        case "finalizados":
          return this.data.filter((empenho) => {
            const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
            const financasTotal = this.calculateFinancasTotal(empenho);
            const status =
              orcamentarioTotal > 0
                ? (financasTotal / orcamentarioTotal) * 100
                : 0;
            return status >= 100;
          });

        case "rap":
          return this.data.filter((empenho) => {
            // First check if empenho is finalized (100% status)
            const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
            const financasTotal = this.calculateFinancasTotal(empenho);
            const status =
              orcamentarioTotal > 0
                ? (financasTotal / orcamentarioTotal) * 100
                : 0;
            const isFinalized = status >= 100;

            // Only check for RAP if empenho is NOT finalized
            if (isFinalized) {
              return false; // Finalized empenhos are excluded from RAP
            }

            // Multiple ways to detect RAP - using the proven method from encontro_contas.js

            // Method 1: Check operacao field
            if (empenho.operacao === "RP") {
              return true;
            }

            // Method 2: Check movimentacoes for RP operation
            if (
              empenho.movimentacoes &&
              empenho.movimentacoes.some((mov) => mov.operacao === "RP")
            ) {
              return true;
            }

            // Method 3: Check orçamentário operations for "RP", "INSCRICAO", or "RESTOS A PAGAR" in no_operacao (proven working method)
            const orcamentario =
              empenho.Orçamentário?.operacoes ||
              empenho.Ne_item?.operacoes ||
              empenho.Orçamentário ||
              [];
            if (Array.isArray(orcamentario)) {
              const hasRpOperation = orcamentario.some((op) => {
                const operationType =
                  op.no_operacao?.toString().toUpperCase() || "";
                return (
                  operationType.includes("RP") ||
                  operationType.includes("INSCRICAO") ||
                  operationType.includes("RESTOS A PAGAR")
                );
              });
              if (hasRpOperation) {
                return true;
              }
            }

            // Method 4: Check if empenho number contains "RP" (case insensitive, any position)
            if (empenho.empenho?.numero && /rp/i.test(empenho.empenho.numero)) {
              return true;
            }

            return false;
          });

        case "criticos":
          return this.data.filter((empenho) => {
            const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
            const financasTotal = this.calculateFinancasTotal(empenho);
            const status =
              orcamentarioTotal > 0
                ? (financasTotal / orcamentarioTotal) * 100
                : 0;
            return status > 100;
          });

        default:
          return this.data;
      }
    }

    /**
     * Add visual click feedback to element
     * @param {HTMLElement} element - Element to animate
     */
    addClickFeedback(element) {
      element.style.transform = "scale(0.95)";
      element.style.transition = "transform 0.1s";

      setTimeout(() => {
        element.style.transform = "scale(1)";
        setTimeout(() => {
          element.style.transition = "";
        }, 100);
      }, 100);
    }

    /**
     * Toggle dropdown menu visibility
     */
    toggleDropdown() {
      const dropdown = this.cardElement.querySelector(".empenhos-dropdown-menu");
      if (dropdown) {
        const isVisible = dropdown.style.display !== "none";
        dropdown.style.display = isVisible ? "none" : "block";
      }
    }

    /**
     * Hide dropdown menu
     */
    hideDropdown() {
      const dropdown = this.cardElement.querySelector(".empenhos-dropdown-menu");
      if (dropdown) {
        dropdown.style.display = "none";
      }
    }

    /**
     * Handle dropdown action clicks
     * @param {string} action - Action type
     */
    handleDropdownAction(action) {
      const customEvent = new CustomEvent("empenhosDropdownAction", {
        detail: {
          action,
          data: this.data,
          metrics: this.metrics,
        },
      });

      this.container.dispatchEvent(customEvent);
    }

    /**
     * Update card data and re-render
     * @param {Array} newData - New empenhos data
     */
    updateData(newData) {
      this.data = newData || [];
      this.render();
    }

    /**
     * Get current metrics
     * @returns {Object} Current calculated metrics
     */
    getMetrics() {
      return { ...this.metrics };
    }

    /**
     * Get current data
     * @returns {Array} Current empenhos data
     */
    getData() {
      return [...this.data];
    }

    /**
     * Safe parseFloat that never returns negative zero
     * @param {any} value - The value to parse
     * @returns {number} The parsed number, with negative zero converted to positive zero
     */
    safeParseFloat(value) {
      const result = parseFloat(value) || 0;
      return Object.is(result, -0) ? 0 : result;
    }

    /**
     * Calculate orçamentário total for an empenho (same logic as encontro_contas.js)
     * @param {Object} empenho - Empenho object
     * @returns {number} Total orçamentário value
     */
    calculateOrcamentarioTotal(empenho) {
      // Handle the new data structure with nested Orçamentário.operacoes
      const orcamentario =
        empenho.Orçamentário?.operacoes ||
        empenho.Ne_item?.operacoes ||
        empenho.Orçamentário ||
        [];

      // Ensure it's an array before calling reduce
      if (!Array.isArray(orcamentario)) {
        console.warn("Orçamentário data is not an array:", orcamentario);
        return 0;
      }

      // Backend now provides pre-processed va_operacao values (0 for RP operations)
      // So we can simply sum the va_operacao values without additional RP filtering
      const result = orcamentario.reduce((total, op) => {
        if (!op || op.va_operacao === null || op.va_operacao === undefined) {
          return total;
        }

        let value = this.safeParseFloat(op.va_operacao);

        // Log RP operations for debugging (backend already set them to 0)
        if (op.is_rp_excluded) {
          console.log(
            `🔄 Frontend: RP operation excluded by backend: ${op.no_operacao} - Display: ${op.va_operacao_display}, Calculation: ${value}`
          );
        }

        return total + value;
      }, 0);

      // Handle negative zero
      return result === 0 ? 0 : result;
    }

    /**
     * Calculate finanças total for an empenho (same logic as encontro_contas.js)
     * @param {Object} empenho - Empenho object
     * @returns {number} Total finanças value
     */
    calculateFinancasTotal(empenho) {
      let total = 0;

      // Handle new nested structure under Finanças
      const financas = empenho.Finanças || {};

      // DARF documents
      (financas.documentos_darf || empenho.documentos_darf || []).forEach(
        (doc) => {
          let documentValue = 0;
          const juros = this.safeParseFloat(doc.va_juros);
          const receita = this.safeParseFloat(doc.va_receita);
          const multa = this.safeParseFloat(doc.va_multa);
          documentValue = juros + receita + multa;

          // Apply negative value if document is cancelled (DE CANCELAMENTO status)
          if (doc.is_negative_value === true) {
            documentValue = documentValue === 0 ? 0 : -Math.abs(documentValue);
          }

          total += documentValue;
        }
      );

      // DAR documents
      (financas.documentos_dar || empenho.documentos_dar || []).forEach((doc) => {
        let documentValue = 0;
        const multa = this.safeParseFloat(doc.va_multa);
        const juros = this.safeParseFloat(doc.va_juros);
        const principal = this.safeParseFloat(doc.va_principal);
        documentValue = multa + juros + principal;

        // Apply negative value if document is cancelled (DE CANCELAMENTO status)
        if (doc.is_negative_value === true) {
          documentValue = documentValue === 0 ? 0 : -Math.abs(documentValue);
        }

        total += documentValue;
      });

      // GPS documents
      (financas.documentos_gps || empenho.documentos_gps || []).forEach((doc) => {
        let documentValue = 0;
        documentValue = this.safeParseFloat(doc.va_inss);

        // Apply negative value if document is cancelled (DE CANCELAMENTO status)
        if (doc.is_negative_value === true) {
          documentValue = documentValue === 0 ? 0 : -Math.abs(documentValue);
        }

        total += documentValue;
      });

      // OB documents (OB doesn't have va_celula, so always use va_linha_evento)
      (financas.linha_evento_ob || empenho.linha_evento_ob || []).forEach(
        (doc) => {
          const documentValue = this.safeParseFloat(doc.va_linha_evento);
          total += documentValue;
        }
      );

      // Handle negative zero in total
      const finalTotal = total === 0 ? 0 : total;

      return finalTotal;
    }

    /**
     * Show loading state
     */
    showLoading() {
      if (this.cardElement) {
        const content = this.cardElement.querySelector(".card-content");
        if (content) {
          content.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 120px;">
              <div class="br-loading medium" role="progressbar" aria-label="Carregando empenhos"></div>
            </div>
          `;
        }
      }
    }

    /**
     * Show error state
     * @param {string} message - Error message to display
     */
    showError(message = "Erro ao carregar dados") {
      if (this.cardElement) {
        const content = this.cardElement.querySelector(".card-content");
        if (content) {
          content.innerHTML = `
            <div class="text-center text-muted" style="padding: 40px;">
              <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <br />
              ${message}
            </div>
          `;
        }
      }
    }
  }
};


