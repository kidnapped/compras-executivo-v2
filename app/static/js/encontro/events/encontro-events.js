import EncontroAPI from "../api/encontro-api.js";
import EncontroUI from "../ui/encontro-ui.js";

/**
 * Event handlers for Encontro de Contas
 * Manages all user interactions and events
 */

const EncontroEvents = {
  /**
   * Initialize all event listeners
   */
  initialize() {
    try {
      // Only initialize if we're on the right page and elements exist
      if (!this.isOnEncontroPage()) {
        console.log("Not on Encontro de Contas page, skipping initialization");
        return;
      }

      this.setupSearchEvents();
      this.setupFormEvents();
      this.setupNavigationEvents();
      console.log("Encontro de Contas events initialized");
    } catch (error) {
      console.error("Error initializing Encontro events:", error);
    }
  },

  /**
   * Check if we're on the encontro de contas page
   */
  isOnEncontroPage() {
    return window.location.pathname.includes("/encontro-de-contas");
  },

  /**
   * Setup search-related events
   */
  setupSearchEvents() {
    const searchButton = document.getElementById("search-empenhos-btn");
    const contratoInput = document.getElementById("contrato-id-input");
    const unidadeInput = document.getElementById("unidade-empenho-input");

    if (searchButton) {
      searchButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleSearch();
      });
    }

    // Allow Enter key to trigger search
    if (contratoInput) {
      contratoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          this.handleSearch();
        }
      });
    }

    if (unidadeInput) {
      unidadeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          this.handleSearch();
        }
      });
    }
  },

  /**
   * Setup form-related events
   */
  setupFormEvents() {
    const clearButton = document.getElementById("clear-search-btn");

    if (clearButton) {
      clearButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleClear();
      });
    }
  },

  /**
   * Setup navigation events
   */
  setupNavigationEvents() {
    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
      // Reload the page with new URL parameters
      window.location.reload();
    });

    // Add right-click context menu for opening in new tab
    document.addEventListener("contextmenu", (e) => {
      const encontroAction = e.target.closest(".encontro-action");
      if (encontroAction) {
        // Browser's default context menu will handle "Open in new tab"
        console.log("Context menu for Encontro de Contas action");
      }
    });
  },

  /**
   * Handle search button click
   */
  async handleSearch() {
    const contratoInput = document.getElementById("contrato-id-input");
    const unidadeInput = document.getElementById("unidade-empenho-input");

    if (!contratoInput) {
      console.error("Contract ID input not found");
      return;
    }

    const contratoId = contratoInput.value.trim();

    if (!contratoId) {
      EncontroUI.showError("Por favor, insira um ID de contrato válido");
      return;
    }

    // Validate contract ID is numeric
    if (!/^\d+$/.test(contratoId)) {
      EncontroUI.showError("O ID do contrato deve conter apenas números");
      return;
    }

    const unidadeEmpenhoId = unidadeInput ? unidadeInput.value.trim() : null;

    // Update URL parameter
    this.updateUrlParameter(contratoId);

    // Show loading state
    EncontroUI.showLoading();

    try {
      // Fetch data from API
      const result = await EncontroAPI.fetchEmpenhosContrato(
        parseInt(contratoId),
        unidadeEmpenhoId ? parseInt(unidadeEmpenhoId) : null
      );

      if (result.success) {
        // Render the results
        EncontroUI.renderEmpenhos(result.data);
      } else {
        // Show error
        EncontroUI.showError(`Erro ao buscar empenhos: ${result.error}`);
      }
    } catch (error) {
      console.error("Unexpected error during search:", error);
      EncontroUI.showError(
        "Erro inesperado ao buscar empenhos. Tente novamente."
      );
    }
  },

  /**
   * Handle clear button click
   */
  handleClear() {
    const contratoInput = document.getElementById("contrato-id-input");
    const unidadeInput = document.getElementById("unidade-empenho-input");
    const resultsContainer = document.getElementById("empenhos-results");

    if (contratoInput) contratoInput.value = "";
    if (unidadeInput) unidadeInput.value = "";
    if (resultsContainer) resultsContainer.innerHTML = "";

    // Clear URL parameter
    this.updateUrlParameter(null);

    console.log("Search fields cleared");
  },

  // URL Parameter management
  updateUrlParameter(contractId) {
    const url = new URL(window.location);
    if (contractId) {
      url.searchParams.set("contrato", contractId);
    } else {
      url.searchParams.delete("contrato");
    }
    window.history.replaceState({}, "", url);
  },

  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  // Public method for external navigation
  searchContract(contractId) {
    if (contractId) {
      // Update URL parameter
      this.updateUrlParameter(contractId);

      // Update search input
      const contractInput = document.getElementById("contrato-id-input");
      if (contractInput) {
        contractInput.value = contractId;
      }

      // Trigger search
      this.handleSearch();
    }
  },
};

// Export the EncontroEvents object
export default EncontroEvents;
