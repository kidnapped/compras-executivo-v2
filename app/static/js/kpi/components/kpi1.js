// KPI 1 - Basic KPI metrics
import {
  fetchKpiData,
  renderKpiCard,
  displayValueInH2,
  showKpiError,
  BR_COLORS,
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
      customOption: (labels, values, option) => {
        // Custom colors - yellow and green
        const customColors = [BR_COLORS.yellow, BR_COLORS.success]; // Yellow and Green
        
        return {
          ...option,
          color: customColors,
          series: [
            {
              ...option.series[0],
              label: {
                show: true,
                position: "outside",
                fontSize: 12,
                formatter: "{b}: {c}",
                color: "#333"
              },
              labelLine: {
                show: true,
                length: 15,
                length2: 10
              },
              data: labels.map((label, i) => ({
                value: values[i],
                name: label,
                itemStyle: {
                  color: customColors[i % customColors.length]
                }
              }))
            }
          ],
          legend: {
            show: false // Hide legend
          }
        };
      }
    });
    setupKpiDropdown("card-kpi-total-vigentes");

    await renderKpiCard({
      containerId: "card-kpi-stacked-bar",
      cardTitle: "Finalizados vs Vigentes",
      chartType: "pie",
      labels: ["Finalizados", "Vigentes"],
      values: [kpiData.finalizados, kpiData.vigentes],
      customOption: (labels, values, option) => {
        // Custom options for full pie chart (not donut)
        const customColors = [BR_COLORS.warning, BR_COLORS.success]; // Warm red and Green
        
        return {
          ...option,
          color: customColors,
          series: [
            {
              ...option.series[0],
              radius: ["0%", "70%"], // Full pie (starts from center)
              center: ["50%", "50%"], // Center the pie
              data: labels.map((label, i) => ({
                value: values[i],
                name: label,
                itemStyle: {
                  color: customColors[i % customColors.length]
                }
              })),
              label: {
                show: true,
                position: "outside",
                fontSize: 14,
                fontWeight: "bold",
                formatter: "{b}: {c}\n({d}%)",
                color: "#333"
              },
              labelLine: {
                show: true,
                length: 20,
                length2: 15,
                lineStyle: {
                  width: 2
                }
              }
            }
          ],
          legend: {
            show: false // Hide legend
          }
        };
      }
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
