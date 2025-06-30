// KPI 3 - Contratos por Categoria
import {
  fetchKpiData,
  renderKpiCard,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi3 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi3");

    await renderKpiCard({
      containerId: "card-kpi-contratos-por-area",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "pie",
      labels: kpiData.categorias.map(
        (c) => c.categoria_nome || `Categoria ${c.categoria_id}`
      ),
      values: kpiData.categorias.map((c) => c.total_contratos),
      customOption: (labels, values, option) => {
        // Hide legend for this chart
        return {
          ...option,
          legend: { show: false },
        };
      },
    });

    setupKpiDropdown("card-kpi-contratos-por-area");
  } catch (err) {
    showKpiError(["card-kpi-por-categoria"], err);
  }
};
