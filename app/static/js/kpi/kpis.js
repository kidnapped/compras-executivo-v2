import * as echarts from "echarts";
import card_kpi from "./card.js";

// --- Centralized KPI Data Fetching ---
async function fetchKpiData(endpoint = "/kpis/kpi1") {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Erro ao carregar");
  return await res.json();
}

// --- Shared Chart Option Template ---
function getBaseChartOption({ chartType, cardTitle, labels, values }) {
  if (chartType === "pie") {
    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { orient: "vertical", left: "left" },
      grid: { left: 30, right: 30, bottom: 30, top: 30, containLabel: true },
      series: [
        {
          name: cardTitle,
          type: "pie",
          radius: ["50%", "70%"],
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
          data: labels.map((label, i) => ({ value: values[i], name: label })),
        },
      ],
    };
  }
  // Default: bar/stacked bar
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 5, right: 30, bottom: 80, top: 30, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { show: true, rotate: 45, fontSize: 13 },
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
        data: values,
        itemStyle: { color: "#5470C6" },
        barMaxWidth: 50,
        label: {
          show: true,
          position: "top",
          fontSize: 14,
          color: "#333",
          formatter: "{c}",
        },
      },
    ],
  };
}

// --- Reusable Card Rendering Function ---
function renderKpiCard({
  containerId,
  cardTitle,
  cardSubtitle = "",
  icon,
  chartType = "bar",
  labels,
  values,
  customOption,
}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // Render card header and chart area
  container.innerHTML =
    card_kpi.cardHeader({
      titulo: cardTitle,
      subtitulo: cardSubtitle,
      icone: icon,
    }) +
    '<div class="kpi-chart-inner" style="width:100%;min-height:100px;height:300px;"></div>';
  const chartDiv = container.querySelector(".kpi-chart-inner");
  chartDiv.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;"><div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status"><span class="sr-only">Loading...</span></div></div>`;
  // Remove setTimeout, render immediately
  chartDiv.innerHTML = "";
  const echartsDiv = document.createElement("div");
  echartsDiv.style.width = "100%";
  echartsDiv.style.height = "300px";
  chartDiv.appendChild(echartsDiv);
  let option = getBaseChartOption({ chartType, cardTitle, labels, values });
  if (typeof customOption === "function") {
    option = customOption(labels, values, option);
  }
  const chart = echarts.init(echartsDiv);
  chart.setOption(option);
  chart.resize();
  window.addEventListener("resize", () => chart.resize());
}

// --- Usage Example: Fetch Once, Render Many ---
fetchKpiData()
  .then((kpiData) => {
    // Bar chart: All categories
    renderKpiCard({
      containerId: "card-kpi-exercicio-container",
      cardTitle: "KPI Exercício",
      cardSubtitle: kpiData.subtitulo,
      chartType: "bar",
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
        kpiData.vigentes,
        kpiData.finalizados,
        kpiData.criticos,
        kpiData.dias120,
        kpiData.dias90,
        kpiData.dias45,
        kpiData.outros,
      ],
    });

    // Donut chart: Total vs Vigentes
    renderKpiCard({
      containerId: "card-kpi-total-vigentes",
      cardTitle: "Total vs Vigentes",
      chartType: "pie",
      labels: ["Total", "Vigentes"],
      values: [kpiData.quantidade_total, kpiData.vigentes],
    });

    // Horizontal stacked bar: Finalizados vs Vigentes
    renderKpiCard({
      containerId: "card-kpi-stacked-bar",
      cardTitle: "Finalizados vs Vigentes (Stacked, Horizontal)",
      chartType: "pie",
      labels: ["Contratos"],
      values: [kpiData.finalizados, kpiData.vigentes],
      customOption: (labels, values, option) => ({
        ...option,
        grid: { left: 80, right: 30, bottom: 30, top: 30, containLabel: true },
        xAxis: { type: "value" },
        yAxis: { type: "category", data: labels },
        legend: { data: ["Finalizados", "Vigentes"] },
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

    // Display 'outros' value as a string in a chosen container
    displayValueInH2("outros-value-container", kpiData.outros);
  })
  .catch((err) => {
    console.error("Erro ao carregar dados:", err);
  });

// --- Utility: Display value in H2 ---
function displayValueInH2(containerId, value) {
  const container = document.getElementById(containerId);
  if (container) {
    let h2 = container.querySelector("h2");
    if (!h2) {
      h2 = document.createElement("h2");
      container.appendChild(h2);
    }
    h2.textContent = value;
  }
}

// Export as module for compatibility with app.js
export default {
  fetchKpiData,
  renderKpiCard,
  getBaseChartOption,
  displayValueInH2,
};
