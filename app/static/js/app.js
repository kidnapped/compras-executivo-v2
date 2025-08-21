if (process.env.ENVIRONMENT === "production") {
  import("./app/style.js");
}

import environment from "./environment.js";
import menu from "./app/menu.js";
import header from "./app/header.js";
import footer from "./app/footer.js";
import cookie from "./app/cookie.js";
import admin from "./admin.js";
import cpfAlias from "./admin/admin_cpf_alias.js";
import modalManager from "./common/modal-manager.js";
import aditivosHandler from "./contrato/aditivos-handler.js";
import devOps from "./dev-ops/dev-ops.js";
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

  // Inicializar componentes dinâmicos
  if (header.autoInit) header.autoInit();
  if (menu.autoInit) menu.autoInit();
  if (footer.autoInit) footer.autoInit();
  if (cookie.cookieAutoInit) cookie.cookieAutoInit();

  modalManager.initialize();
  breadcrumb.breadcrumb_init();
  filter.filter_init();
  card_header.card_header_init();
  topico.topico_init();

  // Auto-inicialização do admin DW Tesouro se estivermos na página correta
  if (admin_dw_tesouro.autoInit) {
    admin_dw_tesouro.autoInit();
  }

  // Auto-inicialização da página admin se estivermos na página correta
  if (admin.autoInit) {
    admin.autoInit();
  }

  // Auto-inicialização da página CPF Alias se estivermos na página correta
  if (cpfAlias.autoInit) {
    cpfAlias.autoInit();
  }

  // Auto-inicialização dos indicadores apenas se estivermos na página correta
  if (indicadores.autoInit) {
    indicadores.autoInit();
  }

  // Auto-inicialização dos KPIs apenas se estivermos na página correta
  if (kpis.autoInit) {
    kpis.autoInit();
  }

  // Auto-inicialização da página minha conta se estivermos na página correta
  if (minha_conta.autoInit) {
    minha_conta.autoInit();
  }

  // Auto-inicialização do dashboard se estivermos na página correta
  if (contratos_dashboard.dashboard_autoInit) {
    contratos_dashboard.dashboard_autoInit();
  }

  // Auto-inicialização do encontro de contas se estivermos na página correta
  if (encontroContas.encontroDeContas_autoInit) {
    encontroContas.encontroDeContas_autoInit();
  }

  // Inicializar SPA Router
  if (SPARouter) {
    window.SPARouter = SPARouter;
    let attempts = 0;
    const maxAttempts = 50;

    function tryInitSPA() {
      attempts++;

      if (window.SPARouter) {
        window.spaRouter = new window.SPARouter();
        console.log("🚀 SPA Router inicializado");

        // Integrar com sistema de menu se disponível
        if (
          window.menuApp &&
          typeof window.menuApp.updateActiveMenuItem === "function"
        ) {
          // Escutar mudanças de rota
          window.addEventListener("popstate", function () {
            setTimeout(() => window.menuApp.updateActiveMenuItem(), 100);
          });

          // Atualizar menu inicial
          setTimeout(() => window.menuApp.updateActiveMenuItem(), 200);
        }
      } else if (attempts < maxAttempts) {
        setTimeout(tryInitSPA, 100);
      } else {
        console.warn("⚠️ SPA Router não pôde ser inicializado");
      }
    }

    tryInitSPA();
  }

  App.init();
});
