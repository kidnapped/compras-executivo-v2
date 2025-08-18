/**
 * Encontro de Contas - Complete Frontend Logic
 * Handles data loading, table rendering, row interactions, and ECharts integration
 */

import getEcharts from "../util/echarts.js";

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
        const statusBadge = this.encontroDeContas_getPercentageStatusBadge(percentage);

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
            <td>${statusBadge}</td>
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
    if (
      window.location.pathname.includes("encontro-de-contas") ||
      document.querySelector("#empenhos-originais-tbody") ||
      document.querySelector("#ultimos-lancamentos-container")
    ) {
      console.log("🎯 Auto-initializing Encontro de Contas...");
      
      // Try immediate initialization first
      if (document.readyState === 'complete') {
        console.log("📄 DOM is complete, initializing immediately");
        this.encontroDeContas_init();
      } else {
        console.log("⏳ DOM not ready, using timeout");
        setTimeout(() => {
          console.log("🚀 Timeout reached, initializing now");
          this.encontroDeContas_init();
        }, 1000); // Increased timeout to ensure DOM is ready
      }
    } else {
      console.log("❌ Not on encontro-de-contas page, skipping initialization");
    }
  },

  // Public method for manual initialization (useful for SPA routing)
  // Reset state for fresh initialization (SPA navigation compatible)
  encontroDeContas_resetState() {
    console.log("🔄 Resetting Encontro de Contas state...");
    this.state = {
      currentContractId: null,
      selectedEmpenhoNumero: null,
      rawData: null,
      filteredData: null,
      chart: null,
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
        const filename = `Encontro_de_Contas_Contrato_${contractId}_${dateStr}.xlsx`;

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
    if (!empenho?.Orçamentário) return 0;
    
    let total = 0;
    
    // Check if it has 'operacoes' array (based on the JSON structure)
    if (empenho.Orçamentário.operacoes && Array.isArray(empenho.Orçamentário.operacoes)) {
      empenho.Orçamentário.operacoes.forEach(op => {
        total += parseFloat(op.va_operacao || 0);
      });
    } else {
      // Fallback to old structure if needed
      Object.values(empenho.Orçamentário).forEach(operations => {
        if (Array.isArray(operations)) {
          operations.forEach(op => {
            total += parseFloat(op.va_operacao || 0);
          });
        }
      });
    }
    
    return total;
  },

  encontroDeContas_calculateFinancasTotal(empenho, usePartialValues = false) {
    if (!empenho?.Finanças) return 0;
    
    let total = 0;
    
    // Based on the JSON structure, sum up all financial operations
    const financas = empenho.Finanças;
    
    // Sum linha_evento_ob (OB operations)
    if (financas.linha_evento_ob && Array.isArray(financas.linha_evento_ob)) {
      financas.linha_evento_ob.forEach(op => {
        total += parseFloat(op.va_linha_evento || 0);
      });
    }
    
    // Sum ob_grouped if available
    if (financas.ob_grouped && Array.isArray(financas.ob_grouped)) {
      financas.ob_grouped.forEach(op => {
        total += parseFloat(op.va_linha_evento || 0);
      });
    }
    
    // Sum other document types (DAR, DARF, GPS) if they exist
    ['documentos_dar', 'documentos_darf', 'documentos_gps'].forEach(docType => {
      if (financas[docType] && Array.isArray(financas[docType])) {
        financas[docType].forEach(doc => {
          const value = usePartialValues ? 
            (parseFloat(doc.va_parcial || 0)) : 
            (parseFloat(doc.va_nominal || doc.va_linha_evento || 0));
          total += value;
        });
      }
    });
    
    // Fallback to old structure if needed
    if (total === 0) {
      Object.values(financas).forEach(operations => {
        if (Array.isArray(operations)) {
          operations.forEach(op => {
            const value = usePartialValues ? 
              (parseFloat(op.va_parcial || 0)) : 
              (parseFloat(op.va_nominal || op.va_linha_evento || 0));
            total += value;
          });
        }
      });
    }
    
    return total;
  },

  encontroDeContas_calculateStatusPercentage(financas, orcamentario) {
    if (orcamentario === 0) return 0;
    return (financas / orcamentario) * 100;
  },

  encontroDeContas_getPercentageStatusBadge(percentage) {
    if (percentage >= 100) {
      return '<span class="badge bg-success">✅ Completo</span>';
    } else if (percentage >= 80) {
      return '<span class="badge bg-info">🔄 Quase</span>';
    } else if (percentage >= 50) {
      return '<span class="badge bg-warning">⏳ Parcial</span>';
    } else if (percentage > 0) {
      return '<span class="badge bg-secondary">📝 Iniciado</span>';
    } else {
      return '<span class="badge bg-light text-dark">⭕ Pendente</span>';
    }
  },

  encontroDeContas_checkForRapOperations(empenho) {
    // Check in Orçamentário operations
    const orcamentario = empenho.Orçamentário || {};
    
    // Check operacoes array first (new structure)
    if (orcamentario.operacoes && Array.isArray(orcamentario.operacoes)) {
      for (const operation of orcamentario.operacoes) {
        if (operation.no_operacao && operation.no_operacao.includes("RAP")) {
          return true;
        }
      }
    }
    
    // Fallback to old structure
    for (const [key, operations] of Object.entries(orcamentario)) {
      if (Array.isArray(operations)) {
        for (const operation of operations) {
          if (operation.no_operacao && operation.no_operacao.includes("RAP")) {
            return true;
          }
        }
      }
    }

    // Check in Finanças operations
    const financas = empenho.Finanças || {};
    for (const [key, operations] of Object.entries(financas)) {
      if (Array.isArray(operations)) {
        for (const operation of operations) {
          if (operation.no_operacao && operation.no_operacao.includes("RAP")) {
            return true;
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
      const echarts = await getEcharts();

      // Destroy existing chart if it exists
      if (this.state.chart) {
        this.state.chart.dispose();
      }

      this.state.chart = echarts.init(containers.valoresTotaisChart);

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

      this.state.chart.setOption(option);

      // Handle window resize
      window.addEventListener("resize", () => {
        if (this.state.chart) {
          this.state.chart.resize();
        }
      });
      
      console.log("✅ Valores totais chart rendered successfully");
    } catch (error) {
      console.error("❌ Error rendering valores totais chart:", error);
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
    if (doc.ano_saque_bacen && doc.mes_saque_bacen && doc.dia_saque_bacen) {
      const day = String(doc.dia_saque_bacen).padStart(2, "0");
      const month = String(doc.mes_saque_bacen).padStart(2, "0");
      const year = String(doc.ano_saque_bacen);
      return `${day}/${month}/${year}`;
    }

    // For other documents - use date fields
    if (doc.dt_doc_dar) {
      return this.encontroDeContas_formatDate(doc.dt_doc_dar);
    }
    if (doc.dt_doc_darf) {
      return this.encontroDeContas_formatDate(doc.dt_doc_darf);
    }
    if (doc.dt_doc_gps) {
      return this.encontroDeContas_formatDate(doc.dt_doc_gps);
    }

    return "N/A";
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
    if (empenho && empenho.items) {
      const item = empenho.items.find(item => item.id === itemId);
      if (item && item.descricao) {
        return item.descricao;
      }
    }
    return "N/A";
  },

  encontroDeContas_parseDateForComparison(dateString) {
    if (!dateString || dateString === "N/A") return null;

    // Handle DD/MM/YYYY format
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmmyyyyMatch = dateString.match(ddmmyyyyRegex);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Handle other formats
    try {
      return new Date(dateString);
    } catch (error) {
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

      console.log("✅ Empenhos card updated:", {
        total: totalEmpenhos,
        emExecucao: emExecucao,
        finalizados: finalizados,
        rap: rapCount
      });
    } catch (error) {
      console.error("❌ Error updating empenhos card:", error);
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
      const echarts = await getEcharts();

      // Destroy existing chart
      if (this.state.chart) {
        this.state.chart.dispose();
      }

      // Initialize new chart
      this.state.chart = echarts.init(containers.chartContainer);

      const chartData = this.encontroDeContas_prepareChartData();

      const option = {
        title: {
          text: "Movimentações Financeiras Parciais e Orçamentárias",
          left: "center",
          textStyle: { color: "#333", fontSize: 16 },
        },
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

      // Handle window resize
      window.addEventListener("resize", () => {
        if (this.state.chart) {
          this.state.chart.resize();
        }
      });
      
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
};

// Static method for HTML button access
if (typeof window !== 'undefined') {
  window.exportToExcel = function () {
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
}
