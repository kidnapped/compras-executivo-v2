/**
 * Histórico Orçamentário Card Component
 * Manages the budget history information card display and updates
 */

import EncontroAPI from "../api/encontro-api.js";

const HistoricoOrcamentarioCard = {
  /**
   * Initialize the histórico orçamentário card with loading state
   */
  initialize() {
    console.log("Initializing Histórico Orçamentário Card...");
    this.showLoadingState();
  },

  /**
   * Show loading state in the budget history card
   */
  showLoadingState() {
    const container = document.getElementById("historico-orcamentario-tbody");
    if (!container) {
      console.warn("Histórico orçamentário card container not found");
      return;
    }

    container.innerHTML = `<td class="" style="min-height: 37px">
                    <i class="fa-solid fa-file-contract text-info"></i>
                  </td>
                  <td class="" style="">empenhos</td>
                  <td class="" style=""><div
                      class="br-loading small"
                      role="progressbar"
                      aria-label="carregando histórico orçamentário"
                    ></div></td>
                </tr>
                <tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-play text-info"></i>
                  </td>
                  <td class="" style="">em execução</td>
                  <td class="" style=""><div
                      class="br-loading small"
                      role="progressbar"
                      aria-label="carregando histórico orçamentário"
                    ></div></td>
                </tr>
                <tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-circle-check text-success"></i>
                  </td>
                  <td class="" style="">Finalizados</td>
                  <td class="" style=""><div
                      class="br-loading small"
                      role="progressbar"
                      aria-label="carregando histórico orçamentário"
                    ></div></td>
                </tr>
                <tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-triangle-exclamation text-danger"></i>
                  </td>
                  <td class="" style="">Críticos</td>
                  <td class="" style=""><div
                      class="br-loading small"
                      role="progressbar"
                      aria-label="carregando histórico orçamentário"
                    ></div></td>
                </tr>
                <tr>
                  <td class="" style="<div
                      class="br-loading small"
                      role="progressbar"
                      aria-label="carregando histórico orçamentário"
                    ></div>">
                    <i class="fa-solid fa-receipt text-info"></i>
                  </td>
                  <td class="" style="">RAP</td>
                  <td class="" style=""><div
                      class="br-loading small"
                      role="progressbar"
                      aria-label="carregando histórico orçamentário"
                    ></div></td>
                </tr>
                <tr>
                  
                    
                  
    `;
  },

  /**
   * Update the budget history card with data from the API
   * @param {Object} data - Budget history data from the API
   */
  updateWithData(data) {
    if (!data) {
      console.warn("No data provided to update budget history card");
      this.showErrorState("Dados não encontrados");
      return;
    }

    console.log("Updating budget history card with data:", data);

    // Extract data with defaults - keeping the original field names
    const totalEmpenhos = data.quantidade_total || "0 Empenhos";
    const emExecucao = data.em_execucao || 0;
    const finalizados = data.finalizados || 0;
    const rap = data.rap || 0; // Keep RAP information
    const criticos = data.criticos || 0;

    // Show the updated card content
    this.showCardContent(totalEmpenhos, emExecucao, finalizados, rap, criticos);
  },

  /**
   * Show the card content with the actual data
   * @param {string} totalEmpenhos - Total number of empenhos
   * @param {number} emExecucao - Number of empenhos in execution
   * @param {number} finalizados - Number of finished empenhos
   * @param {number} rap - Number of RAP empenhos
   * @param {number} criticos - Number of critical empenhos
   */
  showCardContent(totalEmpenhos, emExecucao, finalizados, rap, criticos) {
    const container = document.getElementById("historico-orcamentario-tbody");
    if (!container) {
      console.warn("Histórico orçamentário card container not found");
      return;
    }

    container.innerHTML = `<tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-file-contract text-info"></i>
                  </td>
                  <td class="" style="">empenhos</td>
                  <td class="" style="">${totalEmpenhos}</td>
                </tr>
                <tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-play text-info"></i>
                  </td>
                  <td class="" style="">em execução</td>
                  <td class="" style="">${emExecucao}</td>
                </tr>
                <tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-circle-check text-success"></i>
                  </td>
                  <td class="" style="">Finalizados</td>
                  <td class="" style="">${finalizados}</td>
                </tr>
                <tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-triangle-exclamation text-danger"></i>
                  </td>
                  <td class="" style="">Críticos</td>
                  <td class="" style="">${criticos}</td>
                </tr>
                <tr>
                  <td class="" style="min-height: 37px">
                    <i class="fa-solid fa-receipt text-info"></i>
                  </td>
                  <td class="" style="">RAP</td>
                  <td class="" style="">${rap}</td>
                </tr>
    `;
  },

  /**
   * Show error state in the budget history card
   * @param {string} message - Error message to display
   */
  showErrorState(message = "Erro ao carregar dados") {
    const container = document.getElementById(
      "card-historico-orcamentario-container"
    );
    if (!container) {
      console.warn("Histórico orçamentário card container not found");
      return;
    }

    container.innerHTML = `
      <div class="br-card h-100 card-contratos d-flex justify-content-center align-items-center text-center" style="min-height: 180px">
        <div class="card-content">
          <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
          <p class="text-muted mb-0">${message}</p>
          <small class="text-muted">Tente realizar uma nova busca</small>
        </div>
      </div>
    `;
  },

  /**
   * Reset the budget history card to initial state
   */
  reset() {
    const container = document.getElementById(
      "card-historico-orcamentario-container"
    );
    if (!container) {
      console.warn("Histórico orçamentário card container not found");
      return;
    }

    container.innerHTML = `
      <div class="br-card h-100 card-contratos d-flex justify-content-center align-items-center" style="min-height: 180px">
        <div class="br-loading medium" role="progressbar" aria-label="carregando histórico orçamentário"></div>
      </div>
    `;
  },

  /**
   * Format numbers for display
   * @param {number} value - The value to format
   * @returns {string} Formatted number string
   */
  formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return "0";
    }

    return new Intl.NumberFormat("pt-BR").format(value);
  },

  /**
   * Load data from API for a specific contract
   * @param {number} contratoId - Contract ID
   * @param {number} unidadeEmpenhoId - Optional unit ID
   */
  async loadDataFromAPI(contratoId, unidadeEmpenhoId = null) {
    if (!contratoId) {
      console.warn(
        "Contract ID is required to load historico orcamentario data"
      );
      this.showErrorState("ID do contrato não fornecido");
      return;
    }

    try {
      console.log(
        `Loading historico orcamentario data for contract ${contratoId}...`
      );

      const response = await EncontroAPI.fetchHistoricoOrcamentario(
        contratoId,
        unidadeEmpenhoId
      );

      if (response.success) {
        this.updateWithData(response.data);
      } else {
        console.error(
          "Failed to load historico orcamentario data:",
          response.error
        );
        this.showErrorState("Erro ao carregar dados da API");
      }
    } catch (error) {
      console.error("Error loading historico orcamentario data:", error);
      this.showErrorState("Erro de conexão com a API");
    }
  },
};

export default HistoricoOrcamentarioCard;
