import getEcharts from "../util/echarts.js";
import Card from "../kpi/card.js";
import DashboardEvents from "./dashboard-events.js";
import financialBars from "./financial-bars.js";

export default {
  // Filter management using the new filter module
  addDashboardFilter(
    filterKey,
    filterValue,
    displayText,
    filterType = "status"
  ) {
    if (window.App && window.App.filter) {
      window.App.filter.filter_addFilter(
        filterKey,
        filterValue,
        displayText,
        filterType
      );
    }
  },

  removeDashboardFilter(filterKey, filterValue) {
    if (window.App && window.App.filter) {
      window.App.filter.filter_removeFilter(filterKey, filterValue);
    }
  },

  clearAllDashboardFilters() {
    if (window.App && window.App.filter) {
      window.App.filter.filter_clearAllFilters();
    }
  },

  getDashboardFilters() {
    if (window.App && window.App.filter) {
      return window.App.filter.filter_getCurrentFilters();
    }
    return {};
  },

  // Helper method to convert filters to API parameters
  getApiFiltersFromFilterSystem() {
    const apiParams = {};

    if (window.App && window.App.filter) {
      const currentFilters = window.App.filter.filter_getCurrentFilters();

      // Convert each filter type to API parameters
      Object.keys(currentFilters).forEach((filterKey) => {
        const filterValues = currentFilters[filterKey].map((f) => f.value);
        if (filterValues.length > 0) {
          apiParams[`${filterKey}_filters`] = filterValues.join(",");
        }
      });
    }

    return apiParams;
  },

  // Legacy compatibility function - redirects to new filter system
  renderActiveFilters() {
    // This function is now handled by the filter module
    console.warn(
      "renderActiveFilters is deprecated. Use the filter module instead."
    );
  },

  // Legacy compatibility function - redirects to new filter system
  removeActiveFilter(filtro) {
    // Convert old filter format to new format
    const filterNames = {
      vigentes: "Vigentes",
      finalizados: "Finalizados",
      criticos: "Críticos",
      "120dias": "120 dias",
      "90dias": "90 dias",
      "45dias": "45 dias",
      outros: "Outros",
      todos: "Todos",
      mais120: "Mais de 120 dias",
      pf: "Pessoa Física",
      pj: "Pessoa Jurídica",
    };

    const displayText = filterNames[filtro] || filtro;
    this.removeDashboardFilter("status", filtro);
  },
  // State management for the table
  tableState: {
    currentPage: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
    filters: {
      favoritos: false,
      uasgs: [],
      tipo: [],
    },
    sort: "numero",
  },

  // Modal popup functionality
  dashboardModalPopup() {
    const modal = document.getElementById("dashboard-modal");
    if (!modal) return;

    modal.style.display = "block";

    const closeButton = modal.querySelector(".close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    // Add click outside listener to close modal
    document.addEventListener("click", (event) => {
      if (modal.contains(event.target)) return;
      modal.style.display = "none";
    });
  },

  // Dashboard filter options
  dashboardGridFiltroOpcoes() {
    const menu = document.getElementById("filtro-opcoes-menu");
    if (menu) {
      if (menu.style.display === "none" || menu.style.display === "") {
        menu.style.display = "block";
        // Add click outside listener to close menu
        document.addEventListener("click", this.handleClickOutside);
      } else {
        menu.style.display = "none";
        // Remove click outside listener
        document.removeEventListener("click", this.handleClickOutside);
      }
    }
  },

  // Handle click outside filter menu
  handleClickOutside(event) {
    const menu = document.getElementById("filtro-opcoes-menu");
    const button = document.getElementById("btn-filtro-opcoes");
    const container = document.querySelector(".filter-menu-container");

    if (menu && !container.contains(event.target)) {
      menu.style.display = "none";
      document.removeEventListener("click", this.handleClickOutside);
    }
  },

  dashboardContratosCard() {
    const container = document.getElementById("dashboardContratosContent");
    if (!container) return;

    fetch("/dashboard/contratos")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data) => {
        container.innerHTML = this.renderDashboardCardContratosContent(data);
        // Setup event listeners after rendering
        setTimeout(() => {
          this.setupDashboardCardFilterClicks();
        }, 0);
      })
      .catch((err) => {
        container.innerHTML =
          '<div class="text-danger">Erro ao carregar dados</div>';
        console.error("Erro ao buscar contratos:", err);
      });
  },

  async dashboardContratosPorExercicioCard() {
    const container = document.getElementById(
      "card-contratos-exercicio-container"
    );
    if (!container) return;

    try {
      const res = await fetch("/dashboard/contratos-por-exercicio");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();

      const novoCard = Card.cardGrafico({
        id: "grafico-contratos-por-exercicio",
        titulo: "Contratos por exercício",
        subtitulo: "Histórico de contratos por ano",
        icone: "/static/images/doc2.png",
      });

      const wrapper = document.createElement("div");
      wrapper.innerHTML = novoCard.trim();
      const novoElemento = wrapper.firstChild;
      const parent = container.parentElement;
      if (parent) parent.replaceChild(novoElemento, container);

      const chartDom = document.getElementById(
        "grafico-contratos-por-exercicio"
      );
      if (!chartDom) return;

      const echarts = await getEcharts();
      const chart = echarts.init(chartDom);
      chart.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
          },
          formatter: (p) =>
            `${p[0].axisValue}<br/><strong>${p[0].data} Contratos</strong>`,
        },
        grid: { right: 20 },
        xAxis: {
          type: "category",
          data: data.anos,
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
            data: data.valores,
            itemStyle: { color: "#8f9dd2" },
            barMaxWidth: 20,
          },
        ],
      });

      chart.off && chart.off("click");
      chart.on("click", (params) => {
        if (params.componentType === "series" && params.seriesType === "bar") {
          const filter = params.name;
          // Use the new filter system for year filters
          if (window.App && window.App.filter) {
            window.App.filter.filter_toggleFilter(
              "ano",
              filter,
              `Ano ${filter}`,
              "date"
            );
          }
        }
      });
    } catch (err) {
      console.error("Erro ao carregar gráfico:", err);
    }
  },

  async dashboardRepresentacaoAnualValores() {
    const container = document.getElementById(
      "card-representacao-anual-valores"
    );
    if (!container) return;

    try {
      const res = await fetch("/dashboard/valores-por-exercicio");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();

      const novoCard = Card.cardGrafico({
        id: "grafico-representacao-anual-valores",
        titulo: "Valores por exercício",
        subtitulo: "Valores de contratos nos últimos 6 anos",
        icone: "/static/images/clock.png",
      });

      const wrapper = document.createElement("div");
      wrapper.innerHTML = novoCard.trim();
      const novoElemento = wrapper.firstChild;
      const parent = container.parentElement;
      if (parent) parent.replaceChild(novoElemento, container);

      const chartDom = document.getElementById(
        "grafico-representacao-anual-valores"
      );
      if (!chartDom) return;

      const echarts = await getEcharts();
      const chart = echarts.init(chartDom);
      chart.setOption({
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: "#084a8a",
          textStyle: {
            color: "#ffffff",
          },
          formatter: (p) =>
            `${
              p[0].axisValue
            }<br/><strong>R$ ${p[0].data.toLocaleString()}</strong>`,
        },
        grid: { right: 20 },
        xAxis: {
          type: "category",
          data: data.anos,
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
            itemStyle: { color: "#bbc6ea" },
            barMaxWidth: 20,
          },
          {
            name: "Aditivos",
            type: "line",
            data: data.linha,
            smooth: true,
            lineStyle: { width: 3, color: "#8f9dd2" },
            symbol: "circle",
            symbolSize: 10,
            itemStyle: {
              borderWidth: 2,
              borderColor: "#fff",
              color: "#bbc6ea",
            },
          },
        ],
      });
    } catch (err) {
      console.error("Erro ao carregar gráfico de valores:", err);
    }
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
            const diasExibir =
              atividade.dias_restantes < 45
                ? 45
                : atividade.dias_restantes > 90
                ? 120
                : 90;
            const dia = atividade.dias_restantes === 1 ? "dia" : "dias";

            return `
                <div class="widget-atividades-item" style="display:flex; align-items:flex-start;">
                    <img src="/static/images/clock-icon.png" alt="clock" style="width:18px;height:18px;vertical-align:top; margin:-2px 8px 0px 0px;">
                    <div>
                        <div>
                        <a href="#">${atividade.data}</a>
                        <span>em ${atividade.dias_restantes} ${dia}</span>
                        </div>
                        <div style="margin-top:-4px;font-size:10px;">
                        Renovação de <b>${diasExibir} dias</b> para o contrato <b>${atividade.numero}</b>
                        </div>
                    </div>
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
          </div>`;
      })
      .catch((err) => {
        console.error("Erro ao carregar próximas atividades:", err);
        container.innerHTML =
          '<div class="text-danger">Erro ao carregar atividades</div>';
      });
  },

  // New function to render only the card content without the outer structure
  renderDashboardCardContratosContent({
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
    // Helper to check if filter is active using new filter system
    const isActive = (filter) => {
      if (window.App && window.App.filter) {
        return window.App.filter.filter_hasFilter("status", filter)
          ? "active"
          : "";
      }
      return "";
    };

    // Content HTML with clickable/filterable fields
    const contentHTML = `
      <div class="card-content">
        <div class="valor-principal">${quantidade_total} <font style="font-size:14px;">Contratos</font></div>
        <div class="linha">
          <div class="dashboard-card-filter clickable ${isActive(
            "vigentes"
          )}" data-filter="vigentes" tabindex="0"><div>Vigentes</div><div class="valor-azul">${vigentes}</div></div>
          <div class="divider"></div>
          <div class="dashboard-card-filter clickable ${isActive(
            "finalizados"
          )}" data-filter="finalizados" tabindex="0"><div>Finalizados</div><div class="valor-azul">${finalizados}</div></div>
          <div class="divider"></div>
          <div class="dashboard-card-filter clickable ${isActive(
            "criticos"
          )}" data-filter="criticos" tabindex="0"><div>Críticos</div><div class="valor-vermelho">${criticos}</div></div>
        </div>
        <div class="linha" style="gap: 8px;">
          <div class="dashboard-card-filter clickable ${isActive(
            "120dias"
          )}" data-filter="120dias" tabindex="0"><div>120 dias</div><div class="valor-vermelho">${dias120}</div></div>
          <div class="divider"></div>
          <div class="dashboard-card-filter clickable ${isActive(
            "90dias"
          )}" data-filter="90dias" tabindex="0"><div>90 dias</div><div class="valor-vermelho">${dias90}</div></div>
          <div class="divider"></div>
          <div class="dashboard-card-filter clickable ${isActive(
            "45dias"
          )}" data-filter="45dias" tabindex="0"><div>45 dias</div><div class="valor-vermelho">${dias45}</div></div>
          <div class="divider"></div>
          <div class="dashboard-card-filter clickable ${isActive(
            "outros"
          )}" data-filter="outros" tabindex="0"><div>Outros</div><div class="valor-azul">${outros}</div></div>
        </div>
      </div>
    `;

    return contentHTML;
  },

  // Add event listeners to dashboard card filter fields
  setupDashboardCardFilterClicks() {
    document
      .querySelectorAll(".dashboard-card-filter.clickable")
      .forEach((el) => {
        // Remove listeners para evitar múltiplos handlers
        el.replaceWith(el.cloneNode(true));
      });
    // Re-seleciona após replaceWith
    document
      .querySelectorAll(".dashboard-card-filter.clickable")
      .forEach((el) => {
        el.addEventListener("click", (e) => {
          const filter = el.getAttribute("data-filter");
          this.toggleDashboardCardFilter(filter, el);
        });
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            const filter = el.getAttribute("data-filter");
            this.toggleDashboardCardFilter(filter, el);
          }
        });
      });
  },

  // Toggle filter in new filter system
  toggleDashboardCardFilter(filter, el) {
    const filterNames = {
      vigentes: "Vigentes",
      finalizados: "Finalizados",
      criticos: "Críticos",
      "120dias": "120 dias",
      "90dias": "90 dias",
      "45dias": "45 dias",
      outros: "Outros",
      todos: "Todos",
      mais120: "Mais de 120 dias",
      pf: "Pessoa Física",
      pj: "Pessoa Jurídica",
    };

    const displayText = filterNames[filter] || filter;

    // Use the new filter system
    if (window.App && window.App.filter) {
      window.App.filter.filter_toggleFilter(
        "status",
        filter,
        displayText,
        "status"
      );
    }
  },

  // Reload all dashboard cards, grids, and charts using the new filters
  updateDashboardFilters() {
    this.loadContractsTable();
    this.dashboardContratosPorExercicioCard();
    this.dashboardRepresentacaoAnualValores();
    this.dashboardProximasAtividades();
  },

  // Contract vigencia gauge functionality
  async initVigenciaGauges() {
    console.log("=== INITIALIZING VIGENCIA GAUGES ===");

    const gaugeContainers = document.querySelectorAll(
      ".vigencia-gauge-container"
    );
    console.log("Found gauge containers:", gaugeContainers.length);

    for (const container of gaugeContainers) {
      await this.createVigenciaGauge(container);
    }
  },

  async createVigenciaGauge(container) {
    try {
      const contractId = container.getAttribute("data-contract-id");
      const startDate = container.getAttribute("data-start-date");
      const endDate = container.getAttribute("data-end-date");

      if (!startDate || !endDate) {
        console.warn(`Missing date attributes for contract ${contractId}`);
        return;
      }

      const echarts = await getEcharts();
      const chart = echarts.init(container);

      const vigenciaData = this.calculateVigenciaData(startDate, endDate);
      const option = this.getVigenciaGaugeOption(vigenciaData);

      chart.setOption(option);

      // Make responsive
      window.addEventListener("resize", () => {
        chart.resize();
      });

      console.log(
        `✅ Vigencia gauge created for contract ${contractId}:`,
        vigenciaData
      );
    } catch (error) {
      console.error("Error creating vigencia gauge:", error);
    }
  },

  calculateVigenciaData(startDateStr, endDateStr) {
    const today = new Date();
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    const elapsedDays = totalDays - remainingDays;

    // Calculate percentage based on contract phases
    let percentage;
    if (remainingDays > 120) {
      // Green zone: from start to 120 days left (0% to 70%)
      const greenPhaseDays = totalDays - 120;
      const elapsedInGreen = Math.min(elapsedDays, greenPhaseDays);
      percentage = (elapsedInGreen / greenPhaseDays) * 0.7;
    } else if (remainingDays > 90) {
      // Yellow zone: 120 to 90 days left (70% to 80%)
      const yellowPhaseProgress = (120 - remainingDays) / 30; // 30 days in yellow phase
      percentage = 0.7 + yellowPhaseProgress * 0.1;
    } else if (remainingDays > 45) {
      // Orange zone: 90 to 45 days left (80% to 90%)
      const orangePhaseProgress = (90 - remainingDays) / 45; // 45 days in orange phase
      percentage = 0.8 + orangePhaseProgress * 0.1;
    } else {
      // Red zone: 45 to 0 days left (90% to 100%)
      const redPhaseProgress = (45 - remainingDays) / 45; // 45 days in red phase
      percentage = 0.9 + redPhaseProgress * 0.1;
    }

    // Ensure percentage is within bounds
    percentage = Math.max(0, Math.min(1, percentage));

    return {
      totalDays: Math.max(totalDays, 1),
      remainingDays: Math.max(remainingDays, 0),
      elapsedDays: Math.max(elapsedDays, 0),
      percentage,
      startDate,
      endDate,
      status: this.getContractStatus(remainingDays, percentage),
    };
  },

  getContractStatus(remainingDays, percentage) {
    if (remainingDays <= 0)
      return { level: "expired", label: "Expirado", color: "#E52207" };
    if (remainingDays <= 45)
      return { level: "critical", label: "dias restantes", color: "#E52207" };
    if (remainingDays <= 90)
      return { level: "warning", label: "dias restantes", color: "#EF5E25" };
    if (remainingDays <= 120)
      return { level: "caution", label: "dias restantes", color: "#FFCD07" };
    return { level: "good", label: "dias restantes", color: "#168821" };
  },

  getVigenciaGaugeOption(data) {
    const { percentage, remainingDays, totalDays, startDate, endDate, status } =
      data;

    const currentValue = Math.round(percentage * 100);

    // Format dates for display
    const formatDate = (date) => {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    };

    // Check if contract is finished (expired)
    if (remainingDays <= 0) {
      return {
        // Remove all margins and padding
        grid: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          containLabel: false,
        },
        tooltip: {
          show: false,
        },
        graphic: [
          // Dot at 0 position (start date) - grey for finished
          {
            type: "circle",
            left: "25%",
            top: "75%",
            shape: {
              r: 4,
            },
            style: {
              fill: "#999999",
              stroke: "#fff",
              lineWidth: 2,
            },
          },
          // Dot at 100 position (end date) - grey for finished
          {
            type: "circle",
            right: "25%",
            top: "75%",
            shape: {
              r: 4,
            },
            style: {
              fill: "#999999",
              stroke: "#fff",
              lineWidth: 2,
            },
          },
          // Start date label - grey for finished
          {
            type: "text",
            left: "5%",
            bottom: "5%",
            style: {
              text: formatDate(startDate),
              fontSize: 12,
              fontWeight: "bold",
              fill: "#999999",
              textAlign: "center",
            },
          },
          // End date label - grey for finished
          {
            type: "text",
            right: "5%",
            bottom: "5%",
            style: {
              text: formatDate(endDate),
              fontSize: 12,
              fontWeight: "bold",
              fill: "#999999",
              textAlign: "center",
            },
          },
        ],
        series: [
          {
            name: "Vigência",
            type: "gauge",
            center: ["50%", "50%"],
            radius: "100%",
            progress: {
              show: false,
            },
            axisLine: {
              lineStyle: {
                width: 13,
                color: [
                  [1, "#999999"], // All grey for finished contract
                ],
              },
            },
            axisLabel: {
              show: false,
            },
            pointer: {
              itemStyle: {
                color: "#666666", // Grey pointer
              },
            },
            title: {
              offsetCenter: [0, "60%"],
              fontSize: 11,
            },
            detail: {
              show: false, // Hide the detail/counter for finished contracts
            },
            data: [
              {
                value: 100, // Point to the end
                name: "Finalizado",
              },
            ],
          },
        ],
      };
    }

    return {
      // Remove all margins and padding
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        containLabel: false,
      },
      tooltip: {
        backgroundColor: "#084a8a",
        textStyle: {
          color: "#ffffff",
        },
        formatter: "{a} <br/>{b} : {c}%",
      },
      graphic: [
        // Dot at 0 position (start date)
        {
          type: "circle",
          left: "25%",
          top: "75%",
          shape: {
            r: 4,
          },
          style: {
            fill: "#168821",
            stroke: "#fff",
            lineWidth: 2,
          },
        },
        // Dot at 100 position (end date)
        {
          type: "circle",
          right: "25%",
          top: "75%",
          shape: {
            r: 4,
          },
          style: {
            fill: "#B50909",
            stroke: "#fff",
            lineWidth: 2,
          },
        },
        // Start date label
        {
          type: "text",
          left: "5%",
          bottom: "0%",
          style: {
            text: formatDate(startDate),
            fontSize: 12,
            fontWeight: "bold",
            fill: "#333",
            textAlign: "center",
          },
        },
        // End date label
        {
          type: "text",
          right: "5%",
          bottom: "0%",
          style: {
            text: formatDate(endDate),
            fontSize: 12,
            fontWeight: "bold",
            fill: "#333",
            textAlign: "center",
          },
        },
      ],
      series: [
        {
          name: "Vigência",
          type: "gauge",
          center: ["50%", "50%"],
          radius: "100%",
          progress: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              width: 13,
              color: [
                [0.7, "#b0cdac"], // 0 to 70 - Green
                [0.8, "#fcec8f"], // 70 to 80 - Yellow
                [0.9, "#f5c289"], // 80 to 90 - Orange
                [1, "#ec7975"], // 90 to 100 - Red
              ],
            },
          },
          axisLabel: {
            show: false,
          },
          pointer: {
            itemStyle: {
              color: "#000000",
            },
          },
          title: {
            offsetCenter: [0, "68%"],
            fontSize: 9,
          },
          detail: {
            valueAnimation: true,
            fontSize: 16,
            formatter: function (value) {
              return remainingDays;
            },
            offsetCenter: [0, "53%"],
          },
          data: [
            {
              value: currentValue,
              name: status.label,
            },
          ],
        },
      ],
    };
  },

  // Initialize dashboard - called from DOMContentLoaded
  initDashboard() {
    // Initialize the new filter system (filters are now managed by the filter module)
    console.log("Initializing dashboard...");
    this.loadContractsTable();
    this.setupTableEventListeners();
    DashboardEvents.initialize();
    this.initCards();
  },

  // Initialize all dashboard cards
  initCards() {
    this.initDashboardCardHeaders();
    this.dashboardContratosCard();
    this.dashboardContratosPorExercicioCard();
    this.dashboardRepresentacaoAnualValores();
    this.dashboardProximasAtividades();
  },

  // Initialize dashboard card headers
  initDashboardCardHeaders() {
    console.log("🔧 Inicializando card headers do dashboard...");

    // Verifica se o módulo card header está disponível
    if (
      typeof App !== "undefined" &&
      App.card_header &&
      App.card_header.card_header_createDynamic
    ) {
      console.log("✅ Módulo card_header disponível, criando headers...");

      // Card 1 - Contratos e Renovações
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos e Renovações",
          subtitle: "Visão geral dos contratos e seu status atual",
          icon: "fas fa-file-contract",
          actions: [], // No buttons for cleaner layout
        },
        "dashboard-contratos-header"
      );
    } else {
      console.warn("⚠️ Módulo card_header não disponível");
    }
  },

  // Setup event listeners for table interactions
  setupTableEventListeners() {
    // Filtro de texto do input pesquisa-contratos
    const searchInput = document.getElementById("pesquisa-contratos");
    if (searchInput) {
      let lastSearch = "";
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const value = e.target.value.trim();

          // Use the new filter system for search
          if (window.App && window.App.filter) {
            // Remove the previous search filter if it exists
            if (lastSearch) {
              window.App.filter.filter_removeFilter("search", lastSearch);
            }
            // Add the new search filter if not empty
            if (value) {
              window.App.filter.filter_addFilter(
                "search",
                value,
                `Busca: "${value}"`,
                "default"
              );
            }
            lastSearch = value;
          }
        }
      });
    }

    // Filter checkboxes
    this.setupFilterListeners();

    // Sort radio buttons
    this.setupSortListeners();

    // Page size selection
    this.setupPageSizeListeners();
  },

  // Setup filter event listeners
  setupFilterListeners() {
    // Favoritos filter
    const favoritosCheck = document.getElementById("check-favoritos");
    if (favoritosCheck) {
      favoritosCheck.addEventListener("change", (e) => {
        this.tableState.filters.favoritos = e.target.checked;
        this.tableState.currentPage = 1;
        this.loadContractsTable();
      });
    }

    // Contract type filters
    const typeFilters = {
      "check-todos": "todos",
      "check-vigentes": "vigentes",
      "check-finalizados": "finalizados",
      "check-criticos": "criticos",
      "check-45dias": "45dias",
      "check-90dias": "90dias",
      "check-120dias": "120dias",
      "check-mais120": "mais120",
      "check-pf": "pf",
      "check-pj": "pj",
    };

    Object.entries(typeFilters).forEach(([checkId, filterType]) => {
      const checkbox = document.getElementById(checkId);
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            if (!this.tableState.filters.tipo.includes(filterType)) {
              this.tableState.filters.tipo.push(filterType);
            }
          } else {
            this.tableState.filters.tipo = this.tableState.filters.tipo.filter(
              (t) => t !== filterType
            );
          }
          this.tableState.currentPage = 1;
          this.loadContractsTable();
        });
      }
    });
  },

  // Setup sort event listeners
  setupSortListeners() {
    const sortOptions = {
      "radio-numero": "numero",
      "radio-vigencia": "vigencia",
      "radio-valor": "valor",
    };

    Object.entries(sortOptions).forEach(([radioId, sortType]) => {
      const radio = document.getElementById(radioId);
      if (radio) {
        radio.addEventListener("change", (e) => {
          if (e.target.checked) {
            this.tableState.sort = sortType;
            this.tableState.currentPage = 1;
            this.loadContractsTable();
          }
        });
      }
    });
  },

  // Setup page size listeners
  setupPageSizeListeners() {
    // Page size options are handled by onclick in HTML
    console.log("Page size listeners ready");
  },

  // Load contracts table data
  async loadContractsTable() {
    try {
      console.log("Loading contracts table...", this.tableState);

      // Show loading state
      this.showTableLoading();

      // Build query parameters
      const params = new URLSearchParams({
        page: this.tableState.currentPage,
        limit: this.tableState.limit,
      });

      // Add sort parameter
      if (this.tableState.sort) {
        let sortCriteria = [];
        switch (this.tableState.sort) {
          case "numero":
            sortCriteria = [["numero", "ASC"]];
            break;
          case "vigencia":
            sortCriteria = [["vigencia_fim", "DESC"]];
            break;
          case "valor":
            sortCriteria = [["valor", "DESC"]];
            break;
          default:
            sortCriteria = [["numero", "ASC"]];
        }
        params.append("sort", JSON.stringify(sortCriteria));
      }

      // Add filters from tableState (legacy filters)
      if (this.tableState.filters.favoritos) {
        params.append("favoritos", "true");
      }

      if (this.tableState.filters.tipo.length > 0) {
        params.append("tipo", this.tableState.filters.tipo.join(","));
      }

      if (this.tableState.search) {
        params.append("search", this.tableState.search);
      }

      // Add filters from new filter system
      if (window.App && window.App.filter) {
        const currentFilters = window.App.filter.filter_getCurrentFilters();

        // Add status filters
        if (currentFilters.status && currentFilters.status.length > 0) {
          const statusValues = currentFilters.status.map((f) => f.value);
          params.append("status_filters", statusValues.join(","));
        }

        // Add search filters
        if (currentFilters.search && currentFilters.search.length > 0) {
          const searchValues = currentFilters.search.map((f) => f.value);
          params.append("search_filters", searchValues.join(","));
        }

        // Add year filters
        if (currentFilters.ano && currentFilters.ano.length > 0) {
          const yearValues = currentFilters.ano.map((f) => f.value);
          params.append("year_filters", yearValues.join(","));
        }

        // Add processo filters
        if (currentFilters.processo && currentFilters.processo.length > 0) {
          const processoValues = currentFilters.processo.map((f) => f.value);
          params.append("processo_filters", processoValues.join(","));
        }

        // Add UASG filters
        if (currentFilters.uasg && currentFilters.uasg.length > 0) {
          const uasgValues = currentFilters.uasg.map((f) => f.value);
          params.append("uasg_filters", uasgValues.join(","));
        }
      }

      // Fetch data
      const response = await fetch(`/dashboard/contratos-lista?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received contracts data:", data);

      // Update table state
      this.tableState.totalItems = data.total;
      this.tableState.totalPages = data.pages;

      // Render table
      this.renderContractsTable(data.data);
      this.updatePaginationInfo();

      // Initialize visual elements after render
      setTimeout(() => {
        this.initVigenciaGauges();
        financialBars.initialize();
      }, 100);
    } catch (error) {
      console.error("Error loading contracts table:", error);
      this.showTableError();
    }
  },

  // Show loading state in table
  showTableLoading() {
    const tbody = document.querySelector("table.br-table tbody");
    const gridLoading = document.getElementById("grid-loading");

    if (tbody) {
      // Clear table content
      tbody.innerHTML = "";
    }

    if (gridLoading) {
      gridLoading.style.display = "block";
    }
  },

  // Hide loading overlay
  hideTableLoading() {
    const gridLoading = document.getElementById("grid-loading");
    if (gridLoading) {
      gridLoading.style.display = "none";
    }
  },

  // Show error state in table
  showTableError() {
    const tbody = document.querySelector("table.br-table tbody");
    if (tbody) {
      // Remove loading overlay first
      this.hideTableLoading();

      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger" style="padding: 40px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
            <div>Erro ao carregar contratos</div>
            <button class="br-button small" onclick="App.loadContractsTable()" style="margin-top: 10px;">
              <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
          </td>
        </tr>
      `;
    }
  },

  // Render contracts table rows
  renderContractsTable(contracts) {
    const tbody = document.querySelector("table.br-table tbody");
    if (!tbody) return;

    // Remove loading overlay first
    this.hideTableLoading();

    if (contracts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding: 40px;">
            <div style="color: #666;">Nenhum contrato encontrado</div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = contracts
      .map((contract) => this.renderContractRow(contract))
      .join("");
    tbody.innerHTML = rows;

    // Adiciona funcionalidade de filtro visual para número do processo
    setTimeout(() => {
      document.querySelectorAll(".processo-filter").forEach((el) => {
        el.replaceWith(el.cloneNode(true));
      });
      document.querySelectorAll(".processo-filter").forEach((el) => {
        el.addEventListener("click", (e) => {
          const processo = el.getAttribute("data-processo");
          if (!processo) return;

          // Use the new filter system for processo filters
          if (window.App && window.App.filter) {
            window.App.filter.filter_toggleFilter(
              "processo",
              processo,
              `Processo: ${processo}`,
              "category"
            );
          }
        });
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            const processo = el.getAttribute("data-processo");
            if (!processo) return;

            // Use the new filter system for processo filters
            if (window.App && window.App.filter) {
              window.App.filter.filter_toggleFilter(
                "processo",
                processo,
                `Processo: ${processo}`,
                "category"
              );
            }
          }
        });
      });
    }, 0);
  },

  // Render a single contract row
  renderContractRow(contract) {
    const formatCurrency = (value) => {
      if (!value) return "R$ 0,00";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const formatDate = (dateString) => {
      if (!dateString || dateString === null || dateString === undefined) {
        return "N/A";
      }

      // Try to create a date object
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Data Inválida";
      }

      // Check if it's a reasonable date (not too far in past/future)
      const currentYear = new Date().getFullYear();
      const dateYear = date.getFullYear();

      if (dateYear < 1900 || dateYear > currentYear + 50) {
        return "Data Inválida";
      }

      try {
        return date.toLocaleDateString("pt-BR");
      } catch (error) {
        return "Data Inválida";
      }
    };

    return `
      <tr>
        <td style="padding: 8px 8px !important;" valign="top">
          <div style="display: flex; gap: 8px; font-family: Arial, sans-serif;">
          <div class="icon-circle" 
            data-tooltip-text="${contract.naturezadespesa_id} - ${
      contract.naturezadespesa_descricao || "N/A"
    }"
            data-tooltip-place="bottom"
            data-tooltip-type="info"
            style="opacity: 0.7; transform: scale(0.8);">  
          <i class="${
            contract.fontawesome_icon
          }" alt="contracto" style="font-size: 34px; color: #bbc6ea; opacity: 0.7;"></i>
          </div>  
            <div style="flex: 1;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 5px;">
                <img src="static/images/ico/ico-fornecedor.png" style="width: 20px; height: 20px;" />
                <div style="padding-left: 6px;">
                  <span style="color: #929ab5; font-size: 14px; text-transform: uppercase;" data-tooltip-text="Fornecedor do contrato" data-tooltip-place="bottom" data-tooltip-type="info"><b>${
                    contract.fornecedor_nome || "N/A"
                  }</b></span><br />
                  <span style="color: #666; cursor: pointer;" onclick="detalhesFornecedor('${
                    contract.fornecedor_id || ""
                  }');" data-tooltip-text="Fornecedor do contrato" data-tooltip-place="bottom" data-tooltip-type="info">${
      contract.fornecedor_cnpj || "N/A"
    }</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 2px; flex-wrap: nowrap; white-space: nowrap; margin-top: -10px !important;">
                <img src="${this.getContratoInfo(contract.tipo_id).icon}" 
                data-tooltip-text="${
                  this.getContratoInfo(contract.tipo_id).name
                }"
                data-tooltip-place="bottom"
                data-tooltip-type="info"
                style="height: 20px;" />

                <span style="font-size: 16px; color: #FF9933; white-space: nowrap;" 
                data-tooltip-text="Número do contrato"
                data-tooltip-place="bottom"
                data-tooltip-type="info">${
                  contract.numero
                } <span style="color: #000">/</span> ${contract.ano}</span>

                <img src="static/images/ico/heart_${
                  contract.favorite_icon
                }.png" style="cursor: pointer; margin-left: 20px;"  alt="Favorito" 
                  data-tooltip-text="${contract.favorite_title}"
                  data-tooltip-place="bottom"
                  data-tooltip-type="info"
                  onclick="App.toggleFavorite(${contract.id}, this)" />
                <img data-contract-id="${
                  contract.id
                }" class="encontro-action" src="static/images/ico/bank.png" style="cursor: pointer; margin-left: 2px;" 
                  data-tooltip-text="Encontro de Contas"
                  data-tooltip-place="bottom"
                  data-tooltip-type="info" />

    <div class="aditivo-action" style="position: relative; display: inline-block; padding-top: 5px; margin-left: -6px;" 
      data-contract-id="${contract.id}"
      data-contract-numero="${contract.numero}"
      data-contract-ano="${contract.ano}"
      data-contract-aditivos-count="${contract.aditivos_count || 0}">
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style="opacity: 0.7;"
  >
    <path
      d="M13.1459 11.0499L12.9716 9.05752L15.3462 8.84977C14.4471 7.98322 13.2242 7.4503 11.8769 7.4503C9.11547 7.4503 6.87689 9.68888 6.87689 12.4503C6.87689 15.2117 9.11547 17.4503 11.8769 17.4503C13.6977 17.4503 15.2911 16.4771 16.1654 15.0224L18.1682 15.5231C17.0301 17.8487 14.6405 19.4503 11.8769 19.4503C8.0109 19.4503 4.87689 16.3163 4.87689 12.4503C4.87689 8.58431 8.0109 5.4503 11.8769 5.4503C13.8233 5.4503 15.5842 6.24474 16.853 7.52706L16.6078 4.72412L18.6002 4.5498L19.1231 10.527L13.1459 11.0499Z"
      fill="#ccc"
    />
  </svg>
  <div style="cursor: pointer;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    color: #666;
    padding-top: 2px;
    font-size: 11px;" 
    data-tooltip-text="Termos aditivos"
    data-tooltip-place="bottom"
    data-tooltip-type="info"
    >
    ${contract.aditivos_count || 0}
  </div>
</div>            
    <div style="position: relative; display: inline-block; padding-top: 5px; margin-left: -10px;">
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style="opacity: 0.7;"
  >
    <circle cx="12" cy="12" r="6" stroke="green" stroke-width="1.2" />
  </svg>
  <div style="cursor: pointer;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    color: #666;
    padding-top: 2px;
    font-size: 11px;" 
    data-tooltip-text="Restrições"
    data-tooltip-place="bottom"
    data-tooltip-type="info">0</div>
</div>
      <div style="position: relative; display: inline-block; padding-top: 5px; margin-left: -10px;">
  <svg
    width="30"
    height="30"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style="opacity: 0.7;"
  >
    <path
      d="M13.1459 11.0499L12.9716 9.05752L15.3462 8.84977C14.4471 7.98322 13.2242 7.4503 11.8769 7.4503C9.11547 7.4503 6.87689 9.68888 6.87689 12.4503C6.87689 15.2117 9.11547 17.4503 11.8769 17.4503C13.6977 17.4503 15.2911 16.4771 16.1654 15.0224L18.1682 15.5231C17.0301 17.8487 14.6405 19.4503 11.8769 19.4503C8.0109 19.4503 4.87689 16.3163 4.87689 12.4503C4.87689 8.58431 8.0109 5.4503 11.8769 5.4503C13.8233 5.4503 15.5842 6.24474 16.853 7.52706L16.6078 4.72412L18.6002 4.5498L19.1231 10.527L13.1459 11.0499Z"
      fill="#ccc"
    />
  </svg>
  <div style="cursor: pointer;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    color: #666;
    padding-top: 2px;
    font-size: 11px;" 
    data-tooltip-text="${this.formatContractStartInfo(
      contract.vigencia_inicio
    )}"
    data-tooltip-place="bottom"
    data-tooltip-type="info"
    >${this.getContractYearsDisplay(contract.vigencia_inicio)}</div>
</div>              

                <img src="static/images/ico/ico-processos.png" style="margin-left: 10px;" />

                <span 
                  class="processo-filter"
                  style="color: #666; cursor: pointer; margin-left: 2px;" 
                  tabindex="0"
                  data-processo="${contract.processo || ""}"
                  data-tooltip-text="Número do processo"
                  data-tooltip-place="bottom"
                  data-tooltip-type="info"
                >${contract.processo || "N/A"}</span>
              </div>

              
            </div>
          </div>
          <div class="capitalize capitalizeBig" style="margin-top: 5px; letter-spacing: 0.25px; text-align: justify; text-justify: inter-word; color: #666; text-transform: lowercase; font-size: 14px; line-height: 1.2;">
                <span style="font-size: 12px;">${
                  contract.objeto || "Objeto não informado"
                }</span>
              </div>
        </td>
        
        <td class="hide-mobile" valign="top">
          <div class="vigencia-gauge-container" 
               data-contract-id="${contract.numero}/${contract.ano}" 
               data-start-date="${contract.vigencia_inicio}" 
               data-end-date="${contract.vigencia_fim}"
               style="width: 150px; height: 150px; display: inline-block">
          </div>
        </td>
        <td class="hide-mobile" style="padding: 8px 0; border-bottom: 1px solid #ddd;">
          ${financialBars.createContractedBar(contract)}
        </td>
        <td class="hide-mobile" style="padding: 8px 0; border-bottom: 1px solid #ddd;">
          ${financialBars.createCommittedBar(contract)}
        </td>
        <td class="hide-mobile" style="padding: 8px 0; border-bottom: 1px solid #ddd;">
          ${financialBars.createPaidBar(contract)}
        </td>
        <td class="hide-mobile" valign="top" style="padding: 5px 8px; min-width: ${
          Array.isArray(contract.responsaveis) &&
          contract.responsaveis.length > 0
            ? "180px"
            : "120px"
        };">
          ${
            Array.isArray(contract.responsaveis) &&
            contract.responsaveis.length > 0
              ? contract.responsaveis
                  .map(
                    (resp) => `
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                        <i class=\"fas fa-user\" style=\"color: #003366; font-size: 16px; opacity: 0.85;\"></i>
                        <span style=\"font-size: 14px; color: #222; word-break: break-word;\">${resp}</span>
                      </div>
                    `
                  )
                  .join("")
              : `<div style=\"display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 48px;\">
                    <i class=\"fas fa-exclamation-triangle\" style=\"color: #e52207; font-size: 22px; margin-bottom: 4px;\"></i>
                    <span style=\"color: #888; font-size: 13px; text-align: center;\">Nenhuma designação atribuída para este contrato</span>
                 </div>`
          }
        </td>
      </tr>
    `;
  },

  // Calculate years elapsed since contract start
  calculateContractYears(vigenciaInicio) {
    if (!vigenciaInicio) return 0;

    const startDate = new Date(vigenciaInicio);
    const currentDate = new Date();

    let years = currentDate.getFullYear() - startDate.getFullYear();
    let months = currentDate.getMonth() - startDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    // If we're before the start day in the current month, subtract one month
    if (currentDate.getDate() < startDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    return { years, months, startDate };
  },

  // Format contract start info for tooltip
  formatContractStartInfo(vigenciaInicio) {
    if (!vigenciaInicio) return "Data de início não disponível";

    const { years, months, startDate } =
      this.calculateContractYears(vigenciaInicio);

    // Format start date in Portuguese
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const formattedStartDate = `${startDate
      .getDate()
      .toString()
      .padStart(2, "0")} de ${
      monthNames[startDate.getMonth()]
    } de ${startDate.getFullYear()}`;

    // Format elapsed time
    let elapsedTime = "";
    if (years > 0 && months > 0) {
      elapsedTime = `${years} ano${years > 1 ? "s" : ""} e ${months} mês${
        months > 1 ? "es" : ""
      }`;
    } else if (years > 0) {
      elapsedTime = `${years} ano${years > 1 ? "s" : ""}`;
    } else if (months > 0) {
      elapsedTime = `${months} mês${months > 1 ? "es" : ""}`;
    } else {
      elapsedTime = "Menos de 1 mês";
    }

    return `Início: ${formattedStartDate}\nTempo transcorrido: ${elapsedTime}`;
  },

  // Get the number of years for display
  getContractYearsDisplay(vigenciaInicio) {
    if (!vigenciaInicio) return "0";

    const { years } = this.calculateContractYears(vigenciaInicio);
    return years.toString();
  },

  // Update pagination information
  updatePaginationInfo() {
    // Update page input
    const pageInput = document.getElementById("pagina-atual");
    if (pageInput) {
      pageInput.value = this.tableState.currentPage;
      pageInput.max = this.tableState.totalPages;
    }

    // Update total pages display
    const totalPagesElement = document.querySelector("span strong");
    if (totalPagesElement) {
      totalPagesElement.textContent = this.tableState.totalPages;
    }

    // Update items display
    const start = (this.tableState.currentPage - 1) * this.tableState.limit + 1;
    const end = Math.min(
      this.tableState.currentPage * this.tableState.limit,
      this.tableState.totalItems
    );
    const itemsDisplay = document.querySelector(".text-muted.small");
    if (itemsDisplay) {
      itemsDisplay.textContent = `Exibindo ${start}–${end} de ${this.tableState.totalItems} contratos`;
    }
  },

  // Pagination functions
  irParaPrimeiraPagina() {
    if (this.tableState && this.tableState.currentPage > 1) {
      this.tableState.currentPage = 1;
      this.loadContractsTable();
    }
  },

  irParaAnterior() {
    if (this.tableState && this.tableState.currentPage > 1) {
      this.tableState.currentPage--;
      this.loadContractsTable();
    }
  },

  irParaProxima() {
    if (
      this.tableState &&
      this.tableState.currentPage < this.tableState.totalPages
    ) {
      this.tableState.currentPage++;
      this.loadContractsTable();
    }
  },

  irParaUltima() {
    if (
      this.tableState &&
      this.tableState.currentPage < this.tableState.totalPages
    ) {
      this.tableState.currentPage = this.tableState.totalPages;
      this.loadContractsTable();
    }
  },

  irParaPaginaEspecifica(page) {
    const pageNum = parseInt(page);
    if (
      pageNum >= 1 &&
      pageNum <= this.tableState.totalPages &&
      pageNum !== this.tableState.currentPage
    ) {
      this.tableState.currentPage = pageNum;
      this.loadContractsTable();
    }
  },

  atualizarTabelaContratos() {
    this.loadContractsTable();
  },

  // Set page size and reload table
  setPageSize(size) {
    this.tableState.limit = size;
    this.tableState.currentPage = 1;
    this.loadContractsTable();
  },

  // Get status color based on contract status
  getStatusColor(status) {
    switch (status) {
      case "vigente":
        return "#28a745";
      case "finalizado":
        return "#6c757d";
      case "critico":
        return "#dc3545";
      case "alerta":
        return "#ffc107";
      default:
        return "#17a2b8";
    }
  },

  // Get status text based on contract status
  getStatusText(status) {
    switch (status) {
      case "vigente":
        return "Vigente";
      case "finalizado":
        return "Finalizado";
      case "critico":
        return "Crítico";
      case "alerta":
        return "Alerta";
      default:
        return "Indefinido";
    }
  },

  // Helper functions for contract details display
  getContratoInfo(tipo_id) {
    // Unified function to get contract icon and name based on tipo_id
    const contratoTypes = {
      66: {
        icon: "static/images/ico/ico-termo-adesao.png",
        name: "Termo de Adesão",
      },
      175: {
        icon: "static/images/ico/ico-termo-compromisso.png",
        name: "Termo de Compromisso",
      },
      61: {
        icon: "static/images/ico/ico-credenciamento.png",
        name: "Credenciamento",
      },
      62: { icon: "static/images/ico/ico-comodato.png", name: "Comodato" },
      151: { icon: "static/images/ico/ico-empenho.png", name: "Empenho" },
      60: { icon: "static/images/ico/ico-contrato.png", name: "Contrato" },
      164: { icon: "static/images/ico/ico-outros.png", name: "Outros" },
      174: {
        icon: "static/images/ico/ico-act.png",
        name: "Acordo de Cooperação Técnica (ACT)",
      },
      67: { icon: "static/images/ico/ico-convenio.png", name: "Convênio" },
      64: { icon: "static/images/ico/ico-concessao.png", name: "Concessão" },
      173: {
        icon: "static/images/ico/ico-ted.png",
        name: "Termo de Execução Descentralizada (TED)",
      },
      311: {
        icon: "static/images/ico/ico-carta-contrato.png",
        name: "Carta Contrato",
      },
      63: {
        icon: "static/images/ico/ico-arrendamento.png",
        name: "Arrendamento",
      },
    };

    return (
      contratoTypes[tipo_id] || {
        icon: "static/images/ico/ico-default.png",
        name: "Tipo não identificado",
      }
    );
  },

  getContratoIcon(tipo_id) {
    return this.getContratoInfo(tipo_id).icon;
  },

  getCategoriaIcon(tipo_id) {
    return this.getContratoInfo(tipo_id).icon;
  },

  getContratoFase(status) {
    switch (status) {
      case "vigente":
        return "Em andamento";
      case "finalizado":
        return "Finalizado";
      case "critico":
        return "Crítico";
      case "alerta":
        return "Alerta";
      default:
        return "Indefinido";
    }
  },

  getRestricoesIcone(status) {
    switch (status) {
      case "critico":
        return "red";
      case "alerta":
        return "yellow";
      case "vigente":
        return "green";
      case "finalizado":
        return "gray";
      default:
        return "gray";
    }
  },

  getRestricoesCor(status) {
    switch (status) {
      case "critico":
        return "#dc3545";
      case "alerta":
        return "#ffc107";
      case "vigente":
        return "#28a745";
      case "finalizado":
        return "#6c757d";
      default:
        return "#6c757d";
    }
  },

  getRestricoesTexto(status) {
    switch (status) {
      case "critico":
        return "Alto";
      case "alerta":
        return "Médio";
      case "vigente":
        return "Baixo";
      case "finalizado":
        return "Nulo";
      default:
        return "N/A";
    }
  },

  getTempoContrato(diasRestantes) {
    if (diasRestantes > 120) {
      return `Mais de 120 dias para vencimento`;
    } else if (diasRestantes > 90) {
      return `${diasRestantes} dias para vencimento`;
    } else if (diasRestantes > 45) {
      return `${diasRestantes} dias para vencimento - Atenção`;
    } else if (diasRestantes > 0) {
      return `${diasRestantes} dias para vencimento - Crítico`;
    } else if (diasRestantes === 0) {
      return "Vence hoje";
    } else {
      return `Vencido há ${Math.abs(diasRestantes)} dias`;
    }
  },

  getTempoContratoIcone(diasRestantes) {
    if (diasRestantes > 120) {
      return "🟢";
    } else if (diasRestantes > 90) {
      return "🟡";
    } else if (diasRestantes > 45) {
      return "🟠";
    } else if (diasRestantes >= 0) {
      return "🔴";
    } else {
      return "⚫";
    }
  },

  escapeQuotes(str) {
    if (!str) return "";
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
  },

  // Toggle favorite status for a contract
  async toggleFavorite(contractId, imgElement) {
    try {
      // Show loading state
      const originalSrc = imgElement.src;
      imgElement.style.opacity = "0.5";

      const response = await fetch(
        `/dashboard/contrato/${contractId}/favorito`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update the image
        imgElement.src = `static/images/ico/heart_${data.favorite_icon}.png`;
        imgElement.title = data.favorite_title;
        imgElement.setAttribute("data-tooltip-text", data.favorite_title);

        console.log("Favorite status updated:", data);
      } else {
        throw new Error("Failed to update favorite status");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Optionally show an error message to the user
      alert("Erro ao atualizar favorito. Tente novamente.");
    } finally {
      // Restore opacity
      imgElement.style.opacity = "1";
    }
  },

  // Nova função para inicializar o breadcrumb dinamicamente
  dashboard_initBreadcrumb() {
    console.log("🔧 Inicializando breadcrumb do dashboard...");

    // First check if the container exists
    const container = document.getElementById(
      "dashboard-breadcrumb-dynamic-container"
    );
    if (!container) {
      console.warn("❌ Breadcrumb container not found, retrying in 500ms...");
      setTimeout(() => {
        this.dashboard_initBreadcrumb();
      }, 500);
      return;
    }

    // Verifica se o módulo breadcrumb está disponível
    if (
      typeof App !== "undefined" &&
      App.breadcrumb &&
      App.breadcrumb.breadcrumb_createDynamic
    ) {
      const breadcrumbItems = [
        { title: "Página Inicial", icon: "fas fa-home", url: "/inicio" },
        { title: "Dashboard", icon: "fas fa-tachometer-alt", url: "" },
      ];

      App.breadcrumb.breadcrumb_createDynamic(
        breadcrumbItems,
        "dashboard-breadcrumb-dynamic-container"
      );
      console.log("✅ Breadcrumb Dashboard initialized dynamically");
    } else {
      console.warn(
        "❌ Breadcrumb module not available - App:",
        typeof App,
        "breadcrumb:",
        App?.breadcrumb ? "exists" : "missing"
      );
      console.warn("⏳ Retrying in 500ms...");
      // Retry after a short delay if breadcrumb is not available yet
      setTimeout(() => {
        this.dashboard_initBreadcrumb();
      }, 500);
    }
  },

  // Nova função para inicializar o filtro dinamicamente
  dashboard_initFilter() {
    console.log("🔧 Inicializando filter do dashboard...");

    // First check if the container exists
    const container = document.getElementById(
      "dashboard-filter-dynamic-container"
    );
    if (!container) {
      console.warn("❌ Filter container not found, retrying in 500ms...");
      setTimeout(() => {
        this.dashboard_initFilter();
      }, 500);
      return;
    }

    // Verifica se o módulo filter está disponível
    if (
      typeof App !== "undefined" &&
      App.filter &&
      App.filter.filter_createDynamic
    ) {
      App.filter.filter_createDynamic("dashboard-filter-dynamic-container");
      console.log("✅ Filter Dashboard initialized dynamically");

      // Listen for filter changes to update dashboard
      document.addEventListener("filtersChanged", (event) => {
        console.log("🔄 Filters changed:", event.detail.filters);
        // Here you can trigger dashboard updates when filters change
        this.updateDashboardFilters();
      });
    } else {
      console.warn(
        "❌ Filter module not available - App:",
        typeof App,
        "filter:",
        App?.filter ? "exists" : "missing"
      );
      console.warn("⏳ Retrying in 500ms...");
      // Retry after a short delay if filter is not available yet
      setTimeout(() => {
        this.dashboard_initFilter();
      }, 500);
    }
  },

  // Dashboard initialization function with proper naming convention
  dashboard_autoInit() {
    // Only initialize dashboard if we're specifically on the dashboard page
    if (!window.location.pathname.includes("/dashboard")) {
      console.log("⚠️ Skipping dashboard auto-init - not on dashboard page");
      return;
    }

    // Initialize the dashboard with dynamic table loading
    if (typeof App !== "undefined" && App.initDashboard) {
      console.log("Initializing dashboard...");

      // Inicializar breadcrumb
      this.dashboard_initBreadcrumb();

      // Inicializar filtros
      this.dashboard_initFilter();

      App.initDashboard();
    } else {
      // Fallback: try again after a short delay if App is not ready
      setTimeout(() => {
        // Only initialize dashboard if we're specifically on the dashboard page (check again after delay)
        if (!window.location.pathname.includes("/dashboard")) {
          console.log(
            "⚠️ Skipping dashboard delayed init - not on dashboard page"
          );
          return;
        }

        if (typeof App !== "undefined" && App.initDashboard) {
          console.log("Initializing dashboard (delayed)...");

          // Inicializar breadcrumb
          this.dashboard_initBreadcrumb();

          // Inicializar filtros
          this.dashboard_initFilter();

          App.initDashboard();
        } else {
          console.warn("App.initDashboard not available");
        }
      }, 1000);
    }
  },

  // Public method for manual dashboard initialization (useful for SPA routing)
  dashboard_forceInit() {
    console.log("🔧 Force initializing dashboard components...");

    // Always initialize breadcrumb and filters first
    this.dashboard_initBreadcrumb();
    this.dashboard_initFilter();

    // Then initialize the main dashboard
    this.initDashboard();

    console.log("✅ Dashboard force initialization complete");
  },
};
