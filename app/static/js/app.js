if (process.env.ENVIRONMENT === "production") {
  import("./app/style.js");
}

import environment from "./environment.js";
import menu from "./app/menu.js";
import header from "./app/header.js";
import footer from "./app/footer.js";
import cookie from "./app/cookie.js";
import admin from "./admin.js";
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

const App = {
  ...environment,
  ...menu,
  ...header,
  ...footer,
  ...cookie,
  ...admin,
  ...contratos_dashboard,
  ...admin_dw_tesouro,
  ...indicadores,
  ...minha_conta,
  ...modalManager,
  ...aditivosHandler,
  ...devOps,
  breadcrumb,
  filter,
  card_header,
  topico,
  SPARouter,

  // Dynamic KPI initialization method
  async kpisInit() {
    console.log("🔧 Loading KPIs dynamically...");
    try {
      const { initializeAllKpis } = await import("./kpi/kpis.js");
      await initializeAllKpis();
      console.log("✅ KPIs loaded and initialized successfully!");
    } catch (error) {
      console.error("❌ Error loading KPIs:", error);
    }
  },

  // Dynamic Indicadores initialization method
  indicadoresInit() {
    console.log("🔧 Loading Indicadores dynamically...");
    try {
      if (indicadores.indicadores_initComplete) {
        indicadores.indicadores_initComplete();
        console.log("✅ Indicadores loaded and initialized successfully!");
      } else {
        console.warn("⚠️ indicadores.indicadores_initComplete not available");
      }
    } catch (error) {
      console.error("❌ Error loading Indicadores:", error);
    }
  },

  // Dynamic EncontroContas initialization method
  async encontroContasInit() {
    console.log("🔧 Loading EncontroContas dynamically...");
    try {
      const { default: EncontroContas } = await import(
        "./encontro/encontro-contas.js"
      );

      // Clean up previous instance if exists
      if (window.encontroContasInstance) {
        window.encontroContasInstance = null;
      }

      // Initialize the EncontroContas instance
      if (EncontroContas) {
        window.encontroContasInstance = new EncontroContas();
        console.log("✅ EncontroContas loaded and initialized successfully!");
      } else {
        console.warn("⚠️ EncontroContas class not found in module");
      }
    } catch (error) {
      console.error("❌ Error loading EncontroContas:", error);
    }
  },
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
  // tooltip.initialize(); // Disabled - using GovBR DS tooltips instead
  breadcrumb.breadcrumb_init();
  filter.filter_init();
  card_header.card_header_init();
  topico.topico_init();
  // Fix: Call the init method on the EncontroInit object
  // encontroInit.init(); // Remove this line - EncontroInit already auto-initializes

  // Auto-inicialização do admin DW Tesouro se estivermos na página correta
  if (admin_dw_tesouro.autoInit) {
    admin_dw_tesouro.autoInit();
  }

  // Auto-inicialização dos indicadores apenas se estivermos na página correta
  if (indicadores.autoInit) {
    indicadores.autoInit();
  }

  // Auto-inicialização da página minha conta se estivermos na página correta
  if (minha_conta.autoInit) {
    minha_conta.autoInit();
  }

  // Auto-inicialização do dashboard se estivermos na página correta
  if (contratos_dashboard.dashboard_autoInit) {
    contratos_dashboard.dashboard_autoInit();
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
