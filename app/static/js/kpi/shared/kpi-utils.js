// Shared utilities for KPI components
import getEcharts from "../../util/echarts.js";
import card_kpi from "../card.js";

// BR Design System Color Palette
export const BR_COLORS = {
  // Primary colors
  primary: "#1351b4", // Blue primary
  primaryDark: "#0f4394", // Blue primary dark
  primaryLight: "#4f83cc", // Blue primary light

  // Secondary colors
  secondary: "#10b981", // Green secondary
  secondaryDark: "#059669", // Green secondary dark
  secondaryLight: "#34d399", // Green secondary light

  // Neutral colors
  warning: "#dc3545", // Warm red (instead of orange)
  warningDark: "#c82333", // Dark warm red
  danger: "#ef4444", // Red danger
  dangerDark: "#dc2626", // Red danger dark
  info: "#3b82f6", // Blue info
  infoDark: "#2563eb", // Blue info dark
  success: "#10b981", // Green success
  successDark: "#059669", // Green success dark

  // Additional colors
  yellow: "#eab308", // Yellow
  yellowDark: "#ca8a04", // Yellow dark
};

export const fetchKpiData = async (endpoint = "/kpis/kpi1") => {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Erro ao carregar dados do KPI");
  return res.json();
};

export const getBaseChartOption = ({
  chartType,
  cardTitle,
  labels,
  values,
}) => {
  if (chartType === "pie") {
    return {
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { show: false }, // Hide legend by default
      grid: { left: 40, right: 40, bottom: 40, top: 40, containLabel: true },
      series: [
        {
          name: cardTitle,
          type: "pie",
          radius: ["40%", "65%"],
          center: ["50%", "50%"], // Center the pie since no legend
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "outside",
            fontSize: 12,
            formatter: "{b}: {c}",
          },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: "bold" },
          },
          labelLine: { show: true, length: 15, length2: 10 },
          data: labels.map((label, i) => ({ value: values[i], name: label })),
        },
      ],
    };
  }
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 20, right: 30, bottom: 60, top: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { show: true, rotate: 45, fontSize: 11, margin: 10 },
    },
    yAxis: {
      type: "value",
      axisLabel: { show: true, fontSize: 11 },
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
};

export const renderKpiCard = async ({
  containerId,
  cardTitle,
  cardSubtitle = "",
  icon = "",
  chartType = "bar",
  labels = [],
  values = [],
  isKPI10 = false,
  customOption,
}) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    card_kpi.cardHeader({
      titulo: cardTitle,
      subtitulo: cardSubtitle,
      isKPI10: isKPI10,
    }) +
    '<div class="kpi-chart-inner" style="width:100%;min-height:100px;height:300px;padding:10px;"></div>';

  const chartDiv = container.querySelector(".kpi-chart-inner");
  chartDiv.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;">
      <div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status" aria-label="Carregando..."></div>
    </div>`;

  chartDiv.innerHTML = "";
  const echartsDiv = document.createElement("div");
  echartsDiv.style.width = "100%";
  echartsDiv.style.height = "280px"; // Slightly smaller to account for padding
  chartDiv.appendChild(echartsDiv);

  let option = getBaseChartOption({ chartType, cardTitle, labels, values });
  if (typeof customOption === "function") {
    option = customOption(labels, values, option);
  }

  const echarts = await getEcharts();
  const chart = echarts.init(echartsDiv);
  chart.setOption(option);
  chart.resize();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => chart.resize(), 150);
  });

  // Store chart instance by container id for dropdown menu access
  if (!window.kpiCharts) window.kpiCharts = {};
  window.kpiCharts[containerId] = chart;

  // Store chart data for type switching
  if (!window.kpiChartData) window.kpiChartData = {};
  window.kpiChartData[containerId] = { labels, values, cardTitle };
};

/**
 * Display a value in an H2 element inside a container.
 * @param {string} containerId - DOM container ID.
 * @param {string|number} value - Value to display.
 */
export const displayValueInH2 = (containerId, value) => {
  const container = document.getElementById(containerId);
  if (container) {
    container.textContent = value;
  }
};

/**
 * Show error message in KPI containers
 * @param {string[]} containerIds - Array of container IDs to show error in
 * @param {Error} error - The error to display
 */
export const showKpiError = (containerIds, error) => {
  containerIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `<div class='alert alert-danger'>${error.message}</div>`;
    }
  });
  console.error("Erro ao carregar dados:", error);
};
