/**
 * Financial Bars Component
 * Handles rendering and updating of financial progress bars for contracts
 */

const formatCurrency = (value) => {
  if (!value) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const calculateFinancialPercentage = (value, total) => {
  if (!value || !total) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
};

const createFinancialBar = ({
  contractId,
  type,
  value,
  total,
  width = 32,
  height = 140,
  backgroundColor = "#E5EBFB",
  fillColor = "#8f9dd2",
  tooltipText = "",
  showTooltipOnFill = false,
}) => {
  const percentage = calculateFinancialPercentage(value, total);

  return `
    <div class="financial-bars-container" 
         data-contract-id="${contractId}" 
         data-type="${type}" 
         style="height: ${height}px; display: flex; align-items: center; justify-content: center;">
      <div class="financial-bar-group" 
           style="height: ${height}px; display: flex; align-items: center; position: relative;">
        <div class="financial-bar-value" 
             style="
               position: absolute;
               left: -20px;
               top: 50%;
               transform: translateY(-50%) rotate(180deg); 
               writing-mode: vertical-rl; 
               font-family: Arial, sans-serif; 
               font-size: 10px; 
               font-weight: bold; 
               color: #333; 
               white-space: nowrap;
               line-height: 1.2;
               z-index: 1;
               max-width: 18px;
               overflow: hidden;
               text-overflow: ellipsis;">${formatCurrency(value)}</div>
        <div class="financial-bar" 
             ${generateTooltipAttributes(
               !showTooltipOnFill,
               tooltipText || `${type} ${formatCurrency(value)}`
             )}
             data-type="${type}" 
             data-amount="${value || 0}" 
             style="
               width: ${width}px; 
               height: ${height}px; 
               background-color: ${backgroundColor}; 
               position: relative;">
          <div class="financial-bar-fill" 
               ${generateTooltipAttributes(
                 showTooltipOnFill,
                 tooltipText || `${type} ${formatCurrency(value)}`
               )}
               style="
                 position: absolute; 
                 bottom: 0; 
                 width: 100%; 
                 background-color: ${fillColor}; 
                 transition: height 0.3s ease;
                 height: ${percentage}%;"></div>
        </div>
      </div>
    </div>
  `;
};

const createContractedBar = (contract) => {
  const contractId = `${contract.numero}/${contract.ano}`;
  const aditivosCount = contract.aditivos_count || 0;
  const totalSegments = 1 + aditivosCount; // 1 for contract + aditivos
  const segmentHeight = Math.floor(140 / totalSegments); // Equal height for each segment
  const value = contract.valor_global;

  // Create segments HTML - Contract at bottom, aditivos stacked on top
  let segmentsHtml = "";

  // First, add aditivos from highest to lowest (ad 3, ad 2, ad 1)
  for (let i = aditivosCount; i >= 1; i--) {
    const segmentType = `Aditivo ${i}`;
    const segmentColor = "#a8b8e8"; // Aditivos color

    segmentsHtml += `
      <div class="financial-bar-segment" 
           data-tooltip-text="${segmentType} - ${formatCurrency(
      value / totalSegments
    )}"
           data-tooltip-place="left"
           data-tooltip-type="info"
           style="
             min-width: 32px;
             width: 100%; 
             height: ${segmentHeight}px; 
             background-color: ${segmentColor}; 
             border-bottom: 1px solid #fff;
             cursor: pointer;">
      </div>
    `;
  }

  // Then add the contract at the bottom
  segmentsHtml += `
    <div class="financial-bar-segment" 
         data-tooltip-text="Contrato Original - ${formatCurrency(
           value / totalSegments
         )}"
         data-tooltip-place="left"
         data-tooltip-type="info"
         style="
           min-width: 32px;
           width: 100%; 
           height: ${segmentHeight}px; 
           background-color: #bbc6ea; 
           border-bottom: none;
           cursor: pointer;">
    </div>
  `;

  return `
    <div class="financial-bars-container" 
         data-contract-id="${contractId}" 
         data-type="contratado" 
         style="height: 140px; display: flex; align-items: center; justify-content: center;">
      <div class="financial-bar-group" 
           style="height: 140px; display: flex; align-items: center; position: relative;">
        <div class="financial-bar-value" 
             style="
               position: absolute;
               left: -20px;
               top: 50%;
               transform: translateY(-50%) rotate(180deg); 
               writing-mode: vertical-rl; 
               font-family: Arial, sans-serif; 
               font-size: 12px; 
               font-weight: bold; 
               color: #333; 
               white-space: nowrap;
               line-height: 1.2;
               z-index: 1;
               max-width: 18px;
               overflow: hidden;
               text-overflow: ellipsis;">${formatCurrency(value)}</div>
        <div class="financial-bar" 
             data-type="contratado" 
             data-amount="${value || 0}" 
             style="
               width: 32px; 
               height: 140px; 
               background-color: #D0D9F6; 
               position: relative;
               display: flex;
               flex-direction: column;">
          ${segmentsHtml}
        </div>
      </div>
    </div>
  `;
};

const createCommittedBar = (contract) => {
  const contractId = `${contract.numero}/${contract.ano}`;
  const empenhado = contract.total_valor_empenhado || 0;
  const contractValue = contract.valor_inicial || contract.valor_global || 0;
  const empenhadoPercentage = calculateFinancialPercentage(
    empenhado,
    contractValue
  );

  // Calculate segment heights - empenhado proportional, top segment always fills remaining space
  const empenhadoHeight = Math.floor((140 * empenhadoPercentage) / 100);
  const topSegmentHeight = 140 - empenhadoHeight; // Top segment takes remaining space

  // Create segments HTML - Top segment (contract value at 100%), empenhado at bottom
  let segmentsHtml = "";

  // Top segment: Always shows total contract value at 100%
  segmentsHtml += `
    <div class="financial-bar-segment" 
         data-tooltip-text="Contrato Total (100%) ${formatCurrency(
           contractValue
         )}"
         data-tooltip-place="left"
         data-tooltip-type="info"
         style="
            min-width: 32px;
           width: 100%; 
           height: ${topSegmentHeight}px; 
           background-color: #E5EBFB; 
           border-bottom: 1px solid #fff;
           cursor: pointer;">
    </div>
  `;

  // Bottom segment: Empenhado value (only if there is empenhado)
  if (empenhadoHeight > 0) {
    segmentsHtml += `
      <div class="financial-bar-segment" 
           data-tooltip-text="Orçamentário (${empenhadoPercentage.toFixed(
             1
           )}%) ${formatCurrency(empenhado)}"
           data-tooltip-place="left"
           data-tooltip-type="info"
           style="
             min-width: 32px;
             width: 100%; 
             height: ${empenhadoHeight}px; 
             background-color: #8f9dd2; 
             border-bottom: none;
             cursor: pointer;">
      </div>
    `;
  }

  return `
    <div class="financial-bars-container" 
         data-contract-id="${contractId}" 
         data-type="empenhado" 
         style="height: 140px; display: flex; align-items: center; justify-content: center;">
      <div class="financial-bar-group" 
           style="height: 140px; min-width: 32px; display: flex; align-items: center; position: relative;">
        <div class="financial-bar-value" 
             style="
               position: absolute;
               left: -20px;
               top: 50%;
               transform: translateY(-50%) rotate(180deg); 
               writing-mode: vertical-rl; 
               font-family: Arial, sans-serif; 
               font-size: 12px; 
               font-weight: bold; 
               color: #333; 
               white-space: nowrap;
               line-height: 1.2;
               z-index: 1;
               max-width: 32px;
               overflow: hidden;
               text-overflow: ellipsis;">${formatCurrency(contractValue)}</div>
        <div class="financial-bar" 
             data-type="empenhado" 
             data-amount="${contractValue || 0}" 
             style="
               width: 32px; 
               height: 140px; 
               background-color: #E5EBFB; 
               position: relative;
               display: flex;
               flex-direction: column;">
          ${segmentsHtml}
        </div>
      </div>
    </div>
  `;
};

const createPaidBar = (contract) => {
  const contractId = `${contract.numero}/${contract.ano}`;
  const totalPaid = contract.total_valor_pago || 0;
  const totalEmpenhado = contract.total_valor_empenhado || 0;

  // Calculate payment components (assuming these fields exist in contract data)
  const taxesPaidToFornecedor = contract.taxes_paid_fornecedor || 0;
  const taxes = contract.taxes || 0;
  const payments = contract.payments || totalPaid; // Use total paid if individual payments not specified

  // Calculate percentages relative to total empenhado
  const taxesPaidPercentage = calculateFinancialPercentage(
    taxesPaidToFornecedor,
    totalEmpenhado
  );
  const taxesPercentage = calculateFinancialPercentage(taxes, totalEmpenhado);
  const paymentsPercentage = calculateFinancialPercentage(
    payments,
    totalEmpenhado
  );

  // Calculate segment heights (each proportional to their percentage of empenhado)
  const taxesPaidHeight = Math.floor((140 * taxesPaidPercentage) / 100);
  const taxesHeight = Math.floor((140 * taxesPercentage) / 100);
  const paymentsHeight = Math.floor((140 * paymentsPercentage) / 100);
  const totalEmpenhadoHeight =
    140 - (taxesPaidHeight + taxesHeight + paymentsHeight); // Remaining space

  // Create segments HTML - From bottom to top: taxes paid, taxes, payments, total empenhado
  let segmentsHtml = "";

  // Top segment: Total amount empenhado (100%) - takes remaining space
  if (totalEmpenhadoHeight > 0) {
    segmentsHtml += `
      <div class="financial-bar-segment" 
           data-tooltip-text="Total Empenhado (100%) ${formatCurrency(
             totalEmpenhado
           )}"
           data-tooltip-place="left"
           data-tooltip-type="info"
           style="
             min-width: 32px;
             width: 100%; 
             height: ${totalEmpenhadoHeight}px; 
             background-color: #D3FACF; 
             border-bottom: 1px solid #fff;
             cursor: pointer;">
      </div>
    `;
  }

  // Third segment: Payments
  if (paymentsHeight > 0) {
    segmentsHtml += `
      <div class="financial-bar-segment" 
           data-tooltip-text="Pagamentos (${paymentsPercentage.toFixed(
             1
           )}%) ${formatCurrency(payments)}"
           data-tooltip-place="left"
           data-tooltip-type="info"
           style="
             min-width: 32px;
             width: 100%; 
             height: ${paymentsHeight}px; 
             background-color: #8EEC84; 
             border-bottom: 1px solid #fff;
             cursor: pointer;">
      </div>
    `;
  }

  // Second segment: Taxes
  if (taxesHeight > 0) {
    segmentsHtml += `
      <div class="financial-bar-segment" 
           data-tooltip-text="Impostos (${taxesPercentage.toFixed(
             1
           )}%) ${formatCurrency(taxes)}"
           data-tooltip-place="left"
           data-tooltip-type="info"
           style="
             min-width: 32px;
             width: 100%; 
             height: ${taxesHeight}px; 
             background-color: #4DD23F; 
             border-bottom: 1px solid #fff;
             cursor: pointer;">
      </div>
    `;
  }

  // Bottom segment: Taxes paid to fornecedor
  if (taxesPaidHeight > 0) {
    segmentsHtml += `
      <div class="financial-bar-segment" 
           data-tooltip-text="Impostos Pagos Fornecedor (${taxesPaidPercentage.toFixed(
             1
           )}%) ${formatCurrency(taxesPaidToFornecedor)}"
           data-tooltip-place="left"
           data-tooltip-type="info"
           style="
             min-width: 32px;
             width: 100%; 
             height: ${taxesPaidHeight}px; 
             background-color: #2DBF1E; 
             border-bottom: none;
             cursor: pointer;">
      </div>
    `;
  }

  return `
    <div class="financial-bars-container" 
         data-contract-id="${contractId}" 
         data-type="pagamentos" 
         style="height: 140px; display: flex; align-items: center; justify-content: center;">
      <div class="financial-bar-group" 
           style="height: 140px; display: flex; align-items: center; position: relative;">
        <div class="financial-bar-value" 
             style="
               position: absolute;
               left: -20px;
               top: 50%;
               transform: translateY(-50%) rotate(180deg); 
               writing-mode: vertical-rl; 
               font-family: Arial, sans-serif; 
               font-size: 12px; 
               font-weight: bold; 
               color: #333; 
               white-space: nowrap;
               line-height: 1.2;
               z-index: 1;
               max-width: 18px;
               overflow: hidden;
               text-overflow: ellipsis;">${formatCurrency(totalPaid)}</div>
        <div class="financial-bar" 
             data-type="pagamentos" 
             data-amount="${totalPaid || 0}" 
             style="
               width: 32px; 
               height: 140px; 
               background-color: #D3FACF; 
               position: relative;
               display: flex;
               flex-direction: column;">
          ${segmentsHtml}
        </div>
      </div>
    </div>
  `;
};

const renderFinancialBarsGroup = (contract) => {
  return {
    contracted: createContractedBar(contract),
    committed: createCommittedBar(contract),
    paid: createPaidBar(contract),
  };
};

const updateFinancialBar = (container, value, total, contractData = null) => {
  const bar = container.querySelector(".financial-bar");
  const valueElement = container.querySelector(".financial-bar-value");
  const containerType = container.getAttribute("data-type");

  if (!bar || !valueElement) {
    console.warn("Financial bar elements not found in container");
    return;
  }

  // Update the value display
  valueElement.textContent = formatCurrency(value);

  // Handle segmented bars (contracted and committed bars)
  if (containerType === "contratado") {
    const segments = bar.querySelectorAll(".financial-bar-segment");
    if (segments.length > 0) {
      // Update segment tooltips with new value
      const segmentValue = value / segments.length;
      const aditivosCount = segments.length - 1; // Total segments minus contract

      segments.forEach((segment, index) => {
        // With new ordering: aditivos first (highest to lowest), then contract last
        const isContract = index === segments.length - 1; // Last segment is contract
        let segmentType;

        if (isContract) {
          segmentType = "Contrato Original";
        } else {
          // Aditivos are in reverse order (ad 3, ad 2, ad 1, contract)
          const aditivoNumber = aditivosCount - index;
          segmentType = `Aditivo ${aditivoNumber}`;
        }

        segment.setAttribute(
          "data-tooltip-text",
          `${segmentType} - ${formatCurrency(segmentValue)}`
        );
      });
      return;
    }
  }

  // Handle segmented committed bars
  if (containerType === "empenhado") {
    const segments = bar.querySelectorAll(".financial-bar-segment");
    if (segments.length > 0) {
      // For committed bars: value is empenhado, total is contract value
      const contractValue = total;
      const empenhadoPercentage = calculateFinancialPercentage(
        value,
        contractValue
      );

      segments.forEach((segment, index) => {
        if (index === 0) {
          // Top segment: Always shows total contract value at 100%
          segment.setAttribute(
            "data-tooltip-text",
            `Contrato Total (100%) ${formatCurrency(contractValue)}`
          );
        } else {
          // Bottom segment: Empenhado value (if exists)
          segment.setAttribute(
            "data-tooltip-text",
            `Orçamentário (${empenhadoPercentage.toFixed(1)}%) ${formatCurrency(
              value
            )}`
          );
        }
      });

      // Update segment heights based on new percentages
      const empenhadoHeight = Math.floor((140 * empenhadoPercentage) / 100);
      const topSegmentHeight = 140 - empenhadoHeight;

      if (segments.length >= 1) {
        segments[0].style.height = `${topSegmentHeight}px`; // Top segment (contract total)
        if (segments.length === 2) {
          segments[1].style.height = `${empenhadoHeight}px`; // Bottom segment (empenhado)
        }
      }
      return;
    }
  }

  // Handle segmented paid bars
  if (containerType === "pagamentos") {
    const segments = bar.querySelectorAll(".financial-bar-segment");
    if (segments.length > 0) {
      // For paid bars: value is total_valor_pago, total is total_valor_empenhado
      const totalEmpenhado = total;
      const totalPaid = value;

      // Calculate payment components (assuming these fields exist in contractData)
      const taxesPaidToFornecedor = contractData?.taxes_paid_fornecedor || 0;
      const taxes = contractData?.taxes || 0;
      const payments = contractData?.payments || totalPaid;

      const taxesPaidPercentage = calculateFinancialPercentage(
        taxesPaidToFornecedor,
        totalEmpenhado
      );
      const taxesPercentage = calculateFinancialPercentage(
        taxes,
        totalEmpenhado
      );
      const paymentsPercentage = calculateFinancialPercentage(
        payments,
        totalEmpenhado
      );

      segments.forEach((segment, index) => {
        switch (index) {
          case 0: // Top segment: Total empenhado (100%)
            segment.setAttribute(
              "data-tooltip-text",
              `Total Empenhado (100%) ${formatCurrency(totalEmpenhado)}`
            );
            break;
          case 1: // Third segment: Payments
            segment.setAttribute(
              "data-tooltip-text",
              `Pagamentos (${paymentsPercentage.toFixed(1)}%) ${formatCurrency(
                payments
              )}`
            );
            break;
          case 2: // Second segment: Taxes
            segment.setAttribute(
              "data-tooltip-text",
              `Impostos (${taxesPercentage.toFixed(1)}%) ${formatCurrency(
                taxes
              )}`
            );
            break;
          case 3: // Bottom segment: Taxes paid to fornecedor
            segment.setAttribute(
              "data-tooltip-text",
              `Impostos Pagos Fornecedor (${taxesPaidPercentage.toFixed(
                1
              )}%) ${formatCurrency(taxesPaidToFornecedor)}`
            );
            break;
        }
      });

      // Update segment heights based on new percentages
      const taxesPaidHeight = Math.floor((140 * taxesPaidPercentage) / 100);
      const taxesHeight = Math.floor((140 * taxesPercentage) / 100);
      const paymentsHeight = Math.floor((140 * paymentsPercentage) / 100);
      const totalEmpenhadoHeight =
        140 - (taxesPaidHeight + taxesHeight + paymentsHeight);

      if (segments.length === 4) {
        segments[0].style.height = `${totalEmpenhadoHeight}px`; // Top segment
        segments[1].style.height = `${paymentsHeight}px`; // Payments
        segments[2].style.height = `${taxesHeight}px`; // Taxes
        segments[3].style.height = `${taxesPaidHeight}px`; // Taxes paid to fornecedor
      }
      return;
    }
  }

  // Handle traditional bars (committed and paid bars)
  const fill = container.querySelector(".financial-bar-fill");
  if (fill) {
    const percentage = calculateFinancialPercentage(value, total);
    fill.style.height = `${percentage}%`;

    // Update tooltip if present on bar
    const barTooltipText = bar.getAttribute("data-tooltip-text");
    if (barTooltipText) {
      const type = bar.getAttribute("data-type") || "valor";
      bar.setAttribute("data-tooltip-text", `${type} ${formatCurrency(value)}`);
    }

    // Update tooltip if present on fill
    const fillTooltipText = fill.getAttribute("data-tooltip-text");
    if (fillTooltipText) {
      const type = bar.getAttribute("data-type");
      if (type === "empenhado") {
        const fillPercentage = calculateFinancialPercentage(value, total);

        fill.setAttribute(
          "data-tooltip-text",
          `Orçamentário (${fillPercentage.toFixed(1)}%) ${formatCurrency(
            value
          )}`
        );
      } else {
        fill.setAttribute(
          "data-tooltip-text",
          `${type} ${formatCurrency(value)}`
        );
      }
    }
  }
};

const initializeFinancialBars = async () => {
  console.log("=== INITIALIZING FINANCIAL BARS COMPONENT ===");

  const financialContainers = document.querySelectorAll(
    ".financial-bars-container"
  );
  console.log("Found financial bar containers:", financialContainers.length);

  financialContainers.forEach((container) => {
    const contractId = container.getAttribute("data-contract-id");
    const type = container.getAttribute("data-type");

    if (!contractId || !type) {
      console.warn(
        `Missing attributes for financial bars: ${contractId}, ${type}`
      );
      return;
    }

    console.log(
      `✅ Financial bars initialized for contract ${contractId}, type: ${type}`
    );
  });
};

const updateFinancialBarsForContract = (contractData) => {
  const contractId = `${contractData.numero}/${contractData.ano}`;

  // Update contracted value bar
  const contractedContainer = document.querySelector(
    `.financial-bars-container[data-contract-id="${contractId}"][data-type="contratado"]`
  );
  if (contractedContainer) {
    updateFinancialBar(
      contractedContainer,
      contractData.valor_global,
      contractData.valor_global,
      contractData
    );
  }

  // Update committed value bar
  const committedContainer = document.querySelector(
    `.financial-bars-container[data-contract-id="${contractId}"][data-type="empenhado"]`
  );
  if (committedContainer) {
    updateFinancialBar(
      committedContainer,
      contractData.total_valor_empenhado,
      contractData.valor_inicial,
      contractData
    );
  }

  // Update paid value bar
  const paidContainer = document.querySelector(
    `.financial-bars-container[data-contract-id="${contractId}"][data-type="pagamentos"]`
  );
  if (paidContainer) {
    updateFinancialBar(
      paidContainer,
      contractData.total_valor_pago,
      contractData.total_valor_empenhado,
      contractData
    );
  }
};

/**
 * Helper function to generate tooltip attributes based on conditions
 * @param {boolean} shouldShowTooltip - Whether to show the tooltip
 * @param {string} tooltipText - The tooltip text content
 * @param {string} placement - Tooltip placement (default: "left")
 * @param {string} type - Tooltip type (default: "info")
 * @returns {string} HTML attributes string
 */
const generateTooltipAttributes = (
  shouldShowTooltip,
  tooltipText,
  placement = "left",
  type = "info"
) => {
  if (!shouldShowTooltip) return "";

  return `data-tooltip-text="${tooltipText}" data-tooltip-place="${placement}" data-tooltip-type="${type}"`;
};

export default {
  initialize: initializeFinancialBars,
  createFinancialBar,
  createContractedBar,
  createCommittedBar,
  createPaidBar,
  renderFinancialBarsGroup,
  updateFinancialBar,
  updateFinancialBarsForContract,
  calculateFinancialPercentage,
  formatCurrency,
};
