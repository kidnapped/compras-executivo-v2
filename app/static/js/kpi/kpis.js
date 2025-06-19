import getEcharts from "../util/echarts.js";
import card_kpi from "./card.js";
import * as echarts from "https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.esm.min.js";

export const fetchKpiData = async (endpoint = "/kpis/kpi1") => {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Erro ao carregar dados do KPI");
  return res.json();
};

export const getBaseChartOption = ({ chartType, cardTitle, labels, values }) => {
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
            label: { show: true, fontSize: 18, fontWeight: "bold" },
          },
          labelLine: { show: true },
          data: labels.map((label, i) => ({ value: values[i], name: label })),
        },
      ],
    };
  }
  return {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 5, right: 30, bottom: 5, top: 30, containLabel: true },
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
};

export const renderKpiCard = async ({
  containerId,
  cardTitle,
  cardSubtitle = "",
  icon = "",
  chartType = "bar",
  labels = [],
  values = [],
  customOption,
}) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    card_kpi.cardHeader({ titulo: cardTitle, subtitulo: cardSubtitle, icone: icon }) +
    card_kpi.cardHeader({
      titulo: cardTitle,
      subtitulo: cardSubtitle,
    }) +
    '<div class="kpi-chart-inner" style="width:100%;min-height:100px;height:300px;"></div>';

  const chartDiv = container.querySelector(".kpi-chart-inner");
  chartDiv.innerHTML =
    `<div style="display:flex;justify-content:center;align-items:center;height:100%;">
      <div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status" aria-label="Carregando..."></div>
    </div>`;

  chartDiv.innerHTML = "";
  const echartsDiv = document.createElement("div");
  echartsDiv.style.width = "100%";
  echartsDiv.style.height = "300px";
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

fetchKpiData("/kpis/kpi2")
  .then((kpiData) => {
    renderKpiCard({
      containerId: "card-kpi-sem-licitacao",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "pie",
      labels: ["Total contratos", "Sem Licitacao"],
      values: [kpiData.total_contratos, kpiData.contratos_sem_licitacao],
    });
  })
  .catch((err) => {
    // Show error in UI if possible
    const errorContainers = ["card-kpi-sem-licitacao"];
    errorContainers.forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML = `<div class='alert alert-danger'>${err.message}</div>`;
    });
    console.error("Erro ao carregar dados:", err);
  });

// --- Usage Example: Fetch Once, Render Many ---
fetchKpiData()
  .then((kpiData) => {
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

    await renderKpiCard({
      containerId: "card-kpi-total-vigentes",
      cardTitle: "Total vs Vigentes",
      chartType: "pie",
      labels: ["Total", "Vigentes"],
      values: [kpiData.quantidade_total, kpiData.vigentes],
    });

    await renderKpiCard({
      containerId: "card-kpi-stacked-bar",
      cardTitle: "Finalizados vs Vigentes",
      chartType: "pie",
      labels: ["Finalizados", "Vigentes"],
      values: [kpiData.finalizados, kpiData.vigentes],
    });

    displayValueInH2("outros-value-container", kpiData.outros);
    displayValueInH2("criticos", kpiData.criticos);
  } catch (err) {
    const errorContainers = [
      "card-kpi-exercicio-container",
      "card-kpi-total-vigentes",
      "card-kpi-stacked-bar",
    ];
    errorContainers.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `<div class='alert alert-danger'>${err.message}</div>`;
      }
    });
    console.error("Erro ao carregar dados:", err);
  });

// Expose getBaseChartOption globally for dropdown use
window.getBaseChartOption = getBaseChartOption;
