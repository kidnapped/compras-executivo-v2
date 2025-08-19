import aditivosHandler from "./aditivos-handler.js";

export default {
  // Flag para evitar múltiplos listeners
  _initialized: false,

  /**
   * Handles all user interaction events for the dashboard table.
   * Uses event delegation for efficiency and to support dynamic content.
   */
  handleTableClick(event) {
    // Check if the click was on or inside an element meant to open the aditivos modal
    const aditivoAction = event.target.closest(".aditivo-action");
    if (aditivoAction) {
      const { contractId, contractNumero, contractAno, aditivosCount } =
        aditivoAction.dataset;
      // Call the specific handler to show the aditivos
      aditivosHandler.showAditivos(
        contractId,
        contractNumero,
        contractAno,
        aditivosCount
      );
      return;
    }

    // Check if the click was on the encontro de contas action
    const encontroAction = event.target.closest(".encontro-action");
    if (encontroAction) {
      // Prevent default link behavior
      event.preventDefault();
      event.stopPropagation();

      // Limpar tooltips Bootstrap (sem erro se bootstrap não estiver definido)
      try {
        if (typeof bootstrap !== 'undefined') {
          document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
            const tooltip = bootstrap.Tooltip.getInstance(el);
            if (tooltip) {
              tooltip.hide();
              tooltip.dispose();
            }
          });
        }
        // Remove elementos tooltip visíveis
        document.querySelectorAll('.tooltip, .popover, [class*="tooltip"]').forEach(el => {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
      } catch (error) {
        console.warn("Erro ao remover tooltips:", error);
      }

      // Get contract ID from the data attribute
      const contractId = encontroAction.getAttribute("data-contract-id");

      console.log(`Encontro de Contas clicked for contract ID: ${contractId}`);

      // Navigate to encontro de contas page with contract ID parameter using SPA
      if (contractId && contractId !== "N/A") {
        // Use SPA router if available, otherwise fallback to traditional navigation
        if (
          window.spaRouter &&
          typeof window.spaRouter.navigateTo === "function"
        ) {
          console.log(
            "Using SPA navigation to:",
            `/encontro_contas?contrato=${contractId}`
          );
          window.spaRouter.navigateTo(
            `/encontro_contas?contrato=${contractId}`
          );
        } else {
          console.warn(
            "SPA router not available, falling back to traditional navigation"
          );
          window.location.href = `/encontro_contas?contrato=${contractId}`;
        }
      } else {
        console.error("Contract ID not found for navigation");
      }
      return;
    }
  },
  
  /**
   * Initializes the single event listener for the entire table.
   * This should be called once when the dashboard is set up.
   */
  initialize() {
    const table = document.querySelector("table.br-table");
    if (table) {
      // Remove listener existente se houver
      table.removeEventListener("click", this.handleTableClick);
      // Adiciona novo listener
      table.addEventListener("click", this.handleTableClick.bind(this));
      this._initialized = true;
      console.log("✅ DashboardEvents inicializado com sucesso");
    }
  },
  
  /**
   * Reset the initialization flag - useful for SPA navigation
   */
  reset() {
    this._initialized = false;
    console.log("🔄 DashboardEvents reset");
  },
};
