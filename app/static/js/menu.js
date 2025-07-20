export default {
  menuItems: [
    { texto: "Início", url: "/inicio", icone: "fas fa-home" },
    { texto: "Contratos", url: "/dashboard", icone: "fas fa-chart-line" },
    {
      texto: "Encontro de Contas",
      url: "/encontro-de-contas",
      icone: "fas fa-balance-scale",
    },
    { texto: "Filtro UASG", url: "/uasg-filter", icone: "fas fa-filter" },
    { texto: "kpi's", url: "/kpis", icone: "fas fa-tachometer-alt" },
    { texto: "Administração", url: "/admin", icone: "fas fa-cogs" },
    { texto: "Minha Conta", url: "/bloqueado", icone: "fas fa-user-circle" },
    { texto: "Suporte", url: "/bloqueado", icone: "fas fa-life-ring" },
    { texto: "Ajuda", url: "/bloqueado", icone: "fas fa-question-circle" },
    { texto: "Sair", url: "/logout", icone: "fas fa-sign-out-alt" },
  ],

  // Development-only menu items
  devMenuItems: [{ texto: "dev-ops", url: "/dev-ops", icone: "fas fa-tools" }],

  // Check if we're in development mode
  isDevelopmentMode() {
    // Method 1: Check hostname
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("dev")
    ) {
      return true;
    }

    // Method 2: Check port (development usually runs on non-standard ports)
    if (
      window.location.port === "8000" ||
      window.location.port === "8001" ||
      window.location.port === "5000"
    ) {
      return true;
    }

    // Method 3: Check for development flag in localStorage
    if (localStorage.getItem("dev_mode") === "true") {
      return true;
    }

    // Method 4: Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("dev") === "true") {
      return true;
    }

    return false;
  },

  // Get menu items based on environment
  getMenuItems() {
    let items = [...this.menuItems];

    // Add development items if in development mode
    if (this.isDevelopmentMode()) {
      // Insert dev items before "Sair" (last item)
      const sairIndex = items.findIndex((item) => item.texto === "Sair");
      if (sairIndex !== -1) {
        items.splice(sairIndex, 0, ...this.devMenuItems);
      } else {
        items.push(...this.devMenuItems);
      }
    }

    return items;
  },

  menu() {
    const container = document.getElementById("menu-dinamico");
    if (container) {
      container.innerHTML = "";

      // Use getMenuItems() instead of this.menuItems
      const menuItems = this.getMenuItems();

      for (const item of menuItems) {
        const link = document.createElement("a");
        link.href = item.url;
        link.className = "menu-item";
        link.setAttribute("role", "treeitem");

        link.innerHTML = `
                    <span class="icon"><i class="${item.icone}" aria-hidden="true"></i></span>
                    <span class="content">${item.texto}</span>
                `;
        container.appendChild(link);
      }
    }

    // Funcionalidade: abrir/fechar menu
    const menu = document.getElementById("main-navigation");
    const body = document.body;
    const menuButtons = document.querySelectorAll(
      'button[aria-label="Abrir Menu"]'
    );

    if (menuButtons.length && menu) {
      menuButtons.forEach((menuButton) => {
        menuButton.addEventListener("click", () => {
          const isOpen = menu.classList.contains("active");
          menu.classList.toggle("active", !isOpen);
          body.classList.toggle("menu-open", !isOpen);
          menuButton.innerHTML = isOpen
            ? "<span>&#9776;</span>"
            : "<span>&times;</span>";
        });
      });
    }
  },

  // Ativa/desativa campo de busca no mobile
  initBuscaMobile() {
    const botaoAbrir = document.getElementById("abrir-pesquisa");
    const botaoFechar = document.getElementById("fechar-pesquisa");
    const campoBusca = document.getElementById("busca-mobile");
    const campoInput = document.getElementById("campo-pesquisa-mobile");

    if (botaoAbrir && botaoFechar && campoBusca) {
      botaoAbrir.addEventListener("click", function () {
        document.getElementById("header-esquerda").style.display = "none";
        document.getElementById("header-direita-desktop").style.display =
          "none";
        botaoAbrir.style.display = "none";
        campoBusca.style.display = "flex";
        campoInput.focus();
      });

      botaoFechar.addEventListener("click", function () {
        document.getElementById("header-esquerda").style.display = "";
        document.getElementById("header-direita-desktop").style.display = "";
        botaoAbrir.style.display = "";
        campoBusca.style.display = "none";
      });
    }
  },
};
