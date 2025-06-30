// KPI 10 - Contratos com Valor Global Maior que Inicial
import {
  fetchKpiData,
  renderKpiCard,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi10 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi10");

    // Get top 10 contracts for the chart (limit to prevent overcrowding)
    const topContracts = kpiData.contratos.slice(0, 10);

    await renderKpiCard({
      containerId: "card-kpi10-stacked-bar",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "bar",
      labels: topContracts.map((c) => c.numero),
      values: topContracts.map((c) => c.valor_global),
      isKPI10: true,
      customOption: (labels, values, baseOption) => {
        // Create stacked bar chart option
        return {
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "shadow",
            },
            formatter: function (params) {
              let result = params[0].name + "<br/>";
              let total = 0;
              params.forEach((param) => {
                result +=
                  param.seriesName +
                  ": " +
                  formatCurrency(param.value) +
                  "<br/>";
                total += param.value;
              });
              result += "Total: " + formatCurrency(total);
              return result;
            },
          },
          legend: {
            data: ["Valor Inicial", "Diferença (Aditivos)"],
            top: 20,
          },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "15%",
            top: "15%",
            containLabel: true,
          },
          xAxis: {
            type: "category",
            data: labels,
            axisLabel: {
              rotate: 45,
              fontSize: 10,
              interval: 0,
            },
          },
          yAxis: {
            type: "value",
            axisLabel: {
              formatter: function (value) {
                return formatCurrencyShort(value);
              },
            },
          },
          series: [
            {
              name: "Valor Inicial",
              type: "bar",
              stack: "total",
              emphasis: {
                focus: "series",
              },
              data: topContracts.map((c) => c.valor_inicial),
              itemStyle: {
                color: "#5470C6",
              },
              label: {
                show: true,
                position: "inside",
                formatter: function (params) {
                  // Only show label if value is significant enough to fit
                  if (params.value > 1000000) {
                    return formatCurrencyShort(params.value);
                  }
                  return "";
                },
                fontSize: 10,
                color: "#fff",
                fontWeight: "bold",
              },
            },
            {
              name: "Diferença (Aditivos)",
              type: "bar",
              stack: "total",
              emphasis: {
                focus: "series",
              },
              data: topContracts.map((c) => c.diferenca_valores),
              itemStyle: {
                color: "#91CC75",
              },
              label: {
                show: true,
                position: "inside",
                formatter: function (params) {
                  // Only show label if value is significant enough to fit
                  if (params.value > 1000000) {
                    return formatCurrencyShort(params.value);
                  }
                  return "";
                },
                fontSize: 10,
                color: "#fff",
                fontWeight: "bold",
              },
            },
          ],
        };
      },
    });

    // Store the original KPI data for chart switching
    if (!window.kpiChartData) window.kpiChartData = {};
    if (window.kpiChartData["card-kpi10-stacked-bar"]) {
      window.kpiChartData["card-kpi10-stacked-bar"].kpi10Data = kpiData;
    }

    setupKpiDropdown("card-kpi10-stacked-bar");
  } catch (err) {
    showKpiError(["card-kpi10-stacked-bar"], err);
  }
};

// Helper function to format currency
function formatCurrency(value) {
  if (typeof value !== "number") {
    return value;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Helper function to format currency in short form for axis labels
function formatCurrencyShort(value) {
  if (value >= 1000000000) {
    return "R$ " + (value / 1000000000).toFixed(1) + "B";
  } else if (value >= 1000000) {
    return "R$ " + (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return "R$ " + (value / 1000).toFixed(1) + "K";
  }
  return "R$ " + value.toFixed(0);
}
