/**
 * API layer for Encontro de Contas
 * Handles all API calls related to contract settlement accounts
 */

export default {
  /**
   * Fetch empenhos for a specific contract
   * @param {number} contratoId - Contract ID
   * @param {number} unidadeEmpenhoId - Optional unit ID
   * @returns {Promise<Object>} API response with empenhos and contract data
   */
  async fetchEmpenhosContrato(contratoId, unidadeEmpenhoId = null) {
    try {
      let url = `/encontro-de-contas/empenhos-contrato/${contratoId}`;

      // Add query parameter if unidadeEmpenhoId is provided
      if (unidadeEmpenhoId) {
        url += `?unidade_empenho_id=${unidadeEmpenhoId}`;
      }

      console.log(
        `Fetching empenhos and contract data for contract ${contratoId}...`
      );

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      console.log(`Successfully fetched contract data:`, {
        contractId: contratoId,
        totalEmpenhos: data.total_empenhos,
        contractValue: data.contrato?.valor_global,
        totalEmpenhado: data.total_empenhado,
        executionPercentage: data.percentual_empenhado,
      });

      // Validate the enhanced data structure
      if (!this.validateApiResponse(data)) {
        throw new Error("Resposta da API inválida ou incompleta");
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error fetching empenhos and contract data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Validate API response structure
   * @param {Object} data - API response data
   * @returns {boolean} True if valid
   */
  validateApiResponse(data) {
    const requiredFields = [
      "contrato_id",
      "contrato",
      "total_empenhos",
      "total_empenhado",
      "total_liquidado",
      "total_pago",
      "percentual_empenhado",
      "percentual_liquidado",
      "percentual_pago",
      "saldo_contrato",
      "empenhos",
    ];

    const contractFields = [
      "valor_inicial",
      "valor_global",
      "data_assinatura",
      "vigencia_inicio",
      "vigencia_fim",
    ];

    // Check main fields
    for (const field of requiredFields) {
      if (!(field in data)) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }

    // Check contract sub-object
    if (!data.contrato || typeof data.contrato !== "object") {
      console.error("Missing or invalid contract object");
      return false;
    }

    for (const field of contractFields) {
      if (!(field in data.contrato)) {
        console.error(`Missing required contract field: ${field}`);
        return false;
      }
    }

    // Check empenhos array
    if (!Array.isArray(data.empenhos)) {
      console.error("Empenhos should be an array");
      return false;
    }

    return true;
  },

  /**
   * Format currency value
   * @param {number} value - Numeric value
   * @returns {string} Formatted currency string
   */
  formatCurrency(value) {
    if (!value && value !== 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  },

  /**
   * Format date string
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date in Brazilian format
   */
  formatDate(dateString) {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Data Inválida";

      return date.toLocaleDateString("pt-BR");
    } catch (error) {
      return "Data Inválida";
    }
  },

  /**
   * Format percentage value
   * @param {number} value - Percentage value
   * @returns {string} Formatted percentage string
   */
  formatPercentage(value) {
    if (!value && value !== 0) return "0%";
    return `${value.toFixed(1)}%`;
  },

  /**
   * Calculate contract utilization status
   * @param {Object} data - Contract and empenhos data
   * @returns {Object} Status information
   */
  getContractStatus(data) {
    const utilizationRate = data.percentual_empenhado;

    let status = {
      level: "success",
      text: "Normal",
      description: "Execução dentro do esperado",
    };

    if (utilizationRate >= 95) {
      status = {
        level: "danger",
        text: "Crítico",
        description: "Contrato quase totalmente executado",
      };
    } else if (utilizationRate >= 80) {
      status = {
        level: "warning",
        text: "Atenção",
        description: "Alta execução financeira",
      };
    } else if (utilizationRate >= 50) {
      status = {
        level: "info",
        text: "Moderado",
        description: "Execução moderada",
      };
    } else if (utilizationRate < 10) {
      status = {
        level: "secondary",
        text: "Baixo",
        description: "Baixa execução financeira",
      };
    }

    return status;
  },
};
