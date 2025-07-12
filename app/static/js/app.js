if (process.env.ENVIRONMENT === "production") {
  import("./style.js");
}

import environment from "./environment.js";
import menu from "./menu.js";
import admin from "./admin.js";
import modalManager from "./common/modal-manager.js";
import aditivosHandler from "./contrato/aditivos-handler.js";
import encontroContas from "./encontro/encontro-contas.js";

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
  ...aditivosHandler,
  initEncontroContas: encontroContas.init.bind(encontroContas),
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
  modalManager.initialize();
  encontroContas.init();
  App.init();
});
