import EncontroAPI from "../api/encontro-api.js";

/**
 * UI layer for Encontro de Contas
 * Handles all UI updates and rendering
 */

export default {
  /**
   * Show loading state
   */
  showLoading() {
    const resultsContainer = document.getElementById("empenhos-results");
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="text-center" style="padding: 40px;">
          <div class="br-loading medium" role="progressbar" aria-label="carregando empenhos"></div>
          <div style="margin-top: 10px;">Carregando empenhos e dados do contrato...</div>
        </div>
      `;
    }
  },

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    const resultsContainer = document.getElementById("empenhos-results");
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="br-card">
          <div class="card-content text-center" style="padding: 40px;">
            <i class="fas fa-exclamation-triangle text-danger" style="font-size: 24px; margin-bottom: 10px;"></i>
            <div class="text-danger">${message}</div>
            <button class="br-button small" onclick="document.getElementById('contrato-id-input').value = ''; document.getElementById('empenhos-results').innerHTML = '';" style="margin-top: 10px;">
              <i class="fas fa-times"></i> Limpar
            </button>
          </div>
        </div>
      `;
    }
  },

  /**
   * Show empty state
   */
  showEmpty() {
    const resultsContainer = document.getElementById("empenhos-results");
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="br-card">
          <div class="card-content text-center" style="padding: 40px;">
            <i class="fas fa-info-circle text-muted" style="font-size: 24px; margin-bottom: 10px;"></i>
            <div class="text-muted">Nenhum empenho encontrado para este contrato</div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render empenhos data with contract information
   * @param {Object} data - Enhanced data from API including contract details
   */
  renderEmpenhos(data) {
    const resultsContainer = document.getElementById("empenhos-results");
    if (!resultsContainer) return;

    if (data.total_empenhos === 0) {
      this.showEmpty();
      return;
    }

    const html = `
      <div class="br-card mb-4">
        <div class="card-header">
          <h4>${data.titulo}</h4>
          <p class="text-muted">${data.subtitulo}</p>
        </div>
        <div class="card-content">
          <!-- Contract Information Section -->
          ${this.renderContractInfo(data.contrato)}

          <!-- Financial Overview -->
          ${this.renderFinancialOverview(data)}

          <!-- Detailed Statistics -->
          ${this.renderDetailedStats(data)}

          <!-- Empenhos Table -->
          ${this.renderEmpenhosTable(data.empenhos)}

          <!-- Analysis Section -->
          ${this.renderAnalysisSection(data)}
        </div>
      </div>
    `;

    resultsContainer.innerHTML = html;
  },

  /**
   * Render contract information section
   * @param {Object} contrato - Contract data
   * @returns {string} HTML string for contract info
   */
  renderContractInfo(contrato) {
    return `
      <div class="row mb-4">
        <div class="col-12">
          <h5><i class="fas fa-file-contract text-primary"></i> Informações do Contrato</h5>
          <div class="row">
            <div class="col-md-2">
              <div class="br-card bg-light">
                <div class="card-content text-center">
                  <div class="h6 text-muted">Valor Inicial</div>
                  <div class="h5 text-success">${EncontroAPI.formatCurrency(
                    contrato.valor_inicial
                  )}</div>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="br-card bg-light">
                <div class="card-content text-center">
                  <div class="h6 text-muted">Valor Global</div>
                  <div class="h5 text-primary">${EncontroAPI.formatCurrency(
                    contrato.valor_global
                  )}</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="br-card bg-light">
                <div class="card-content text-center">
                  <div class="h6 text-muted">Data Assinatura</div>
                  <div class="h6">${EncontroAPI.formatDate(
                    contrato.data_assinatura
                  )}</div>
                </div>
              </div>
            </div>
            <div class="col-md-2">
              <div class="br-card bg-light">
                <div class="card-content text-center">
                  <div class="h6 text-muted">Vigência Início</div>
                  <div class="h6">${EncontroAPI.formatDate(
                    contrato.vigencia_inicio
                  )}</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="br-card bg-light">
                <div class="card-content text-center">
                  <div class="h6 text-muted">Vigência Fim</div>
                  <div class="h6">${EncontroAPI.formatDate(
                    contrato.vigencia_fim
                  )}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render financial overview with percentages
   * @param {Object} data - Complete data object
   * @returns {string} HTML string for financial overview
   */
  renderFinancialOverview(data) {
    return `
      <div class="row mb-4">
        <div class="col-12">
          <h5><i class="fas fa-chart-pie text-info"></i> Visão Financeira</h5>
          <div class="row">
            <div class="col-md-3">
              <div class="br-card bg-success text-white">
                <div class="card-content text-center">
                  <div class="h5">${EncontroAPI.formatCurrency(
                    data.total_empenhado
                  )}</div>
                  <div class="small">Total Empenhado</div>
                  <div class="badge badge-light text-dark mt-1">${
                    data.percentual_empenhado
                  }%</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="br-card bg-warning text-white">
                <div class="card-content text-center">
                  <div class="h5">${EncontroAPI.formatCurrency(
                    data.total_liquidado
                  )}</div>
                  <div class="small">Total Liquidado</div>
                  <div class="badge badge-light text-dark mt-1">${
                    data.percentual_liquidado
                  }%</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="br-card bg-info text-white">
                <div class="card-content text-center">
                  <div class="h5">${EncontroAPI.formatCurrency(
                    data.total_pago
                  )}</div>
                  <div class="small">Total Pago</div>
                  <div class="badge badge-light text-dark mt-1">${
                    data.percentual_pago
                  }%</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="br-card ${
                data.saldo_contrato < 0 ? "bg-danger" : "bg-secondary"
              } text-white">
                <div class="card-content text-center">
                  <div class="h5">${EncontroAPI.formatCurrency(
                    data.saldo_contrato
                  )}</div>
                  <div class="small">Saldo do Contrato</div>
                  <div class="small mt-1">${
                    data.saldo_contrato < 0 ? "Excedido!" : "Disponível"
                  }</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render detailed statistics
   * @param {Object} data - Complete data object
   * @returns {string} HTML string for detailed stats
   */
  renderDetailedStats(data) {
    return `
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="br-card bg-primary text-white">
            <div class="card-content text-center">
              <div class="h5">${data.total_empenhos}</div>
              <div class="small">Total de Empenhos</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="br-card ${
            data.saldo_empenhado < 0 ? "bg-danger" : "bg-warning"
          } text-white">
            <div class="card-content text-center">
              <div class="h5">${EncontroAPI.formatCurrency(
                data.saldo_empenhado
              )}</div>
              <div class="small">Saldo Empenhado</div>
              <div class="small">(Empenhado - Liquidado)</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="br-card ${
            data.saldo_liquidado < 0 ? "bg-danger" : "bg-info"
          } text-white">
            <div class="card-content text-center">
              <div class="h5">${EncontroAPI.formatCurrency(
                data.saldo_liquidado
              )}</div>
              <div class="small">Saldo Liquidado</div>
              <div class="small">(Liquidado - Pago)</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render empenhos table
   * @param {Array} empenhos - Array of empenho objects
   * @returns {string} HTML string for the table
   */
  renderEmpenhosTable(empenhos) {
    return `
      <div class="row mb-4">
        <div class="col-12">
          <h5><i class="fas fa-table text-secondary"></i> Detalhes dos Empenhos</h5>
          <div class="table-responsive">
            <table class="table table-striped br-table">
              <thead class="thead-dark">
                <tr>
                  <th>Número</th>
                  <th>Empenhado</th>
                  <th>Liquidado</th>
                  <th>Pago</th>
                  <th>Data Empenho</th>
                  <th>Data Liquidação</th>
                  <th>Data Pagamento</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderEmpenhosRows(empenhos)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render table rows for empenhos with enhanced information
   * @param {Array} empenhos - Array of empenho objects
   * @returns {string} HTML string for table rows
   */
  renderEmpenhosRows(empenhos) {
    return empenhos
      .map((empenho) => {
        const saldoEmpenho = empenho.empenhado - empenho.liquidado;
        const saldoLiquidado = empenho.liquidado - empenho.pago;

        let situacao = "";
        let situacaoClass = "";

        if (empenho.pago > 0) {
          if (empenho.pago === empenho.liquidado) {
            situacao = "Pago";
            situacaoClass = "badge-success";
          } else {
            situacao = "Parc. Pago";
            situacaoClass = "badge-warning";
          }
        } else if (empenho.liquidado > 0) {
          situacao = "Liquidado";
          situacaoClass = "badge-info";
        } else {
          situacao = "Empenhado";
          situacaoClass = "badge-primary";
        }

        return `
        <tr>
          <td><strong>${empenho.numero || "N/A"}</strong></td>
          <td>${EncontroAPI.formatCurrency(empenho.empenhado)}</td>
          <td>${EncontroAPI.formatCurrency(empenho.liquidado)}</td>
          <td>${EncontroAPI.formatCurrency(empenho.pago)}</td>
          <td>${EncontroAPI.formatDate(empenho.data_empenho)}</td>
          <td>${EncontroAPI.formatDate(empenho.data_liquidacao)}</td>
          <td>${EncontroAPI.formatDate(empenho.data_pagamento)}</td>
          <td><span class="badge ${situacaoClass}">${situacao}</span></td>
        </tr>
      `;
      })
      .join("");
  },

  /**
   * Render analysis section with insights
   * @param {Object} data - Complete data object
   * @returns {string} HTML string for analysis
   */
  renderAnalysisSection(data) {
    const executionRate = data.percentual_empenhado;
    const liquidationRate = data.percentual_liquidado;
    const paymentRate = data.percentual_pago;

    let insights = [];

    if (executionRate > 90) {
      insights.push(
        '<i class="fas fa-exclamation-triangle text-warning"></i> Contrato com alta execução financeira'
      );
    }

    if (data.saldo_contrato < 0) {
      insights.push(
        '<i class="fas fa-exclamation-circle text-danger"></i> Valor empenhado excede o valor do contrato'
      );
    }

    if (liquidationRate < paymentRate) {
      insights.push(
        '<i class="fas fa-info-circle text-info"></i> Inconsistência: pagamentos superiores às liquidações'
      );
    }

    if (data.saldo_liquidado > data.total_liquidado * 0.1) {
      insights.push(
        '<i class="fas fa-clock text-warning"></i> Há liquidações pendentes de pagamento'
      );
    }

    return `
      <div class="row">
        <div class="col-12">
          <h5><i class="fas fa-lightbulb text-warning"></i> Análise</h5>
          <div class="br-card bg-light">
            <div class="card-content">
              ${
                insights.length > 0
                  ? `<ul class="list-unstyled mb-0">
                  ${insights
                    .map((insight) => `<li class="mb-2">${insight}</li>`)
                    .join("")}
                </ul>`
                  : '<p class="mb-0 text-muted"><i class="fas fa-check-circle text-success"></i> Nenhuma inconsistência detectada na execução financeira</p>'
              }
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
