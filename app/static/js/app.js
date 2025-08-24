import environment from "./util/environment.js";
import menu from "./app/menu.js";
import header from "./app/header.js";
import footer from "./app/footer.js";
import cookie from "./app/cookie.js";
import uiUtils from "./app/ui-utils.js";
import admin from "./admin.js";
import cpfAlias from "./admin/admin_cpf_alias.js";
import modalManager from "./common/modal-manager.js";
import aditivosHandler from "./contrato/aditivos-handler.js";
import devOps from "./dev_ops/dev_ops.js";
import contratos_dashboard from "./contrato/dashboard.js";
import admin_dw_tesouro from "./admin/admin_dw_tesouro.js";
import indicadores from "./indicadores.js";
import minha_conta from "./minha_conta.js";
import breadcrumb from "./app/breadcrumb.js";
import filter from "./app/filter.js";
import card_header from "./app/card_header.js";
import topico from "./app/topico.js";
import SPARouter from "./spa_router.js";
import getEcharts from "./util/echarts.js";
import encontroContas from "./encontro_contas.js";
import kpis from "./kpi/kpis.js";

const App = {
  ...environment,
  ...menu,
  ...header,
  ...footer,
  ...cookie,
  ...uiUtils,
  ...admin,
  ...cpfAlias,
  ...contratos_dashboard,
  ...admin_dw_tesouro,
  ...indicadores,
  ...minha_conta,
  ...modalManager,
  ...aditivosHandler,
  ...devOps,
  ...encontroContas,
  ...kpis,
  breadcrumb,
  filter,
  card_header,
  topico,
  SPARouter,
  getEcharts,
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
  // Configurar window.menuApp corretamente
  window.menuApp = menu;

  // Inicializar componentes
  header.autoInit();
  menu.autoInit();
  footer.autoInit();
  cookie.cookieAutoInit();
  uiUtils.autoInit();
  modalManager.initialize();
  breadcrumb.breadcrumb_init();
  filter.filter_init();
  card_header.card_header_init();
  topico.topico_init();
  admin_dw_tesouro.autoInit();
  admin.autoInit();
  cpfAlias.autoInit();
  indicadores.autoInit();
  kpis.autoInit();
  minha_conta.autoInit();
  contratos_dashboard.dashboard_autoInit();
  encontroContas.encontroDeContas_autoInit();
  SPARouter.autoInit();
});
