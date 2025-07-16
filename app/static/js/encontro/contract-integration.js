/**
 * ContractIntegration - Integrates contract search with tudo data loading
 * Handles the flow from contract selection to data display
 */
const ContractIntegration = {
  currentContractId: null,

  /**
   * Initialize the contract integration
   */
  initialize() {
    console.log("Initializing Contract Integration...");

    // Listen for contract selection events
    this.setupEventListeners();

    // Note: URL parameter handling is done by the main EncontroContas.handleUrlParameters()
    // This avoids duplication and ensures consistency
  },

  /**
   * Setup event listeners for contract selection
   */
  setupEventListeners() {
    // Listen for custom events from other components
    document.addEventListener("contractSelected", (event) => {
      this.handleContractSelection(event.detail);
    });

    // Listen for the search button if it exists
    const searchButton = document.getElementById("search-empenhos-btn");
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        this.handleSearchButtonClick();
      });
    }
  },

  /**
   * Check URL parameters for contract ID
   */
  checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get("contrato"); // Use 'contrato' parameter to match existing system

    if (contratoId) {
      console.log(`Found contract ID in URL: ${contratoId}`);
      this.loadContractData(parseInt(contratoId));
    }
  },

  /**
   * Handle contract selection from other components
   * @param {Object} contractData - Contract data object
   */
  handleContractSelection(contractData) {
    if (contractData && contractData.contrato_id) {
      console.log("Contract selected:", contractData.contrato_id);
      this.loadContractData(contractData.contrato_id);
    }
  },

  /**
   * Handle search button click
   */
  handleSearchButtonClick() {
    const contratoIdInput = document.getElementById("contrato-id-input");
    if (contratoIdInput && contratoIdInput.value) {
      const contratoId = parseInt(contratoIdInput.value);
      if (!isNaN(contratoId)) {
        this.loadContractData(contratoId);
      }
    }
  },

  /**
   * Load all contract data using the tudo endpoint
   * @param {number} contratoId - Contract ID to load
   */
  async loadContractData(contratoId) {
    if (this.currentContractId === contratoId) {
      console.log(`Contract ${contratoId} data already loaded`);
      return;
    }

    this.currentContractId = contratoId;

    try {
      // Show loading states
      this.showLoadingStates();

      // Load data from the tudo endpoint
      const tudoData = await TudoDataHandler.loadTudoData(contratoId);

      // Update existing components with the contract data
      await this.updateExistingComponents(contratoId, tudoData);

      // Update URL without page reload
      this.updateUrl(contratoId);

      // Update page title
      this.updatePageTitle(contratoId);

      console.log(`Successfully loaded all data for contract ${contratoId}`);
    } catch (error) {
      console.error(`Error loading contract ${contratoId} data:`, error);
      this.showErrorStates(error);
    }
  },

  /**
   * Show loading states in all relevant components
   */
  showLoadingStates() {
    const loadingHTML = `
      <tr>
        <td colspan="4" class="text-center" style="padding: 40px;">
          <div class="text-muted">
            <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
            <br />
            Carregando dados...
          </div>
        </td>
      </tr>
    `;

    const loadingHTMLFinanceiro = `
      <tr>
        <td colspan="8" class="text-center" style="padding: 40px;">
          <div class="text-muted">
            <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
            <br />
            Carregando dados financeiros...
          </div>
        </td>
      </tr>
    `;

    // Show loading in Últimos Lançamentos
    const ultimosLancamentosTable = document.getElementById(
      "ultimos-lancamentos-tbody"
    );
    if (ultimosLancamentosTable) {
      ultimosLancamentosTable.innerHTML = loadingHTML;
    }

    // Show loading in Grid Financeiro
    const financeiroGrid = document.getElementById("financeiro-grid-tbody");
    if (financeiroGrid) {
      financeiroGrid.innerHTML = loadingHTMLFinanceiro;
    }

    // Show loading in other components if they have loading methods
    if (
      typeof FornecedorCard !== "undefined" &&
      FornecedorCard.showLoadingState
    ) {
      FornecedorCard.showLoadingState();
    }

    if (
      typeof HistoricoOrcamentarioCard !== "undefined" &&
      HistoricoOrcamentarioCard.showLoadingState
    ) {
      HistoricoOrcamentarioCard.showLoadingState();
    }
  },

  /**
   * Show error states in components
   * @param {Error} error - The error object
   */
  showErrorStates(error) {
    const errorMessage = error.message || "Erro desconhecido";

    // The TudoDataHandler already handles error states for its components
    // Here we can handle additional error states for other components

    if (
      typeof FornecedorCard !== "undefined" &&
      FornecedorCard.showErrorState
    ) {
      FornecedorCard.showErrorState(errorMessage);
    }

    if (
      typeof HistoricoOrcamentarioCard !== "undefined" &&
      HistoricoOrcamentarioCard.showErrorState
    ) {
      HistoricoOrcamentarioCard.showErrorState(errorMessage);
    }
  },

  /**
   * Update existing components with contract data
   * @param {number} contratoId - Contract ID
   * @param {Object} tudoData - Data from tudo endpoint
   */
  async updateExistingComponents(contratoId, tudoData) {
    // Update FornecedorCard if it exists and has data
    if (
      typeof FornecedorCard !== "undefined" &&
      FornecedorCard.updateWithContractData
    ) {
      // We need to get contract details for the fornecedor card
      // This might require a separate API call or extracting from empenhos data
      await this.updateFornecedorCard(contratoId, tudoData);
    }

    // Update HistoricoOrcamentarioCard
    if (
      typeof HistoricoOrcamentarioCard !== "undefined" &&
      HistoricoOrcamentarioCard.loadDataFromAPI
    ) {
      await HistoricoOrcamentarioCard.loadDataFromAPI(contratoId);
    }

    // The TudoDataHandler already updates:
    // - Últimos Lançamentos
    // - Grid Financeiro
    // - Empenhos Originais
  },

  /**
   * Update FornecedorCard with contract data
   * @param {number} contratoId - Contract ID
   * @param {Object} tudoData - Data from tudo endpoint
   */
  async updateFornecedorCard(contratoId, tudoData) {
    try {
      // Try to use existing endpoint to get contract details
      const response = await fetch(
        `/encontro-de-contas/empenhos-contrato/${contratoId}`
      );
      if (response.ok) {
        const contractData = await response.json();
        if (
          typeof FornecedorCard !== "undefined" &&
          FornecedorCard.updateWithData
        ) {
          FornecedorCard.updateWithData(contractData);
        }
      } else {
        // If that fails, try to extract basic info from tudo data
        this.updateFornecedorCardFromTudoData(tudoData);
      }
    } catch (error) {
      console.warn("Could not update fornecedor card:", error);
      this.updateFornecedorCardFromTudoData(tudoData);
    }
  },

  /**
   * Update fornecedor card with basic info from tudo data
   * @param {Object} tudoData - Data from tudo endpoint
   */
  updateFornecedorCardFromTudoData(tudoData) {
    if (
      !tudoData ||
      !tudoData.empenhos_data ||
      tudoData.empenhos_data.length === 0
    ) {
      return;
    }

    // Calculate totals from empenhos data
    let totalEmpenhado = 0;
    let totalPago = 0;

    tudoData.empenhos_data.forEach((item) => {
      const empenho = item.empenho;
      totalEmpenhado += parseFloat(empenho.empenhado || 0);
      totalPago += parseFloat(empenho.pago || 0);
    });

    // Update basic statistics in fornecedor card
    const empenhosTotal = document.getElementById("empenhos-total-empenhado");
    const empenhosFinancas = document.getElementById("empenhos-total-pago");

    if (empenhosTotal) {
      empenhosTotal.textContent = this.formatCurrency(totalEmpenhado);
    }

    if (empenhosFinancas) {
      empenhosFinancas.textContent = this.formatCurrency(totalPago);
    }
  },

  /**
   * Update URL with contract ID
   * @param {number} contratoId - Contract ID
   */
  updateUrl(contratoId) {
    const url = new URL(window.location);
    url.searchParams.set("contrato", contratoId); // Use 'contrato' parameter to match existing system
    window.history.replaceState(null, "", url);
  },

  /**
   * Update page title with contract ID
   * @param {number} contratoId - Contract ID
   */
  updatePageTitle(contratoId) {
    document.title = `Encontro de Contas - Contrato ${contratoId} - Compras Executivo`;
  },

  /**
   * Format currency value
   * @param {number} value - Numeric value
   * @returns {string} Formatted currency
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },

  /**
   * Trigger a contract search programmatically
   * @param {number} contratoId - Contract ID to search for
   */
  searchContract(contratoId) {
    this.loadContractData(contratoId);
  },

  /**
   * Get current contract ID
   * @returns {number|null} Current contract ID
   */
  getCurrentContractId() {
    return this.currentContractId;
  },
};

// Make it available globally for cross-module access
if (typeof window !== "undefined") {
  window.ContractIntegration = ContractIntegration;
  console.log("ContractIntegration registered globally");
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ContractIntegration;
}
