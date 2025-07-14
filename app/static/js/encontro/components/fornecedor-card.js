/**
 * Fornecedor Card Component
 * Manages the supplier information card display and updates
 */

const FornecedorCard = {
  /**
   * Initialize the fornecedor card with loading state
   */
  initialize() {
    console.log("Initializing Fornecedor Card...");
    this.showLoadingState();
  },

  /**
   * Show loading state in the supplier card
   */
  showLoadingState() {
    const container = document.getElementById("card-fornecedor-container");
    if (!container) {
      console.warn("Fornecedor card container not found");
      return;
    }

    container.innerHTML = `
      <div class="pl-6 pt-3 h-100 card-fornecedor br-card" style="min-height: 10px">
        <div id="fornecedor-card-content">
          <div class="row">
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-building text-blue-warm-vivid-80 br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Fornecedor</div>
                    <span class="text-muted" id="fornecedor-nome" title="Aguardando consulta...">aguardando consulta...</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-id-card text-info br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">CNPJ / CPF</div>
                    <span class="text-muted" id="fornecedor-cpf-cnpj">aguardando consulta...</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-dollar-sign text-success br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Valor do Contrato</div>
                    <span class="text-muted" id="contrato-valor-global">aguardando consulta...</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-chart-bar text-warning br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Orçamentário</div>
                    <span class="text-muted" id="empenhos-total-empenhado">...</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-coins text-secondary br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Finanças</div>
                    <span class="text-muted" id="empenhos-total-pago">...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Update the supplier card with data from the API
   * @param {Object} data - Contract and supplier data from the API
   */
  updateWithContractData(data) {
    if (!data) {
      console.warn("No data provided to update supplier card");
      this.showErrorState("Dados não encontrados");
      return;
    }

    const { contrato, total_empenhado, total_pago } = data;

    if (!contrato) {
      console.warn("No contract data provided");
      this.showErrorState("Dados do contrato não encontrados");
      return;
    }

    console.log("Updating supplier card with data:", {
      contrato,
      total_empenhado,
      total_pago,
    });

    // Show the updated card content
    this.showCardContent(contrato, total_empenhado, total_pago);
  },

  /**
   * Show the card content with the actual data
   * @param {Object} contrato - Contract data
   * @param {number} totalEmpenhado - Total empenhado amount
   * @param {number} totalPago - Total pago amount
   */
  showCardContent(contrato, totalEmpenhado, totalPago) {
    const container = document.getElementById("card-fornecedor-container");
    if (!container) {
      console.warn("Fornecedor card container not found");
      return;
    }

    const fornecedorNome = contrato.fornecedor_nome || "Não informado";
    const cpfCnpj = contrato.cpf_cnpj_idgener || "Não informado";
    const valorGlobal = this.formatCurrency(contrato.valor_global || 0);
    const orcamentario = this.formatCurrency(totalEmpenhado || 0);
    const financas = this.formatCurrency(totalPago || 0);

    container.innerHTML = `
      <div class="pl-6 pt-3 h-100 card-fornecedor br-card" style="min-height: 10px">
        <div id="fornecedor-card-content">
          <div class="row">
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-building text-blue-warm-vivid-80 br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Fornecedor</div>
                    <span class="text-muted" id="fornecedor-nome" title="${fornecedorNome}">
                      ${this.truncateText(fornecedorNome, 30)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-id-card text-info br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">CNPJ / CPF</div>
                    <span class="text-muted" id="fornecedor-cpf-cnpj">${cpfCnpj}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-dollar-sign text-success br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Valor do Contrato</div>
                    <span class="text-muted" id="contrato-valor-global">${valorGlobal}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-chart-bar text-warning br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Orçamentário</div>
                    <span class="text-muted" id="empenhos-total-empenhado">${orcamentario}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2">
              <div class="pt-1">
                <div class="d-flex pb-2">
                  <i class="fas fa-coins text-secondary br-avatar"></i>
                  <div class="ml-3">
                    <div class="text-weight-semi-bold text-up-01">Finanças</div>
                    <span class="text-muted" id="empenhos-total-pago">${financas}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Show error state in the supplier card
   * @param {string} message - Error message to display
   */
  showErrorState(message = "Erro ao carregar dados") {
    const container = document.getElementById("card-fornecedor-container");
    if (!container) {
      console.warn("Fornecedor card container not found");
      return;
    }

    container.innerHTML = `
      <div class="br-card h-100 card-fornecedor d-flex justify-content-center align-items-center text-center" style="min-height: 180px">
        <div class="card-content">
          <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
          <p class="text-muted mb-0">${message}</p>
          <small class="text-muted">Tente realizar uma nova busca</small>
        </div>
      </div>
    `;
  },

  /**
   * Reset the supplier card to initial state
   */
  reset() {
    const container = document.getElementById("card-fornecedor-container");
    if (!container) {
      console.warn("Fornecedor card container not found");
      return;
    }

    container.innerHTML = `
      <div class="br-card pt-3 h-100 card-fornecedor" style="min-height: 180px">
        <div class="card-content" id="fornecedor-card-content">
          <div class="row">
            <div class="col-12 mb-3">
              <span style="font-weight: bold">
                <i class="fas fa-building text-primary"></i> Fornecedor
              </span><br />
              <span class="text-muted" id="fornecedor-nome">Aguardando consulta...</span>
            </div>
            <div class="col-12 mb-3">
              <span style="font-weight: bold">
                <i class="fas fa-id-card text-info"></i> CNPJ / CPF
              </span><br />
              <span class="text-muted" id="fornecedor-cpf-cnpj">--</span>
            </div>
            <div class="col-12 mb-3">
              <span style="font-weight: bold">
                <i class="fas fa-dollar-sign text-success"></i> Valor do Contrato
              </span><br />
              <span class="text-muted" id="contrato-valor-global">--</span>
            </div>
            <div class="col-12 mb-3">
              <span style="font-weight: bold">
                <i class="fas fa-chart-bar text-warning"></i> Orçamentário
              </span><br />
              <span class="text-muted" id="empenhos-total-empenhado">--</span>
            </div>
            <div class="col-12">
              <span style="font-weight: bold">
                <i class="fas fa-coins text-secondary"></i> Finanças
              </span><br />
              <span class="text-muted" id="empenhos-total-pago">--</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Format currency values
   * @param {number} value - The value to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return "R$ 0,00";
    }

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },

  /**
   * Truncate text if it's too long
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  },
};

export default FornecedorCard;
