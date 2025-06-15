export default {

    menuItems: [
        { texto: "Início", url: "/dashboard", icone: "fas fa-home" },
        { texto: "Contratos", url: "/contratos", icone: "fas fa-file-contract" },
        { texto: "Empenhos", url: "/empenhos", icone: "fas fa-file-invoice" },
        { texto: "Dashboard", url: "/dashboard", icone: "fas fa-chart-line" },
        { texto: "kpi's", url: "/kpis", icone: "fas fa-tachometer-alt" },
        { texto: "Financeiro", url: "/financeiro", icone: "fas fa-dollar-sign" },
        { texto: "Administração", url: "/admin", icone: "fas fa-cogs" },
        { texto: "Minha Conta", url: "/minha-conta", icone: "fas fa-user-circle" },
        { texto: "Suporte", url: "/suporte", icone: "fas fa-life-ring" },
        { texto: "Ajuda", url: "/ajuda", icone: "fas fa-question-circle" },
        { texto: "Sair", url: "/logout", icone: "fas fa-sign-out-alt" },
    ],

    menu() {
        const container = document.getElementById("menu-dinamico");
        if (container) {
            container.innerHTML = "";
            for (const item of this.menuItems) {
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