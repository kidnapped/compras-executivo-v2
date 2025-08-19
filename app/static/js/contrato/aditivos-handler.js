import modalManager from "../common/modal-manager.js";

const renderAditivos = (aditivos) => {
  if (!aditivos || aditivos.length === 0) {
    return "<p>Nenhum aditivo encontrado para este contrato.</p>";
  }

  // Helper function to format currency values
  const formatCurrency = (value) => {
    if (!value || value === null || value === 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString || dateString === null || dateString === undefined) {
      return "N/A";
    }

    let date;

    // Check if it's already in DD/MM/YYYY format (from API)
    if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        // Convert DD/MM/YYYY to YYYY-MM-DD for proper parsing
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];

        // Create date using YYYY-MM-DD format which is universally recognized
        date = new Date(`${year}-${month}-${day}`);
      } else {
        return "Data Inválida";
      }
    } else {
      // Try to create a date object for other formats
      date = new Date(dateString);
    }

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

  const aditivosHtml = aditivos
    .map(
      (aditivo) => `
        <tr>
          <td><strong class="text-primary">${
            aditivo.tipo_descricao || "N/A"
          }</strong></td>
          <td><span class="valor-currency">${formatCurrency(
            aditivo.valor_global
          )}</span></td>
          <td><span class="data-badge">${formatDate(
            aditivo.vigencia_inicio
          )}</span></td>
          <td><span class="data-badge">${formatDate(
            aditivo.vigencia_fim
          )}</span></td>
        </tr>
        <tr class="aditivo-objeto-row">
          <td colspan="4">
            <div class="aditivo-detail-label"><strong>Objeto:</strong></div>
            <div class="aditivo-detail-content">${aditivo.objeto || "N/A"}</div>
          </td>
        </tr>
        <tr class="aditivo-observacao-row">
          <td colspan="4">
            <div class="aditivo-detail-label"><strong>Observações:</strong></div>
            <div class="aditivo-detail-content">${
              aditivo.observacao || "N/A"
            }</div>
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <div class="aditivos-summary">
      <strong>${aditivos.length} aditivo(s) encontrado(s)</strong>
    </div>
    <div class="table-responsive">
      <table class="aditivos-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Valor Global</th>
            <th>Vigência Início</th>
            <th>Vigência Fim</th>
          </tr>
        </thead>
        <tbody>
          ${aditivosHtml}
        </tbody>
      </table>
    </div>
  `;
};

const showAditivos = async (contractId, contractNumero, contractAno) => {
  // 1. Open the modal and set its initial state
  modalManager.open();
  modalManager.setTitle(
    `Aditivos do Contrato ${contractNumero}/${contractAno}`
  );
  modalManager.showLoading();

  // 2. Fetch the specific data
  try {
    // IMPORTANT: Replace with your actual API endpoint
    const response = await fetch(`/dashboard/contrato/${contractId}/aditivos`);
    if (!response.ok) {
      throw new Error("Nenhum aditivo encontrado para este contrato.");
    }
    const data = await response.json();

    // 3. Render the data and update the modal body
    const aditivosHtml = renderAditivos(data);
    modalManager.setBody(aditivosHtml);
  } catch (error) {
    console.error("Error fetching aditivos:", error);
    modalManager.setBody(
      `<div class="br-message danger" role="alert">${error.message}</div>`
    );
  }
};

export default {
  showAditivos,
};
