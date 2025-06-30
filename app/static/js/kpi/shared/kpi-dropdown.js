// KPI dropdown functionality and chart switching
import { getBaseChartOption } from "./kpi-utils.js";
import { brazilStatesGeoJson } from "../brazil_states_geojson.js";
import getEcharts from "../../util/echarts.js";

// Helper function to format currency
function formatCurrency(value) {
  if (typeof value !== "number") {
    return value;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Helper function to format currency in short form for axis labels
function formatCurrencyShort(value) {
  if (value >= 1000000000) {
    return "R$ " + (value / 1000000000).toFixed(1) + "B";
  } else if (value >= 1000000) {
    return "R$ " + (value / 1000000).toFixed(1) + "M";
  } else if (value >= 1000) {
    return "R$ " + (value / 1000).toFixed(1) + "K";
  }
  return "R$ " + value.toFixed(0);
}

// Universal KPI dropdown setup function
export const setupKpiDropdown = (containerId) => {
  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const dropdownBtn = container.querySelector(".kpi-dropdown-btn");
    const dropdownMenu = container.querySelector(".kpi-dropdown-menu");
    const mapOption = container.querySelector(".kpi-map-option");
    const calendarOption = container.querySelector(".kpi-calendar-option");
    const barOption = container.querySelector(".kpi-bar-option");
    const pieOption = container.querySelector(".kpi-pie-option");
    const lineOption = container.querySelector(".kpi-line-option");
    const showDataOption = container.querySelector(".kpi-show-data-option");
    const exportImageOption = container.querySelector(
      ".kpi-export-image-option"
    );

    if (dropdownBtn && dropdownMenu) {
      // Toggle dropdown visibility
      dropdownBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Close any other open dropdowns
        document
          .querySelectorAll(
            ".kpi-dropdown-menu, .kpi8-dropdown-menu, .kpi9-dropdown-menu, .kpi10-dropdown-menu"
          )
          .forEach((menu) => {
            if (menu !== dropdownMenu) {
              menu.style.display = "none";
            }
          });

        // Toggle this dropdown
        dropdownMenu.style.display =
          dropdownMenu.style.display === "none" ? "block" : "none";
      });

      // Handle map option click (only for KPI 8)
      if (mapOption) {
        mapOption.addEventListener("click", (e) => {
          e.preventDefault();
          switchKpiChartType(containerId, "map");
          dropdownMenu.style.display = "none";
        });
      }

      // Handle calendar option click (only for KPI 9)
      if (calendarOption) {
        calendarOption.addEventListener("click", (e) => {
          e.preventDefault();
          switchKpiChartType(containerId, "calendar");
          dropdownMenu.style.display = "none";
        });
      }

      // Handle bar chart option click
      if (barOption) {
        barOption.addEventListener("click", (e) => {
          e.preventDefault();
          switchKpiChartType(containerId, "bar");
          dropdownMenu.style.display = "none";
        });
      }

      // Handle pie chart option click
      if (pieOption) {
        pieOption.addEventListener("click", (e) => {
          e.preventDefault();
          switchKpiChartType(containerId, "pie");
          dropdownMenu.style.display = "none";
        });
      }

      // Handle line chart option click
      if (lineOption) {
        lineOption.addEventListener("click", (e) => {
          e.preventDefault();
          switchKpiChartType(containerId, "line");
          dropdownMenu.style.display = "none";
        });
      }

      // Handle show data option click
      if (showDataOption) {
        showDataOption.addEventListener("click", (e) => {
          e.preventDefault();
          showKpiData(containerId);
          dropdownMenu.style.display = "none";
        });
      }

      // Handle export image option click
      if (exportImageOption) {
        exportImageOption.addEventListener("click", (e) => {
          e.preventDefault();
          exportKpiImage(containerId);
          dropdownMenu.style.display = "none";
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (
          !e.target.closest(".kpi-dropdown-btn") &&
          !e.target.closest(".kpi8-dropdown-btn") &&
          !e.target.closest(".kpi9-dropdown-btn") &&
          !e.target.closest(".kpi10-dropdown-btn") &&
          !e.target.closest(".kpi-dropdown-menu") &&
          !e.target.closest(".kpi8-dropdown-menu") &&
          !e.target.closest(".kpi9-dropdown-menu") &&
          !e.target.closest(".kpi10-dropdown-menu")
        ) {
          dropdownMenu.style.display = "none";
        }
      });
    }
  }, 100);
};

// Universal chart switching function
export const switchKpiChartType = (containerId, newType) => {
  console.log(`Switching KPI chart to ${newType} for container ${containerId}`);

  const chartData = window.kpiChartData[containerId];
  if (!chartData) {
    console.error("Chart data not found for container:", containerId);
    return;
  }

  const chart = window.kpiCharts[containerId];
  if (!chart) {
    console.error("Chart instance not found for container:", containerId);
    return;
  }

  // Use getEcharts() to get the echarts instance
  getEcharts()
    .then((echarts) => {
      let newOption;

      if (newType === "map" && containerId === "card-kpi-por-estado") {
        // Special handling for KPI 8 map - need to dispose and recreate for map
        console.log(
          "Switching to map - disposing chart for map registration..."
        );
        chart.dispose();

        const container = document.getElementById(containerId);
        const echartsDiv = container.querySelector(".kpi-chart-inner > div");
        const newChart = echarts.init(echartsDiv);

        console.log("Registering map...");
        echarts.registerMap("BR", brazilStatesGeoJson);
        const mapData =
          chartData.mapData ||
          chartData.labels.map((label, i) => ({
            name: label,
            value: chartData.values[i],
          }));

        const valuesArray = mapData.map((d) => d.value);
        const minValue = valuesArray.length ? Math.min(...valuesArray) : 0;
        const maxValue = valuesArray.length ? Math.max(...valuesArray) : 0;

        newOption = {
          animation: true,
          animationDuration: 1000,
          animationEasing: "cubicOut",
          tooltip: {
            trigger: "item",
            formatter: (params) =>
              `${params.name}: ${
                typeof params.value === "number" && !isNaN(params.value)
                  ? params.value.toLocaleString()
                  : 0
              }`,
          },
          visualMap: {
            min: minValue,
            max: maxValue,
            left: "left",
            top: "bottom",
            text: ["Alto", "Baixo"],
            inRange: {
              color: ["#e0f3f8", "#abd9e9", "#74add1", "#4575b4"],
            },
            calculable: true,
          },
          series: [
            {
              name: chartData.cardTitle,
              type: "map",
              map: "BR",
              nameProperty: "PK_sigla",
              roam: true,
              aspectScale: 0.75,
              zoom: 1.1,
              center: [-50, -15],
              label: {
                show: true,
                fontSize: 8,
                color: "#000",
                formatter: (params) => `${params.name}\n${params.value || 0}`,
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 10,
                  fontWeight: "bold",
                },
              },
              data: mapData,
              animationDuration: 1000,
              animationEasing: "cubicOut",
            },
          ],
        };

        newChart.setOption(newOption);
        newChart.resize();
        window.kpiCharts[containerId] = newChart;
        chartData.isMap = true;
      } else if (
        newType === "calendar" &&
        containerId === "card-kpi-calendar-vencimentos"
      ) {
        // Special handling for KPI 9 calendar - need to dispose and recreate
        console.log("Switching to calendar - disposing chart for calendar...");
        chart.dispose();

        const container = document.getElementById(containerId);
        const echartsDiv = container.querySelector(".kpi-chart-inner > div");
        const newChart = echarts.init(echartsDiv);

        const calendarData = chartData.calendarData || [];

        newOption = {
          animation: true,
          animationDuration: 1000,
          animationEasing: "cubicOut",
          tooltip: {
            trigger: "item",
            formatter: function (params) {
              // For calendar heatmap, params.data is [date, count]
              if (!params.data || !Array.isArray(params.data)) {
                return `${params.name || "Data"}<br/>Nenhum contrato vence`;
              }

              const [date, count] = params.data;

              // Handle empty days or days without data
              if (!count || count === 0) {
                return `${date}<br/>Nenhum contrato vence`;
              }

              let tooltip = `<strong>${date}</strong><br/>`;
              tooltip += `<strong>${count} contrato(s) vencem:</strong><br/>`;

              // Find the contracts for this date from the stored calendar data
              const storedCalendarData = chartData.calendarData || [];
              const dayData = storedCalendarData.find(([d]) => d === date);
              if (dayData && dayData[2] && Array.isArray(dayData[2])) {
                const contracts = dayData[2];

                // Show contract numbers only if 5 or fewer contracts
                if (count <= 5) {
                  contracts.forEach((contract) => {
                    tooltip += `• ${contract.contrato_numero}<br/>`;
                  });
                } else {
                  tooltip += `<em>Muitos contratos (${count})</em><br/>`;
                  tooltip += "<br/><em>Clique para ver detalhes</em>";
                }
              }

              if (count > 5) {
                // Only add this if we didn't already add it above
                if (!tooltip.includes("Clique para ver detalhes")) {
                  tooltip += "<br/><em>Clique para ver detalhes</em>";
                }
              }

              return tooltip;
            },
          },
          visualMap: {
            min: 0,
            max: Math.max(...calendarData.map((d) => d[1]), 5),
            type: "piecewise",
            orient: "horizontal",
            left: "center",
            top: 10,
            itemWidth: 15,
            itemHeight: 10,
            pieces: [
              { min: 0, max: 0, color: "#ebedf0", label: "0 contratos" },
              { min: 1, max: 1, color: "#ff8d7b", label: "1 contrato" },
              { min: 2, max: 3, color: "#fb5a47", label: "2-3 contratos" },
              { min: 4, max: 6, color: "#e52207", label: "4-6 contratos" },
              { min: 7, color: "#b50909", label: "7+ contratos" },
            ],
            text: ["Mais", "Menos"],
            textStyle: {
              fontSize: 11,
            },
          },
          calendar: {
            top: 45,
            left: 50,
            right: 30,
            bottom: 10,
            cellSize: ["auto", 12],
            range: "2025",
            itemStyle: {
              borderWidth: 0.5,
              borderColor: "#ccc",
            },
            yearLabel: { show: false },
            monthLabel: {
              nameMap: [
                "Jan",
                "Fev",
                "Mar",
                "Abr",
                "Mai",
                "Jun",
                "Jul",
                "Ago",
                "Set",
                "Out",
                "Nov",
                "Dez",
              ],
              fontSize: 11,
            },
            dayLabel: {
              nameMap: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
              fontSize: 11,
            },
          },
          series: [
            {
              type: "heatmap",
              coordinateSystem: "calendar",
              data: calendarData.map(([date, count]) => [date, count]),
              label: {
                show: true,
                formatter: function (params) {
                  return params.value[1] > 0 ? params.value[1] : "";
                },
                fontSize: 11,
                fontWeight: "bold",
                color: "#000",
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 20,
                  shadowColor: "rgba(0, 0, 0, 0.8)",
                },
                label: {
                  show: true,
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#000",
                },
              },
              animationDuration: 1000,
              animationEasing: "cubicOut",
            },
          ],
        };

        newChart.setOption(newOption);

        // Re-add click event for contract details
        newChart.on("click", function (params) {
          if (
            params.componentType === "series" &&
            params.seriesType === "heatmap"
          ) {
            const clickedData = calendarData.find(
              (d) => d[0] === params.data[0]
            );

            if (clickedData) {
              const [date, count, contracts] = clickedData;
              if (contracts && contracts.length > 0) {
                window.showContractDetails(date, contracts);
              }
            }
          }
        });

        newChart.resize();
        window.kpiCharts[containerId] = newChart;
        chartData.isCalendar = true;
      } else {
        // Standard chart types - use smooth transition
        console.log(`Rendering ${newType} chart with animation...`);

        // Special handling for KPI 10 line chart
        if (newType === "line" && containerId === "card-kpi10-stacked-bar") {
          // Get the original data for KPI 10
          const kpi10Data = chartData.kpi10Data;
          if (kpi10Data && kpi10Data.contratos) {
            const topContracts = kpi10Data.contratos.slice(0, 10);

            newOption = {
              animation: true,
              animationDuration: 1000,
              animationEasing: "cubicOut",
              tooltip: {
                trigger: "axis",
                axisPointer: {
                  type: "cross",
                  crossStyle: {
                    color: "#999",
                  },
                },
                formatter: function (params) {
                  let result = params[0].name + "<br/>";
                  params.forEach((param) => {
                    result +=
                      param.seriesName +
                      ": " +
                      formatCurrency(param.value) +
                      "<br/>";
                  });
                  return result;
                },
              },
              legend: {
                data: ["Valor Inicial", "Valor Global", "Total Empenhado"],
                top: 20,
              },
              grid: {
                left: "3%",
                right: "4%",
                bottom: "15%",
                top: "15%",
                containLabel: true,
              },
              xAxis: {
                type: "category",
                data: topContracts.map((c) => c.numero),
                axisLabel: {
                  rotate: 45,
                  fontSize: 10,
                  interval: 0,
                },
              },
              yAxis: {
                type: "value",
                axisLabel: {
                  formatter: function (value) {
                    return formatCurrencyShort(value);
                  },
                },
              },
              series: [
                {
                  name: "Valor Inicial",
                  type: "line",
                  data: topContracts.map((c) => c.valor_inicial),
                  smooth: true,
                  lineStyle: {
                    color: "#5470C6",
                    width: 3,
                  },
                  itemStyle: {
                    color: "#5470C6",
                  },
                  symbol: "circle",
                  symbolSize: 6,
                },
                {
                  name: "Valor Global",
                  type: "line",
                  data: topContracts.map((c) => c.valor_global),
                  smooth: true,
                  lineStyle: {
                    color: "#91CC75",
                    width: 3,
                  },
                  itemStyle: {
                    color: "#91CC75",
                  },
                  symbol: "circle",
                  symbolSize: 6,
                },
                {
                  name: "Total Empenhado",
                  type: "line",
                  data: topContracts.map((c) => c.total_valor_empenhado || 0),
                  smooth: true,
                  lineStyle: {
                    color: "#FAC858",
                    width: 3,
                  },
                  itemStyle: {
                    color: "#FAC858",
                  },
                  symbol: "circle",
                  symbolSize: 6,
                },
              ],
            };
          } else {
            // Fallback to standard line chart
            newOption = getBaseChartOption({
              chartType: "line",
              cardTitle: chartData.cardTitle,
              labels: chartData.labels,
              values: chartData.values,
            });
          }
        } else {
          newOption = getBaseChartOption({
            chartType: newType,
            cardTitle: chartData.cardTitle,
            labels: chartData.labels,
            values: chartData.values,
          });
        }

        // Add animation properties
        newOption.animation = true;
        newOption.animationDuration = 1000;
        newOption.animationEasing = "cubicOut";

        // Enhanced animations for series
        if (newOption.series && newOption.series[0]) {
          newOption.series[0].animationDuration = 1000;
          newOption.series[0].animationEasing = "cubicOut";

          // Special animation settings for different chart types
          if (newType === "pie") {
            newOption.series[0].animationDelayUpdate = function (idx) {
              return idx * 100;
            };
          } else if (newType === "bar") {
            newOption.series[0].animationDelay = function (idx) {
              return idx * 50;
            };
          }
        }

        // Use notMerge: true for smooth transitions between different chart types
        chart.setOption(newOption, {
          notMerge: true,
          lazyUpdate: false,
        });

        chartData.isMap = false;
        chartData.isCalendar = false;
      }

      console.log("Chart switched successfully with animation");
    })
    .catch((error) => {
      console.error("Error switching chart type:", error);
    });
};

// Function to show KPI data in a modal or table format
export const showKpiData = (containerId) => {
  console.log(`Showing data for container ${containerId}`);

  const chartData = window.kpiChartData[containerId];
  if (!chartData) {
    console.error("Chart data not found for container:", containerId);
    return;
  }

  // Remove existing modal if any
  const existingModal = document.getElementById("kpiDataModal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create a simple modal to show the data
  const modal = document.createElement("div");
  modal.id = "kpiDataModal";
  modal.className = "kpi-modal-overlay";
  modal.innerHTML = `
    <div class="kpi-modal-content">
      <div class="kpi-modal-header">
        <h3 class="kpi-modal-title">${chartData.cardTitle} - Dados</h3>
        <button type="button" class="kpi-modal-close" onclick="this.closest('.kpi-modal-overlay').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="kpi-modal-body">
        <div class="table-responsive">
          <table class="kpi-data-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${chartData.labels
                .map(
                  (label, index) => `
                <tr>
                  <td>${label}</td>
                  <td>${chartData.values[index].toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="kpi-modal-footer">
        <button type="button" class="kpi-btn kpi-btn-secondary" onclick="this.closest('.kpi-modal-overlay').remove()">
          Fechar
        </button>
        <button type="button" class="kpi-btn kpi-btn-primary" onclick="copyKpiDataToClipboard('${containerId}', this)">
          <i class="fas fa-copy"></i> Copiar Dados
        </button>
      </div>
    </div>
  `;

  // Add modal to body
  document.body.appendChild(modal);

  // Close modal when clicking on overlay
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
};

// Function to copy KPI data to clipboard
export const copyKpiDataToClipboard = (containerId, buttonElement) => {
  const chartData = window.kpiChartData[containerId];
  if (!chartData) return;

  const dataText = chartData.labels
    .map((label, index) => `${label}: ${chartData.values[index]}`)
    .join("\n");

  navigator.clipboard
    .writeText(dataText)
    .then(() => {
      // Show success message
      if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        buttonElement.classList.add("success");

        setTimeout(() => {
          buttonElement.innerHTML = originalText;
          buttonElement.classList.remove("success");
        }, 2000);
      }
    })
    .catch((err) => {
      console.error("Erro ao copiar dados:", err);
      // Show error message
      if (buttonElement) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML =
          '<i class="fas fa-exclamation-triangle"></i> Erro';
        buttonElement.classList.remove("kpi-btn-primary");
        buttonElement.classList.add("kpi-btn-secondary");

        setTimeout(() => {
          buttonElement.innerHTML = originalText;
          buttonElement.classList.remove("kpi-btn-secondary");
          buttonElement.classList.add("kpi-btn-primary");
        }, 2000);
      }
    });
};

// Function to export KPI chart as image
export const exportKpiImage = (containerId) => {
  console.log(`Exporting image for container ${containerId}`);

  const chart = window.kpiCharts[containerId];
  if (!chart) {
    console.error("Chart instance not found for container:", containerId);
    return;
  }

  const chartData = window.kpiChartData[containerId];
  const fileName = `${chartData.cardTitle.replace(/[^a-zA-Z0-9]/g, "_")}.png`;

  try {
    // Get current chart option
    const currentOption = chart.getOption();

    // Create a copy with title for export
    const exportOption = JSON.parse(JSON.stringify(currentOption));

    // Add title for export
    exportOption.title = {
      text: chartData.cardTitle,
      left: "center",
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
      },
    };

    // For calendar charts, adjust positioning when title is added
    if (
      containerId === "card-kpi-calendar-vencimentos" &&
      exportOption.visualMap
    ) {
      // Move visualMap down when title is present
      if (Array.isArray(exportOption.visualMap)) {
        exportOption.visualMap[0].top = 60;
      } else {
        exportOption.visualMap.top = 60;
      }

      // Move calendar down when title is present
      if (exportOption.calendar) {
        if (Array.isArray(exportOption.calendar)) {
          exportOption.calendar[0].top = 95;
        } else {
          exportOption.calendar.top = 95;
        }
      }
    }

    // Temporarily set option with title
    chart.setOption(exportOption, true);

    // Get chart as base64 image
    const imageDataURL = chart.getDataURL({
      type: "png",
      pixelRatio: 2, // Higher resolution
      backgroundColor: "#fff",
    });

    // Restore original option without title
    chart.setOption(currentOption, true);

    // Create download link
    const link = document.createElement("a");
    link.href = imageDataURL;
    link.download = fileName;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`Image exported successfully: ${fileName}`);
  } catch (error) {
    console.error("Erro ao exportar imagem:", error);
    alert("Erro ao exportar imagem. Tente novamente.");
  }
};

// Make functions globally accessible
window.switchKpiChartType = switchKpiChartType;
window.showKpiData = showKpiData;
window.copyKpiDataToClipboard = copyKpiDataToClipboard;
window.exportKpiImage = exportKpiImage;
