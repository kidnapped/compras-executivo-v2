// KPI 5 - Contratos por Região
import {
  fetchKpiData,
  renderKpiCard,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi5 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi5");

    await renderKpiCard({
      containerId: "card-kpi-contratos-por-regiao",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "bar",
      labels: kpiData.regioes.map((r) => r.regiao),
      values: kpiData.regioes.map((r) => r.total_contratos),
      customOption: (labels, values, option) => {
        return {
          ...option,
          legend: { show: false },
          xAxis: {
            ...option.xAxis,
            axisLabel: { show: true, rotate: 0, fontSize: 14 },
          },
        };
      },
    });

    setupKpiDropdown("card-kpi-contratos-por-regiao");
  } catch (err) {
    showKpiError(["card-kpi-contratos-por-regiao"], err);
  }
};
