import DetalhesEmpenhosChart from "./detalhes-empenhos-chart.js";

/**
 * DetalhesEmpenhos Component for Encontro de Contas
 * Handles the display and management of detailed empenho information
 */

export default {
  /**
   * Initialize Detalhes Empenhos section
   */
  async initialize() {
    console.log("Initializing Detalhes Empenhos component...");

    try {
      // Initialize chart component (without data)
      await DetalhesEmpenhosChart.initialize();

      const result = await this.loadEmpenhosData();

      if (result.success) {
        // Populate table first
        this.populateTable(result.data.empenhos);

        // Then render chart with the loaded data (including payments)
        const pagamentos = result.data.pagamentos || [];
        await DetalhesEmpenhosChart.renderWithData(
          result.data.empenhos,
          pagamentos
        );

        console.log("Detalhes Empenhos initialized successfully");
      } else {
        this.showError(result.error);
      }
    } catch (error) {
      console.error("Error initializing Detalhes Empenhos:", error);
      this.showError("Erro ao carregar dados dos empenhos");
    }
  },

  /**
   * Load empenhos data from JSON file
   * @returns {Promise<Object>} Empenhos data with success/error status
   */
  async loadEmpenhosData() {
    try {
      console.log("Loading empenhos data from JSON file...");

      const response = await fetch("/static/js/encontro/empenhos-data.json");

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: Failed to load empenhos data`
        );
      }

      const data = await response.json();

      console.log("Successfully loaded empenhos data:", {
        totalRecords: data.metadata.total_records,
        totalOriginal: data.metadata.total_original,
        totalReforco: data.metadata.total_reforco,
        totalAnulacao: data.metadata.total_anulacao,
        valorLiquido: data.metadata.valor_liquido,
        totalPagamentos: data.metadata.total_pagamentos || 0,
        valorTotalPago: data.metadata.valor_total_pago || 0,
      });

      // Validate the data structure
      if (!this.validateData(data)) {
        throw new Error("Dados de empenhos inválidos ou incompletos");
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error loading empenhos data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Validate empenhos data structure
   * @param {Object} data - Empenhos data from JSON
   * @returns {boolean} True if valid
   */
  validateData(data) {
    const requiredFields = ["empenhos", "metadata"];
    const requiredMetadataFields = [
      "total_records",
      "total_original",
      "total_reforco",
      "total_anulacao",
      "valor_total_original",
      "valor_total_reforco",
      "valor_total_anulacao",
      "valor_liquido",
    ];

    // Check main fields
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Check metadata fields
    for (const field of requiredMetadataFields) {
      if (!(field in data.metadata)) {
        console.error(`Missing required metadata field: ${field}`);
        return false;
      }
    }

    // Check empenhos array
    if (!Array.isArray(data.empenhos)) {
      console.error("Empenhos should be an array");
      return false;
    }

    // Validate each empenho has required fields
    const requiredEmpenhoFields = [
      "data",
      "empenho",
      "especie",
      "observacao",
      "nominal",
      "nominal_valor",
    ];
    for (const empenho of data.empenhos) {
      for (const field of requiredEmpenhoFields) {
        if (!(field in empenho)) {
          console.error(
            `Missing required empenho field: ${field} in empenho ${
              empenho.empenho || "unknown"
            }`
          );
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Populate the detalhes empenhos table
   * @param {Array} empenhos - Array of empenho objects
   */
  populateTable(empenhos) {
    const tbody = document.getElementById("detalhes-empenhos-tbody");
    if (!tbody) {
      console.error("Detalhes empenhos tbody not found");
      return;
    }

    // Clear existing content
    tbody.innerHTML = "";

    // Sort empenhos by date (chronological order)
    const sortedEmpenhos = empenhos.sort((a, b) => {
      const dateA = this.parseDate(a.data);
      const dateB = this.parseDate(b.data);
      return dateA - dateB;
    });

    // Populate table rows
    sortedEmpenhos.forEach((empenho, index) => {
      const row = this.createTableRow(empenho, index + 1);
      tbody.appendChild(row);
    });

    // Initialize tooltips
    this.initializeTooltips();
  },

  /**
   * Create a table row for an empenho
   * @param {Object} empenho - Empenho data
   * @param {number} index - Row index
   * @returns {HTMLElement} Table row element
   */
  createTableRow(empenho, index) {
    const row = document.createElement("tr");

    // Get badge class based on especie
    const badgeClass = this.getBadgeClass(empenho.especie);
    const valueClass =
      empenho.nominal_valor >= 0 ? "text-success" : "text-danger";

    row.innerHTML = `
      <td>${empenho.data}</td>
      <td>${empenho.empenho}</td>
      <td><span class="badge ${badgeClass}">${empenho.especie}</span></td>
      <td class="${valueClass} font-weight-bold">${empenho.nominal}</td>
      <td class="text-center">
        <i class="fas fa-info-circle text-info" 
           data-toggle="tooltip" 
           data-placement="left"
           title="${empenho.observacao}"
           style="cursor: pointer;"></i>
      </td>
      <td class="text-center">
        <i class="fas fa-chart-line text-primary" 
           style="cursor: pointer;"
           onclick="DetalhesEmpenhos.showChart('${empenho.empenho}')"></i>
      </td>
    `;

    return row;
  },

  /**
   * Get badge CSS class based on especie
   * @param {string} especie - Empenho type
   * @returns {string} Badge CSS class
   */
  getBadgeClass(especie) {
    switch (especie.toLowerCase()) {
      case "original":
        return "badge-primary";
      case "reforço":
        return "badge-info";
      case "anulação":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  },

  /**
   * Parse date string to Date object
   * @param {string} dateString - Date in DD/MM/YYYY format
   * @returns {Date} Date object
   */
  parseDate(dateString) {
    const [day, month, year] = dateString.split("/");
    return new Date(year, month - 1, day);
  },

  /**
   * Initialize tooltips for info icons
   */
  initializeTooltips() {
    // Initialize tooltips using native title attribute (no Bootstrap dependency)
    const tooltipElements = document.querySelectorAll(
      '#detalhes-empenhos-tbody [data-toggle="tooltip"]'
    );
    tooltipElements.forEach((element) => {
      // Use the native browser tooltip by ensuring title attribute is set
      if (
        !element.getAttribute("title") &&
        element.getAttribute("data-original-title")
      ) {
        element.setAttribute(
          "title",
          element.getAttribute("data-original-title")
        );
      }
    });
  },

  /**
   * Show chart for specific empenho
   * @param {string} empenhoId - Empenho ID
   */
  async showChart(empenhoId) {
    console.log(`Showing chart for empenho: ${empenhoId}`);

    try {
      // Show chart with specific empenho highlighted
      await DetalhesEmpenhosChart.showChart(empenhoId);
    } catch (error) {
      console.error("Error showing chart:", error);
      alert(
        `Erro ao exibir gráfico para empenho ${empenhoId}: ${error.message}`
      );
    }
  },

  /**
   * Show error message in the table
   * @param {string} message - Error message
   */
  showError(message) {
    const tbody = document.getElementById("detalhes-empenhos-tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 40px">
            <div class="text-danger">
              <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <br />
              ${message}
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Show loading state in the table
   */
  showLoading() {
    const tbody = document.getElementById("detalhes-empenhos-tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 40px">
            <div class="text-muted">
              <div class="br-loading medium" role="progressbar" aria-label="carregando detalhes dos empenhos"></div>
              <br />
              Carregando detalhes dos empenhos...
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Update table with new data (for future API integration)
   * @param {Array} empenhos - Array of empenho objects
   */
  updateData(empenhos) {
    if (empenhos && empenhos.length > 0) {
      this.populateTable(empenhos);
    } else {
      this.showError("Nenhum empenho encontrado");
    }
  },

  /**
   * Clear table data
   */
  clear() {
    const tbody = document.getElementById("detalhes-empenhos-tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 40px">
            <div class="text-muted">
              <i class="fas fa-search fa-2x mb-3"></i>
              <br />
              Realize uma busca para visualizar os detalhes dos empenhos
            </div>
          </td>
        </tr>
      `;
    }
  },

  /**
   * Get component statistics
   * @returns {Object} Statistics about loaded data
   */
  getStats() {
    const tbody = document.getElementById("detalhes-empenhos-tbody");
    if (!tbody) return null;

    const rows = tbody.querySelectorAll("tr:not(.empty-state)");
    return {
      totalRows: rows.length,
      hasData: rows.length > 0,
      component: "DetalhesEmpenhos",
    };
  },
};
