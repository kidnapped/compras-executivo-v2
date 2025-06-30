// KPI 7 - Contratos com Cláusulas
import {
  fetchKpiData,
  renderKpiCard,
  displayValueInH2,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi7 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi7");

    await renderKpiCard({
      containerId: "card-kpi-contratos-com-clausulas",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "pie",
      labels: ["Com Cláusulas", "Total"],
      values: [kpiData.total_com_clausulas, kpiData.total_contratos],
      customOption: (labels, values, option) => {
        return {
          ...option,
          legend: { show: false },
        };
      },
    });

    setupKpiDropdown("card-kpi-contratos-com-clausulas");

    // Optionally display the percentual in an H2 or other element
    displayValueInH2(
      "percentual-com-clausulas",
      kpiData.percentual_com_clausulas + "%"
    );
  } catch (err) {
    showKpiError(["card-kpi-contratos-com-clausulas"], err);
  }
};
