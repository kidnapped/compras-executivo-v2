if (process.env.ENVIRONMENT === "production") {
  import("./app/style.js");
}

import environment from "./environment.js";
import menu from "./app/menu.js";
import header from "./app/header.js";
import footer from "./app/footer.js";
import admin from "./admin.js";
import modalManager from "./common/modal-manager.js";
// import tooltip from "./common/tooltip.js"; // Disabled - using GovBR DS tooltips instead
import aditivosHandler from "./contrato/aditivos-handler.js";
import financialBars from "./contrato/financial-bars.js";
import devOps from "./dev-ops/dev-ops.js";
import card_kpi from "./kpi/card.js";
import contratos_dashboard from "./contrato/dashboard.js";
import admin_dw_tesouro from "./admin/admin_dw_tesouro.js";
import indicadores from "./indicadores.js";
import minha_conta from "./minha_conta.js";
import * as kpis_kpi from "./kpi/kpis.js";
// import encontroInit from "./encontro/encontro-init.js";
import breadcrumb from "./app/breadcrumb.js";
import card_header from "./app/card_header.js";
import topico from "./app/topico.js";
import SPARouter from "./spa_router.js";

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
  ...minha_conta,
  ...kpis_kpi,
  ...modalManager,
  // ...tooltip, // Disabled - using GovBR DS tooltips instead
  ...aditivosHandler,
  ...financialBars,
  ...devOps,
  breadcrumb,
  card_header,
  topico,
  SPARouter,
  // Don't spread encontroInit since it's an object with its own init method
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
  // Configurar window.menuApp corretamente
  window.menuApp = menu;
  
  // Inicializar componentes dinâmicos
  if (header.autoInit) header.autoInit();
  if (menu.autoInit) menu.autoInit();
  if (footer.autoInit) footer.autoInit();
  
  modalManager.initialize();
  // tooltip.initialize(); // Disabled - using GovBR DS tooltips instead
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
  
  // Auto-inicialização da página minha conta se estivermos na página correta
  if (minha_conta.autoInit) {
    minha_conta.autoInit();
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
        console.log('🚀 SPA Router inicializado');
        
        // Integrar com sistema de menu se disponível
        if (window.menuApp && typeof window.menuApp.updateActiveMenuItem === 'function') {
          // Escutar mudanças de rota
          window.addEventListener('popstate', function() {
            setTimeout(() => window.menuApp.updateActiveMenuItem(), 100);
          });
          
          // Atualizar menu inicial
          setTimeout(() => window.menuApp.updateActiveMenuItem(), 200);
        }
        
      } else if (attempts < maxAttempts) {
        setTimeout(tryInitSPA, 100);
      } else {
        console.warn('⚠️ SPA Router não pôde ser inicializado');
      }
    }
    
    tryInitSPA();
  }
  
  App.init();
});
