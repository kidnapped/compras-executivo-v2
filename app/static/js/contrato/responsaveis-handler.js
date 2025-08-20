import modalManager from "../common/modal-manager.js";

const renderResponsaveis = (responsaveis) => {
  if (!responsaveis || responsaveis.length === 0) {
    return "<p>Nenhum responsável encontrado para este contrato.</p>";
  }

  // Create HTML for each responsible
  const responsaveisHtml = responsaveis
    .map((resp, index) => {
      // Build phone info HTML
      let phoneInfo = "";
      const phones = [];

      if (resp.telefone_fixo) {
        phones.push(
          `<i class="fas fa-phone" style="color: #1351b4; margin-right: 4px;"></i>${resp.telefone_fixo}`
        );
      }

      if (resp.telefone_celular) {
        phones.push(
          `<i class="fas fa-mobile-alt" style="color: #1351b4; margin-right: 4px;"></i>${resp.telefone_celular}`
        );
      }

      if (phones.length > 0) {
        phoneInfo = `
            <div style="color: #666; font-size: 13px; margin-top: 4px; display: flex; flex-direction: column; gap: 2px;">
              ${phones.map((phone) => `<div>${phone}</div>`).join("")}
            </div>
          `;
      }

      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e5e5;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 32px; 
                height: 32px; 
                background: #1351b4; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 14px;
              ">
                ${resp.name
                  .trim()
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #333; font-size: 15px;">
                  ${resp.name.trim()}
                </div>
                ${phoneInfo}
              </div>
            </div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e5e5; text-align: center;">
            <span style="
              background: #e8f5e8; 
              color: #2e7d32; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-size: 12px; 
              font-weight: 500;
            ">
              Ativo
            </span>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="responsaveis-summary" style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-users" style="color: #1351b4; font-size: 18px;"></i>
        <strong style="font-size: 16px; color: #333;">
          ${responsaveis.length} responsável(is) designado(s)
        </strong>
      </div>
    </div>
    <div class="table-responsive">
      <table class="responsaveis-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 12px 16px; border-bottom: 2px solid #ddd; text-align: left; font-weight: 600; color: #333;">
              Responsável e Contato
            </th>
            <th style="padding: 12px 16px; border-bottom: 2px solid #ddd; text-align: center; font-weight: 600; color: #333;">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          ${responsaveisHtml}
        </tbody>
      </table>
    </div>
  `;
};

const showResponsaveis = async (
  contractId,
  contractNumero,
  contractAno,
  responsaveisCount
) => {
  // 1. Open the modal and set its initial state
  modalManager.open();
  modalManager.setTitle(
    `Responsáveis do Contrato ${contractNumero}/${contractAno}`
  );
  modalManager.showLoading();

  // 2. Fetch the specific data
  try {
    // IMPORTANT: Replace with your actual API endpoint
    const response = await fetch(
      `/dashboard/contrato/${contractId}/responsaveis`
    );
    if (!response.ok) {
      throw new Error("Nenhum responsável encontrado para este contrato.");
    }
    const data = await response.json();

    // 3. Render the data and update the modal body
    const responsaveisHtml = renderResponsaveis(data);
    modalManager.setBody(responsaveisHtml);
  } catch (error) {
    console.error("Error fetching responsaveis:", error);
    modalManager.setBody(
      `<div class="br-message danger" role="alert">
        <div class="icon">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
        </div>
        <div class="content">
          <span class="message-title">Erro ao carregar responsáveis</span><br/>
          <span class="message-body">${error.message}</span>
        </div>
      </div>`
    );
  }
};

export default {
  showResponsaveis,
};
