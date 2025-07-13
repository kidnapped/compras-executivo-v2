import EncontroEvents from "./events/encontro-events.js";

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
    
    // Check for URL parameters and auto-load data
    this.handleUrlParameters();

    // Update page title with contract ID if present
    this.updatePageTitle();

    console.log("Encontro de Contas initialized successfully");
  },

  /**
   * Handle URL parameters and auto-load data if contract ID is present
   */
  handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const contratoId = urlParams.get('contrato');
    const unidadeId = urlParams.get('unidade');

    if (contratoId) {
      console.log(`Auto-loading data for contract ${contratoId}`);
      
      // Fill the input fields with the URL parameters
      const contratoInput = document.getElementById('contrato-id-input');
      const unidadeInput = document.getElementById('unidade-empenho-input');
      
      if (contratoInput) {
        contratoInput.value = contratoId;
      }
      
      if (unidadeInput && unidadeId) {
        unidadeInput.value = unidadeId;
      }
      
      // Show loading state immediately
      const resultsContainer = document.getElementById('empenhos-results');
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
    const contratoId = urlParams.get('contrato');
    
    if (contratoId) {
      // Update browser tab title
      document.title = `Encontro de Contas - Contrato ${contratoId} - Compras Executivo`;
      
      // Update page header
      const pageHeader = document.querySelector('h1');
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
    const headerSection = document.querySelector('.row.mb-4 .col-12');
    if (headerSection) {
      const existingBreadcrumb = headerSection.querySelector('.breadcrumb-nav');
      if (!existingBreadcrumb) {
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb-nav mt-2';
        breadcrumb.innerHTML = `
          <ol class="breadcrumb">
            <li class="breadcrumb-item">
              <a href="/dashboard" class="text-decoration-none">
                <i class="fas fa-home"></i> Dashboard
              </a>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              Encontro de Contas - Contrato ${contratoId}
            </li>
          </ol>
        `;
        headerSection.appendChild(breadcrumb);
      }
    }
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

// Export for use in other modules
export default EncontroContas;
