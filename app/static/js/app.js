if (process.env.ENVIRONMENT === "production") {
  import("./style.js");
}

import environment from "./environment.js";
import menu from "./menu.js";
import admin from "./admin.js";
import modalManager from "./common/modal-manager.js";
import tooltip from "./common/tooltip.js";
import aditivosHandler from "./contrato/aditivos-handler.js";
import encontroContas from "./encontro/encontro-contas.js";
import devOps from "./dev-ops/dev-ops.js";

import card_kpi from "./kpi/card.js";
import contratos_dashboard from "./contrato/dashboard.js";
import * as kpis_kpi from "./kpi/kpis.js";

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
  ...devOps,
  initEncontroContas: encontroContas.init.bind(encontroContas),
};

window.App = App;
window.EncontroContas = encontroContas;

document.addEventListener("DOMContentLoaded", () => {
  modalManager.initialize();
  tooltip.initialize();
  encontroContas.init();
  App.init();
});
