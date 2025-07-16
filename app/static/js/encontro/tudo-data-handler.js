/**
 * TudoDataHandler - Handles data from the /tudo endpoint
 * Processes empenhos and financial documents data for display
 */
const TudoDataHandler = {
  /**
   * Load and process data from the /tudo endpoint
   * @param {number} contratoId - Contract ID to load data for
   */
  async loadTudoData(contratoId) {
    try {
      console.log(`Loading tudo data for contract ${contratoId}...`);

      const response = await fetch(`/tudo?contrato_id=${contratoId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Tudo data loaded successfully:", data);

      // Process and distribute the data to different components
      this.processAndDistributeData(data);

      return data;
    } catch (error) {
      console.error("Error loading tudo data:", error);
      this.handleError(error);
      throw error;
    }
  },

  /**
   * Process the tudo data and distribute to different UI components
   * @param {Object} data - The data from /tudo endpoint
   */
  processAndDistributeData(data) {
    if (!data || !data.empenhos_data) {
      console.warn("No empenhos data found in tudo response");
      return;
    }

    // Extract all transactions for Últimos Lançamentos
    const allTransactions = this.extractAllTransactions(data);

    // Update Últimos Lançamentos table
    this.updateUltimosLancamentos(allTransactions);

    // Extract financial documents for Grid Financeiro
    const financialDocuments = this.extractFinancialDocuments(data);

    // Update Grid Financeiro table
    this.updateGridFinanceiro(financialDocuments);

    // Update Empenhos Originais with the empenho data
    this.updateEmpenhosOriginais(data.empenhos_data);

    console.log(
      `Processed ${data.total_empenhos} empenhos with ${allTransactions.length} total transactions`
    );
  },

  /**
   * Extract all transactions from empenhos data
   * @param {Object} data - The tudo data
   * @returns {Array} Array of transaction objects
   */
  extractAllTransactions(data) {
    const transactions = [];

    data.empenhos_data.forEach((empenhoData) => {
      const empenho = empenhoData.empenho;

      // Add empenho as a transaction if it has value
      if (empenho.empenhado && parseFloat(empenho.empenhado) > 0) {
        transactions.push({
          data:
            empenho.data_emissao ||
            empenho.created_at ||
            new Date().toISOString(),
          tipo: "EMPENHO",
          codigo: this.trimDocumentNumber(empenhoData.prefixed_numero),
          valor: parseFloat(empenho.empenhado),
          especie: "ORIGINAL",
          tooltip: `Empenho ${empenho.numero} - Valor: ${this.formatCurrency(
            empenho.empenhado
          )} - Sistema: ${empenho.sistema_origem || "N/A"}`,
          icone: "fas fa-money-bill-wave",
          categoria: "orcamentario",
        });
      }

      // Add liquidation as transaction if different from empenhado
      if (empenho.liquidado && parseFloat(empenho.liquidado) > 0) {
        transactions.push({
          data:
            empenho.data_emissao ||
            empenho.created_at ||
            new Date().toISOString(),
          tipo: "LIQUIDACAO",
          codigo: this.trimDocumentNumber(empenhoData.prefixed_numero),
          valor: parseFloat(empenho.liquidado),
          especie: "LIQUIDACAO",
          tooltip: `Liquidação ${empenho.numero} - Valor: ${this.formatCurrency(
            empenho.liquidado
          )}`,
          icone: "fas fa-check-circle",
          categoria: "orcamentario",
        });
      }

      // Add payment as transaction if it exists
      if (empenho.pago && parseFloat(empenho.pago) > 0) {
        transactions.push({
          data:
            empenho.data_emissao ||
            empenho.created_at ||
            new Date().toISOString(),
          tipo: "PAGAMENTO",
          codigo: this.trimDocumentNumber(empenhoData.prefixed_numero),
          valor: parseFloat(empenho.pago),
          especie: "PAGAMENTO",
          tooltip: `Pagamento ${empenho.numero} - Valor: ${this.formatCurrency(
            empenho.pago
          )}`,
          icone: "fas fa-money-bill-wave",
          categoria: "orcamentario",
        });
      }
    });

    // Sort by date (most recent first)
    return transactions.sort((a, b) => new Date(b.data) - new Date(a.data));
  },

  /**
   * Extract financial documents (DAR, DARF, GPS) from empenhos data
   * @param {Object} data - The tudo data
   * @returns {Array} Array of financial document objects
   */
  extractFinancialDocuments(data) {
    const documents = [];

    data.empenhos_data.forEach((empenhoData) => {
      // Process DARF documents
      empenhoData.documentos_darf.forEach((darf) => {
        documents.push({
          data: this.formatDarfDate(darf),
          tipo: "DARF",
          codigo: this.trimDocumentNumber(darf.id_doc_darf),
          valor: parseFloat(darf.va_receita || 0),
          empenho_numero: this.trimDocumentNumber(empenhoData.prefixed_numero),
          processo: darf.nr_processo,
          receita_id: darf.id_receita,
          vencimento: this.formatVencimentoDate(darf),
          tooltip: `DARF ${this.trimDocumentNumber(
            darf.id_doc_darf
          )} - Receita: ${darf.id_receita} - Processo: ${darf.nr_processo}`,
          icone: "fas fa-file-invoice-dollar",
          categoria: "financeiro",
        });
      });

      // Process DAR documents
      empenhoData.documentos_dar.forEach((dar) => {
        documents.push({
          data: dar.data || new Date().toISOString(),
          tipo: "DAR",
          codigo: this.trimDocumentNumber(dar.id_doc_dar),
          valor: parseFloat(dar.valor || 0),
          empenho_numero: this.trimDocumentNumber(empenhoData.prefixed_numero),
          tooltip: `DAR ${this.trimDocumentNumber(dar.id_doc_dar)}`,
          icone: "fas fa-file-alt",
          categoria: "financeiro",
        });
      });

      // Process GPS documents
      empenhoData.documentos_gps.forEach((gps) => {
        documents.push({
          data: gps.data || new Date().toISOString(),
          tipo: "GPS",
          codigo: this.trimDocumentNumber(gps.id_doc_gps),
          valor: parseFloat(gps.valor || 0),
          empenho_numero: this.trimDocumentNumber(empenhoData.prefixed_numero),
          tooltip: `GPS ${this.trimDocumentNumber(gps.id_doc_gps)}`,
          icone: "fas fa-file-medical",
          categoria: "financeiro",
        });
      });
    });

    // Sort by date (most recent first)
    return documents.sort((a, b) => new Date(b.data) - new Date(a.data));
  },

  /**
   * Update Últimos Lançamentos table with transaction data
   * @param {Array} transactions - Array of transaction objects
   */
  updateUltimosLancamentos(transactions) {
    const tbody = document.getElementById("ultimos-lancamentos-tbody");
    if (!tbody) return;

    // Take only the 5 most recent transactions
    const recentTransactions = transactions.slice(0, 5);

    if (recentTransactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center" style="padding: 40px;">
            <div class="text-muted">
              <i class="fas fa-inbox fa-2x mb-3"></i>
              <br />
              Nenhum lançamento encontrado
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = recentTransactions
      .map((transaction) => this.renderTransactionRow(transaction))
      .join("");

    tbody.innerHTML = rows;
  },

  /**
   * Update Grid Financeiro table with financial documents
   * @param {Array} documents - Array of financial document objects
   */
  updateGridFinanceiro(documents) {
    const tbody = document.getElementById("financeiro-grid-tbody");
    if (!tbody) return;

    if (documents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center" style="padding: 40px;">
            <div class="text-muted">
              <i class="fas fa-inbox fa-2x mb-3"></i>
              <br />
              Nenhum documento financeiro encontrado
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const rows = documents
      .map((doc, index) => this.renderFinancialDocumentRow(doc, index + 1))
      .join("");

    tbody.innerHTML = rows;
  },

  /**
   * Update Empenhos Originais table
   * @param {Array} empenhosData - Array of empenho data objects
   */
  updateEmpenhosOriginais(empenhosData) {
    // Use the existing method from EncontroContas
    if (
      typeof EncontroContas !== "undefined" &&
      EncontroContas.updateEmpenhosOriginaisGrid
    ) {
      // Transform data to match expected format
      const empenhos = empenhosData.map((item) => item.empenho);
      EncontroContas.updateEmpenhosOriginaisGrid({ empenhos });
    }
  },

  /**
   * Render a transaction row for Últimos Lançamentos
   * @param {Object} transaction - Transaction object
   * @returns {string} HTML string for the row
   */
  renderTransactionRow(transaction) {
    const formattedDate = this.formatDate(transaction.data);
    const formattedValue = this.formatCurrency(transaction.valor);

    return `
      <tr>
        <td style="text-align: center; width: 60px;">
          <i class="${transaction.icone} text-success" style="font-size: 16px;"></i>
        </td>
        <td style="font-size: 14px; color: #666;">
          ${formattedDate}
        </td>
        <td style="text-align: center; width: 60px;">
          <i class="fas fa-info-circle text-info" 
             style="cursor: pointer; font-size: 16px;" 
             title="${transaction.tooltip}"
             data-toggle="tooltip"
             data-placement="top">
          </i>
        </td>
        <td style="font-size: 14px;">
          <strong>${transaction.codigo}</strong> (${formattedValue}) - ${transaction.tipo}
        </td>
      </tr>
    `;
  },

  /**
   * Render a financial document row for Grid Financeiro
   * @param {Object} doc - Financial document object
   * @param {number} index - Row index
   * @returns {string} HTML string for the row
   */
  renderFinancialDocumentRow(doc, index) {
    const formattedDate = this.formatDate(doc.data);
    const formattedValue = this.formatCurrency(doc.valor);

    return `
      <tr>
        <td style="width: 40px; text-align: center;">${index}</td>
        <td style="font-size: 14px;">${formattedDate}</td>
        <td style="font-size: 14px;"><strong>${doc.codigo}</strong></td>
        <td style="text-align: center; width: 50px;">
          <i class="${doc.icone} text-primary" style="font-size: 16px;"></i>
        </td>
        <td style="font-size: 14px;">${doc.tipo}</td>
        <td style="font-size: 14px;">${formattedValue}</td>
        <td style="font-size: 14px;">${doc.empenho_numero || "N/A"}</td>
        <td style="text-align: center; width: 50px;">
          <i class="fas fa-info-circle text-info" 
             style="cursor: pointer; font-size: 16px;" 
             title="${doc.tooltip}"
             data-toggle="tooltip"
             data-placement="top">
          </i>
        </td>
      </tr>
    `;
  },

  /**
   * Format DARF date from components
   * @param {Object} darf - DARF document object
   * @returns {string} Formatted date
   */
  formatDarfDate(darf) {
    try {
      if (darf.dt_carga_c) {
        // Format: YYYYMMDD to YYYY-MM-DD
        const dateStr = darf.dt_carga_c.toString();
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.warn("Error formatting DARF date:", error);
    }
    return new Date().toISOString();
  },

  /**
   * Format vencimento date from DARF components
   * @param {Object} darf - DARF document object
   * @returns {string} Formatted date
   */
  formatVencimentoDate(darf) {
    try {
      const year = darf.id_ano_vencimento_doc;
      const month = darf.id_mes_vencimento_doc.toString().padStart(2, "0");
      const day = darf.id_dia_vencimento_doc.toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn("Error formatting vencimento date:", error);
      return "N/A";
    }
  },

  /**
   * Format date to Brazilian format
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  },

  /**
   * Format currency to Brazilian format
   * @param {number|string} value - Numeric value
   * @returns {string} Formatted currency
   */
  formatCurrency(value) {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numericValue)) return "R$ 0,00";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numericValue);
  },

  /**
   * Trim document number if longer than 10 characters
   * Removes the first 10 characters and keeps the rest
   * @param {string|number} documentNumber - Document number to trim
   * @returns {string} Trimmed document number or original if <= 10 chars
   */
  trimDocumentNumber(documentNumber) {
    try {
      // Convert to string and handle null/undefined
      const docStr = String(documentNumber || "").trim();

      // If empty or very short, return as-is
      if (!docStr || docStr.length <= 10) {
        return docStr || "N/A";
      }

      // Remove first 10 characters if longer than 10
      const trimmed = docStr.substring(10);

      // Ensure we don't return empty string
      return trimmed || docStr;
    } catch (error) {
      console.warn("Error trimming document number:", error);
      return String(documentNumber || "N/A");
    }
  },

  /**
   * Handle errors during data loading
   * @param {Error} error - The error object
   */
  handleError(error) {
    // Update UI to show error state
    const containers = ["ultimos-lancamentos-tbody", "financeiro-grid-tbody"];

    containers.forEach((containerId) => {
      const container = document.getElementById(containerId);
      if (container) {
        const colSpan = containerId.includes("financeiro") ? "8" : "4";
        container.innerHTML = `
          <tr>
            <td colspan="${colSpan}" class="text-center" style="padding: 40px;">
              <div class="text-danger">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <br />
                Erro ao carregar dados: ${error.message}
              </div>
            </td>
          </tr>
        `;
      }
    });
  },
};

// Make it available globally for cross-module access
if (typeof window !== "undefined") {
  window.TudoDataHandler = TudoDataHandler;
  console.log("TudoDataHandler registered globally");
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = TudoDataHandler;
}
