/**
 * Empenhos Card Component
 * Creates a reusable card for displaying empenhos data with dynamic calculations
 * Based on the CardGenerator pattern following project best practices
 *
 * Usage:
 * const empenhosCard = new EmpenhosCard({
 *   containerId: 'empenhos-card-container',
 *   data: empenhosData,
 *   title: 'Empenhos',
 *   subtitle: 'Total de empenhos desde 2019'
 * });
 */

import CardGenerator from "./card-generator.js";

class EmpenhosCard {
  constructor(options = {}) {
    this.options = {
      containerId: "empenhos-card",
      title: "Empenhos",
      subtitle: "Total de empenhos desde 2019",
      icon: "/static/images/doc2.png",
      ...options,
    };

    this.data = options.data || [];
    this.container = null;
    this.cardElement = null;
    this.metrics = {
      total: 0,
      emExecucao: 0,
      finalizados: 0,
      rap: 0,
      criticos: 0,
    };

    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      console.error(
        `Container with ID '${this.options.containerId}' not found`
      );
      return;
    }

    this.render();
    this.setupEventListeners();
  }

  /**
   * Calculate metrics based on empenhos data
   * @param {Array} data - Array of empenhos objects
   */
  calculateMetrics(data = []) {
    this.metrics = {
      total: data.length,
      emExecucao: 0,
      finalizados: 0,
      rap: 0,
      criticos: 0,
    };

    console.log("📊 Calculating metrics for empenhos:", data.length);
    if (data.length > 0) {
      console.log("📊 First empenho structure:", data[0]);
    }

    data.forEach((empenho, index) => {
      // Calculate status the same way as in the main table: Finanças / Orçamentário * 100
      const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
      const financasTotal = this.calculateFinancasTotal(empenho);
      const status =
        orcamentarioTotal > 0 ? (financasTotal / orcamentarioTotal) * 100 : 0;
      const isFinalized = status >= 100;

      console.log(`📊 Empenho ${index + 1}:`, {
        numero: empenho.empenho?.numero,
        orcamentarioTotal: orcamentarioTotal,
        financasTotal: financasTotal,
        status: status.toFixed(1) + "%",
        isFinalized: isFinalized,
        operacao: empenho.operacao,
        hasMovimentacoes: !!empenho.movimentacoes,
        movimentacoesLength: empenho.movimentacoes?.length || 0,
      });

      if (!isFinalized) {
        this.metrics.emExecucao++;
      } else {
        this.metrics.finalizados++;
      }

      // Check for RAP (Restos a Pagar) - ONLY for non-finalized empenhos
      // Finalized empenhos (100% status) should NOT be counted as RAP
      if (!isFinalized) {
        let isRAP = false;

        // Method 1: Check operacao field
        if (empenho.operacao === "RP") {
          isRAP = true;
          console.log(
            `📊 RAP detected via operacao: ${empenho.empenho?.numero}`
          );
        }

        // Method 2: Check movimentacoes for RP operation
        if (
          empenho.movimentacoes &&
          empenho.movimentacoes.some((mov) => mov.operacao === "RP")
        ) {
          isRAP = true;
          console.log(
            `📊 RAP detected via movimentacoes: ${empenho.empenho?.numero}`
          );
        }

        // Method 3: Check orçamentário operations for "RP" in no_operacao (proven working method)
        const orcamentario =
          empenho.Orçamentário?.operacoes ||
          empenho.Ne_item?.operacoes ||
          empenho.Orçamentário ||
          [];
        if (Array.isArray(orcamentario)) {
          const hasRpOperation = orcamentario.some((op) => {
            const operationType =
              op.no_operacao?.toString().toUpperCase() || "";
            return (
              operationType.includes("RP") ||
              operationType.includes("INSCRICAO") ||
              operationType.includes("RESTOS A PAGAR")
            );
          });
          if (hasRpOperation) {
            isRAP = true;
            console.log(
              `📊 RAP detected via orcamentario no_operacao: ${empenho.empenho?.numero}`
            );
          }
        }

        // Method 4: Check if empenho number contains "RP" (case insensitive, any position)
        if (empenho.empenho?.numero && /rp/i.test(empenho.empenho.numero)) {
          isRAP = true;
          console.log(
            `📊 RAP detected via numero pattern: ${empenho.empenho?.numero}`
          );
        }

        if (isRAP) {
          this.metrics.rap++;
          console.log(
            `📊 RAP counted for non-finalized empenho: ${
              empenho.empenho?.numero
            } (status: ${status.toFixed(1)}%)`
          );
        }
      } else {
        console.log(
          `📊 Skipping RAP check for finalized empenho: ${
            empenho.empenho?.numero
          } (status: ${status.toFixed(1)}%)`
        );
      }

      // Check for críticos (status > 100%)
      if (status > 100) {
        this.metrics.criticos++;
      }
    });

    console.log("📊 Final calculated metrics:", this.metrics);
  }

  /**
   * Render the card component
   */
  render() {
    this.calculateMetrics(this.data);

    this.cardElement = this.createCardHTML();

    // Clear container and append new card
    this.container.innerHTML = "";
    this.container.appendChild(this.cardElement);
  }

  /**
   * Create the complete card HTML structure
   * @returns {HTMLElement} The card element
   */
  createCardHTML() {
    const cardDiv = document.createElement("div");
    cardDiv.className = "br-card h-100 card-contratos";
    cardDiv.id = this.options.containerId;

    cardDiv.innerHTML = `
      <div class="card-header">
        <div class="d-flex" style="width: 100%">
          <div class="ml-3" style="flex-grow: 1">
            <div class="titulo">
              <img
                src="${this.options.icon}"
                alt="Ícone"
                style="height: 36px; margin: 10px 0px -10px 0px"
              />
              ${this.options.title}
            </div>
            <div
              style="border-bottom: 1px solid #ccc; margin: -6px 0px 0px 26px"
            ></div>
            <div class="subtitulo">${this.options.subtitle}</div>
          </div>

          <div
            class="ml-auto"
            style="margin: -10px -10px 0px 0px; position: relative"
          >
            <button
              class="br-button circle kpi-dropdown-btn"
              type="button"
              aria-label="Opções de visualização"
              data-card-id="${this.options.containerId}"
            >
              <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
            </button>
            <div class="empenhos-dropdown-menu" style="display: none;">
              <a href="#" class="dropdown-item" data-action="refresh">
                <i class="fas fa-sync-alt" style="margin-right: 8px;"></i>Atualizar
              </a>
              <a href="#" class="dropdown-item" data-action="export">
                <i class="fas fa-download" style="margin-right: 8px;"></i>Exportar
              </a>
              <div class="dropdown-divider"></div>
              <a href="#" class="dropdown-item" data-action="details">
                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>Detalhes
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="card-content" style="padding-top: 8px">
        <div class="valor-principal" data-metric="total">${this.metrics.total}</div>
        <div class="linha">
          <div
            class="dashboard-card-filter clickable"
            data-filter="em-execucao"
            data-metric="emExecucao"
            tabindex="0"
          >
            <div>Em execução</div>
            <div class="valor-azul">${this.metrics.emExecucao}</div>
          </div>
          <div class="divider"></div>
          <div
            class="dashboard-card-filter clickable"
            data-filter="finalizados"
            data-metric="finalizados"
            tabindex="0"
          >
            <div>Finalizados</div>
            <div class="valor-azul">${this.metrics.finalizados}</div>
          </div>
          <div class="divider"></div>
          <div
            class="dashboard-card-filter clickable"
            data-filter="rap"
            data-metric="rap"
            tabindex="0"
          >
            <div>RAP</div>
            <div class="valor-vermelho">${this.metrics.rap}</div>
          </div>
          <div class="divider"></div>
          <div
            class="dashboard-card-filter clickable"
            data-filter="criticos"
            data-metric="criticos"
            tabindex="0"
          >
            <div>Críticos</div>
            <div class="valor-vermelho">${this.metrics.criticos}</div>
          </div>
        </div>
      </div>
    `;

    return cardDiv;
  }

  /**
   * Setup event listeners for card interactions
   */
  setupEventListeners() {
    if (!this.cardElement) return;

    // Filter click handlers
    const filterElements = this.cardElement.querySelectorAll(
      ".dashboard-card-filter"
    );
    filterElements.forEach((element) => {
      element.addEventListener("click", (e) => {
        this.handleFilterClick(e);
      });

      element.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.handleFilterClick(e);
        }
      });
    });

    // Dropdown button handler
    const dropdownBtn = this.cardElement.querySelector(".kpi-dropdown-btn");
    if (dropdownBtn) {
      dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Dropdown menu handlers
    const dropdownItems = this.cardElement.querySelectorAll(
      ".empenhos-dropdown-menu .dropdown-item"
    );
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = e.currentTarget.dataset.action;
        this.handleDropdownAction(action);
        this.hideDropdown();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.cardElement.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }

  /**
   * Handle filter button clicks
   * @param {Event} event - Click event
   */
  handleFilterClick(event) {
    const filterType = event.currentTarget.dataset.filter;
    const metric = event.currentTarget.dataset.metric;

    // Add visual feedback
    this.addClickFeedback(event.currentTarget);

    // Emit custom event for parent components to handle
    const customEvent = new CustomEvent("empenhosFilterChanged", {
      detail: {
        filterType,
        metric,
        value: this.metrics[metric],
        data: this.getFilteredData(filterType),
      },
    });

    this.container.dispatchEvent(customEvent);
  }

  /**
   * Get filtered data based on filter type
   * @param {string} filterType - Type of filter to apply
   * @returns {Array} Filtered empenhos data
   */
  getFilteredData(filterType) {
    switch (filterType) {
      case "em-execucao":
        return this.data.filter((empenho) => {
          const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
          const financasTotal = this.calculateFinancasTotal(empenho);
          const status =
            orcamentarioTotal > 0
              ? (financasTotal / orcamentarioTotal) * 100
              : 0;
          return status < 100;
        });

      case "finalizados":
        return this.data.filter((empenho) => {
          const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
          const financasTotal = this.calculateFinancasTotal(empenho);
          const status =
            orcamentarioTotal > 0
              ? (financasTotal / orcamentarioTotal) * 100
              : 0;
          return status >= 100;
        });

      case "rap":
        return this.data.filter((empenho) => {
          // First check if empenho is finalized (100% status)
          const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
          const financasTotal = this.calculateFinancasTotal(empenho);
          const status =
            orcamentarioTotal > 0
              ? (financasTotal / orcamentarioTotal) * 100
              : 0;
          const isFinalized = status >= 100;

          // Only check for RAP if empenho is NOT finalized
          if (isFinalized) {
            return false; // Finalized empenhos are excluded from RAP
          }

          // Multiple ways to detect RAP - using the proven method from encontro-contas.js

          // Method 1: Check operacao field
          if (empenho.operacao === "RP") {
            return true;
          }

          // Method 2: Check movimentacoes for RP operation
          if (
            empenho.movimentacoes &&
            empenho.movimentacoes.some((mov) => mov.operacao === "RP")
          ) {
            return true;
          }

          // Method 3: Check orçamentário operations for "RP", "INSCRICAO", or "RESTOS A PAGAR" in no_operacao (proven working method)
          const orcamentario =
            empenho.Orçamentário?.operacoes ||
            empenho.Ne_item?.operacoes ||
            empenho.Orçamentário ||
            [];
          if (Array.isArray(orcamentario)) {
            const hasRpOperation = orcamentario.some((op) => {
              const operationType =
                op.no_operacao?.toString().toUpperCase() || "";
              return (
                operationType.includes("RP") ||
                operationType.includes("INSCRICAO") ||
                operationType.includes("RESTOS A PAGAR")
              );
            });
            if (hasRpOperation) {
              return true;
            }
          }

          // Method 4: Check if empenho number contains "RP" (case insensitive, any position)
          if (empenho.empenho?.numero && /rp/i.test(empenho.empenho.numero)) {
            return true;
          }

          return false;
        });

      case "criticos":
        return this.data.filter((empenho) => {
          const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
          const financasTotal = this.calculateFinancasTotal(empenho);
          const status =
            orcamentarioTotal > 0
              ? (financasTotal / orcamentarioTotal) * 100
              : 0;
          return status > 100;
        });

      default:
        return this.data;
    }
  }

  /**
   * Add visual click feedback to element
   * @param {HTMLElement} element - Element to animate
   */
  addClickFeedback(element) {
    element.style.transform = "scale(0.95)";
    element.style.transition = "transform 0.1s";

    setTimeout(() => {
      element.style.transform = "scale(1)";
      setTimeout(() => {
        element.style.transition = "";
      }, 100);
    }, 100);
  }

  /**
   * Toggle dropdown menu visibility
   */
  toggleDropdown() {
    const dropdown = this.cardElement.querySelector(".empenhos-dropdown-menu");
    if (dropdown) {
      const isVisible = dropdown.style.display !== "none";
      dropdown.style.display = isVisible ? "none" : "block";
    }
  }

  /**
   * Hide dropdown menu
   */
  hideDropdown() {
    const dropdown = this.cardElement.querySelector(".empenhos-dropdown-menu");
    if (dropdown) {
      dropdown.style.display = "none";
    }
  }

  /**
   * Handle dropdown action clicks
   * @param {string} action - Action type
   */
  handleDropdownAction(action) {
    const customEvent = new CustomEvent("empenhosDropdownAction", {
      detail: {
        action,
        data: this.data,
        metrics: this.metrics,
      },
    });

    this.container.dispatchEvent(customEvent);
  }

  /**
   * Update card data and re-render
   * @param {Array} newData - New empenhos data
   */
  updateData(newData) {
    this.data = newData || [];
    this.render();
  }

  /**
   * Get current metrics
   * @returns {Object} Current calculated metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get current data
   * @returns {Array} Current empenhos data
   */
  getData() {
    return [...this.data];
  }

  /**
   * Safe parseFloat that never returns negative zero
   * @param {any} value - The value to parse
   * @returns {number} The parsed number, with negative zero converted to positive zero
   */
  safeParseFloat(value) {
    const result = parseFloat(value) || 0;
    return Object.is(result, -0) ? 0 : result;
  }

  /**
   * Calculate orçamentário total for an empenho (same logic as encontro-contas.js)
   * @param {Object} empenho - Empenho object
   * @returns {number} Total orçamentário value
   */
  calculateOrcamentarioTotal(empenho) {
    // Handle the new data structure with nested Orçamentário.operacoes
    const orcamentario =
      empenho.Orçamentário?.operacoes ||
      empenho.Ne_item?.operacoes ||
      empenho.Orçamentário ||
      [];

    // Ensure it's an array before calling reduce
    if (!Array.isArray(orcamentario)) {
      console.warn("Orçamentário data is not an array:", orcamentario);
      return 0;
    }

    // Backend now provides pre-processed va_operacao values (0 for RP operations)
    // So we can simply sum the va_operacao values without additional RP filtering
    const result = orcamentario.reduce((total, op) => {
      if (!op || op.va_operacao === null || op.va_operacao === undefined) {
        return total;
      }

      let value = this.safeParseFloat(op.va_operacao);

      // Log RP operations for debugging (backend already set them to 0)
      if (op.is_rp_excluded) {
        console.log(
          `🔄 Frontend: RP operation excluded by backend: ${op.no_operacao} - Display: ${op.va_operacao_display}, Calculation: ${value}`
        );
      }

      return total + value;
    }, 0);

    // Handle negative zero
    return result === 0 ? 0 : result;
  }

  /**
   * Calculate finanças total for an empenho (same logic as encontro-contas.js)
   * @param {Object} empenho - Empenho object
   * @returns {number} Total finanças value
   */
  calculateFinancasTotal(empenho) {
    let total = 0;

    // Handle new nested structure under Finanças
    const financas = empenho.Finanças || {};

    // DARF documents
    (financas.documentos_darf || empenho.documentos_darf || []).forEach(
      (doc) => {
        total += this.safeParseFloat(doc.va_documento);
      }
    );

    // DAR documents
    (financas.documentos_dar || empenho.documentos_dar || []).forEach((doc) => {
      total += this.safeParseFloat(doc.va_documento);
    });

    // GPS documents
    (financas.documentos_gps || empenho.documentos_gps || []).forEach((doc) => {
      total += this.safeParseFloat(doc.va_documento);
    });

    // OB documents
    (financas.linha_evento_ob || empenho.linha_evento_ob || []).forEach(
      (doc) => {
        total += this.safeParseFloat(doc.va_ob_parcial);
      }
    );

    // Handle negative zero in total
    return total === 0 ? 0 : total;
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.cardElement) {
      const content = this.cardElement.querySelector(".card-content");
      if (content) {
        content.innerHTML = `
          <div class="d-flex justify-content-center align-items-center" style="min-height: 120px;">
            <div class="br-loading medium" role="progressbar" aria-label="Carregando empenhos"></div>
          </div>
        `;
      }
    }
  }

  /**
   * Show error state
   * @param {string} message - Error message to display
   */
  showError(message = "Erro ao carregar dados") {
    if (this.cardElement) {
      const content = this.cardElement.querySelector(".card-content");
      if (content) {
        content.innerHTML = `
          <div class="text-center text-muted" style="padding: 40px;">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <br />
            ${message}
          </div>
        `;
      }
    }
  }
}

// Export for use in other modules
export default EmpenhosCard;
