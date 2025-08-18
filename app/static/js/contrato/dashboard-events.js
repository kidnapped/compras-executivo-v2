import aditivosHandler from "./aditivos-handler.js";

/**
 * Handles all user interaction events for the dashboard table.
 * Uses event delegation for efficiency and to support dynamic content.
 */

// This function will be called by the event listener.
const handleTableClick = (event) => {
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
          `/encontro-de-contas?contrato=${contractId}`
        );
        window.spaRouter.navigateTo(
          `/encontro-de-contas?contrato=${contractId}`
        );
      } else {
        console.warn(
          "SPA router not available, falling back to traditional navigation"
        );
        window.location.href = `/encontro-de-contas?contrato=${contractId}`;
      }
    } else {
      console.error("Contract ID not found for navigation");
    }
    return;
  }

  // Check if the click was on the favorite icon
  // const favoriteAction = event.target.closest('.favorite-action');
  // if (favoriteAction) {
  //   const { contractId } = favoriteAction.dataset;
  //   const icon = favoriteAction.querySelector('i');
  //
  //   // Placeholder for actually saving the favorite state
  //   console.log(`Toggling favorite status for contract ID: ${contractId}`);
  //
  //   // Toggle the visual state of the icon
  //   if (icon) {
  //     // Assumes Font Awesome 5+ classes for solid (favorited) and regular (not favorited)
  //     icon.classList.toggle('fa-solid');
  //     icon.classList.toggle('fa-regular');
  //   }
  //   return;
  // }

  // You can add more checks here for other actions later
};

export default {
  // Flag para evitar múltiplos listeners
  _initialized: false,
  
  /**
   * Initializes the single event listener for the entire table.
   * This should be called once when the dashboard is set up.
   */
  initialize() {
    const table = document.querySelector("table.br-table");
    if (table) {
      // Remove listener existente se houver
      table.removeEventListener("click", handleTableClick);
      // Adiciona novo listener
      table.addEventListener("click", handleTableClick);
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
