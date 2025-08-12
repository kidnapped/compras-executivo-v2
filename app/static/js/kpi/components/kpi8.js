// KPI 8 - Mapa por Estado
import {
  fetchKpiData,
  getBaseChartOption,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";
import { brazilStatesGeoJson } from "../../common/brazil_states_geojson.js";
import getEcharts from "../../util/echarts.js";
import card_kpi from "../card.js";

export const initKpi8 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi8");
    const containerId = "card-kpi-por-estado";
    const container = document.getElementById(containerId);
    if (!container) return;

    // Prepare data for both chart types
    const mapData = (kpiData.estados || []).map((estado) => ({
      name: estado.uf,
      value: Number(estado.total_contratos) || 0,
    }));

    const barLabels = mapData.map((d) => d.name);
    const barValues = mapData.map((d) => d.value);

    // Store data for chart type switching
    if (!window.kpiChartData) window.kpiChartData = {};
    window.kpiChartData[containerId] = {
      labels: barLabels,
      values: barValues,
      cardTitle: kpiData.titulo || "KPI 8: Mapa por Estado",
      mapData: mapData,
      isMap: true, // Default to map view
    };
    container.innerHTML =
      card_kpi.cardHeader({
        titulo: kpiData.titulo || "KPI 8: Mapa por Estado",
        subtitulo: kpiData.subtitulo || "",
        isKPI8: true,
      }) +
      '<div class="kpi-chart-inner" style="width:100%;height:calc(100% - 40px);padding:20px 20px 60px 20px;overflow:hidden;box-sizing:border-box;"></div>';

    const chartDiv = container.querySelector(".kpi-chart-inner");
    chartDiv.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;">
      <div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status" aria-label="Carregando..."></div>
    </div>`;

    chartDiv.innerHTML = "";
    const echartsDiv = document.createElement("div");
    echartsDiv.style.width = "calc(100% - 40px)"; // Account for left/right padding
    echartsDiv.style.height = "calc(100% - 80px)"; // Account for top/bottom padding (20px + 60px)
    echartsDiv.style.maxWidth = "100%";
    echartsDiv.style.maxHeight = "100%";
    echartsDiv.style.overflow = "hidden";
    echartsDiv.style.margin = "0 auto"; // Center the chart
    chartDiv.appendChild(echartsDiv);

    const echarts = await getEcharts();

    // Function to render map
    const renderMap = () => {
      echarts.registerMap("BR", brazilStatesGeoJson);
      const valuesArray = mapData.map((d) => d.value);
      const minValue = valuesArray.length ? Math.min(...valuesArray) : 0;
      const maxValue = valuesArray.length ? Math.max(...valuesArray) : 0;

      return {
        tooltip: {
          trigger: "item",
          formatter: (params) =>
            `${params.name}: ${
              typeof params.value === "number" && !isNaN(params.value)
                ? params.value.toLocaleString()
                : 0
            }`,
        },
        visualMap: {
          min: minValue,
          max: maxValue,
          left: "left",
          top: "bottom",
          text: ["Alto", "Baixo"],
          inRange: {
            color: ["#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
          },
          calculable: true,
        },
        series: [
          {
            name: kpiData.titulo || "KPI 8",
            type: "map",
            map: "BR",
            nameProperty: "PK_sigla",
            roam: true,
            aspectScale: 0.9,
            zoom: 1.2,
            center: [-50, -15],
            label: {
              show: true,
              fontSize: 8,
              color: "#000",
              formatter: (params) => `${params.name}\n${params.value || 0}`,
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 10,
                fontWeight: "bold",
              },
            },
            data: mapData,
          },
        ],
      };
    };

    // Initial render (map by default)
    const chart = echarts.init(echartsDiv);

    // Register the map initially
    echarts.registerMap("BR", brazilStatesGeoJson);

    const initialOption = renderMap();
    chart.setOption(initialOption);
    chart.resize();

    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentChart = window.kpiCharts[containerId];
        if (currentChart) {
          currentChart.resize();
        }
      }, 150);
    });

    // Store chart instance
    if (!window.kpiCharts) window.kpiCharts = {};
    window.kpiCharts[containerId] = chart;

    // Set up KPI 8 dropdown functionality
    setupKpiDropdown(containerId);
  } catch (err) {
    showKpiError(["card-kpi-por-estado"], err);
  }
};
