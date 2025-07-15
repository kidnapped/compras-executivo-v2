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
    displayValueInH2(
      "kpi12-vigencia-media",
      `${kpiData.media_anos_vigencia} anos e ${kpiData.media_meses_vigencia} meses`
    );
    displayValueInH2(
      "kpi12-tempo-execucao",
      `${kpiData.media_dias_execucao} dias`
    );

    // Add CSS to ensure consistent card sizing
    if (!document.getElementById("kpi12-card-styles")) {
      const style = document.createElement("style");
      style.id = "kpi12-card-styles";
      style.textContent = `
        #kpi12-vigencia-media {
          line-height: 1.1 !important;
          min-height: 20px;
          display: flex;
          align-items: left;
          justify-content: center;
        }
        
        #kpi12-total-contratos,
        #kpi12-tempo-execucao {
          min-height: 20px;
          display: flex;
          align-items: lef;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          #kpi12-vigencia-media {
            font-size: 1.8rem !important;
          }
        }
      `;
      document.head.appendChild(style);
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
