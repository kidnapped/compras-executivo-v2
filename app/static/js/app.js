if (process.env.ENVIRONMENT === "production") {
  import("./style.js");
}

import environment from "./environment.js";
import menu from "./menu.js";
import admin from "./admin.js";
import modalManager from "./common/modal-manager.js";
import tooltip from "./common/tooltip.js";
import aditivosHandler from "./contrato/aditivos-handler.js";
import financialBars from "./contrato/financial-bars.js";
import devOps from "./dev-ops/dev-ops.js";
import card_kpi from "./kpi/card.js";
import contratos_dashboard from "./contrato/dashboard.js";
import * as kpis_kpi from "./kpi/kpis.js";
import encontroInit from "./encontro/encontro-init.js";

const App = {
  ...environment,
  ...menu,
  ...admin,
  ...card_kpi,
  ...contratos_dashboard,
  ...kpis_kpi,
  ...modalManager,
  ...tooltip,
  ...aditivosHandler,
  ...financialBars,
  ...devOps,
  // Don't spread encontroInit since it's an object with its own init method
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
  modalManager.initialize();
  tooltip.initialize();
  financialBars.initialize();
  // Fix: Call the init method on the EncontroInit object
  // encontroInit.init(); // Remove this line - EncontroInit already auto-initializes
  App.init();
});
