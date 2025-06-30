// KPI 4 - Top Fornecedores
import {
  fetchKpiData,
  renderKpiCard,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi4 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi4");

    await renderKpiCard({
      containerId: "card-kpi-top-fornecedores",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "bar",
      labels: kpiData.fornecedores.map(
        (f) => f.fornecedor_nome || `Fornecedor ${f.fornecedor_id}`
      ),
      values: kpiData.fornecedores.map((f) => {
        // Remove 'R$ ' and '.' for chart, parse as float
        const val = (f.total_valor_contratos || "")
          .replace(/R\$\s?/g, "")
          .replace(/\./g, "")
          .replace(",", ".");
        return parseFloat(val) || 0;
      }),
      customOption: (labels, values, option) => {
        // Hide legend for this chart
        return {
          ...option,
          legend: { show: false },
          xAxis: {
            ...option.xAxis,
            axisLabel: { show: true, rotate: 30, fontSize: 12 },
          },
        };
      },
    });

    setupKpiDropdown("card-kpi-top-fornecedores");
  } catch (err) {
    showKpiError(["card-kpi-top-fornecedores"], err);
  }
};
