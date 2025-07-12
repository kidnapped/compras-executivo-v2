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
  /**
   * Initializes the single event listener for the entire table.
   * This should be called once when the dashboard is set up.
   */
  initialize() {
    const table = document.querySelector("table.br-table");
    if (table) {
      table.addEventListener("click", handleTableClick);
    }
  },
};
