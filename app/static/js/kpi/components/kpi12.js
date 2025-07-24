// KPI 12 - Análise de Vigência de Contratos
import {
  fetchKpiData,
  displayValueInH2,
  showKpiError,
} from "../shared/kpi-utils.js";

export const initKpi12 = async () => {
  try {
    console.log("Initializing KPI 12 - Análise de Vigência...");

    const kpiData = await fetchKpiData("/kpis/kpi12");

    // Display the three key metrics in their respective containers
    displayValueInH2("kpi12-total-contratos", kpiData.total_contratos);
    // Convert meses to fractional years and show only the first decimal digit as an integer (e.g., 0.42 -> 4, 0.8 -> 8)
    const mesesComoAno = Math.round((kpiData.media_meses_vigencia / 12) * 10);
    displayValueInH2(
      "kpi12-vigencia-media",
      `${kpiData.media_anos_vigencia}, ${mesesComoAno} anos`
    );
    displayValueInH2(
      "kpi12-tempo-execucao",
      `${kpiData.media_dias_execucao} dias`
    );

    // Show the KPI cards section and hide loading now that data is loaded
    const kpiCardsRow = document.getElementById("kpi-cards-row");
    const kpiLoadingSection = document.getElementById("kpi-loading-section");

    if (kpiCardsRow && kpiLoadingSection) {
      // Hide loading section
      kpiLoadingSection.classList.add("d-none");

      // Show KPI cards section
      kpiCardsRow.classList.remove("d-none");

      // Add a smooth fade-in effect
      kpiCardsRow.style.opacity = "0";
      kpiCardsRow.style.transition = "opacity 0.5s ease-in-out";
      setTimeout(() => {
        kpiCardsRow.style.opacity = "1";
      }, 100);
    }

    console.log("KPI 12 initialized successfully!");
  } catch (error) {
    console.error("Error initializing KPI 12:", error);
    showKpiError(
      ["kpi12-total-contratos", "kpi12-vigencia-media", "kpi12-tempo-execucao"],
      error
    );
  }
};
