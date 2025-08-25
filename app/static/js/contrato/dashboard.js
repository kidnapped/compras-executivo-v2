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
    isLoading: false, // Add loading guard
    filters: {
      favoritos: false,
      uasgs: [],
      tipo: [],
    },
    sort: "numero",
    sortDirection: "ASC",
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

    // Get current filters and convert to API parameters
    const apiParams = this.getApiFiltersFromFilterSystem();
    const queryString = new URLSearchParams(apiParams).toString();
    const url = queryString
      ? `/dashboard/contratos?${queryString}`
      : "/dashboard/contratos";

    fetch(url)
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
    const contentContainer = document.getElementById(
      "dashboardContratosExercicioContent"
    );
    if (!contentContainer) return;

    try {
      const res = await fetch("/dashboard/contratos-por-exercicio");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();

      // Create chart HTML content for the new card structure
      const chartHtml = `
        <div id="grafico-contratos-por-exercicio" style="width: 100%; height: 100%; min-height: 172px;"></div>
      `;

      // Update the content area
      contentContainer.innerHTML = chartHtml;

      // Wait for DOM update and ensure container has dimensions
      await new Promise(resolve => setTimeout(resolve, 50));

      const chartDom = document.getElementById(
        "grafico-contratos-por-exercicio"
      );
      if (!chartDom) return;

      // Force container dimensions if not set
      const containerRect = contentContainer.getBoundingClientRect();
      if (containerRect.height > 0) {
        chartDom.style.height = `${containerRect.height}px`;
        chartDom.style.width = `${containerRect.width}px`;
      }

      const echarts = await getEcharts();
      const chart = echarts.init(chartDom);
      
      // Set option with proper sizing
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
        grid: { 
          left: 20,
          right: 20,
          top: 20,
          bottom: 40,
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: data.anos,
          axisLabel: { rotate: 45, fontSize: 11 },
        },
        yAxis: {
          type: "value",
          axisLabel: { show: false },
          splitLine: { show: false },
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

      // Force resize to ensure proper dimensions
      setTimeout(() => {
        chart.resize();
      }, 100);

      // Add global resize listener
      const resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(contentContainer);

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
      contentContainer.innerHTML = '<div class="text-danger">Erro ao carregar gráfico</div>';
    }
  },

  async dashboardRepresentacaoAnualValores() {
    const contentContainer = document.getElementById(
      "dashboardRepresentacaoAnualContent"
    );
    if (!contentContainer) return;

    try {
      const res = await fetch("/dashboard/valores-por-exercicio");
      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();

      // Create chart HTML content for the new card structure
      const chartHtml = `
        <div id="grafico-representacao-anual-valores" style="width: 100%; height: 100%; min-height: 172px;"></div>
      `;

      // Update the content area
      contentContainer.innerHTML = chartHtml;

      // Wait for DOM update and ensure container has dimensions
      await new Promise(resolve => setTimeout(resolve, 50));

      const chartDom = document.getElementById(
        "grafico-representacao-anual-valores"
      );
      if (!chartDom) return;

      // Force container dimensions if not set
      const containerRect = contentContainer.getBoundingClientRect();
      if (containerRect.height > 0) {
        chartDom.style.height = `${containerRect.height}px`;
        chartDom.style.width = `${containerRect.width}px`;
      }

      const echarts = await getEcharts();
      const chart = echarts.init(chartDom);
      
      // Set option with proper sizing
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
        grid: { 
          left: 20,
          right: 20,
          top: 20,
          bottom: 40,
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: data.anos,
          axisLabel: { rotate: 45, fontSize: 11 },
        },
        yAxis: {
          type: "value",
          axisLabel: { show: false },
          splitLine: { show: false },
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

      // Force resize to ensure proper dimensions
      setTimeout(() => {
        chart.resize();
      }, 100);

      // Add global resize listener
      const resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(contentContainer);

    } catch (err) {
      console.error("Erro ao carregar gráfico de valores:", err);
      contentContainer.innerHTML = '<div class="text-danger">Erro ao carregar gráfico</div>';
    }
  },

  dashboardProximasAtividades() {
    const contentContainer = document.getElementById("dashboardProximasAtividadesContent");
    if (!contentContainer) return;

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
                        <span>${atividade.data}</span>
                        <span>em ${atividade.dias_restantes} ${dia}</span>
                        </div>
                        <div style="margin-top:-4px;font-size:10px;">
                        Renovação de <b>${diasExibir} dias</b> para o contrato 
                        <a href="#" 
                           class="contract-filter-link" 
                           data-contract-number="${atividade.numero}"
                           style="color: #1351b4; text-decoration: none; font-weight: bold;"
                           title="Clique para filtrar por este contrato">
                           ${atividade.numero}
                        </a>
                        </div>
                    </div>
                </div>
            `;
          })
          .join("");

        // Update the content area with the new card structure
        contentContainer.innerHTML = `
          <div class="widget-atividades-box">
            <div class="widget-atividades-lista">${conteudo}</div>
          </div>`;

        // Add click event listeners to contract links
        this.setupProximasAtividadesClickHandlers();
      })
      .catch((err) => {
        console.error("Erro ao carregar próximas atividades:", err);
        contentContainer.innerHTML = '<div class="text-danger">Erro ao carregar atividades</div>';
      });
  },

  // Setup click handlers for contract links in próximas atividades
  setupProximasAtividadesClickHandlers() {
    const contractLinks = document.querySelectorAll(".contract-filter-link");

    contractLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const contractNumber = link.getAttribute("data-contract-number");

        if (contractNumber && window.App && window.App.filter) {
          // Clear existing search filters to avoid conflicts
          window.App.filter.filter_removeFiltersByKey("search");

          // Add contract number filter
          window.App.filter.filter_addFilter(
            "search",
            contractNumber,
            `Contrato: ${contractNumber}`,
            "search"
          );

          // Notify filter change to update the table
          window.App.filter.filter_notifyFilterChange();
        }
      });
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
    // Reset pagination to page 1 when filters change
    this.tableState.currentPage = 1;

    // Debounce rapid filter changes
    clearTimeout(this._filterUpdateTimeout);
    this._filterUpdateTimeout = setTimeout(() => {
      this.loadContractsTable();
      this.dashboardContratosCard(); // Add this to update Contratos e Renovações card
      this.dashboardContratosPorExercicioCard();
      this.dashboardRepresentacaoAnualValores();
      this.dashboardProximasAtividades();
    }, 150); // 150ms debounce
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
    // Reset and initialize dashboard events for SPA compatibility
    DashboardEvents.reset();
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

      // Card 2 - Contratos por Exercício
      App.card_header.card_header_createDynamic(
        {
          title: "Contratos por Exercício",
          subtitle: "Distribuição de contratos por ano",
          icon: "fas fa-chart-bar",
          actions: [], // No buttons for cleaner layout
        },
        "dashboard-contratos-exercicio-header"
      );

      // Card 3 - Representação Anual de Valores
      App.card_header.card_header_createDynamic(
        {
          title: "Representação Anual de Valores",
          subtitle: "Evolução dos valores contratuais",
          icon: "fas fa-chart-line",
          actions: [], // No buttons for cleaner layout
        },
        "dashboard-representacao-anual-header"
      );

      // Card 4 - Próximas Atividades
      App.card_header.card_header_createDynamic(
        {
          title: "Próximas Atividades",
          subtitle: "Contratos próximos ao vencimento",
          icon: "fas fa-calendar-check",
          actions: [], // No buttons for cleaner layout
        },
        "dashboard-proximas-atividades-header"
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

    // Sortable table headers
    this.setupSortableHeaders();

    // Page size selection
    this.setupPageSizeListeners();
  },

  // Setup sortable table headers
  setupSortableHeaders() {
    // Remove existing listeners to avoid duplicates
    document.querySelectorAll(".sortable-header").forEach((header) => {
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);
    });

    // Add click listeners to sortable headers
    document.querySelectorAll(".sortable-header").forEach((header) => {
      header.addEventListener("click", (e) => {
        const sortField = header.getAttribute("data-sort");
        this.handleHeaderSort(sortField, header);
      });
    });

    // Update visual indicators based on current sort
    this.updateSortIndicators();
  },

  // Handle header click for sorting
  handleHeaderSort(sortField, headerElement) {
    const currentSort = this.tableState.sort;
    const currentDirection = this.tableState.sortDirection || "ASC";

    // Toggle direction if same field, otherwise default to ASC
    let newDirection;
    if (currentSort === sortField) {
      newDirection = currentDirection === "ASC" ? "DESC" : "ASC";
    } else {
      newDirection = "ASC";
    }

    // Update table state
    this.tableState.sort = sortField;
    this.tableState.sortDirection = newDirection;
    this.tableState.currentPage = 1; // Reset to first page

    // Update visual indicators
    this.updateSortIndicators();

    // Reload table with new sort
    this.loadContractsTable();
  },

  // Update sort indicators in table headers
  updateSortIndicators() {
    // Reset all icons
    document.querySelectorAll(".sortable-header .sort-icon").forEach((icon) => {
      icon.className = "fas fa-sort sort-icon";
      icon.style.color = "#999";
    });

    // Update active sort indicator
    const currentSort = this.tableState.sort;
    const currentDirection = this.tableState.sortDirection || "ASC";

    if (currentSort) {
      const activeHeader = document.querySelector(
        `[data-sort="${currentSort}"]`
      );
      if (activeHeader) {
        const icon = activeHeader.querySelector(".sort-icon");
        if (icon) {
          if (currentDirection === "ASC") {
            icon.className = "fas fa-sort-up sort-icon";
            icon.style.color = "#1351B4";
          } else {
            icon.className = "fas fa-sort-down sort-icon";
            icon.style.color = "#1351B4";
          }
        }
      }
    }
  },

  // Setup filter event listeners
  setupFilterListeners() {
    // Favoritos filter
    const favoritosCheck = document.getElementById("check-favoritos");
    if (favoritosCheck) {
      favoritosCheck.addEventListener("change", (e) => {
        this.tableState.filters.favoritos = e.target.checked;
        this.tableState.currentPage = 1;

        // Debounce to prevent duplicate calls with filter system
        clearTimeout(this._legacyFilterTimeout);
        this._legacyFilterTimeout = setTimeout(() => {
          this.loadContractsTable();
        }, 100);
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

          // Debounce to prevent duplicate calls with filter system
          clearTimeout(this._legacyFilterTimeout);
          this._legacyFilterTimeout = setTimeout(() => {
            this.loadContractsTable();
          }, 100);
        });
      }
    });
  },

  // Setup sort event listeners (DEPRECATED - now using sortable headers)
  setupSortListeners() {
    // This method is deprecated since we moved to sortable headers
    // Keeping for compatibility but functionality moved to setupSortableHeaders()
    /*
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
    */
  },

  // Setup page size listeners
  setupPageSizeListeners() {
    // Page size options are handled by onclick in HTML
    console.log("Page size listeners ready");
  },

  // Load contracts table data
  async loadContractsTable() {
    // Prevent multiple simultaneous loads
    if (this.tableState.isLoading) {
      console.log("🔄 Table already loading, skipping duplicate request");
      return;
    }

    try {
      this.tableState.isLoading = true;
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
        const direction = this.tableState.sortDirection || "ASC";
        let sortCriteria = [];
        switch (this.tableState.sort) {
          case "numero":
            sortCriteria = [["numero", direction]];
            break;
          case "vigencia":
            sortCriteria = [["vigencia_fim", direction]];
            break;
          case "valor":
            sortCriteria = [["valor", direction]];
            break;
          case "empenhado":
            sortCriteria = [["valor_empenhado", direction]];
            break;
          case "pagamentos":
            sortCriteria = [["valor_pago", direction]];
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

      // Add filters from new filter system (use the helper)
      const apiFilters = this.getApiFiltersFromFilterSystem();
      Object.entries(apiFilters).forEach(([key, value]) => {
        params.append(key, value);
      });

      // Fetch data
      const response = await fetch(`/dashboard/contratos-lista?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received contracts data:", data);

      // Debug responsaveis data for the first contract
      if (data.data && data.data.length > 0) {
        console.log(
          "First contract responsaveis:",
          data.data[0].responsaveis,
          "Type:",
          typeof data.data[0].responsaveis
        );
      }

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
    } finally {
      // Always reset loading state
      this.tableState.isLoading = false;
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

      // Add click handlers for responsavel filtering
      document.querySelectorAll(".responsavel-filter-link").forEach((el) => {
        el.replaceWith(el.cloneNode(true));
      });
      document.querySelectorAll(".responsavel-filter-link").forEach((el) => {
        el.addEventListener("click", async (e) => {
          e.preventDefault();
          const userId = el.getAttribute("data-user-id");
          const responsavelName = el.textContent.trim();

          if (!userId) return;

          try {
            // Get contracts for this responsavel
            const response = await fetch(
              `/dashboard/contratos-by-responsavel/${userId}`
            );
            if (!response.ok) throw new Error("Failed to fetch contracts");

            const data = await response.json();
            const contractNumbers = data.contract_numbers;

            if (contractNumbers.length === 0) {
              // Show message if no contracts found
              alert(`Nenhum contrato encontrado para ${responsavelName}`);
              return;
            }

            // Clear existing search filters to avoid conflicts
            if (window.App && window.App.filter) {
              window.App.filter.filter_removeFiltersByKey("search");

              // Add search filters for each contract number
              contractNumbers.forEach((contractNumber) => {
                window.App.filter.filter_addFilter(
                  "search",
                  contractNumber,
                  `Contrato: ${contractNumber}`,
                  "search"
                );
              });

              // Notify filter change to update the table
              window.App.filter.filter_notifyFilterChange();
            }
          } catch (error) {
            console.error("Error filtering by responsavel:", error);
            alert(`Erro ao filtrar contratos de ${responsavelName}`);
          }
        });
      });
    }, 0);

    // Setup sortable headers after table content is rendered
    setTimeout(() => {
      this.setupSortableHeaders();
    }, 50);
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

    // Check if multiple UASGs are available using the data attribute
    const tituloGrid = document.querySelector(".titulo-grid-uasg");
    const uasgCount = tituloGrid
      ? parseInt(tituloGrid.getAttribute("data-uasg-count"), 10)
      : 1;
    const showUasgInfo = uasgCount > 1;

    // Generate UASG display HTML conditionally
    const uasgDisplayHtml = showUasgInfo
      ? `
      <i class="fa fa-home" aria-hidden="true" style="height: 20px; color: #ccc; "></i>
      <span style="font-size: 16px;color: #FF9933; white-space: nowrap;" 
        data-tooltip-text="UASG do ${contract.uasg_nome}"
        data-tooltip-place="bottom"
        data-tooltip-type="info">${contract.uasg_codigo}</span>
    `
      : "";

    return `
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
              ${uasgDisplayHtml}
              <img src="${this.getContratoInfo(contract.tipo_id).icon}" 
                data-tooltip-text="${
                  this.getContratoInfo(contract.tipo_id).name
                }"
                data-tooltip-place="bottom"
                data-tooltip-type="info"
                style="height: 20px; ${
                  showUasgInfo ? "margin-left: 10;" : "margin-left: 0;"
                }" />
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
                <img data-contract-id="${contract.id}" data-empenhos-count="${
      contract.total_empenhos || 0
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
    <div style="position: relative; display: none; padding-top: 5px; margin-left: -10px;">
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
        <td class="hide-mobile" valign="top" style="padding: 5px 8px; min-width: 80px; text-align: center;">
          ${this.renderResponsaveisColumn(contract)}
        </td>
      </tr>
    `;
  },

  // Render responsaveis column with users icon and count
  renderResponsaveisColumn(contract) {
    const responsaveis = this.getResponsaveisArray(contract.responsaveis);

    if (responsaveis.length === 0) {
      return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 48px;">
                <i class="fas fa-exclamation-triangle" style="color: #e52207; font-size: 22px; margin-bottom: 4px;"></i>
                <span style="color: #888; font-size: 13px; text-align: center;">Nenhuma designação atribuída para este contrato</span>
             </div>`;
    }

    // Show users icon with count badge
    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 48px;">
        <a href="#" 
           class="responsaveis-action" 
           data-contract-id="${contract.id}"
           data-contract-numero="${contract.numero}"
           data-contract-ano="${contract.ano}"
           data-responsaveis-count="${responsaveis.length}"
           style="
             position: relative;
             display: inline-flex;
             align-items: center;
             justify-content: center;
             text-decoration: none;
             color: #1351b4;
             transition: all 0.2s ease;
           "
           title="Ver ${responsaveis.length} responsável${
      responsaveis.length > 1 ? "eis" : ""
    } deste contrato"
           onmouseover="this.style.transform='scale(1.1)'; this.style.color='#0d47a1';"
           onmouseout="this.style.transform='scale(1)'; this.style.color='#1351b4';">
          
          <!-- Users Icon -->
          <i class="fas fa-users" style="font-size: 24px; color: inherit;"></i>
          
          <!-- Count Badge -->
          <span style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #e52207;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            border: 2px solid white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">${responsaveis.length}</span>
        </a>
      </div>
    `;
  },

  // Helper function to convert responsaveis to array format
  getResponsaveisArray(responsaveis) {
    // Handle null, undefined, or empty values
    if (!responsaveis) return [];

    // If it's already an array of objects with user_id and name, return it
    if (Array.isArray(responsaveis)) {
      // Check if it's the new format (array of objects with user_id and name)
      if (
        responsaveis.length > 0 &&
        typeof responsaveis[0] === "object" &&
        responsaveis[0].name
      ) {
        return responsaveis;
      }
      // If it's array of strings (legacy format), convert to new format
      return responsaveis.map((name) => ({ name: name.trim(), user_id: null }));
    }

    // If it's a string, split by comma and clean up each name (legacy format)
    if (typeof responsaveis === "string") {
      return responsaveis
        .split(",")
        .map((name) => ({ name: name.trim(), user_id: null }))
        .filter((item) => item.name.length > 0);
    }

    // If it's some other type, return empty array
    return [];
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
            "X-Requested-With": "XMLHttpRequest", // Indicate this is an AJAX request
            "Accept": "application/json", // Expect JSON response
          },
          credentials: "same-origin", // Include cookies for authentication
          redirect: "error", // Fail on any redirect
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
      // Use the original gov.br error message
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

  // Parse ?status_filters=...&search_filters=...&year_filters=...&processo_filters=...&uasg_filters=...
  initFiltersFromUrl() {
    if (!(window.App && window.App.filter)) return;

    const params = new URLSearchParams(window.location.search);
    const map = [
      { key: "status_filters", filterKey: "status", type: "status" },
      { key: "search_filters", filterKey: "search", type: "default" },
      { key: "year_filters", filterKey: "ano", type: "date" },
      { key: "processo_filters", filterKey: "processo", type: "category" },
      { key: "uasg_filters", filterKey: "uasg", type: "uasg" },
    ];

    // Localized display names for status (already used elsewhere)
    const statusDisplay = {
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

    const collected = {};

    map.forEach(({ key, filterKey, type }) => {
      const value = params.get(key);
      if (!value) return;
      const values = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      if (values.length === 0) return;

      collected[filterKey] = values.map((val) => ({
        value: val,
        displayText:
          filterKey === "status"
            ? statusDisplay[val] || val
            : filterKey === "ano"
            ? `Ano ${val}`
            : filterKey === "processo"
            ? `Processo: ${val}`
            : filterKey === "uasg"
            ? `UASG ${val}`
            : val,
        type,
      }));
    });

    if (Object.keys(collected).length > 0) {
      // Bulk set state and notify
      window.App.filter.filter_setFilters(collected);
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

      // Seed filters from URL (deep-linking)
      this.initFiltersFromUrl();

      // Listen for filter changes to update dashboard
      document.addEventListener("filtersChanged", (event) => {
        console.log("🔄 Filters changed:", event.detail.filters);
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

    // Then initialize the main dashboard - call the same method used elsewhere
    App.initDashboard();

    console.log("✅ Dashboard force initialization complete");
  },
};
