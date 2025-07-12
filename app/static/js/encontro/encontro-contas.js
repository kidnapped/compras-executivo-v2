import EncontroEvents from "./events/encontro-events.js";

/**
 * Main controller for Encontro de Contas
 * Initializes all components and manages the overall functionality
 */

export default {
  /**
   * Initialize the Encontro de Contas module
   */
  initialize() {
    console.log("Initializing Encontro de Contas...");

    // Initialize events
    EncontroEvents.initialize();

    console.log("Encontro de Contas initialized successfully");
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
