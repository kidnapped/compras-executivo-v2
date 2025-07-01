export default {
  cardHeader({
    titulo,
    subtitulo,
    icone = "/static/images/doc2.png",
    isKPI8 = false,
    isKPI9 = false,
    isKPI10 = false,
  }) {
    // Standard dropdown options for all KPIs
    const standardDropdownOptions = `
      <a href="#" class="dropdown-item kpi-bar-option">
        <i class="fas fa-chart-bar" style="margin-right:8px;"></i>Gráfico de Barras
      </a>
      <a href="#" class="dropdown-item kpi-pie-option">
        <i class="fas fa-chart-pie" style="margin-right:8px;"></i>Gráfico de Pizza
      </a>
      <div class="dropdown-divider"></div>
      <a href="#" class="dropdown-item kpi-show-data-option">
        <i class="fas fa-table" style="margin-right:8px;"></i>Mostrar Dados
      </a>
      <a href="#" class="dropdown-item kpi-export-image-option">
        <i class="fas fa-download" style="margin-right:8px;"></i>Exportar Imagem
      </a>
    `;

    // KPI 9 specific dropdown options (with pie chart added back)
    const kpi9DropdownOptions = `
      <a href="#" class="dropdown-item kpi-bar-option">
        <i class="fas fa-chart-bar" style="margin-right:8px;"></i>Gráfico de Barras
      </a>
      <a href="#" class="dropdown-item kpi-pie-option">
        <i class="fas fa-chart-pie" style="margin-right:8px;"></i>Gráfico de Pizza
      </a>
      <div class="dropdown-divider"></div>
      <a href="#" class="dropdown-item kpi-show-data-option">
        <i class="fas fa-table" style="margin-right:8px;"></i>Mostrar Dados
      </a>
      <a href="#" class="dropdown-item kpi-export-image-option">
        <i class="fas fa-download" style="margin-right:8px;"></i>Exportar Imagem
      </a>
    `;

    // KPI 10 specific dropdown options (stacked bar and line chart only)
    const kpi10DropdownOptions = `
      <a href="#" class="dropdown-item kpi-bar-option">
        <i class="fas fa-chart-bar" style="margin-right:8px;"></i>Gráfico de Barras Empilhadas
      </a>
      <a href="#" class="dropdown-item kpi-line-option">
        <i class="fas fa-chart-line" style="margin-right:8px;"></i>Gráfico de Linhas
      </a>
      <div class="dropdown-divider"></div>
      <a href="#" class="dropdown-item kpi-show-data-option">
        <i class="fas fa-table" style="margin-right:8px;"></i>Mostrar Dados
      </a>
      <a href="#" class="dropdown-item kpi-export-image-option">
        <i class="fas fa-download" style="margin-right:8px;"></i>Exportar Imagem
      </a>
    `;

    // Extra option for KPI 8 (Map)
    const mapOption = isKPI8
      ? `
      <a href="#" class="dropdown-item kpi-map-option">
        <i class="fas fa-map" style="margin-right:8px;"></i>Mapa
      </a>
    `
      : "";

    // Extra option for KPI 9 (Calendar)
    const calendarOption = isKPI9
      ? `
      <a href="#" class="dropdown-item kpi-calendar-option">
        <i class="fas fa-calendar" style="margin-right:8px;"></i>Calendário
      </a>
    `
      : "";

    const dropdownButton = `
      <div class="ml-auto" style="margin: -10px -10px 0px 0px; position: relative;">
        <button class="br-button circle kpi-dropdown-btn${
          isKPI8 ? " kpi8-dropdown-btn" : ""
        }${isKPI9 ? " kpi9-dropdown-btn" : ""}${
      isKPI10 ? " kpi10-dropdown-btn" : ""
    }" type="button" aria-label="Opções de visualização">
          <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
        </button>
        <div class="kpi-dropdown-menu${isKPI8 ? " kpi8-dropdown-menu" : ""}${
      isKPI9 ? " kpi9-dropdown-menu" : ""
    }${isKPI10 ? " kpi10-dropdown-menu" : ""}" style="display:none;">
          ${mapOption}
          ${calendarOption}
          ${
            isKPI10
              ? kpi10DropdownOptions
              : isKPI9
              ? kpi9DropdownOptions
              : standardDropdownOptions
          }
        </div>
      </div>
    `;

    return `
            <div class="card-header">
                <div class="d-flex" style="width: 100%;">
                    <div class="ml-3" style="flex-grow: 1;">
                        <div class="titulo">
                            <img src="${icone}" alt="Ícone" style="height: 36px;margin:10px 0px -10px 0px;">
                            ${titulo}
                        </div>
                        <div style="border-bottom: 1px solid #ccc;margin:-6px 0px 0px 26px;"></div>
                        <div class="subtitulo">${subtitulo}</div>
                    </div>
                    ${dropdownButton}
                </div>
            </div>
        `;
  },

  cardGrafico({ id, titulo, subtitulo, icone = "/static/images/doc2.png" }) {
    return `
        <div class="col-12 col-lg-3">
        <div class="br-card h-100 card-contratos" style="min-height: 180px;">
            ${this.cardHeader({ titulo, subtitulo, icone })}
            <div class="card-content" style="padding: 0px; height: 180px !important;">
            <div id="${id}" style="width: 100%; height: 210px; margin-top: -40px;"></div>
            </div>
        </div>
        </div>`;
    },
    
};

// DEBUG: Log to check if script runs and button is found
console.log("Dropdown script loaded");
// Dropdown menu HTML (insert this into your card HTML, near the button)
const dropdownHTML = `
  <div class="dropdown-menu" id="chartDropdownMenu" style="display:none; position:absolute; z-index:1000; background:#fff; border:1px solid #ccc; border-radius:4px; min-width:150px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
    <a href="#" class="dropdown-item" id="dropdown-bar">Bar Chart</a>
    <a href="#" class="dropdown-item" id="dropdown-pie">Pie Chart</a>
    <a href="#" class="dropdown-item" id="dropdown-data">Show Data</a>
    <a href="#" class="dropdown-item" id="dropdown-export">Export Image</a>
  </div>
`;

// Insert dropdown into DOM (run once after DOM is ready)
document.addEventListener("DOMContentLoaded", function () {
  // Use event delegation for all chart-dropdown-btn buttons
  document.body.addEventListener("click", function (e) {
    const button = e.target.closest(".chart-dropdown-btn");
    // Only handle if a chart-dropdown-btn was clicked
    if (button) {
      e.stopPropagation();
      // Remove any existing dropdown
      let dropdown = document.getElementById("chartDropdownMenu");
      if (dropdown) dropdown.remove();
      // Insert dropdown after the clicked button
      button.insertAdjacentHTML(
        "afterend",
        `
        <div class="dropdown-menu" id="chartDropdownMenu" style="display:block; position:absolute; z-index:1000; background:#fff; border:1px solid #ccc; border-radius:4px; min-width:150px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
          <a href="#" class="dropdown-item" id="dropdown-bar">Bar Chart</a>
          <a href="#" class="dropdown-item" id="dropdown-pie">Pie Chart</a>
          <a href="#" class="dropdown-item" id="dropdown-data">Show Data</a>
          <a href="#" class="dropdown-item" id="dropdown-export">Export Image</a>
        </div>
      `
      );
      dropdown = document.getElementById("chartDropdownMenu");
      // Position dropdown below the button
      const rect = button.getBoundingClientRect();
      dropdown.style.left = rect.left + window.scrollX + "px";
      dropdown.style.top = rect.bottom + window.scrollY + "px";

      // Find the card container id
      const cardContainer = button.closest("div[id]");
      const containerId = cardContainer ? cardContainer.id : null;

      function getChart() {
        if (containerId && window.kpiCharts && window.kpiCharts[containerId]) {
          return window.kpiCharts[containerId];
        }
        alert("Chart is not available!");
        return null;
      }

      function getChartData() {
        if (
          containerId &&
          window.kpiChartData &&
          window.kpiChartData[containerId]
        ) {
          return window.kpiChartData[containerId];
        }
        return null;
      }

      document.getElementById("dropdown-bar").onclick = function (e) {
        e.preventDefault();
        const chart = getChart();
        const chartData = getChartData();
        if (chart && chartData) {
          const option = window.getBaseChartOption
            ? window.getBaseChartOption({
                chartType: "bar",
                cardTitle: chartData.cardTitle,
                labels: chartData.labels,
                values: chartData.values,
              })
            : {};
          chart.setOption(option, true);
        }
        dropdown.remove();
      };
      document.getElementById("dropdown-pie").onclick = function (e) {
        e.preventDefault();
        const chart = getChart();
        const chartData = getChartData();
        if (chart && chartData) {
          const option = window.getBaseChartOption
            ? window.getBaseChartOption({
                chartType: "pie",
                cardTitle: chartData.cardTitle,
                labels: chartData.labels,
                values: chartData.values,
              })
            : {};
          chart.setOption(option, true);
        }
        dropdown.remove();
      };
      document.getElementById("dropdown-data").onclick = function (e) {
        e.preventDefault();
        const chartData = getChartData();
        if (chartData) {
          alert(
            chartData.labels
              .map((label, i) => `${label}: ${chartData.values[i]}`)
              .join("\n")
          );
        }
        dropdown.remove();
      };
      document.getElementById("dropdown-export").onclick = function (e) {
        e.preventDefault();
        const chart = getChart();
        if (chart) {
          const url = chart.getDataURL({ type: "png" });
          const link = document.createElement("a");
          link.href = url;
          link.download = "chart.png";
          link.click();
        }
        dropdown.remove();
      };
    }
  });
  // Hide dropdown when clicking outside
  document.addEventListener("click", function () {
    const dropdown = document.getElementById("chartDropdownMenu");
    if (dropdown) dropdown.remove();
  });
});
