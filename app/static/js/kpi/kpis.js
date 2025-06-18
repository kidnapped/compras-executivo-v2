import * as echarts from "echarts";

export default {
  /**
   * Renders a KPI card with a chart using ECharts.
   * @param {Object} options
   * @param {string} options.elementId - The container element id to render the card into.
   * @param {string} options.apiEndpoint - The API endpoint to fetch data from.
   * @param {string} options.chartType - The type of chart ('bar', 'line', etc).
   * @param {string} options.cardTitle - The card title.
   * @param {string} options.cardSubtitle - The card subtitle.
   * @param {string} [options.icon] - The icon URL.
   * @param {function} [options.getChartOption] - Optional function to customize chart options.
   * @param {function} [options.transformData] - Optional function to transform API data.
   */
  /**
   * Initializes the KPI1 card with a bar chart.
   */
  initKpi1Card() {
    this.renderKpiChartCard({
      elementId: "card-kpi-exercicio-container",
      apiEndpoint: "/kpis/kpi1",
      chartType: "bar",
      cardTitle: "KPI Exercício",
      cardSubtitle: "Contratos por Exercício",
    });
  },

  renderKpiChartCard({
    elementId,
    apiEndpoint,
    chartType,
    cardTitle,
    cardSubtitle,
    icon = "/static/images/doc2.png",
    getChartOption,
    transformData,
  }) {
    const container = document.getElementById(elementId);
    if (!container) {
      console.error(`Container with id "${elementId}" not found.`);
      return;
    }

    fetch(apiEndpoint)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((data) => {
        console.log("Fetched data:", data);
        // Transform flat object to labels/values if needed
        let chartData = data;
        if (!data.labels && !data.anos && data.vigentes !== undefined) {
          chartData = {
            labels: [
              "Vigentes",
              "Finalizados",
              "Críticos",
              "120 dias",
              "90 dias",
              "45 dias",
              "Outros",
            ],
            values: [
              data.vigentes,
              data.finalizados,
              data.criticos,
              data.dias120,
              data.dias90,
              data.dias45,
              data.outros,
            ],
            titulo: data.titulo,
            subtitulo: data.subtitulo,
          };
        }
        if (typeof transformData === "function") {
          chartData = transformData(chartData);
        }
        // Generate unique chart id
        const chartId = `grafico-${elementId}`;

        // Render card HTML
        const cardHtml = this.renderKpiCard({
          id: chartId,
          titulo: cardTitle,
          subtitulo: cardSubtitle,
          icone: icon,
        });

        const wrapper = document.createElement("div");
        wrapper.innerHTML = cardHtml.trim();
        const newCard = wrapper.firstChild;

        const parent = container.parentElement;
        if (parent) {
          parent.replaceChild(newCard, container);
        }

        const chartDom = document.getElementById(chartId);
        if (!chartDom) return;

        chartDom.style.width = "100%";
        const chart = echarts.init(chartDom);

        // Default chart option
        let option = {
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (p) =>
              `${p[0].axisValue}<br/><strong>${p[0].data} Contratos</strong>`,
          },
          grid: { right: 20 },
          xAxis: {
            type: "category",
            data: chartData.labels || chartData.anos || [],
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
              name: cardTitle,
              type: chartType,
              data: chartData.values || chartData.valores || [],
              itemStyle: { color: "#5470C6" },
              barMaxWidth: 50,
            },
          ],
        };

        // Allow custom chart option
        if (typeof getChartOption === "function") {
          option = getChartOption(chartData, option);
        }

        chart.setOption(option);
        chart.resize();

        window.addEventListener("resize", () => {
          chart.resize();
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar gráfico:", err);
      });
  },

  renderKpiCard({ id, titulo, subtitulo, icone = "/static/images/doc2.png" }) {
    return `
            <div class="br-card h-100 card-contratos" style="min-height: 180px;">
                ${App.cardHeader({ titulo, subtitulo, icone })}
                <div class="card-content" style="padding: 0px; height: 180px !important;">
                    <div id="${id}" style="width: 100%; height: 210px; margin-top: -40px;"></div>
                </div>
            </div>
        `;
  },
};
