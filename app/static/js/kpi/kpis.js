import * as echarts from "echarts";

// --- Standalone, reusable chart rendering function ---
function renderKpiChartCard({
  elementId,
  data,
  chartType = "bar",
  cardTitle = "",
  getChartOption,
  transformData,
}) {
  const container = document.getElementById(elementId);
  if (!container) return;

  // Show spinner
  container.innerHTML = `
    <div style="display:flex;justify-content:center;align-items:center;height:100%;">
      <div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status">
        <span class="sr-only">Loading...</span>
      </div>
    </div>
  `;

  setTimeout(() => {
    container.innerHTML = "";
    const chartDiv = document.createElement("div");
    chartDiv.style.width = "100%";
    chartDiv.style.height = "300px";
    container.appendChild(chartDiv);

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

    let option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
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
    if (typeof getChartOption === "function") {
      option = getChartOption(chartData, option);
    }
    const chart = echarts.init(chartDiv);
    chart.setOption(option);
    chart.resize();
    window.addEventListener("resize", () => chart.resize());
  }, 100); // Simulate async, remove in real use
}

// Utility function to display a value in an H2 inside any container
function displayValueInH2(containerId, value) {
  const container = document.getElementById(containerId);
  if (container) {
    container.textContent = value;
  }
}

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

  loadKpiData() {
    fetch("/kpis/kpi1")
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar");
        return res.json();
      })
      .then((kpiData) => {
        renderKpiChartCard({
          elementId: "card-kpi-exercicio-container",
          data: kpiData,
          chartType: "bar",
          cardTitle: "KPI Exercício",
          cardSubtitle: "Contratos por Exercício",
        });

        displayValueInH2("outeros", kpiData.outros);
        // Render the new card
        renderKpiChartCard({
          elementId: "card-kpi-total-vigentes",
          data: {
            labels: ["Total", "Vigentes"],
            values: [kpiData.quantidade_total, kpiData.vigentes],
          },
          chartType: "pie",
          cardTitle: "Total vs Vigentes",
          getChartOption: (data) => ({
            tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
            legend: { orient: "vertical", left: "left" },
            series: [
              {
                name: "Total vs Vigentes",
                type: "pie",
                radius: ["50%", "70%"], // Donut
                avoidLabelOverlap: false,
                label: {
                  show: true,
                  position: "outside",
                  fontSize: 14,
                  formatter: "{b}: {c}",
                },
                emphasis: {
                  label: { show: true, fontSize: "18", fontWeight: "bold" },
                },
                labelLine: { show: true },
                data: data.labels.map((label, i) => ({
                  value: data.values[i],
                  name: label,
                })),
              },
            ],
          }),
        });

        // Render third card (horizontal stacked bar: Finalizados vs Vigentes)
        renderKpiChartCard({
          elementId: "card-kpi-stacked-bar",
          data: {
            labels: ["Contratos"],
            values: [kpiData.finalizados, kpiData.vigentes],
          },
          chartType: "bar",
          cardTitle: "Finalizados vs Vigentes (Stacked, Horizontal)",
          getChartOption: (data) => ({
            tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
            legend: { data: ["Finalizados", "Vigentes"] },
            xAxis: { type: "value" },
            yAxis: { type: "category", data: data.labels },
            series: [
              {
                name: "Finalizados",
                type: "bar",
                stack: "contratos",
                label: {
                  show: true,
                  position: "inside",
                  fontSize: 14,
                  formatter: "{c}",
                },
                data: [kpiData.finalizados],
                itemStyle: { color: "#FF6F61" },
              },
              {
                name: "Vigentes",
                type: "bar",
                stack: "contratos",
                label: {
                  show: true,
                  position: "inside",
                  fontSize: 14,
                  formatter: "{c}",
                },
                data: [kpiData.vigentes],
                itemStyle: { color: "#5470C6" },
              },
            ],
          }),
        });

        // Display 'outros' value as a string in the chosen container
        displayValueInH2("outros", kpiData.outros);
        displayValueInH2("criticos", kpiData.criticos);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados:", err);
      });
  },

  /**
   * Fetches KPI data from an endpoint and stores it in a variable.
   * @param {string} apiEndpoint
   * @returns {Promise<Object>} The fetched data
   */
  async fetchKpiData(apiEndpoint) {
    const res = await fetch(apiEndpoint);
    if (!res.ok) throw new Error("Erro ao carregar");
    const data = await res.json();
    return data;
  },

  renderKpiCard({ id, titulo, subtitulo, icone = "/static/images/doc2.png" }) {
    return `
            <div class="br-card h-100 card-contratos" style="min-height: 220px; overflow: hidden;">
                ${App.cardHeader({ titulo, subtitulo, icone })}
                <div class="card-content" style="margin: 20px; height: 180px !important;">
                    <div id="${id}" style="width: 100%; height: 180px;"></div>
                </div>
               
            </div>
        `;
  },
};
// --- Unified Card Rendering Example ---
// Fetch the data once, then render as many cards as you want with different options
fetch("/kpis/kpi1")
  .then((res) => {
    if (!res.ok) throw new Error("Erro ao carregar");
    return res.json();
  })
  .then((kpiData) => {
    // Render first card (bar chart)
    renderKpiChartCard({
      elementId: "card-kpi-exercicio-container",
      data: kpiData,
      chartType: "bar",
      cardTitle: "KPI Exercício",
      getChartOption: (data, option) => ({
        ...option,
        xAxis: {
          ...option.xAxis,
          axisLabel: { show: true, rotate: 45, fontSize: 13 },
        },
        series: [
          {
            ...option.series[0],
            label: {
              show: true,
              position: "top",
              fontSize: 14,
              color: "#333",
              formatter: "{c}",
            },
          },
        ],
      }),
    });

    // Render second card (donut chart, only quantidade_total and vigentes)
    renderKpiChartCard({
      elementId: "card-kpi-total-vigentes",
      data: {
        labels: ["Total", "Vigentes"],
        values: [kpiData.quantidade_total, kpiData.vigentes],
      },
      chartType: "pie",
      cardTitle: "Total vs Vigentes",
      getChartOption: (data) => ({
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: { orient: "vertical", left: "left" },
        series: [
          {
            name: "Total vs Vigentes",
            type: "pie",
            radius: ["50%", "70%"], // Donut
            avoidLabelOverlap: false,
            label: {
              show: true,
              position: "outside",
              fontSize: 14,
              formatter: "{b}: {c}",
            },
            emphasis: {
              label: { show: true, fontSize: "18", fontWeight: "bold" },
            },
            labelLine: { show: true },
            data: data.labels.map((label, i) => ({
              value: data.values[i],
              name: label,
            })),
          },
        ],
      }),
    });

    // Render third card (horizontal stacked bar: Finalizados vs Vigentes)
    renderKpiChartCard({
      elementId: "card-kpi-stacked-bar",
      data: {
        labels: ["Contratos"],
        values: [kpiData.finalizados, kpiData.vigentes],
      },
      chartType: "bar",
      cardTitle: "Finalizados vs Vigentes (Stacked, Horizontal)",
      getChartOption: (data) => ({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: { data: ["Finalizados", "Vigentes"] },
        xAxis: { type: "value" },
        yAxis: { type: "category", data: data.labels },
        series: [
          {
            name: "Finalizados",
            type: "bar",
            stack: "contratos",
            label: {
              show: true,
              position: "inside",
              fontSize: 14,
              formatter: "{c}",
            },
            data: [kpiData.finalizados],
            itemStyle: { color: "#FF6F61" },
          },
          {
            name: "Vigentes",
            type: "bar",
            stack: "contratos",
            label: {
              show: true,
              position: "inside",
              fontSize: 14,
              formatter: "{c}",
            },
            data: [kpiData.vigentes],
            itemStyle: { color: "#5470C6" },
          },
        ],
      }),
    });
  })
  .catch((err) => {
    console.error("Erro ao carregar dados:", err);
  });
