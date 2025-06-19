export default {
  init() {
    App.menu();
    App.setupHeaderScroll();
    App.initBuscaMobile();
    App.dashboardContratosCard();
    App.dashboardContratosPorExercicioCard();
    App.dashboardRepresentacaoAnualValores();
    App.dashboardProximasAtividades();
    // App.dashboardTabelaContratos();
    //App.loadKpiData();

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
      let shouldShrink =
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
