// KPI 1 - Basic KPI metrics
import {
  fetchKpiData,
  renderKpiCard,
  displayValueInH2,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi1 = async () => {
  try {
    const kpiData = await fetchKpiData();

    await renderKpiCard({
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
    setupKpiDropdown("card-kpi-exercicio-container");

    await renderKpiCard({
      containerId: "card-kpi-total-vigentes",
      cardTitle: "Total vs Vigentes",
      chartType: "pie",
      labels: ["Total", "Vigentes"],
      values: [kpiData.quantidade_total, kpiData.vigentes],
    });
    setupKpiDropdown("card-kpi-total-vigentes");

    await renderKpiCard({
      containerId: "card-kpi-stacked-bar",
      cardTitle: "Finalizados vs Vigentes",
      chartType: "pie",
      labels: ["Finalizados", "Vigentes"],
      values: [kpiData.finalizados, kpiData.vigentes],
    });
    setupKpiDropdown("card-kpi-stacked-bar");

    displayValueInH2("outros-value-container", kpiData.outros);
    displayValueInH2("criticos", kpiData.criticos);
  } catch (err) {
    showKpiError(
      [
        "card-kpi-exercicio-container",
        "card-kpi-total-vigentes",
        "card-kpi-stacked-bar",
      ],
      err
    );
  }
};
