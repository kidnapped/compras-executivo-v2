// KPI 9 - Calendar View of Contract End Dates
import { fetchKpiData, showKpiError } from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";
import getEcharts from "../../util/echarts.js";
import card_kpi from "../card.js";

export const initKpi9 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi9");
    const containerId = "card-kpi-calendar-vencimentos";
    const container = document.getElementById(containerId);
    if (!container) return;

    // Prepare calendar data
    const calendarData = (kpiData.calendar_data || []).map(
      ([date, count, contracts]) => [
        date,
        count,
        contracts, // Store contract details for click events
      ]
    );

    // Store data for interactions
    if (!window.kpiChartData) window.kpiChartData = {};

    // For pie chart: aggregate data by month
    const monthlyData = {};
    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    calendarData.forEach(([date, count]) => {
      if (count > 0) {
        const month = new Date(date).getMonth();
        const monthName = monthNames[month];
        monthlyData[monthName] = (monthlyData[monthName] || 0) + count;
      }
    });

    const pieLabels = Object.keys(monthlyData);
    const pieValues = Object.values(monthlyData);

    window.kpiChartData[containerId] = {
      calendarData: calendarData,
      cardTitle: kpiData.titulo || "KPI 9: Calendário de Vencimentos",
      isCalendar: true,
      labels: pieLabels, // Monthly aggregation for pie chart
      values: pieValues, // Monthly totals for pie chart
    };

    container.innerHTML =
      card_kpi.cardHeader({
        titulo: kpiData.titulo || "KPI 9: Calendário de Vencimentos",
        subtitulo: kpiData.subtitulo || "",
        isKPI9: true,
      }) +
      '<div class="kpi-chart-inner" style="width:100%;height:280px;padding:10px;"></div>';

    const chartDiv = container.querySelector(".kpi-chart-inner");

    // Show loading spinner
    chartDiv.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;">
      <div class="spinner-border text-primary" style="width:3rem;height:3rem;" role="status" aria-label="Carregando..."></div>
    </div>`;

    const echarts = await getEcharts();

    // Clear loading and create chart container
    chartDiv.innerHTML = "";
    const echartsDiv = document.createElement("div");
    echartsDiv.style.width = "100%";
    echartsDiv.style.height = "260px"; // Further optimized height for calendar
    chartDiv.appendChild(echartsDiv);

    // Create calendar chart
    const chart = echarts.init(echartsDiv);

    const option = {
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
          const storedData =
            window.kpiChartData?.["card-kpi-calendar-vencimentos"]
              ?.calendarData;
          if (storedData) {
            const dayData = storedData.find(([d]) => d === date);
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
        },
      ],
    };

    chart.setOption(option);

    // Add click event for contract details
    chart.on("click", function (params) {
      if (
        params.componentType === "series" &&
        params.seriesType === "heatmap"
      ) {
        const clickedData = calendarData.find((d) => d[0] === params.data[0]);

        if (clickedData) {
          const [date, count, contracts] = clickedData;
          if (contracts && contracts.length > 0) {
            window.showContractDetails(date, contracts);
          }
        }
      }
    });

    // Handle resize
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        chart.resize();
      }, 150);
    });

    // Store chart instance
    if (!window.kpiCharts) window.kpiCharts = {};
    window.kpiCharts[containerId] = chart;

    // Set up dropdown functionality
    setupKpiDropdown(containerId);
  } catch (err) {
    showKpiError(["card-kpi-calendar-vencimentos"], err);
  }
};

// Modal and contract details functions
export const showContractDetails = (date, contracts) => {
  // Helper function to format currency values
  const formatCurrency = (value) => {
    if (!value || value === null || value === 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Helper function to truncate long text with tooltip
  const truncateText = (text, maxLength = 60) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `<span title="${text.replace(/"/g, "&quot;")}">${text.substring(
      0,
      maxLength
    )}...</span>`;
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString || dateString === null || dateString === undefined) {
      return "N/A";
    }

    // Try to create a date object
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Data Inválida";
    }

    // Check if it's a reasonable date (not too far in past/future)
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();

    if (dateYear < 1900 || dateYear > currentYear + 50) {
      return "Data Inválida";
    }

    try {
      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      return "Data Inválida";
    }
  };

  const modalHtml = `
    <div class="kpi-modal-overlay" onclick="this.remove()">
      <div class="kpi-modal-content contract-details-modal" onclick="event.stopPropagation()">
        <div class="kpi-modal-header">
          <h5 class="kpi-modal-title">Contratos que vencem em ${formatDate(
            date
          )}</h5>
          <button type="button" class="kpi-modal-close" onclick="this.closest('.kpi-modal-overlay').remove()">
            ×
          </button>
        </div>
        <div class="kpi-modal-body">
          <div class="contracts-summary mb-3">
            <strong>${contracts.length} contrato(s) encontrado(s)</strong>
          </div>
          <div class="table-responsive">
            <table class="table table-hover contract-details-table">
              <thead class="table-dark">
                <tr>
                  <th scope="col" style="min-width: 120px;">Número</th>
                  <th scope="col" style="min-width: 110px;">Data Vencimento</th>
                  <th scope="col" style="min-width: 120px;">Valor Inicial</th>
                  <th scope="col" style="min-width: 120px;">Valor Global</th>
                  <th scope="col" style="min-width: 200px;">Objeto</th>
                  <th scope="col" style="min-width: 80px;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${contracts
                  .map(
                    (contract) => `
                  <tr>
                    <td>
                      <strong class="text-primary">${
                        contract.contrato_numero || "N/A"
                      }</strong>
                    </td>
                    <td>
                      <span class="badge bg-warning text-dark">${formatDate(
                        contract.data_fim
                      )}</span>
                    </td>
                    <td>
                      <span class="text-success fw-bold">${formatCurrency(
                        contract.valor_inicial
                      )}</span>
                    </td>
                    <td>
                      <span class="text-info fw-bold">${formatCurrency(
                        contract.valor_global
                      )}</span>
                    </td>
                    <td>
                      <div class="objeto-text">${truncateText(
                        contract.objeto,
                        60
                      )}</div>
                    </td>
                    <td>
                      <button type="button" class="btn btn-sm btn-outline-primary" onclick="viewContract(${
                        contract.contrato_id
                      })">
                        <i class="fas fa-eye"></i> Ver
                      </button>
                    </td>
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
            <i class="fas fa-times"></i> Fechar
          </button>
          <button type="button" class="kpi-btn kpi-btn-primary" onclick="exportContractsData('${date}', ${JSON.stringify(
    contracts
  ).replace(/"/g, "&quot;")})">
            <i class="fas fa-download"></i> Exportar Dados
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
};

// Function to export contracts data to CSV
export const exportContractsData = (date, contracts) => {
  try {
    // Parse contracts if it's a string
    if (typeof contracts === "string") {
      contracts = JSON.parse(contracts.replace(/&quot;/g, '"'));
    }

    // Helper function to format dates
    const formatDate = (dateString) => {
      if (!dateString || dateString === null || dateString === undefined) {
        return "N/A";
      }

      // Try to create a date object
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Data Inválida";
      }

      // Check if it's a reasonable date (not too far in past/future)
      const currentYear = new Date().getFullYear();
      const dateYear = date.getFullYear();

      if (dateYear < 1900 || dateYear > currentYear + 50) {
        return "Data Inválida";
      }

      try {
        return date.toLocaleDateString("pt-BR");
      } catch (error) {
        return "Data Inválida";
      }
    };

    const csvHeaders = [
      "Número do Contrato",
      "Data de Vencimento",
      "Valor Inicial",
      "Valor Global",
      "Objeto",
    ];

    const csvRows = contracts.map((contract) => [
      contract.contrato_numero || "N/A",
      formatDate(contract.data_fim),
      contract.valor_inicial || "0",
      contract.valor_global || "0",
      `"${(contract.objeto || "N/A").replace(/"/g, '""')}"`, // Escape quotes in CSV
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `contratos_vencimento_${date}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log(`CSV exported successfully: contratos_vencimento_${date}.csv`);
  } catch (error) {
    console.error("Error exporting contract data:", error);
    alert("Erro ao exportar dados. Tente novamente.");
  }
};

// Placeholder function for contract viewing (to be implemented later)
export const viewContract = (contractId) => {
  alert(
    `Visualizar contrato ID: ${contractId}\n\nEsta funcionalidade será implementada em breve.`
  );
};

// Make functions globally accessible
window.showContractDetails = showContractDetails;
window.exportContractsData = exportContractsData;
window.viewContract = viewContract;
window.formatDate = (dateString) => {
  if (!dateString || dateString === null || dateString === undefined) {
    return "N/A";
  }

  // Try to create a date object
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return "Data Inválida";
  }

  // Check if it's a reasonable date (not too far in past/future)
  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();

  if (dateYear < 1900 || dateYear > currentYear + 50) {
    return "Data Inválida";
  }

  try {
    return date.toLocaleDateString("pt-BR");
  } catch (error) {
    return "Data Inválida";
  }
};
