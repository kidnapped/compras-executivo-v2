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
  },

  // Comportamento de encolhimento do cabeçalho com base no scroll
  setupHeaderScroll() {
    const header = document.querySelector(".br-header");
    const main = document.querySelector(".br-main");
    let lastShrinkState = false;

    const shrinkHeader = () => {
      const scrollY = window.scrollY;
      const shouldShrink =
        (!lastShrinkState && scrollY > 50) || (lastShrinkState && scrollY < 30)
          ? !lastShrinkState
          : lastShrinkState;

      if (shouldShrink !== lastShrinkState) {
        header.classList.toggle("header-shrink", shouldShrink);
        main.style.paddingTop = shouldShrink ? "70px" : "130px";
        lastShrinkState = shouldShrink;
      }
    };

    window.addEventListener("scroll", shrinkHeader);

    // Aplica header shrink direto no mobile
    if (window.innerWidth <= 768) {
      header.classList.add("header-shrink");
      main.style.paddingTop = "70px";
    }

    shrinkHeader();
  },
};
