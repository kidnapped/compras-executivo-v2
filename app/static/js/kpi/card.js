export default {
  cardHeader({ titulo, subtitulo, icone = "/static/images/doc2.png" }) {
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
                    <div class="ml-auto" style="margin: -10px -10px 0px 0px;">
                        <button class="br-button circle chart-dropdown-btn" type="button" aria-label="Mais opções">
                            <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
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
