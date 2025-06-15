import "../css/rawline.css";
import "../css/app.css";
import * as echarts from "echarts";

// Objeto principal que organiza toda a lógica JS da aplicação
const App = {
  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // VARS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

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

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // INIT
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  init() {
    this.menu();
    this.setupHeaderScroll();
    this.initBuscaMobile();
    this.dashboardContratosCard();
    this.dashboardContratosPorExercicioCard();
    this.dashboardRepresentacaoAnualValores();
    this.dashboardProximasAtividades();
    this.adminCards();
    this.adminUsuarios();
    // kpis testing reuse of barchart function
    this.barChart({
      chartId: "card-kpi-container-chart2",
      dataUrl: "/kpis/kpi1",
      xAxisData: [
        "Total",
        "Vigentes",
        "Finalizados",
        "Críticos",
        "120 dias",
        "90 dias",
        "45 dias",
        "Outros",
      ],
      dataFields: [
        "quantidade_total",
        "vigentes",
        "finalizados",
        "criticos",
        "dias120",
        "dias90",
        "dias45",
        "outros",
      ],
      title: "Contratos e Renovações",
      subtitle: "Total de contratos desde 2006",
      labelOptions: {
        show: true,
        position: "top",
        fontSize: 12,
        color: "#333",
      },
    });
    this.barChart({
      chartId: "card-kpi-container-chart1",
      dataUrl: "/kpis/kpi1",
      xAxisData: [
        "Total",
        "Vigentes",
        "Finalizados",
        "Críticos",
        "120 dias",
        "90 dias",
        "45 dias",
        "Outros",
      ],
      dataFields: [
        "quantidade_total",
        "vigentes",
        "finalizados",
        "criticos",
        "dias120",
        "dias90",
        "dias45",
        "outros",
      ],
      title: "Contratos e Renovações",
      subtitle: "Total de contratos desde 2006",
      colors: [
        "#5470C6",
        "#91CC75",
        "#FAC858",
        "#EE6666",
        "#73C0DE",
        "#3BA272",
        "#FC8452",
        "#9A60B4",
      ],
    });
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // LAYOUT
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Menu lateral
  menu() {
    // Renderiza os itens do menu
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

  // Alterna visibilidade do menu de filtros
  dashboardGridFiltroOpcoes() {
    const box = document.getElementById("filtro-opcoes-menu");
    if (box) {
      box.style.display = box.style.display === "none" ? "block" : "none";
    }
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // KPIs
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Card Header
  cardHeader({ titulo, subtitulo, icone = "/static/images/doc2.png" }) {
    return `
            <div class="card-header">
                <div class="d-flex" style="width: 100%;">
                    <div class="ml-3" style="flex-grow: 1;">
                        <div class="titulo">
                            <img src="${icone}" alt="Ícone" style="height: 36px;margin:10px 0px -10px 0px;">
                            ${titulo}
                        </div>
                        <div style="border-bottom: 1px solid #ccc;margin:-6px 0px 0px 26px;"></div>
                        <div class="subtitulo">${subtitulo}</div>
                    </div>
                    <div class="ml-auto" style="margin: -10px -10px 0px 0px;">
                        <button class="br-button circle" type="button" aria-label="Mais opções">
                            <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // DASHBOARD
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Card Contratos Contadores
  dashboardContratosCard() {
    const container = document.getElementById("card-contratos-container");
    if (!container) return;

    fetch("/dashboard/contratos")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data) => {
        container.outerHTML = App.renderDashboardCardContratos(data);
      })
      .catch((err) => {
        container.innerHTML =
          '<div class="text-danger">Erro ao carregar dados</div>';
        console.error("Erro ao buscar contratos:", err);
      });
  },

  dashboardContratosPorExercicioCard() {
    const container = document.getElementById(
      "card-contratos-exercicio-container"
    );
    if (!container) return;

    fetch("/dashboard/contratos-por-exercicio")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data) => {
        const novoCard = App.renderDashboardCardContratosPorExercicio({
          id: "grafico-contratos-por-exercicio",
          titulo: "Contratos por exercício",
          subtitulo: "Histórico de contratos por ano",
          icone: "/static/images/doc2.png",
        });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = novoCard.trim();
        const novoElemento = wrapper.firstChild;

        const parent = container.parentElement;
        if (parent) {
          parent.replaceChild(novoElemento, container);
        }

        const chartDom = document.getElementById(
          "grafico-contratos-por-exercicio"
        );
        if (!chartDom) return;

        const anos = data.anos;
        const totais = data.valores;

        const chart = echarts.init(chartDom);
        chart.setOption({
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (p) =>
              `${p[0].axisValue}<br/><strong>${p[0].data} Contratos</strong>`,
          },
          grid: {
            right: 20,
          },
          xAxis: {
            type: "category",
            data: anos,
            axisLabel: { rotate: 45, fontSize: 11 },
          },
          yAxis: {
            type: "value",
            axisLabel: { show: false },
            splitLine: { show: true }, // linhas horizontais
            axisLine: { show: false }, // opcional: remove a linha do próprio eixo Y
            axisTick: { show: false }, // opcional: remove os tracinhos do eixo Y
          },
          series: [
            {
              name: "Contratos",
              type: "bar",
              data: totais,
              itemStyle: { color: "#5470C6" },
              barMaxWidth: 20,
            },
          ],
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar gráfico:", err);
      });
  },

  dashboardRepresentacaoAnualValores() {
    const container = document.getElementById(
      "card-representacao-anual-valores"
    );
    if (!container) return;

    fetch("/dashboard/valores-por-exercicio")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data) => {
        const novoCard = App.renderDashboardCardContratosPorExercicio({
          id: "grafico-representacao-anual-valores",
          titulo: "Valores por exercício",
          subtitulo: "Valores de contratos nos últimos 6 anos",
          icone: "/static/images/clock.png",
        });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = novoCard.trim();
        const novoElemento = wrapper.firstChild;

        const parent = container.parentElement;
        if (parent) {
          parent.replaceChild(novoElemento, container);
        }

        const chartDom = document.getElementById(
          "grafico-representacao-anual-valores"
        );
        if (!chartDom) return;

        const anos = data.anos;
        const totais = data.valores;

        const chart = echarts.init(chartDom);
        chart.setOption({
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (p) =>
              `${
                p[0].axisValue
              }<br/><strong>R$ ${p[0].data.toLocaleString()}</strong>`,
          },
          grid: { right: 20 },
          xAxis: {
            type: "category",
            data: anos,
            axisLabel: { rotate: 45, fontSize: 11 },
          },
          yAxis: {
            type: "value",
            axisLabel: { show: false },
            splitLine: { show: true },
            axisLine: { show: false },
            axisTick: { show: false },
          },
          series: [
            {
              name: "Contratos",
              type: "bar",
              data: data.coluna,
              itemStyle: { color: "#0072c6" },
              barMaxWidth: 20,
            },
            {
              name: "Aditivos",
              type: "line",
              data: data.linha,
              smooth: true,
              lineStyle: { width: 3, color: "#0099ff" },
              symbol: "circle",
              symbolSize: 10,
              itemStyle: {
                borderWidth: 2,
                borderColor: "#fff",
                color: "#5470c6",
              },
            },
          ],
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar gráfico de valores:", err);
      });
  },

  dashboardProximasAtividades() {
    const container = document.getElementById("card-proximas-atividades");
    if (!container) return;

    fetch("/dashboard/atividades")
      .then((res) => res.json())
      .then((data) => {
        const atividades = data.atividades || [];
        const conteudo = atividades
          .slice(0, 50)
          .map((atividade) => {
            // calcula o valor a exibir de acordo com as regras
            const diasExibir =
              atividade.dias_restantes < 45
                ? 45
                : atividade.dias_restantes > 45
                ? 90
                : atividade.dias_restantes > 90
                ? 120
                : atividade.dias_restantes;

            const dia = atividade.dias_restantes === 1 ? "dia" : "dias";

            return `
      <div class="widget-atividades-item">
        <i class="fas fa-clock"></i>
        <a href="#">${atividade.data}</a>
        <span>em ${atividade.dias_restantes} ${dia}</span><br>
        Renovação de <b>${diasExibir} dias</b> para o contrato ${atividade.numero}
      </div>
    `;
          })
          .join("");

        container.innerHTML = `
                    <div class="br-card h-100 card-contratos">
                        <div class="card-content" style="padding: 0px; height: 186px !important;">
                            <div class="widget-atividades-box">
                                <div class="widget-atividades-header">
                                    <i class="fas fa-chart-line"></i> Próximas atividades
                                </div>
                                <div class="widget-atividades-lista">${conteudo}</div>
                            </div>
                        </div>
                    </div>
                `;
      })
      .catch((err) => {
        console.error("Erro ao carregar próximas atividades:", err);
        container.innerHTML =
          '<div class="text-danger">Erro ao carregar atividades</div>';
      });
  },

  // card de contratos
  renderDashboardCardContratos({
    titulo = "",
    subtitulo = "",
    quantidade_total = "",
    vigentes = 0,
    finalizados = 0,
    criticos = 0,
    dias120 = 0,
    dias90 = 0,
    dias45 = 0,
    outros = 0,
    icone = "/static/images/doc2.png",
  }) {
    return `
            <div class="col-12 col-lg-3">
                <div class="br-card h-100 card-contratos">
                    ${App.cardHeader({ titulo, subtitulo, icone })}
                    <div class="card-content" style="padding-top: 8px;">
                        <div class="valor-principal">
                           ${quantidade_total}
                        </div>
                        <div class="linha">
                            <div><div>Vigentes</div><div class="valor-azul">${vigentes}</div></div>
                            <div class="divider"></div>
                            <div><div>Finalizados</div><div class="valor-azul">${finalizados}</div></div>
                            <div class="divider"></div>
                            <div><div>Críticos</div><div class="valor-vermelho">${criticos}</div></div>
                        </div>
                        <div class="linha" style="gap: 8px;">
                            <div><div>120 dias</div><div class="valor-vermelho">${dias120}</div></div>
                            <div class="divider"></div>
                            <div><div>90 dias</div><div class="valor-vermelho">${dias90}</div></div>
                            <div class="divider"></div>
                            <div><div>45 dias</div><div class="valor-vermelho">${dias45}</div></div>
                            <div class="divider"></div>
                            <div><div>Outros</div><div class="valor-azul">${outros}</div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  },

  renderDashboardCardContratosPorExercicio({
    id,
    titulo,
    subtitulo,
    icone = "/static/images/doc2.png",
  }) {
    return `
            <div class="col-12 col-lg-3">
                <div class="br-card h-100 card-contratos" style="min-height: 180px;">
                    ${App.cardHeader({ titulo, subtitulo, icone })}
                    <div class="card-content" style="padding: 0px; height: 180px !important;">
                        <div id="${id}" style="width: 100%; height: 210px; margin-top: -40px;"></div>
                    </div>
                </div>
            </div>
        `;
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // ADMIN
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  adminCards() {
    const container = document.getElementById("admin-cards");
    if (!container) return;

    const cards = [
      {
        titulo: "Usuários",
        descricao: "Cadastro, edição e perfis",
        icone: "fas fa-users",
        url: "/admin/usuarios",
        botao: "Acessar",
      },
      {
        titulo: "Perfis",
        descricao: "Tipos de perfil e regras",
        icone: "fas fa-id-badge",
        url: "/admin/perfis",
        botao: "Gerenciar",
      },
      {
        titulo: "Permissões",
        descricao: "Papéis e acessos",
        icone: "fas fa-user-shield",
        url: "/admin/permissoes",
        botao: "Acessar",
      },
      {
        titulo: "Logs",
        descricao: "Auditoria e histórico",
        icone: "fas fa-file-alt",
        url: "/admin/logs",
        botao: "Ver registros",
      },
      {
        titulo: "Sistema",
        descricao: "Configurações gerais",
        icone: "fas fa-cogs",
        url: "/admin/sistema",
        botao: "Configurar",
      },
      {
        titulo: "ETL",
        descricao: "Carga e sincronização de dados",
        icone: "fas fa-database",
        url: "/admin/etl",
        botao: "Executar",
      },
      {
        titulo: "UASGs",
        descricao: "Vínculos entre UASGs",
        icone: "fas fa-university",
        url: "/admin/uasgs",
        botao: "Gerenciar",
      },
      {
        titulo: "Parâmetros",
        descricao: "Configuração de variáveis",
        icone: "fas fa-sliders-h",
        url: "/admin/parametros",
        botao: "Ajustar",
      },
      {
        titulo: "Integrações",
        descricao: "APIs e conectores externos",
        icone: "fas fa-plug",
        url: "/admin/integracoes",
        botao: "Conferir",
      },
    ];

    cards.forEach((card) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-6 col-lg-3 mb-3";
      col.innerHTML = `
                <div class="br-card h-100">
                    <div class="card-content text-center p-3">
                        <i class="${card.icone} fa-2x mb-2" style="color:#1351b4;"></i>
                        <h5 class="mt-2">${card.titulo}</h5>
                        <p class="text-muted small">${card.descricao}</p>
                        <a href="${card.url}" class="br-button primary small mt-2">${card.botao}</a>
                    </div>
                </div>
            `;
      container.appendChild(col);
    });
  },

  adminUsuarios(pagina = 1) {
    const tabela = document.querySelector("#tabela-usuarios tbody");
    if (!tabela) return;

    fetch(`/admin/usuarios/lista?pagina=${pagina}`)
      .then((res) => res.json())
      .then((data) => {
        const tbody = document.querySelector("#tabela-usuarios tbody");
        tbody.innerHTML = "";

        data.usuarios.forEach((u) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
                        <td>${u.id}</td>
                        <td>${u.nome}</td>
                        <td>${u.cpf}</td>
                        <td>${u.email || ""}</td>
                        <td>${u.usuario}</td>
                        <td>${u.origem_login}</td>
                        <td><span class="badge ${
                          u.ativo ? "success" : "danger"
                        }">${u.ativo ? "Sim" : "Não"}</span></td>
                        <td>
                            <button class="br-button circle small btn-editar-usuario"
                                    data-id="${u.id}"
                                    data-nome="${u.nome}"
                                    data-email="${u.email || ""}"
                                    data-ativo="${u.ativo}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <form method="post" action="/admin/usuarios/excluir/${
                              u.id
                            }" style="display:inline" onsubmit="return confirm('Confirma exclusão?')">
                                <button class="br-button circle small" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </form>
                        </td>
                    `;
          tbody.appendChild(tr);
        });

        document.querySelectorAll(".btn-editar-usuario").forEach((botao) => {
          botao.addEventListener("click", (e) => {
            e.preventDefault();
            App.adminModalEditar(e.currentTarget);
          });
        });

        App.adminPaginacaoUsuarios(data.pagina, data.limite, data.total);

        const botao = document.getElementById("abrir-modal-novo-usuario");
        if (botao) {
          botao.onclick = () => App.adminModalNovoUsuario();
        }
      });
  },

  adminPaginacaoUsuarios(paginaAtual, limite, total) {
    const container = document.getElementById("paginacao-usuarios");
    container.innerHTML = "";
    const totalPaginas = Math.ceil(total / limite);

    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement("button");
      btn.className = "br-button small" + (i === paginaAtual ? " primary" : "");
      btn.innerText = i;
      btn.onclick = () => App.adminUsuarios(i);
      container.appendChild(btn);
    }
  },

  adminModalEditar(botao) {
    const id = botao.dataset.id;
    const nome = botao.dataset.nome;
    const email = botao.dataset.email;
    const ativo = botao.dataset.ativo === "true";

    const modal = document.createElement("div");
    modal.className = "br-modal active";
    modal.setAttribute("role", "dialog");
    modal.innerHTML = `
            <div class="br-modal-dialog">
                <div class="br-modal-content">
                    <div class="br-modal-header">
                        <h2 class="br-modal-title">Editar Usuário</h2>
                        <button class="br-button circle small" onclick="this.closest('.br-modal').remove()"><i class="fas fa-times"></i></button>
                    </div>
                    <form method="post" action="/admin/usuarios/editar/${id}">
                        <div class="br-modal-body">
                            <div class="br-input">
                                <label for="nome">Nome</label>
                                <input name="nome" type="text" value="${nome}" required>
                            </div>
                            <div class="br-input">
                                <label for="email">Email</label>
                                <input name="email" type="email" value="${email}">
                            </div>
                            <div class="br-input">
                                <label for="ativo">Ativo</label>
                                <select name="ativo">
                                    <option value="true" ${
                                      ativo ? "selected" : ""
                                    }>Sim</option>
                                    <option value="false" ${
                                      !ativo ? "selected" : ""
                                    }>Não</option>
                                </select>
                            </div>
                        </div>
                        <div class="br-modal-footer">
                            <button class="br-button secondary" type="button" onclick="this.closest('.br-modal').remove()">Cancelar</button>
                            <button class="br-button primary" type="submit">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
  },

  adminModalNovoUsuario() {
    const container = document.getElementById("modais-usuarios");
    if (!container) return;

    // Evita múltiplos modais empilhados
    container.innerHTML = "";

    const modal = document.createElement("div");
    modal.className = "br-modal active";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Novo Usuário");

    modal.innerHTML = `
            <div class="br-modal-dialog" role="document">
                <div class="br-modal-content">
                    <div class="br-modal-header">
                        <h2 class="br-modal-title">Novo Usuário</h2>
                        <button class="br-button circle small" onclick="this.closest('.br-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form method="post" action="/admin/usuarios/criar">
                        <div class="br-modal-body">
                            <div class="br-input">
                                <label>Nome</label>
                                <input name="nome" type="text" required>
                            </div>
                            <div class="br-input">
                                <label>CPF</label>
                                <input name="cpf" type="text" required>
                            </div>
                            <div class="br-input">
                                <label>Email</label>
                                <input name="email" type="email">
                            </div>
                            <div class="br-input">
                                <label>Usuário</label>
                                <input name="usuario" type="text" required>
                            </div>
                            <div class="br-input">
                                <label>Senha</label>
                                <input name="senha" type="password">
                            </div>
                            <div class="br-input">
                                <label>Ativo</label>
                                <select name="ativo">
                                    <option value="true" selected>Sim</option>
                                    <option value="false">Não</option>
                                </select>
                            </div>
                        </div>
                        <div class="br-modal-footer">
                            <button class="br-button secondary" type="button" onclick="this.closest('.br-modal').remove()">Cancelar</button>
                            <button class="br-button primary" type="submit">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

    container.appendChild(modal);
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // KPIS
  //////////////////////////////////////////////////////////////////////////////////////////////////////////

  barChart({
    chartId,
    dataUrl,
    xAxisData,
    dataFields,
    title = "",
    subtitle = "",
    colors = [],
    labelOptions = null, // Optional input
  }) {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
      console.error(`Element with id '${chartId}' not found.`);
      return;
    }

    const chart = echarts.init(chartElement);

    fetch(dataUrl)
      .then((res) => res.json())
      .then((data) => {
        const seriesData = dataFields.map((field, index) => ({
          name: xAxisData[index],
          value: data[field],
          itemStyle: colors[index] ? { color: colors[index] } : undefined,
          label: labelOptions ? labelOptions : undefined,
        }));

        const option = {
          title: {
            text: title,
            subtext: subtitle,
            left: "center",
          },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
          },
          xAxis: {
            type: "category",
            data: xAxisData,
          },
          yAxis: {
            type: "value",
          },
          series: [
            {
              type: "bar",
              data: seriesData,
              label: labelOptions || undefined,
            },
          ],
        };

        chart.setOption(option);
      })
      .catch((err) => console.error("Error fetching chart data:", err));
  },

  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  // RODA
  //////////////////////////////////////////////////////////////////////////////////////////////////////////
};

window.App = App;

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
