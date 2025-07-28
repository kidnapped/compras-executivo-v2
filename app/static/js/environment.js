// Detecta o ambiente (development, production, etc.)
const ENV =
  (typeof process !== "undefined" && process.env && process.env.ENVIRONMENT) ||
  (typeof window !== "undefined" &&
    window.__ENV__ &&
    window.__ENV__.ENVIRONMENT) ||
  "development";

// Deixa o valor disponível no browser em window.process.env.ENVIRONMENT
if (typeof window !== "undefined") {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.env.ENVIRONMENT = ENV;
}

// Exportação nomeada para quem quiser só a string do ambiente
export const ENVIRONMENT = ENV;

// Exportação default com utilidades do App
export default {
  ENV,

  init() {
    App.menu();
    App.setupHeaderScroll();
    App.initBuscaMobile();
    App.dashboardContratosCard();
    App.dashboardContratosPorExercicioCard();
    App.dashboardRepresentacaoAnualValores();
    App.dashboardProximasAtividades();
    App.adminCards();
    App.adminUsuarios();
    App.initModal();
  },

  // Comportamento de encolhimento do cabeçalho com base no scroll
  setupHeaderScroll() {
    const header = document.querySelector(".br-header");
    const main = document.querySelector(".br-main");
    const menu = document.querySelector("#main-navigation");
    let lastShrinkState = false;

    const shrinkHeader = () => {
      const scrollY = window.scrollY;
      
      // Melhora a lógica de threshold para evitar "jitter"
      const shouldShrink = lastShrinkState 
        ? scrollY > 20  // Se já está encolhido, só expande se subir bastante
        : scrollY > 80; // Se está normal, só encolhe se descer bastante

      if (shouldShrink !== lastShrinkState) {
        header.classList.toggle("header-shrink", shouldShrink);
        document.body.classList.toggle("header-shrinked", shouldShrink);
        main.style.paddingTop = shouldShrink ? "70px" : "130px";
        
        // Explicitly handle menu positioning when header shrinks
        if (menu) {
          if (shouldShrink) {
            menu.style.top = "90px";
            menu.style.height = "calc(100% - 90px)";
          } else {
            menu.style.top = "130px";
            menu.style.height = "calc(100% - 130px)";
          }
        }
        
        lastShrinkState = shouldShrink;
      }
    };

    window.addEventListener("scroll", shrinkHeader);

    // Aplica header shrink direto no mobile
    if (window.innerWidth <= 768) {
      header.classList.add("header-shrink");
      document.body.classList.add("header-shrinked");
      main.style.paddingTop = "70px";
      if (menu) {
        menu.style.top = "90px";
        menu.style.height = "calc(100% - 90px)";
      }
    }

    shrinkHeader();
  },
};
