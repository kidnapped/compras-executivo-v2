import EncontroEvents from "./events/encontro-events.js";
import Card from "../kpi/card.js";

import DetalhesEmpenhos from "./components/detalhes-empenhos.js";
import FornecedorCard from "./components/fornecedor-card.js";

/**
 * Main controller for Encontro de Contas
 * Initializes all components and manages the overall functionality
 */

const EncontroContas = {
  /**
   * Initialize the Encontro de Contas module
   */
  initialize() {
    console.log("Initializing Encontro de Contas...");

    // Initialize events
    EncontroEvents.initialize();

    // Initialize KPI cards
    this.initializeKpiCards();

    // Check for URL parameters and auto-load data
    this.handleUrlParameters();

    // Update page title with contract ID if present
    this.updatePageTitle();

    console.log("Encontro de Contas initialized successfully");
  },

  /**
   * Initialize KPI cards with loading state
   */
  initializeKpiCards() {
    // Initialize Fornecedor card
    FornecedorCard.initialize();

    // Initialize Histórico Orçamentário card
    this.loadHistoricoOrcamentarioCard();

    // Initialize Últimos Lançamentos grid with default state
    this.initializeUltimosLancamentosGrid();

    // Initialize Empenhos Originais grid with default state
    this.initializeEmpenhosOriginaisGrid();

    // Initialize Grid Numerado Financeiro with hardcoded data
    this.initializeFinanceiroGrid();

    // Initialize Movimentações Financeiras with hardcoded data
    this.initializeMovimentacoesGrid();

    // Initialize Detalhes Empenhos component
    DetalhesEmpenhos.initialize();
  },

  /**
   * Initialize Últimos Lançamentos grid with empty state
   */
  initializeUltimosLancamentosGrid() {
    const tbody = document.getElementById("ultimos-lancamentos-tbody");
    if (tbody) {
      // Show sample data to demonstrate the layout
      const sampleTransactions = this.getMockTransactions().slice(0, 3); // Show only 3 sample rows

      if (sampleTransactions.length > 0) {
        // Show sample data with a note that it's example data
        const rows = sampleTransactions
          .map((transaction) => this.renderTransactionRow(transaction))
          .join("");
        tbody.innerHTML = `
          ${rows}
          <tr style="background-color: #fff3cd; border-top: 2px solid #ffc107;">
            <td colspan="4" class="text-center" style="padding: 15px; font-size: 12px; color: #856404;">
              <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
              <em>Dados de exemplo. Realize uma busca para visualizar os dados reais do contrato.</em>
            </td>
          </tr>
        `;

        // Initialize tooltips for the sample data
        this.initializeTooltips();
      } else {
        // Fallback to empty state
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center" style="padding: 40px;">
              <div class="text-muted">
                <i class="fas fa-search fa-2x mb-3"></i>
                <br />
                Realize uma busca para visualizar os últimos lançamentos
              </div>
            </td>
          </tr>
        `;
      }
    }
  },

  /**
   * Load Histórico Orçamentário KPI card
   */
  async loadHistoricoOrcamentarioCard() {
    const container = document.getElementById(
      "card-historico-orcamentario-container"
    );
    if (!container) return;

    try {
      // For now, we'll use mock data. In production, this should fetch from an API
      const data = await this.fetchHistoricoOrcamentarioData();
      container.outerHTML = this.renderHistoricoOrcamentarioCard(data);
    } catch (error) {
      console.error("Erro ao carregar histórico orçamentário:", error);
      container.innerHTML =
        '<div class="text-danger">Erro ao carregar dados</div>';
    }
  },

  /**
   * Fetch histórico orçamentário data (mock data for now)
   */
  async fetchHistoricoOrcamentarioData() {
    // TODO: Replace with actual API call
    // For now, return mock data matching the requirements
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          titulo: "Histórico Orçamentário",
          subtitulo: "Total de empenhos originais",
          quantidade_total: "11 Empenhos",
          em_execucao: 8,
          finalizados: 3,
          rap: 8,
          criticos: 0,
          icone: "/static/images/doc2.png",
        });
      }, 500);
    });
  },

  /**
   * Render Histórico Orçamentário card
   */
  renderHistoricoOrcamentarioCard({
    titulo = "Histórico Orçamentário",
    subtitulo = "Total de empenhos originais",
    quantidade_total = "11 Empenhos",
    em_execucao = 8,
    finalizados = 3,
    rap = 8,
    criticos = 0,
    icone = "/static/images/doc2.png",
  }) {
    return `
      <div class="col-md-6 col-sm-6">
        <div class="br-card h-100 card-contratos">
          ${Card.cardHeader({ titulo, subtitulo, icone })}
          <div class="card-content" style="padding-top: 8px;">
            <div class="valor-principal">${quantidade_total}</div>
            <div class="linha">
              <div><div>Em execução</div><div class="valor-azul">${em_execucao}</div></div>
              <div class="divider"></div>
              <div><div>Finalizados</div><div class="valor-azul">${finalizados}</div></div>
              <div class="divider"></div>
              <div><div>RAP</div><div class="valor-azul">${rap}</div></div>
              <div class="divider"></div>
              <div><div>Críticos</div><div class="valor-vermelho">${criticos}</div></div>
            </div>
          </div>
        </div>
      </div>`;
  },

  /**
   * Update Histórico Orçamentário card with search results
   * @param {Object} data - The empenhos data from search results
   */
  updateHistoricoOrcamentarioCard(data) {
    if (!data || !data.empenhos_originais) {
      console.log("No empenhos data available for KPI update");
      return;
    }

    const empenhos = data.empenhos_originais;
    const totalEmpenhos = empenhos.length;

    // Calculate statistics based on the actual data
    let emExecucao = 0;
    let finalizados = 0;
    let rap = 0;
    let criticos = 0;

    empenhos.forEach((empenho) => {
      // These calculations would depend on your actual data structure
      // Adjust according to the actual fields available in empenho object
      if (empenho.status === "EM_EXECUCAO") emExecucao++;
      if (empenho.status === "FINALIZADO") finalizados++;
      if (empenho.tipo === "RAP") rap++;
      if (empenho.critico) criticos++;
    });

    const cardData = {
      titulo: "Histórico Orçamentário",
      subtitulo: "Total de empenhos originais",
      quantidade_total: `${totalEmpenhos} Empenhos`,
      em_execucao: emExecucao,
      finalizados: finalizados,
      rap: rap,
      criticos: criticos,
      icone: "/static/images/doc2.png",
    };

    const container = document.getElementById(
      "card-historico-orcamentario-container"
    );
    if (container) {
      container.outerHTML = this.renderHistoricoOrcamentarioCard(cardData);
    }
  },

  /**
   * Update Últimos Lançamentos grid with search results
   * @param {Object} data - The data from search results
   */
  updateUltimosLancamentosGrid(data) {
    if (!data) {
      console.log("No data available for Últimos Lançamentos update");
      return;
    }

    // Extract transactions from different data sources
    const transactions = this.extractTransactionsFromData(data);

    // Sort by date (most recent first) and take only the first 5
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 5);

    this.renderUltimosLancamentosGrid(recentTransactions);
  },

  /**
   * Extract transaction data from search results
   * @param {Object} data - The search results data
   */
  extractTransactionsFromData(data) {
    const transactions = [];

    // Add empenhos originais as transactions
    if (data.empenhos_originais) {
      data.empenhos_originais.forEach((empenho) => {
        transactions.push({
          data: empenho.data || "2019-06-06",
          tipo: "EMPENHO",
          codigo: empenho.numero || "2019NE802656",
          valor: empenho.valor || 25000000.0,
          especie: "ORIGINAL",
          tooltip: `Empenho Original - ${
            empenho.numero || "2019NE802656"
          } - Processo: ${empenho.processo || "99000232013"}`,
          icone: "fas fa-money-bill-wave",
        });
      });
    }

    // Add financial transactions (OB, pagamentos, etc.)
    if (data.pagamentos) {
      data.pagamentos.forEach((pagamento) => {
        transactions.push({
          data: pagamento.data || "2019-02-22",
          tipo: "PAGAMENTO",
          codigo: pagamento.numero || "2019OB811353",
          valor: pagamento.valor || 8093.84,
          especie: "OB",
          tooltip: `Pagamento - ${
            pagamento.fornecedor || "CONSTRUTORA SANCHES TRIPOLONI LTDA"
          } - NF: ${pagamento.nota_fiscal || "0000003963"}`,
          icone: "fas fa-money-bill-wave",
        });
      });
    }

    // If no real data, use mock data
    if (transactions.length === 0) {
      return this.getMockTransactions();
    }

    return transactions;
  },

  /**
   * Get mock transaction data for demonstration
   */
  getMockTransactions() {
    return [
      {
        data: "2019-06-06",
        tipo: "EMPENHO",
        codigo: "2019NE802656",
        valor: 25000000.0,
        especie: "ORIGINAL",
        tooltip:
          "11.0.0.00.0723.2013 DIR.2275 QD.415/2019 RDC- 023/2013-00 ITEM 01 PROC ORIGEM: 99000232013",
        icone: "fas fa-money-bill-wave",
      },
      {
        data: "2019-02-22",
        tipo: "PAGAMENTO",
        codigo: "2019OB811353",
        valor: 8093.84,
        especie: "OB",
        tooltip:
          "CONSTRUTORA SANCHES TRIPOLONI LTDA - ADEQUACAO DE TRECHO RODOV. - CT: 723/13 - MD: 58 - NF: 0000003963, 0000003964, 0000003965 - AP: 2019/001510-001 A 003 - OF: 263187",
        icone: "fas fa-money-bill-wave",
      },
      {
        data: "2019-02-22",
        tipo: "PAGAMENTO",
        codigo: "2019OB811352",
        valor: 16734.37,
        especie: "OB",
        tooltip:
          "CONSTRUTORA SANCHES TRIPOLONI LTDA - ADEQUACAO DE TRECHO RODOV. - CT: 723/13 - MD: 58 - NF: 0000003963, 0000003964, 0000003965 - AP: 2019/001510-001 A 003 - OF: 263187",
        icone: "fas fa-money-bill-wave",
      },
      {
        data: "2019-02-22",
        tipo: "PAGAMENTO",
        codigo: "2019OB811351",
        valor: 37940.34,
        especie: "OB",
        tooltip:
          "CONSTRUTORA SANCHES TRIPOLONI LTDA - ADEQUACAO DE TRECHO RODOV. - CT: 723/13 - MD: 58 - NF: 0000003963, 0000003964, 0000003965 - AP: 2019/001510-001 A 003 - OF: 263187",
        icone: "fas fa-money-bill-wave",
      },
      {
        data: "2019-02-22",
        tipo: "PAGAMENTO",
        codigo: "2019OB811347",
        valor: 2504305.18,
        especie: "OB",
        tooltip:
          "CONSTRUTORA SANCHES TRIPOLONI LTDA - ADEQUACAO DE TRECHO RODOV. - CT: 723/13 - MD: 58 - NF: 0000003963, 0000003964, 0000003965 - AP: 2019/001510-001 A 003 - OF: 263187",
        icone: "fas fa-money-bill-wave",
      },
    ];
  },

  /**
   * Render Últimos Lançamentos grid
   * @param {Array} transactions - Array of transaction objects
   */
  renderUltimosLancamentosGrid(transactions) {
    const tbody = document.getElementById("ultimos-lancamentos-tbody");
    if (!tbody) return;

    if (transactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center" style="padding: 40px;">
            <div class="text-muted">
              <i class="fas fa-inbox fa-2x mb-3"></i>
              <br />
              Nenhum lançamento encontrado
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = transactions
      .map((transaction) => this.renderTransactionRow(transaction))
      .join("");
    tbody.innerHTML = rows;

    // Initialize tooltips for info icons
    this.initializeTooltips();
  },

  /**
   * Initialize Bootstrap tooltips
   */
  initializeTooltips() {
    // Initialize tooltips using native title attribute (no Bootstrap dependency)
    const tooltipElements = document.querySelectorAll(
      '[data-toggle="tooltip"]'
    );
    tooltipElements.forEach((element) => {
      // Use the native browser tooltip by ensuring title attribute is set
      if (
        !element.getAttribute("title") &&
        element.getAttribute("data-original-title")
      ) {
        element.setAttribute(
          "title",
          element.getAttribute("data-original-title")
        );
      }
    });
  },

  /**
   * Render individual transaction row
   * @param {Object} transaction - Transaction object
   */
  renderTransactionRow(transaction) {
    const formattedDate = this.formatDate(transaction.data);
    const formattedValue = this.formatCurrency(transaction.valor);

    return `
      <tr>
        <td style="text-align: center; width: 60px;">
          <i class="${transaction.icone} text-success" style="font-size: 16px;"></i>
        </td>
        <td style="font-size: 14px; color: #666;">
          ${formattedDate}
        </td>
        <td style="text-align: center; width: 60px;">
          <i class="fas fa-info-circle text-info" 
             style="cursor: pointer; font-size: 16px;" 
             title="${transaction.tooltip}"
             data-toggle="tooltip"
             data-placement="top">
          </i>
        </td>
        <td style="font-size: 14px;">
          <strong>${transaction.codigo}</strong> (${formattedValue}) - Espécie ${transaction.especie}
        </td>
      </tr>
    `;
  },

  /**
   * Format date to Brazilian format
   * @param {string} dateString - Date string
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  },

  /**
   * Format currency to Brazilian format
   * @param {number} value - Numeric value
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },

  // ========== EMPENHOS ORIGINAIS GRID METHODS ==========

  /**
   * Initialize Empenhos Originais grid with empty state
   */
  initializeEmpenhosOriginaisGrid() {
    const tbody = document.getElementById("empenhos-originais-tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="13" class="text-center" style="padding: 40px;">
            <div class="text-muted">
              <i class="fas fa-search fa-2x mb-3"></i>
              <br />
              Realize uma busca para visualizar os empenhos originais
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Update Empenhos Originais grid with search results
   * @param {Object} data - The data from search results
   */
  updateEmpenhosOriginaisGrid(data) {
    if (!data || !data.empenhos) {
      console.log("No empenhos data available for Empenhos Originais update");
      this.initializeEmpenhosOriginaisGrid();
      return;
    }

    const empenhos = data.empenhos;

    // Populate year filter options
    this.populateExercicioFilter(empenhos);

    // Render the grid with all empenhos initially
    this.renderEmpenhosOriginaisGrid(empenhos);
  },

  /**
   * Populate year filter options based on available empenhos
   * @param {Array} empenhos - Array of empenho objects
   */
  populateExercicioFilter(empenhos) {
    const exerciciosContainer = document.getElementById(
      "exercicios-disponiveis"
    );
    if (!exerciciosContainer) return;

    // Extract unique years from empenhos
    const years = [
      ...new Set(
        empenhos
          .map((empenho) => {
            if (empenho.data_empenho) {
              return new Date(empenho.data_empenho).getFullYear();
            }
            return null;
          })
          .filter((year) => year !== null)
      ),
    ].sort((a, b) => b - a);

    // Generate radio buttons for each year
    const yearOptions = years
      .map(
        (year) => `
      <div class="br-radio" style="margin-bottom: 4px">
        <input id="radio-exercicio-${year}" type="radio" name="exercicio" 
               onchange="EncontroContas.filterByExercicio(${year})" />
        <label for="radio-exercicio-${year}">${year}</label>
      </div>
    `
      )
      .join("");

    exerciciosContainer.innerHTML = yearOptions;
  },

  /**
   * Filter empenhos by year (exercício)
   * @param {number} year - Year to filter by, null for all
   */
  filterByExercicio(year) {
    const tbody = document.getElementById("empenhos-originais-tbody");
    if (!tbody) return;

    // Get current empenhos data from the last search
    if (!this.currentEmpenhosData) {
      console.warn("No empenhos data available for filtering");
      return;
    }

    let filteredEmpenhos = this.currentEmpenhosData;

    if (year) {
      filteredEmpenhos = this.currentEmpenhosData.filter((empenho) => {
        if (empenho.data_empenho) {
          return new Date(empenho.data_empenho).getFullYear() === year;
        }
        return false;
      });
    }

    this.renderEmpenhosOriginaisGrid(filteredEmpenhos);

    // Close the filter dropdown
    const filterMenu = document.getElementById("filtro-exercicio-menu");
    if (filterMenu) {
      filterMenu.style.display = "none";
    }
  },

  /**
   * Toggle year filter dropdown
   */
  toggleExercicioFilter() {
    const menu = document.getElementById("filtro-exercicio-menu");
    if (menu) {
      if (menu.style.display === "none" || menu.style.display === "") {
        menu.style.display = "block";
        // Add click outside listener to close menu
        document.addEventListener(
          "click",
          this.handleExercicioFilterClickOutside
        );
      } else {
        menu.style.display = "none";
        // Remove click outside listener
        document.removeEventListener(
          "click",
          this.handleExercicioFilterClickOutside
        );
      }
    }
  },

  /**
   * Handle click outside filter menu
   */
  handleExercicioFilterClickOutside(event) {
    const menu = document.getElementById("filtro-exercicio-menu");
    const button = document.getElementById("btn-filtro-exercicio");
    const container = button?.closest(".filter-menu-container");

    if (menu && !container?.contains(event.target)) {
      menu.style.display = "none";
      document.removeEventListener(
        "click",
        EncontroContas.handleExercicioFilterClickOutside
      );
    }
  },

  /**
   * Render Empenhos Originais grid
   * @param {Array} empenhos - Array of empenho objects
   */
  renderEmpenhosOriginaisGrid(empenhos) {
    const tbody = document.getElementById("empenhos-originais-tbody");
    if (!tbody) return;

    // Store current data for filtering
    this.currentEmpenhosData = empenhos;

    if (empenhos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="13" class="text-center" style="padding: 40px;">
            <div class="text-muted">
              <i class="fas fa-inbox fa-2x mb-3"></i>
              <br />
              Nenhum empenho encontrado para o filtro selecionado
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = empenhos
      .map((empenho, index) => this.renderEmpenhoRow(empenho, index + 1))
      .join("");
    tbody.innerHTML = rows;

    // Initialize tooltips for empenho rows
    this.initializeTooltips();
  },

  /**
   * Render individual empenho row
   * @param {Object} empenho - Empenho object from API
   * @param {number} index - Row number
   */
  renderEmpenhoRow(empenho, index) {
    const formattedDate = empenho.data_empenho
      ? this.formatDate(empenho.data_empenho)
      : "N/A";
    const formattedValue = this.formatCurrency(empenho.empenhado || 0);
    const formattedLiquidado = this.formatCurrency(empenho.liquidado || 0);
    const formattedPago = this.formatCurrency(empenho.pago || 0);
    const saldoEmpenho = (empenho.empenhado || 0) - (empenho.pago || 0);
    const formattedSaldo = this.formatCurrency(saldoEmpenho);

    // Calculate status percentage (liquidado vs empenhado)
    const statusPercentage =
      empenho.empenhado > 0
        ? Math.round(((empenho.liquidado || 0) / empenho.empenhado) * 100)
        : 0;

    // Determine icon color based on status
    let iconColor = "#6c757d"; // Gray by default
    if (statusPercentage === 0) iconColor = "#6c757d"; // Gray
    else if (statusPercentage < 100) iconColor = "#fd7e14"; // Orange
    else iconColor = "#28a745"; // Green

    // Create tooltip with empenho details
    const tooltip = `Empenho ${empenho.numero || "N/A"} - Credor ID: ${
      empenho.credor_id || "N/A"
    } - Unidade: ${empenho.unidade_id || "N/A"}`;

    return `
      <tr class="empenho-row">
        <td style="text-align: center; font-weight: bold; color: #666;">${index}</td>
        <td style="text-align: center;">
          <i class="fas fa-circle" style="color: ${iconColor}; font-size: 12px;"></i>
        </td>
        <td style="font-weight: 600; color: #00366f;">${
          empenho.numero || "N/A"
        }</td>
        <td style="font-size: 13px; color: #666;">${formattedDate}</td>
        <td style="text-align: center;">
          <i class="fas fa-info-circle text-info" 
             style="cursor: pointer; font-size: 14px;" 
             title="${tooltip}"
             data-toggle="tooltip"
             data-placement="top">
          </i>
        </td>
        <td style="font-weight: 600; color: #28a745;">${formattedValue}</td>
        <td style="font-size: 12px; color: #666;">ORIGINAL</td>
        <td style="font-weight: 600; color: #17a2b8;">${formattedLiquidado}</td>
        <td style="font-weight: 600; color: #6f42c1;">${formattedPago}</td>
        <td style="font-weight: 600; color: ${
          saldoEmpenho >= 0 ? "#28a745" : "#dc3545"
        };">${formattedSaldo}</td>
        <td style="font-weight: 600; color: #fd7e14;">${statusPercentage}%</td>
        <td style="text-align: center;">
          <i class="fas fa-chart-bar text-primary" 
             style="cursor: pointer; font-size: 14px;" 
             title="Ver gráfico de execução"
             onclick="EncontroContas.showEmpenhoChart(${empenho.id})">
          </i>
        </td>
        <td style="text-align: center;">
          <i class="fas fa-map-marked-alt text-success" 
             style="cursor: pointer; font-size: 14px;" 
             title="Ver localização"
             onclick="EncontroContas.showEmpenhoLocation(${empenho.id})">
          </i>
        </td>
      </tr>
    `;
  },

  /**
   * Show empenho chart (placeholder)
   * @param {number} empenhoId - Empenho ID
   */
  showEmpenhoChart(empenhoId) {
    // TODO: Implement chart visualization
    console.log(`Show chart for empenho ${empenhoId}`);
    alert(
      `Gráfico para empenho ${empenhoId} - Funcionalidade em desenvolvimento`
    );
  },

  /**
   * Show empenho location (placeholder)
   * @param {number} empenhoId - Empenho ID
   */
  showEmpenhoLocation(empenhoId) {
    // TODO: Implement location visualization
    console.log(`Show location for empenho ${empenhoId}`);
    alert(
      `Localização para empenho ${empenhoId} - Funcionalidade em desenvolvimento`
    );
  },

  /**
   * Handle URL parameters and auto-load data if contract ID is present
   */
  handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get("contrato");
    const unidadeId = urlParams.get("unidade");

    if (contratoId) {
      console.log(`Auto-loading data for contract ${contratoId}`);

      // Fill the input fields with the URL parameters
      const contratoInput = document.getElementById("contrato-id-input");
      const unidadeInput = document.getElementById("unidade-empenho-input");

      if (contratoInput) {
        contratoInput.value = contratoId;
      }

      if (unidadeInput && unidadeId) {
        unidadeInput.value = unidadeId;
      }

      // Show loading state immediately
      const resultsContainer = document.getElementById("empenhos-results");
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div class="text-center" style="padding: 40px;">
            <div class="br-loading medium" role="progressbar" aria-label="carregando empenhos"></div>
            <div style="margin-top: 10px;">Carregando dados do contrato ${contratoId}...</div>
          </div>
        `;
      }

      // Trigger the search automatically after a brief delay
      setTimeout(() => {
        EncontroEvents.handleSearch();
      }, 300);
    }
  },

  /**
   * Update page title with contract information
   */
  updatePageTitle() {
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get("contrato");

    if (contratoId) {
      // Update browser tab title
      document.title = `Encontro de Contas - Contrato ${contratoId} - Compras Executivo`;

      // Update page header
      const pageHeader = document.querySelector("h1");
      if (pageHeader) {
        pageHeader.innerHTML = `
          <i class="fas fa-balance-scale text-primary"></i> Encontro de Contas
          <small class="text-muted">- Contrato ${contratoId}</small>
        `;
      }

      // Add breadcrumb navigation
      this.addBreadcrumb(contratoId);
    }
  },

  /**
   * Add breadcrumb navigation
   */
  addBreadcrumb(contratoId) {
    const headerSection = document.querySelector(".row.mb-4 .col-12");
    if (headerSection) {
      const existingBreadcrumb = headerSection.querySelector(".breadcrumb-nav");
      if (!existingBreadcrumb) {
        const breadcrumb = document.createElement("nav");
        breadcrumb.className = "breadcrumb-nav mt-2";
        breadcrumb.innerHTML = `
        
<nav class="br-breadcrumb" aria-label="Breadcrumbs">
  <ol class="crumb-list" role="list">
    <li class="crumb home"><a class="br-button circle" href="javascript:void(0)"><span class="sr-only">Página inicial</span><i class="fas fa-home"></i></a></li>
    <li class="crumb" data-active="active"><i class="icon fas fa-chevron-right"></i><span tabindex="0" aria-current="page">Encontro de Contas - Contrato ${contratoId}</span>
    </li>
  </ol>
</nav>
        `;
        headerSection.appendChild(breadcrumb);
      }
    }
  },

  /**
   * Initialize Financial grid with hardcoded data
   */
  initializeFinanceiroGrid() {
    const tbody = document.getElementById("financeiro-grid-tbody");
    if (tbody) {
      // Use hardcoded data as requested
      const financeiroData = this.getHardcodedFinanceiroData();

      if (financeiroData.length > 0) {
        const rows = financeiroData
          .map((pagamento, index) =>
            this.renderFinanceiroRow(pagamento, index + 1)
          )
          .join("");
        tbody.innerHTML = rows;

        // Initialize tooltips
        this.initializeTooltips();
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center" style="padding: 40px;">
              <div class="text-muted">
                <i class="fas fa-coins fa-2x mb-3"></i>
                <br />
                Nenhum dado financeiro disponível
              </div>
            </td>
          </tr>
        `;
      }
    }
  },

  /**
   * Get hardcoded financial data
   */
  getHardcodedFinanceiroData() {
    return [
      {
        data: "06/07/2017",
        pagamento: "2017OB836057",
        tipo: "OB",
        parcial: 8500322.84,
        nominal: 16995525.89,
        tooltip:
          "Pagamento de ordem bancária OB - Primeira parcela do contrato executado conforme cronograma",
      },
      {
        data: "06/07/2017",
        pagamento: "2017OB836059",
        tipo: "OB",
        parcial: 54929.09,
        nominal: 54929.09,
        tooltip:
          "Pagamento de ordem bancária OB - Despesas complementares do contrato",
      },
      {
        data: "06/07/2017",
        pagamento: "2017OB836060",
        tipo: "OB",
        parcial: 113568.23,
        nominal: 113568.23,
        tooltip:
          "Pagamento de ordem bancária OB - Custos adicionais e taxas administrativas",
      },
    ];
  },

  /**
   * Render a single financial row
   */
  renderFinanceiroRow(pagamento, rowNumber) {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const tooltipId = `tooltip-financeiro-${rowNumber}`;

    return `
      <tr class="financeiro-row">
        <td style="border: none; font-weight: bold; color: #666; text-align: center;">${rowNumber}</td>
        <td style="border: none; color: #666;">
          ${pagamento.data}
        </td>
        <td style="border: none; font-weight: 500; color: #2c5aa0;">
          ${pagamento.pagamento}
        </td>
        <td style="border: none; text-align: center;">
          <i 
            class="fas fa-info-circle text-info" 
            style="cursor: pointer; font-size: 14px;"
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            data-bs-custom-class="custom-tooltip"
            title="${pagamento.tooltip}"
            id="${tooltipId}"
          ></i>
        </td>
        <td style="border: none;">
          <span class="badge badge-secondary" style="background-color: #6c757d; font-size: 11px;">
            ${pagamento.tipo}
          </span>
        </td>
        <td style="border: none; font-weight: 500; color: #28a745;">
          ${formatCurrency(pagamento.parcial)}
        </td>
        <td style="border: none; font-weight: 500; color: #007bff;">
          ${formatCurrency(pagamento.nominal)}
        </td>
        <td style="border: none; text-align: center;">
          <i 
            class="fas fa-map-marked-alt text-success" 
            style="cursor: pointer; font-size: 16px;"
            onclick="alert('Funcionalidade de mapa será implementada')"
            title="Visualizar no mapa"
          ></i>
        </td>
      </tr>
    `;
  },

  /**
   * Initialize Movimentações grid with hardcoded data
   */
  initializeMovimentacoesGrid() {
    const tbody = document.getElementById("movimentacoes-tbody");
    if (tbody) {
      // Use hardcoded data as requested
      const movimentacoesData = this.getHardcodedMovimentacoesData();

      if (movimentacoesData.length > 0) {
        const rows = movimentacoesData
          .map((movimentacao, index) =>
            this.renderMovimentacaoRow(movimentacao, index + 1)
          )
          .join("");
        tbody.innerHTML = rows;

        // Initialize tooltips
        this.initializeTooltips();
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center" style="padding: 40px;">
              <div class="text-muted">
                <i class="fas fa-exchange-alt fa-2x mb-3"></i>
                <br />
                Nenhuma movimentação financeira disponível
              </div>
            </td>
          </tr>
        `;
      }
    }
  },

  /**
   * Get hardcoded movimentações data
   */
  getHardcodedMovimentacoesData() {
    return [
      {
        data: "06/06/2017",
        empenho: "2017NE802657",
        especie: "Reforço",
        valor: 33402000.0,
        tooltip:
          "Movimentação de reforço orçamentário para ampliação do escopo do contrato",
      },
      {
        data: "13/06/2017",
        empenho: "2017NE802777",
        especie: "Reforço",
        valor: 39000000.0,
        tooltip:
          "Reforço adicional para cobertura de custos de materiais e mão de obra",
      },
      {
        data: "29/06/2017",
        empenho: "2017NE802946",
        especie: "Anulação",
        valor: -1000000.0,
        tooltip:
          "Anulação parcial de empenho devido a redução de escopo do projeto",
      },
    ];
  },

  /**
   * Render a single movimentação row
   */
  renderMovimentacaoRow(movimentacao, rowNumber) {
    const formatCurrency = (value) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const tooltipId = `tooltip-movimentacao-${rowNumber}`;
    const isNegative = movimentacao.valor < 0;
    const valueColor = isNegative ? "#dc3545" : "#28a745"; // Red for negative, green for positive
    const especieBadgeColor =
      movimentacao.especie === "Anulação" ? "#dc3545" : "#17a2b8"; // Red for Anulação, blue for others

    return `
      <tr class="movimentacao-row">
        <td style="border: none; font-weight: bold; color: #666; text-align: center;">${rowNumber}</td>
        <td style="border: none; color: #666;">
          ${movimentacao.data}
        </td>
        <td style="border: none; font-weight: 500; color: #2c5aa0;">
          ${movimentacao.empenho}
        </td>
        <td style="border: none; text-align: center;">
          <i 
            class="fas fa-info-circle text-info" 
            style="cursor: pointer; font-size: 14px;"
            data-bs-toggle="tooltip" 
            data-bs-placement="top" 
            data-bs-custom-class="custom-tooltip"
            title="${movimentacao.tooltip}"
            id="${tooltipId}"
          ></i>
        </td>
        <td style="border: none;">
          <span class="badge" style="background-color: ${especieBadgeColor}; color: white; font-size: 11px; padding: 0.3em 0.5em;">
            ${movimentacao.especie}
          </span>
        </td>
        <td style="border: none; font-weight: 500; color: ${valueColor};">
          ${formatCurrency(movimentacao.valor)}
        </td>
        <td style="border: none; text-align: center;">
          <i 
            class="fas fa-chart-bar text-primary" 
            style="cursor: pointer; font-size: 16px;"
            onclick="alert('Funcionalidade de gráfico será implementada')"
            title="Visualizar gráfico"
          ></i>
        </td>
      </tr>
    `;
  },

  // ========== COMPONENT REFERENCES ==========

  /**
   * Get DetalhesEmpenhos component reference
   * @returns {Object} DetalhesEmpenhos component
   */
  getDetalhesEmpenhos() {
    return DetalhesEmpenhos;
  },

  /**
   * Show chart for specific empenho in detalhes (proxy method for global access)
   * @param {string} empenhoId - Empenho ID
   */
  showDetalhesChart(empenhoId) {
    return DetalhesEmpenhos.showChart(empenhoId);
  },

  /**
   * Method to be called when the page loads
   */
  init() {
    try {
      // Check if we're on the encontro de contas page
      if (window.location.pathname.includes("/encontro-de-contas")) {
        this.initialize();
      }
    } catch (error) {
      console.error("Error initializing Encontro de Contas:", error);
      // Don't let this error break other modules
    }
  },
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  EncontroContas.init();
});

// Expose EncontroContas to global scope with component access
window.EncontroContas = {
  ...EncontroContas,
  // Expose DetalhesEmpenhos for onclick handlers
  showDetalhesChart: EncontroContas.showDetalhesChart.bind(EncontroContas),
};

// Export for use in other modules
export default EncontroContas;
