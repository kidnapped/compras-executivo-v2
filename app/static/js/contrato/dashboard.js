import getEcharts from "../util/echarts.js";
import Card from "../kpi/card.js";
import DashboardEvents from "./dashboard-events.js"; // <-- 1. IMPORT THE NEW MODULE

export default {
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
    const container = document.getElementById("card-contratos-container");
    if (!container) return;

    fetch("/dashboard/contratos")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data) => {
        container.outerHTML = this.renderDashboardCardContratos(data);
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
        <div class="widget-atividades-item">
          <i class="fas fa-clock"></i>
          <a href="#">${atividade.data}</a>
          <span>em ${atividade.dias_restantes} ${dia}</span><br>
          Renovação de <b>${diasExibir} dias</b> para o contrato ${atividade.numero}
        </div>`;
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
          ${this.cardHeader({ titulo, subtitulo, icone })}
          <div class="card-content" style="padding-top: 8px;">
            <div class="valor-principal">${quantidade_total}</div>
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
      </div>`;
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
          containLabel: false
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
            center: ['50%', '50%'],
            radius: '100%',
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
        containLabel: false
      },
      tooltip: {
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
          center: ['50%', '50%'],
          radius: '100%',
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

  // Renewal bars functionality
  async initRenewalBars() {
    console.log("=== INITIALIZING RENEWAL BARS ===");

    const renewalContainers = document.querySelectorAll(
      ".renewal-bars-container"
    );
    console.log("Found renewal bar containers:", renewalContainers.length);

    for (const container of renewalContainers) {
      await this.createRenewalBars(container);
    }
  },

  async createRenewalBars(container) {
    try {
      // Find the contract row to get the dates
      const row = container.closest("tr");
      const gaugeContainer = row.querySelector(".vigencia-gauge-container");

      if (!gaugeContainer) {
        console.warn("No gauge container found for renewal bars");
        return;
      }

      const contractId = gaugeContainer.getAttribute("data-contract-id");
      const startDate = gaugeContainer.getAttribute("data-start-date");
      const endDate = gaugeContainer.getAttribute("data-end-date");

      if (!startDate || !endDate) {
        console.warn(`Missing date attributes for contract ${contractId}`);
        return;
      }

      const vigenciaData = this.calculateVigenciaData(startDate, endDate);
      this.updateRenewalBars(container, vigenciaData);

      console.log(
        `✅ Renewal bars updated for contract ${contractId}:`,
        vigenciaData
      );
    } catch (error) {
      console.error("Error creating renewal bars:", error);
    }
  },

  updateRenewalBars(container, vigenciaData) {
    const { remainingDays } = vigenciaData;

    // Get all renewal bar groups in this container
    const barGroups = container.querySelectorAll(".renewal-bar-group");

    barGroups.forEach((group) => {
      const bar = group.querySelector(".renewal-bar");
      const fill = group.querySelector(".renewal-bar-fill");
      const days = parseInt(bar.getAttribute("data-days"));

      // Calculate fill percentage based on remaining days
      let fillPercentage = 0;

      if (remainingDays <= days) {
        // Contract is within this renewal period
        if (days === 120) {
          // For 120 days: fill when <= 120 days remaining
          fillPercentage = Math.max(
            0,
            Math.min(100, ((120 - remainingDays) / 120) * 100)
          );
        } else if (days === 90) {
          // For 90 days: fill when <= 90 days remaining
          fillPercentage = Math.max(
            0,
            Math.min(100, ((90 - remainingDays) / 90) * 100)
          );
        } else if (days === 45) {
          // For 45 days: fill when <= 45 days remaining
          fillPercentage = Math.max(
            0,
            Math.min(100, ((45 - remainingDays) / 45) * 100)
          );
        }
      }

      // Apply the fill percentage
      fill.style.height = `${fillPercentage}%`;

      // Add visual indication if this period is active
      if (fillPercentage > 0) {
        bar.classList.add("active");
      } else {
        bar.classList.remove("active");
      }
    });
  },

  // Financial bars functionality
  async initFinancialBars() {
    console.log("=== INITIALIZING FINANCIAL BARS ===");

    const financialContainers = document.querySelectorAll(
      ".financial-bars-container"
    );
    console.log("Found financial bar containers:", financialContainers.length);

    for (const container of financialContainers) {
      await this.createFinancialBars(container);
    }
  },

  async createFinancialBars(container) {
    try {
      const contractId = container.getAttribute("data-contract-id");
      const type = container.getAttribute("data-type");

      if (!contractId || !type) {
        console.warn(
          `Missing attributes for financial bars: ${contractId}, ${type}`
        );
        return;
      }

      // For now, use static data - later this will be loaded from API
      this.updateFinancialBars(container);

      console.log(
        `✅ Financial bars updated for contract ${contractId}, type: ${type}`
      );
    } catch (error) {
      console.error("Error creating financial bars:", error);
    }
  },

  updateFinancialBars(container) {
    // Get the bar element and its data
    const bar = container.querySelector(".financial-bar");
    const fill = container.querySelector(".financial-bar-fill");

    if (!bar || !fill) {
      console.warn("Financial bar elements not found");
      return;
    }

    const amount = parseFloat(bar.getAttribute("data-amount")) || 0;
    const type = bar.getAttribute("data-type");

    // Calculate fill percentage based on amount and type
    let fillPercentage = 0;

    if (type === "contratado") {
      // Contratado bar is always 100% full
      fillPercentage = 100;
    } else {
      // For other types, calculate based on maximum values
      const maxValues = {
        empenhado: 2000000, // Max committed amount
        pagamentos: 1500000, // Max payments amount
      };

      if (maxValues[type]) {
        fillPercentage = Math.min(100, (amount / maxValues[type]) * 100);
      }
    }

    // Apply the fill percentage
    if (type === "contratado") {
      // Always set contratado bars to 100%, regardless of existing height
      fill.style.height = "100%";
    } else {
      // For other types, only set if not already set
      const currentHeight = fill.style.height;
      if (!currentHeight || currentHeight === "0%") {
        fill.style.height = `${fillPercentage}%`;
      }
    }

    // Add visual indication based on type and fill percentage
    if (type === "contratado" || fillPercentage > 10) {
      bar.classList.add("active");
    } else {
      bar.classList.remove("active");
    }
  },

  // Initialize dashboard - called from DOMContentLoaded
  initDashboard() {
    console.log("Initializing dashboard...");
    this.loadContractsTable();
    //this.setupTableEventListeners();
    DashboardEvents.initialize();
    this.initCards();
  },

  // Initialize all dashboard cards
  initCards() {
    this.dashboardContratosCard();
    this.dashboardContratosPorExercicioCard();
    this.dashboardRepresentacaoAnualValores();
    this.dashboardProximasAtividades();
  },

  // Setup event listeners for table interactions
  setupTableEventListeners() {
    // Search input
    const searchInput = document.getElementById("pesquisa-contratos");
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.tableState.search = e.target.value;
          this.tableState.currentPage = 1;
          this.loadContractsTable();
        }, 500);
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
            sortCriteria = [["vigencia_fim", "ASC"]];
            break;
          case "valor":
            sortCriteria = [["valor", "DESC"]];
            break;
          default:
            sortCriteria = [["numero", "ASC"]];
        }
        params.append("sort", JSON.stringify(sortCriteria));
      }

      // Add filters
      if (this.tableState.filters.favoritos) {
        params.append("favoritos", "true");
      }

      if (this.tableState.filters.tipo.length > 0) {
        params.append("tipo", this.tableState.filters.tipo.join(","));
      }

      if (this.tableState.search) {
        params.append("search", this.tableState.search);
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
        if (window.dashboardConfig?.showRenewalColumn !== false) {
          this.initRenewalBars();
        }
        this.initFinancialBars();
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
  },

  // Render a single contract row
  renderContractRow(contract) {
    // Check if renewal column should be shown
    const showRenewalColumn =
      window.dashboardConfig?.showRenewalColumn !== false;

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
          <div class="icon-circle" style="opacity: 0.7; transform: scale(0.9);">  
          <i class="${
            contract.fontawesome_icon
          }" alt="contracto" style="font-size: 34px; color: #bbc6ea; opacity: 0.7;"></i>
          </div>  
            <div style="flex: 1;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 5px;">
                <img src="static/images/ico/ico-fornecedor.png" style="width: 20px; height: 20px;" />
                <div style="padding-left: 6px;">
                  <span style="color: #929ab5; font-size: 14px; text-transform: uppercase;" title="Fornecedor do contrato"><b>${
                    contract.fornecedor_nome || "N/A"
                  }</b></span><br />
                  <span style="color: #666; cursor: pointer;" onclick="detalhesFornecedor('${
                    contract.fornecedor_id || ""
                  }');" title="Fornecedor do contrato">${
      contract.fornecedor_cnpj || "N/A"
    }</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 2px; flex-wrap: nowrap; white-space: nowrap; margin-top: -10px !important;">
                <img src="${
                  this.getContratoInfo(contract.tipo_id).icon
                }" title="${
      this.getContratoInfo(contract.tipo_id).name
    }" style="height: 20px;" />

                <span style="font-size: 16px; color: #FF9933; white-space: nowrap;" title="Número do contrato">${
                  contract.numero
                } <span style="color: #000">/</span> ${contract.ano}</span>

                <img src="static/images/ico/heart_${
                  contract.favorite_icon
                }.png" style="cursor: pointer; margin-left: 20px;"  alt="Favorito" />

                <img data-contract-id="${
                  contract.id
                }" class="encontro-action" src="static/images/ico/bank.png" style="cursor: pointer; margin-left: 2px;" title="Encontro de Contas" />

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
    font-size: 11px;" title="Termos aditivos">
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
    font-size: 11px;" title="Restrições">0</div>
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
    font-size: 11px;" title="${this.formatContractStartInfo(
      contract.vigencia_inicio
    )}">${this.getContractYearsDisplay(contract.vigencia_inicio)}</div>
</div>              

                <span style="cursor: pointer; margin-left: 2px;">
                  <img src="static/images/sei_icone.png" style="margin-left: 10px;" />
                </span>

                <img src="static/images/ico/ico-processos.png" style="margin-left: 10px;" />

                <span style="color: #666; cursor: pointer; margin-left: 2px;" onclick="detalhesProcesso('${
                  contract.processo
                }');" title="Número do processo">${
      contract.processo || "N/A"
    }</span>
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
        ${
          showRenewalColumn
            ? `
        <td class="hide-mobile">
          <div class="renewal-bars-container" style="display: flex; gap: 8px; align-items: center">
            <div class="renewal-bar-group">
              <div class="renewal-bar-value">120</div>
              <div class="renewal-bar" data-days="120">
                <div class="renewal-bar-fill" style="height: ${this.calculateRenewalPercentage(
                  contract.vigencia_fim,
                  120
                )}%"></div>
              </div>
            </div>
            <div class="renewal-bar-group">
              <div class="renewal-bar-value">90</div>
              <div class="renewal-bar" data-days="90">
                <div class="renewal-bar-fill" style="height: ${this.calculateRenewalPercentage(
                  contract.vigencia_fim,
                  90
                )}%"></div>
              </div>
            </div>
            <div class="renewal-bar-group">
              <div class="renewal-bar-value">45</div>
              <div class="renewal-bar" data-days="45">
                <div class="renewal-bar-fill" style="height: ${this.calculateRenewalPercentage(
                  contract.vigencia_fim,
                  45
                )}%"></div>
              </div>
            </div>
          </div>
        </td>
        `
            : ""
        }
        <td class="hide-mobile" style="padding: 8px 0; border-bottom: 1px solid #ddd;">
          <div class="financial-bars-container" data-contract-id="${
            contract.numero
          }/${contract.ano}" data-type="contratado" style="height: 140px; display: flex; align-items: center; justify-content: center;">
            <div class="financial-bar-group" style="height: 140px; display: flex; align-items: center; position: relative;">
              <div class="financial-bar-value" style="
                position: absolute;
                left: -20px;
                top: 50%;
                transform: translateY(-50%) rotate(180deg); 
                writing-mode: vertical-rl; 
                font-family: Arial, sans-serif; 
                font-size: 10px; 
                font-weight: bold; 
                color: #333; 
                white-space: nowrap;
                line-height: 1.2;
                z-index: 1;
                max-width: 18px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${formatCurrency(contract.valor_global)}</div>
              <div class="financial-bar" data-type="contratado" data-amount="${
                contract.valor_inicial || 0
              }" style="
                width: 21px; 
                height: 140px; 
                background-color: #e0e0e0; 
                position: relative;
              ">
                <div class="financial-bar-fill" style="
                  position: absolute; 
                  bottom: 0; 
                  width: 100%; 
                  background-color: #bbc6ea; 
                  transition: height 0.3s ease;
                  height: ${this.calculateFinancialPercentage(
                    contract.valor_inicial,
                    contract.valor_global
                  )}%;
                "></div>
              </div>
            </div>
          </div>
        </td>
        <td class="hide-mobile" style="padding: 8px 0; border-bottom: 1px solid #ddd;">
          <div class="financial-bars-container" data-contract-id="${
            contract.numero
          }/${contract.ano}" data-type="empenhado" style="height: 140px; display: flex; align-items: center; justify-content: center;">
            <div class="financial-bar-group" style="height: 140px; display: flex; align-items: center; position: relative;">
              <div class="financial-bar-value" style="
                position: absolute;
                left: -20px;
                top: 50%;
                transform: translateY(-50%) rotate(180deg); 
                writing-mode: vertical-rl; 
                font-family: Arial, sans-serif; 
                font-size: 10px; 
                font-weight: bold; 
                color: #333; 
                white-space: nowrap;
                line-height: 1.2;
                z-index: 1;
                max-width: 18px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${formatCurrency(contract.total_valor_empenhado)}</div>
              <div class="financial-bar" data-type="empenhado" data-amount="${
                contract.total_valor_empenhado || 0
              }" style="
                width: 21px; 
                height: 140px; 
                background-color: #e0e0e0; 
                position: relative;
              ">
                <div class="financial-bar-fill" style="
                  position: absolute; 
                  bottom: 0; 
                  width: 100%; 
                  background-color: #8f9dd2; 
                  transition: height 0.3s ease;
                  height: ${this.calculateFinancialPercentage(
                    contract.total_valor_empenhado,
                    contract.valor_inicial
                  )}%;
                "></div>
              </div>
            </div>
          </div>
        </td>
        <td class="hide-mobile" style="padding: 8px 0; border-bottom: 1px solid #ddd;">
          <div class="financial-bars-container" data-contract-id="${
            contract.numero
          }/${contract.ano}" data-type="pagamentos" style="height: 140px; display: flex; align-items: center; justify-content: center;">
            <div class="financial-bar-group" style="height: 140px; display: flex; align-items: center; position: relative;">
              <div class="financial-bar-value" style="
                position: absolute;
                left: -20px;
                top: 50%;
                transform: translateY(-50%) rotate(180deg); 
                writing-mode: vertical-rl; 
                font-family: Arial, sans-serif; 
                font-size: 10px; 
                font-weight: bold; 
                color: #333; 
                white-space: nowrap;
                line-height: 1.2;
                z-index: 1;
                max-width: 18px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">${formatCurrency(contract.total_valor_pago)}</div>
              <div class="financial-bar" data-type="pagamentos" data-amount="${
                contract.total_valor_pago || 0
              }" style="
                width: 21px; 
                height: 140px; 
                background-color: #e0e0e0; 
                position: relative;
              ">
                <div class="financial-bar-fill" style="
                  position: absolute; 
                  bottom: 0; 
                  width: 100%; 
                  background-color: #93b7e3; 
                  transition: height 0.3s ease;
                  height: ${this.calculateFinancialPercentage(
                    contract.total_valor_pago,
                    contract.total_valor_empenhado
                  )}%;
                "></div>
              </div>
            </div>
          </div>
        </td>
        <td class="hide-mobile" valign="top" style="padding: 5px 8px;">${
          contract.responsaveis ||
          "Nenhuma designação atribuída para este contrato"
        }</td>  
      </tr>
    `;
  },

  // Calculate renewal percentage based on days to expiration
  calculateRenewalPercentage(endDate, targetDays) {
    if (!endDate) return 0;

    const end = new Date(endDate);
    const now = new Date();
    const daysToEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    if (daysToEnd <= 0) return 100; // Expired
    if (daysToEnd <= targetDays) return 100; // Within target range
    return 0; // Not yet in target range
  },

  // Calculate financial percentage
  calculateFinancialPercentage(value, total) {
    if (!value || !total) return 0;
    return Math.min(100, Math.max(0, (value / total) * 100));
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
    if (this.tableState.currentPage > 1) {
      this.tableState.currentPage = 1;
      this.loadContractsTable();
    }
  },

  irParaAnterior() {
    if (this.tableState.currentPage > 1) {
      this.tableState.currentPage--;
      this.loadContractsTable();
    }
  },

  irParaProxima() {
    if (this.tableState.currentPage < this.tableState.totalPages) {
      this.tableState.currentPage++;
      this.loadContractsTable();
    }
  },

  irParaUltima() {
    if (this.tableState.currentPage < this.tableState.totalPages) {
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
};
