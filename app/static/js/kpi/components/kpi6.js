// KPI 6 - Contratos com Aditivos
import {
  fetchKpiData,
  renderKpiCard,
  displayValueInH2,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi6 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi6");

    await renderKpiCard({
      containerId: "card-kpi-contratos-com-aditivos",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "pie",
      labels: ["Com Aditivos", "Total Ativos"],
      values: [kpiData.contratos_com_aditivos, kpiData.total_contratos_ativos],
      customOption: (labels, values, option) => {
        return {
          ...option,
          legend: { show: false },
        };
      },
    });

    setupKpiDropdown("card-kpi-contratos-com-aditivos");

    // Optionally display the percentual in an H2 or other element
    displayValueInH2(
      "percentual-com-aditivos",
      kpiData.percentual_com_aditivos + "%"
    );
  } catch (err) {
    showKpiError(["card-kpi-contratos-com-aditivos"], err);
  }
};
