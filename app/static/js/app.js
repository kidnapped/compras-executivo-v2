if (process.env.ENVIRONMENT === "production") {
  import("./app/style.js");
}

import environment from "./environment.js";
import menu from "./app/menu.js";
import header from "./app/header.js";
import footer from "./app/footer.js";
import admin from "./admin.js";
import modalManager from "./common/modal-manager.js";
import tooltip from "./common/tooltip.js";
import aditivosHandler from "./contrato/aditivos-handler.js";
import financialBars from "./contrato/financial-bars.js";
import devOps from "./dev-ops/dev-ops.js";
import card_kpi from "./kpi/card.js";
import contratos_dashboard from "./contrato/dashboard.js";
import admin_dw_tesouro from "./admin/admin_dw_tesouro.js";
import indicadores from "./indicadores.js";
import * as kpis_kpi from "./kpi/kpis.js";
// import encontroInit from "./encontro/encontro-init.js";
import breadcrumb from "./app/breadcrumb.js";
import card_header from "./app/card_header.js";
import topico from "./app/topico.js";

const App = {
  ...environment,
  ...menu,
  ...header,
  ...footer,
  ...admin,
  ...card_kpi,
  ...contratos_dashboard,
  ...admin_dw_tesouro,
  ...indicadores,
  ...kpis_kpi,
  ...modalManager,
  ...tooltip,
  ...aditivosHandler,
  ...financialBars,
  ...devOps,
  breadcrumb,
  card_header,
  topico,
  // Don't spread encontroInit since it's an object with its own init method
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar componentes dinâmicos
  if (header.autoInit) header.autoInit();
  if (menu.autoInit) menu.autoInit();
  if (footer.autoInit) footer.autoInit();
  
  modalManager.initialize();
  tooltip.initialize();
  financialBars.initialize();
  breadcrumb.breadcrumb_init();
  card_header.card_header_init();
  topico.topico_init();
  // Fix: Call the init method on the EncontroInit object
  // encontroInit.init(); // Remove this line - EncontroInit already auto-initializes
  
  // Auto-inicialização do admin DW Tesouro se estivermos na página correta
  if (admin_dw_tesouro.autoInit) {
    admin_dw_tesouro.autoInit();
  }
  
  // Auto-inicialização dos indicadores se estivermos na página correta
  if (indicadores.autoInit) {
    indicadores.autoInit();
  }
  
  App.init();
});
