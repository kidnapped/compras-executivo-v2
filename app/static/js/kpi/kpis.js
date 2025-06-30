// Main KPI initialization file - orchestrates all KPI components
import { getBaseChartOption } from "./shared/kpi-utils.js";

// Import individual KPI components
import { initKpi1 } from "./components/kpi1.js";
import { initKpi2 } from "./components/kpi2.js";
import { initKpi3 } from "./components/kpi3.js";
import { initKpi4 } from "./components/kpi4.js";
import { initKpi5 } from "./components/kpi5.js";
import { initKpi6 } from "./components/kpi6.js";
import { initKpi7 } from "./components/kpi7.js";
import { initKpi8 } from "./components/kpi8.js";
import { initKpi9 } from "./components/kpi9.js";
import { initKpi10 } from "./components/kpi10.js";

// Expose shared utilities globally for backward compatibility
window.getBaseChartOption = getBaseChartOption;

// Initialize all KPIs
const initializeAllKpis = async () => {
  console.log("Initializing all KPIs...");

  try {
    // Initialize KPIs in parallel for better performance
    await Promise.all([
      initKpi1(),
      initKpi2(),
      initKpi3(),
      initKpi4(),
      initKpi5(),
      initKpi6(),
      initKpi7(),
      initKpi8(),
      initKpi9(),
      initKpi10(),
    ]);

    console.log("All KPIs initialized successfully!");
  } catch (error) {
    console.error("Error initializing KPIs:", error);
  }
};

// Start initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAllKpis);
} else {
  initializeAllKpis();
}
