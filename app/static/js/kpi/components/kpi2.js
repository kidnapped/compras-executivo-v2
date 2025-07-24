// KPI 2 - Contratos sem licitação
import {
  fetchKpiData,
  renderKpiCard,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi2 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi2");

    await renderKpiCard({
      containerId: "card-kpi-sem-licitacao",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "pie",
      colorPalette: "status", // Use status colors for contract compliance
      labels: ["Total contratos", "Sem Licitacao"],
      values: [kpiData.total_contratos, kpiData.contratos_sem_licitacao],
    });

    setupKpiDropdown("card-kpi-sem-licitacao");
  } catch (err) {
    showKpiError(["card-kpi-sem-licitacao"], err);
  }
};
