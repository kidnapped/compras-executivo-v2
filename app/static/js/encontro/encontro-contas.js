/**
 * Encontro de Contas - Complete Frontend Logic
 * Handles data loading, table rendering, row interactions, and ECharts integration
 */

import getEcharts from "../util/echarts.js";

class EncontroContas {
  constructor() {
    this.state = {
      currentContractId: null,
      selectedEmpenhoNumero: null,
      rawData: null,
      filteredData: null,
      chart: null,
    };

    // DOM elements
    this.containers = {
      empenhosTable: document.querySelector("#empenhos-originais-tbody"),
      financeiroTable: document.querySelector("#financeiro-grid-tbody"),
      movimentacoesTable: document.querySelector("#movimentacoes-tbody"),
      chartContainer: document.querySelector("#grafico-financeiro-container"),
      ultimosLancamentosContainer: document.querySelector(
        "#ultimos-lancamentos-container"
      ),
    };

    this.init();
  }

  async init() {
    console.log("Initializing Encontro de Contas...");

    // Get contract ID from URL
    this.state.currentContractId = this.getContractIdFromURL();

    if (this.state.currentContractId) {
      await this.loadInitialData();
    } else {
      console.warn("No contract ID provided in URL parameters");
      this.showError(
        "Nenhum ID de contrato fornecido. Adicione ?contrato=ID na URL."
      );
    }

    this.setupEventListeners();
  }

  getContractIdFromURL() {
    // Extract contract ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("contrato");
  }

  async loadInitialData() {
    try {
      console.log(
        `Loading initial data for contract ${this.state.currentContractId}`
      );

      const response = await fetch(
        `/tudo?contrato_id=${this.state.currentContractId}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      this.state.rawData = await response.json();
      this.state.filteredData = this.state.rawData;

      console.log("📊 Raw API Response:", this.state.rawData);
      console.log("📊 Empenhos data:", this.state.rawData?.empenhos_data);
      if (this.state.rawData?.empenhos_data?.[0]) {
        console.log(
          "📊 First empenho structure:",
          this.state.rawData.empenhos_data[0]
        );
      }

      this.renderAllTables();
      await this.renderChart();

      // Show export button when data is loaded
      const exportBtn = document.querySelector("#btn-export-excel");
      if (exportBtn) {
        exportBtn.style.display = "inline-flex";
      }

      console.log("Initial data loaded successfully");
    } catch (error) {
      console.error("Error loading initial data:", error);
      this.showError("Failed to load contract data");
    }
  }

  async loadFilteredData(empenhoNumero) {
    try {
      console.log(`Loading filtered data for empenho ${empenhoNumero}`);

      const response = await fetch(
        `/tudo?contrato_id=${this.state.currentContractId}&empenho_numero=${empenhoNumero}`
      );
      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      this.state.filteredData = await response.json();

      // Update only financeiro and movimentacoes (not empenhos original table)
      this.renderFinanceiroTable();
      this.renderMovimentacoesTable();
      // Note: Últimos Lançamentos should NOT update on filtering - it shows all contract documents
      await this.renderChart();
    } catch (error) {
      console.error("Error loading filtered data:", error);
      this.showError("Failed to load filtered data");
    }
  }

  setupEventListeners() {
    // Handle clicks on empenho rows
    if (this.containers.empenhosTable) {
      this.containers.empenhosTable.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        if (row && row.dataset.empenhoNumero) {
          this.handleEmpenhoRowClick(row);
        }
      });
    }
  }

  async handleEmpenhoRowClick(row) {
    const empenhoNumero = row.dataset.empenhoNumero;

    // Toggle logic
    if (this.state.selectedEmpenhoNumero === empenhoNumero) {
      // Deselect and show all data
      this.state.selectedEmpenhoNumero = null;
      this.state.filteredData = this.state.rawData;

      this.clearRowHighlight();
      this.renderFinanceiroTable();
      this.renderMovimentacoesTable();
      // Note: Últimos Lançamentos should NOT update on filtering - it shows all contract documents
      await this.renderChart();
    } else {
      // Select new empenho and filter data
      this.state.selectedEmpenhoNumero = empenhoNumero;

      this.highlightRow(row);
      await this.loadFilteredData(empenhoNumero);
    }
  }

  highlightRow(row) {
    this.clearRowHighlight();
    row.classList.add("selected-empenho");
    row.style.backgroundColor = "#e3f2fd";
  }

  clearRowHighlight() {
    const selectedRows =
      this.containers.empenhosTable?.querySelectorAll(".selected-empenho");
    selectedRows?.forEach((row) => {
      row.classList.remove("selected-empenho");
      row.style.backgroundColor = "";
    });
  }

  renderAllTables() {
    this.renderEmpenhosTable();
    this.renderFinanceiroTable();
    this.renderMovimentacoesTable();
    this.renderUltimosLancamentos();
  }

  renderEmpenhosTable() {
    if (!this.containers.empenhosTable || !this.state.rawData?.empenhos_data)
      return;

    const empenhos = this.state.rawData.empenhos_data;

    this.containers.empenhosTable.innerHTML = empenhos
      .map((empenho, index) => {
        const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
        const financasTotal = this.calculateFinancasTotal(empenho);
        const empenhado = empenho.empenho?.empenhado || 0;
        const pago = empenho.empenho?.pago || 0;
        const saldo = orcamentarioTotal - financasTotal; // Saldo de empenho = Orçamentário - Finanças

        // Calculate percentage: Finanças / Orçamentário * 100
        const percentageStatus = this.calculateStatusPercentage(
          financasTotal,
          orcamentarioTotal
        );

        return `
        <tr data-empenho-numero="${
          empenho.empenho?.numero || ""
        }" style="cursor: pointer;">
          <td>${index + 1}</td>
          <td><i class="fas fa-circle" style="color: #1976d2; font-size: 8px;"></i></td>
          <td>${empenho.empenho?.numero || "N/A"}</td>
          <td>${this.formatDate(empenho.empenho?.data_emissao)}</td>
          <td>${this.formatCurrency(empenhado)}</td>
          <td>${this.formatCurrency(orcamentarioTotal)}</td>
          <td>${this.formatCurrency(financasTotal)}</td>
          <td>${this.formatCurrency(saldo)}</td>
          <td><span class="badge ${this.getPercentageStatusBadge(
            percentageStatus.percentage
          )}">${percentageStatus.display}</span></td>
          <td>
            <a href="https://portaldatransparencia.gov.br/despesas/empenho/${
              empenho.prefixed_numero
            }?ordenarPor=fase&direcao=asc" 
               target="_blank" class="btn btn-sm btn-outline-primary">
              <i class="fas fa-external-link-alt" style="color: #1976d2; font-size: 10px;"></i>
            </a>
          </td>
          <td>
            <span onclick="EncontroContas.showEmpenhoDetails('${
              empenho.empenho?.numero
            }')">
              <i class="fas fa-info-circle" style="color: #1976d2; font-size: 10px;"></i>
            </span>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  renderFinanceiroTable() {
    if (
      !this.containers.financeiroTable ||
      !this.state.filteredData?.empenhos_data
    )
      return;

    const financialRows = [];

    this.state.filteredData.empenhos_data.forEach((empenho) => {
      // Handle new nested structure under Finanças
      const financas = empenho.Finanças || {};

      // Process different document types from nested structure or fallback to old structure
      const docTypes = [
        {
          key: "documentos_dar",
          data: financas.documentos_dar || empenho.documentos_dar || [],
        },
        {
          key: "documentos_darf",
          data: financas.documentos_darf || empenho.documentos_darf || [],
        },
        {
          key: "documentos_gps",
          data: financas.documentos_gps || empenho.documentos_gps || [],
        },
        {
          key: "linha_evento_ob",
          data: financas.linha_evento_ob || empenho.linha_evento_ob || [],
        },
      ];

      docTypes.forEach((docType) => {
        docType.data.forEach((doc) => {
          financialRows.push(this.createFinancialRow(doc, docType.key));
        });
      });
    });

    this.containers.financeiroTable.innerHTML = financialRows
      .map(
        (row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${row.date}</td>
        <td>${row.documentId}</td>
        <td><a href="https://portaldatransparencia.gov.br/despesas/pagamento/${
          row.fullDocumentId
        }?ordenarPor=fase&direcao=asc" 
               target="_blank" class="btn btn-sm btn-outline-primary">
               <i class="fas ${row.icon}" style="color: ${
          row.iconColor
        }; font-size: 10px;"></i>
            </a></td>
        <td>${row.type}</td>
        <td>${this.formatCurrency(row.parcial)}</td>
        <td>${this.formatCurrency(row.nominal)}</td>
      </tr>
    `
      )
      .join("");
  }

  renderMovimentacoesTable() {
    if (
      !this.containers.movimentacoesTable ||
      !this.state.filteredData?.empenhos_data
    )
      return;

    const movimentacoes = [];

    this.state.filteredData.empenhos_data.forEach((empenho) => {
      // Handle new nested structure: Orçamentário.operacoes or fallback to old structure
      const orcamentario =
        empenho.Orçamentário?.operacoes ||
        empenho.Ne_item?.operacoes ||
        empenho.Orçamentário ||
        [];

      if (Array.isArray(orcamentario)) {
        orcamentario.forEach((op) => {
          movimentacoes.push({
            data: this.formatDateFromOperacao(op.dt_operacao), // Use specialized formatting
            empenho: empenho.empenho?.numero,
            item: op.ds_item || this.getItemDescription(op.id_item, empenho),
            especie: op.no_operacao,
            valor: op.va_operacao,
          });
        });
      }
    });

    this.containers.movimentacoesTable.innerHTML = movimentacoes
      .map(
        (mov, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${mov.data}</td>
        <td>${mov.empenho || "N/A"}</td>
        <td><i class="fas fa-tag" style="color: #ff9800;"></i></td>
        <td>${mov.especie || "N/A"}</td>
        <td>${this.formatCurrency(mov.valor || 0)}</td>
        <td>
          <button class="btn btn-sm btn-outline-info" onclick="EncontroContas.showMovimentacaoDetails('${
            mov.empenho
          }', '${mov.data}')">
            <i class="fas fa-info-circle"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join("");
  }

  renderUltimosLancamentos() {
    if (
      !this.containers.ultimosLancamentosContainer ||
      !this.state.rawData?.empenhos_data
    )
      return;

    console.log("Rendering Últimos Lançamentos...");

    // Collect ALL documents from all empenhos (always use rawData, not filteredData)
    const allDocuments = [];

    this.state.rawData.empenhos_data.forEach((empenho) => {
      // 1. Add the empenho itself
      if (empenho.empenho) {
        const empenhoData = this.createEmpenhoLancamentoRow(empenho.empenho);
        if (empenhoData) {
          allDocuments.push(empenhoData);
        }
      }

      // 2. Add orçamentário operations
      const orcamentario =
        empenho.Orçamentário?.operacoes ||
        empenho.Ne_item?.operacoes ||
        empenho.Orçamentário ||
        [];

      if (Array.isArray(orcamentario)) {
        orcamentario.forEach((op) => {
          const orcamentoData = this.createOrcamentarioLancamentoRow(
            op,
            empenho.empenho?.numero
          );
          if (orcamentoData) {
            allDocuments.push(orcamentoData);
          }
        });
      }

      // 3. Add financial documents
      const financas = empenho.Finanças || {};

      // Process different document types
      const docTypes = [
        {
          key: "documentos_dar",
          data: financas.documentos_dar || empenho.documentos_dar || [],
        },
        {
          key: "documentos_darf",
          data: financas.documentos_darf || empenho.documentos_darf || [],
        },
        {
          key: "documentos_gps",
          data: financas.documentos_gps || empenho.documentos_gps || [],
        },
        {
          key: "linha_evento_ob",
          data: financas.linha_evento_ob || empenho.linha_evento_ob || [],
        },
      ];

      docTypes.forEach((docType) => {
        docType.data.forEach((doc) => {
          const documentData = this.createUltimosLancamentosRow(
            doc,
            docType.key
          );
          if (documentData) {
            allDocuments.push(documentData);
          }
        });
      });
    });

    // Sort documents by date (newest first)
    allDocuments.sort((a, b) => {
      const dateA = this.parseDateForComparison(a.rawDate);
      const dateB = this.parseDateForComparison(b.rawDate);

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    console.log(
      `Found ${allDocuments.length} documents for Últimos Lançamentos`
    );

    // Find the table-responsive div inside the container
    const tableContainer =
      this.containers.ultimosLancamentosContainer.querySelector(
        ".table-responsive"
      );
    if (!tableContainer) {
      console.warn(
        "Table container not found in ultimos-lancamentos-container"
      );
      return;
    }

    // Create the content - show simplified list format
    const content =
      allDocuments.length > 0
        ? allDocuments
            .map(
              (doc) => `
        <div class="lancamento-item" style="padding: 8px 16px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
          <i class="fas ${doc.icon}" style="color: ${doc.iconColor}; font-size: 14px; margin-right: 12px; width: 16px;"></i>
          <div style="flex: 1;">
            <div style="font-size: 12px; color: #666; line-height: 1.2;">
              ${doc.date}
            </div>
            <div style="font-size: 13px; font-weight: 500; color: #333; line-height: 1.3;">
              ${doc.documentId} (${doc.formattedValue})
            </div>
          </div>
        </div>
      `
            )
            .join("")
        : '<div class="text-center text-muted p-3">Nenhum lançamento encontrado</div>';

    tableContainer.innerHTML = content;
  }

  createUltimosLancamentosRow(doc, docType) {
    const documentId = this.getDocumentId(doc, docType);
    const rawDate = this.extractDateFromFinancialDoc(doc);
    const formattedDate = rawDate !== "N/A" ? rawDate : "";
    const value = this.getFinancialDocValue(doc, docType);

    if (!documentId || documentId === "N/A" || !formattedDate) {
      return null; // Skip invalid documents
    }

    return {
      date: formattedDate,
      rawDate: rawDate, // Keep raw date for sorting
      documentId: documentId,
      type: this.getDocumentType(docType),
      icon: this.getDocumentIcon(docType),
      iconColor: this.getDocumentIconColor(docType),
      value: value,
      formattedValue: this.formatCurrency(value),
      category: "financial", // For categorization
    };
  }

  createEmpenhoLancamentoRow(empenho) {
    const rawDate = empenho.data_emissao;
    const formattedDate = this.formatDate(rawDate);
    const value = empenho.empenhado || 0;

    if (!empenho.numero || !formattedDate || formattedDate === "N/A") {
      return null; // Skip invalid empenhos
    }

    return {
      date: formattedDate,
      rawDate: rawDate, // Keep raw date for sorting
      documentId: empenho.numero,
      type: "EMPENHO",
      icon: "fa-file-contract", // Contract icon for empenhos
      iconColor: "#1976d2", // Blue color
      value: value,
      formattedValue: this.formatCurrency(value),
      category: "empenho", // For categorization
    };
  }

  createOrcamentarioLancamentoRow(operacao, empenhoNumero) {
    const rawDate = operacao.dt_operacao;
    const formattedDate = this.formatDateFromOperacao(rawDate);
    const value = operacao.va_operacao || 0;

    if (!operacao.no_operacao || !formattedDate || formattedDate === "N/A") {
      return null; // Skip invalid operations
    }

    // Create a display ID combining operation type and empenho number
    const displayId = `${operacao.no_operacao}${
      empenhoNumero ? ` (${empenhoNumero})` : ""
    }`;

    return {
      date: formattedDate,
      rawDate: rawDate, // Keep raw date for sorting
      documentId: displayId,
      type: "ORÇAMENTÁRIO",
      icon: "fa-calculator", // Calculator icon for budget operations
      iconColor: "#ff9800", // Orange color
      value: value,
      formattedValue: this.formatCurrency(value),
      category: "orcamentario", // For categorization
    };
  }

  async renderChart() {
    if (
      !this.containers.chartContainer ||
      !this.state.filteredData?.empenhos_data
    ) {
      console.warn("Chart container or data not available");
      return;
    }

    try {
      console.log("🎯 Starting chart render...");
      const echarts = await getEcharts();

      // Destroy existing chart
      if (this.state.chart) {
        this.state.chart.dispose();
      }

      // Initialize new chart
      this.state.chart = echarts.init(this.containers.chartContainer);

      const chartData = this.prepareChartData();
      console.log("📊 Chart data prepared:", chartData);

      const option = {
        title: {
          text: "Movimentações Financeiras e Orçamentárias",
          left: "center",
          textStyle: { color: "#333", fontSize: 16 },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          formatter: (params) => {
            let tooltip = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param) => {
              tooltip += `${param.seriesName}: ${this.formatCurrency(
                param.value
              )}<br/>`;
            });
            return tooltip;
          },
        },
        legend: {
          data: ["Valores Orçamentários", "Valores Financeiros"],
          bottom: 10,
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "15%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: chartData.months,
          axisLabel: { rotate: 45 },
        },
        yAxis: [
          {
            type: "value",
            name: "Valores (R$)",
            axisLabel: {
              formatter: (value) => this.formatCurrencyShort(value),
            },
          },
        ],
        series: [
          {
            name: "Valores Orçamentários",
            type: "line",
            step: "end", // Step line configuration
            data: chartData.orcamentario,
            smooth: false, // Disable smooth for step lines
            lineStyle: { color: "#1976d2", width: 3 },
            itemStyle: { color: "#1976d2" },
            areaStyle: {
              color: "rgba(25, 118, 210, 0.3)", // Increased opacity for better visibility
              origin: "start", // Fill from the beginning
            },
          },
          {
            name: "Valores Financeiros",
            type: "line",
            step: "end", // Step line configuration
            data: chartData.financeiro,
            smooth: false, // Disable smooth for step lines
            lineStyle: { color: "#4caf50", width: 3 },
            itemStyle: { color: "#4caf50" },
            areaStyle: {
              color: "rgba(76, 175, 80, 0.3)", // Increased opacity for better visibility
              origin: "start", // Fill from the beginning
            },
          },
        ],
      };

      this.state.chart.setOption(option);
      console.log("✅ Chart rendered successfully");

      // Handle window resize
      window.addEventListener("resize", () => {
        if (this.state.chart) {
          this.state.chart.resize();
        }
      });
    } catch (error) {
      console.error("Error rendering chart:", error);
    }
  }

  prepareChartData() {
    const monthlyData = new Map();

    if (!this.state.filteredData?.empenhos_data) {
      console.warn("No empenhos_data found for chart");
      return { months: [], orcamentario: [], financeiro: [] };
    }

    console.log(
      `📊 Preparing chart data for ${this.state.filteredData.empenhos_data.length} empenhos`
    );

    // RP FILTERING LOGIC:
    // Operations with "RP" in no_operacao (like "INSCRICAO EM RP", "ANULACAO DE RP", etc.)
    // represent budget rollovers to next year and should be excluded from chart calculations
    // to avoid double-counting. They remain visible in tables with actual values.
    //
    // EXCEPTION: If ANY RP operation is marked as the oldest operation (is_oldest_operation=true),
    // it counts at full value as it represents the actual starting budget for the period.

    this.state.filteredData.empenhos_data.forEach((empenho, index) => {
      console.log(
        `Processing empenho ${index + 1}:`,
        empenho.empenho?.numero || empenho.id
      );

      // Process orçamentário data - check the new data structure
      const orcamentarioData =
        empenho.Orçamentário?.operacoes || empenho.Ne_item?.operacoes || [];

      console.log(`  Found ${orcamentarioData.length} orçamentário operations`);

      if (Array.isArray(orcamentarioData)) {
        orcamentarioData.forEach((op, opIndex) => {
          if (
            op &&
            op.dt_operacao &&
            op.va_operacao !== null &&
            op.va_operacao !== undefined
          ) {
            const month = this.extractMonth(op.dt_operacao);
            let value = parseFloat(op.va_operacao) || 0;

            // Exclude RP operations from chart calculations (budget rollover to next year)
            // Operations with "RP" in no_operacao are budget transfers, not new spending
            // EXCEPTION: If this is marked as the oldest operation and contains "RP", count it at full value
            const isRpOperation =
              op.no_operacao &&
              op.no_operacao.toString().toUpperCase().includes("RP");

            // Use backend-calculated is_oldest_operation field for exception handling
            // Exception applies to ANY RP operation when it's the oldest operation
            const isOldestRpException =
              op.is_oldest_operation === true && isRpOperation;

            if (isRpOperation && !isOldestRpException) {
              value = 0; // Count as zero for chart to avoid double-counting budget
              console.log(
                `    ⚠️ RP Operation excluded from chart: ${op.no_operacao} (${
                  op.dt_operacao
                }) - R$ ${parseFloat(op.va_operacao)} -> R$ 0`
              );
            } else if (isOldestRpException) {
              console.log(
                `    ✅ OLDEST RP OPERATION - counting at full value: ${op.no_operacao} (${op.dt_operacao}) - R$ ${value} (is_oldest_operation: ${op.is_oldest_operation})`
              );
            }

            if (month) {
              if (!monthlyData.has(month)) {
                monthlyData.set(month, { orcamentario: 0, financeiro: 0 });
              }
              monthlyData.get(month).orcamentario += value;

              if (!isRpOperation) {
                console.log(
                  `    ✅ Orçamentário op ${opIndex + 1}: ${
                    op.dt_operacao
                  } -> ${month} += R$ ${value}`
                );
              }
            }
          }
        });
      }

      // Process financeiro data from Finanças structure
      const financas = empenho.Finanças || {};

      // Process different document types
      const docTypes = [
        {
          key: "documentos_dar",
          data: financas.documentos_dar || empenho.documentos_dar || [],
        },
        {
          key: "documentos_darf",
          data: financas.documentos_darf || empenho.documentos_darf || [],
        },
        {
          key: "documentos_gps",
          data: financas.documentos_gps || empenho.documentos_gps || [],
        },
        {
          key: "linha_evento_ob",
          data: financas.linha_evento_ob || empenho.linha_evento_ob || [],
        },
      ];

      docTypes.forEach((docType) => {
        const documents = Array.isArray(docType.data) ? docType.data : [];

        if (documents.length > 0) {
          console.log(`  Found ${documents.length} ${docType.key} documents`);
        }

        documents.forEach((doc) => {
          if (!doc) return;

          const month = this.extractMonthFromFinancialDoc(doc);
          const value = this.getFinancialDocValue(doc, docType.key);

          if (month && value !== null && value !== undefined && !isNaN(value)) {
            if (!monthlyData.has(month)) {
              monthlyData.set(month, { orcamentario: 0, financeiro: 0 });
            }
            monthlyData.get(month).financeiro += value;
            console.log(
              `    ✅ Financeiro (${docType.key}): ${month} += R$ ${value}`
            );
          }
        });
      });
    });

    // Create cumulative timeline with all months filled
    return this.createCumulativeTimeline(monthlyData);
  }

  createCumulativeTimeline(monthlyData) {
    console.log("📈 Creating cumulative timeline...");

    // Get all months and sort them
    const allMonths = Array.from(monthlyData.keys()).sort();
    if (allMonths.length === 0) {
      return { months: [], orcamentario: [], financeiro: [] };
    }

    // Find the range from first to last month
    const firstMonth = allMonths[0];
    const lastMonth = allMonths[allMonths.length - 1];

    // Generate all months in the range
    const completeMonthRange = this.generateMonthRange(firstMonth, lastMonth);
    console.log(
      `📅 Complete month range: ${firstMonth} to ${lastMonth} (${completeMonthRange.length} months)`
    );

    // Create cumulative totals
    let cumulativeOrcamentario = 0;
    let cumulativeFinanceiro = 0;

    const months = [];
    const orcamentarioTotals = [];
    const financeiroTotals = [];

    completeMonthRange.forEach((month) => {
      const monthData = monthlyData.get(month) || {
        orcamentario: 0,
        financeiro: 0,
      };

      // Add this month's values to the running totals
      cumulativeOrcamentario += monthData.orcamentario;
      cumulativeFinanceiro += monthData.financeiro;

      months.push(month);
      orcamentarioTotals.push(cumulativeOrcamentario);
      financeiroTotals.push(cumulativeFinanceiro);

      console.log(
        `📊 ${month}: Orç +${monthData.orcamentario.toFixed(
          2
        )} = ${cumulativeOrcamentario.toFixed(
          2
        )}, Fin +${monthData.financeiro.toFixed(
          2
        )} = ${cumulativeFinanceiro.toFixed(2)}`
      );
    });

    return {
      months: months,
      orcamentario: orcamentarioTotals,
      financeiro: financeiroTotals,
    };
  }

  generateMonthRange(startMonth, endMonth) {
    const months = [];
    const [startYear, startMonthNum] = startMonth.split("-").map(Number);
    const [endYear, endMonthNum] = endMonth.split("-").map(Number);

    let currentYear = startYear;
    let currentMonth = startMonthNum;

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonthNum)
    ) {
      const monthStr = `${currentYear}-${currentMonth
        .toString()
        .padStart(2, "0")}`;
      months.push(monthStr);

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    return months;
  }

  // Helper methods
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

    // Apply the same RP filtering logic as used in chart calculations
    return orcamentario.reduce((total, op) => {
      if (!op || op.va_operacao === null || op.va_operacao === undefined) {
        return total;
      }

      let value = parseFloat(op.va_operacao) || 0;

      // Exclude RP operations from calculations (budget rollover to next year)
      // Operations with "RP" in no_operacao are budget transfers, not new spending
      // EXCEPTION: If this is marked as the oldest operation and contains "RP", count it at full value
      const isRpOperation =
        op.no_operacao &&
        op.no_operacao.toString().toUpperCase().includes("RP");

      // Use backend-calculated is_oldest_operation field for exception handling
      // Exception applies to ANY RP operation when it's the oldest operation
      const isOldestRpException =
        op.is_oldest_operation === true && isRpOperation;

      if (isRpOperation && !isOldestRpException) {
        value = 0; // Count as zero to avoid double-counting budget
      }

      return total + value;
    }, 0);
  }

  calculateFinancasTotal(empenho) {
    let total = 0;

    // Handle new nested structure under Finanças
    const financas = empenho.Finanças || {};

    // DARF documents
    (financas.documentos_darf || empenho.documentos_darf || []).forEach(
      (doc) => {
        total +=
          (parseFloat(doc.va_juros) || 0) +
          (parseFloat(doc.va_receita) || 0) +
          (parseFloat(doc.va_multa) || 0);
      }
    );

    // DAR documents
    (financas.documentos_dar || empenho.documentos_dar || []).forEach((doc) => {
      total +=
        (parseFloat(doc.va_multa) || 0) +
        (parseFloat(doc.va_juros) || 0) +
        (parseFloat(doc.va_principal) || 0);
    });

    // GPS documents
    (financas.documentos_gps || empenho.documentos_gps || []).forEach((doc) => {
      total += parseFloat(doc.va_inss) || 0;
    });

    // OB documents
    (financas.linha_evento_ob || empenho.linha_evento_ob || []).forEach(
      (doc) => {
        total += parseFloat(doc.va_linha_evento) || 0;
      }
    );

    return total;
  }

  createFinancialRow(doc, docType) {
    const fullDocumentId = this.getFullDocumentId(doc, docType);
    const shortDocumentId = this.getDocumentId(doc, docType);

    const row = {
      date: this.extractDateFromFinancialDoc(doc),
      documentId: shortDocumentId,
      fullDocumentId: fullDocumentId,
      type: this.getDocumentType(docType),
      icon: this.getDocumentIcon(docType),
      iconColor: this.getDocumentIconColor(docType),
      parcial: this.getFinancialDocValue(doc, docType),
      nominal: this.getFinancialDocValue(doc, docType),
    };

    return row;
  }

  getDocumentId(doc, docType) {
    let documentId;
    switch (docType) {
      case "documentos_dar":
        documentId = doc.id_doc_dar;
        break;
      case "documentos_darf":
        documentId = doc.id_doc_darf;
        break;
      case "documentos_gps":
        documentId = doc.id_doc_gps;
        break;
      case "linha_evento_ob":
        documentId = doc.id_doc_ob;
        break;
      default:
        return "N/A";
    }

    // Remove first 11 characters from the document ID
    if (
      documentId &&
      typeof documentId === "string" &&
      documentId.length > 11
    ) {
      return documentId.substring(11);
    }

    return documentId || "N/A";
  }

  getFullDocumentId(doc, docType) {
    // Returns the full, unmodified document ID for URL usage
    switch (docType) {
      case "documentos_dar":
        return doc.id_doc_dar || "N/A";
      case "documentos_darf":
        return doc.id_doc_darf || "N/A";
      case "documentos_gps":
        return doc.id_doc_gps || "N/A";
      case "linha_evento_ob":
        return doc.id_doc_ob || "N/A";
      default:
        return "N/A";
    }
  }

  // Helper method to remove first 11 characters from document ID
  formatDocumentId(documentId) {
    if (
      documentId &&
      typeof documentId === "string" &&
      documentId.length > 11
    ) {
      return documentId.substring(11);
    }
    return documentId || "N/A";
  }

  getDocumentType(docType) {
    switch (docType) {
      case "documentos_dar":
        return "DAR";
      case "documentos_darf":
        return "DARF";
      case "documentos_gps":
        return "GPS";
      case "linha_evento_ob":
        return "OB";
      default:
        return "Outros";
    }
  }

  getDocumentIcon(docType) {
    switch (docType) {
      case "documentos_dar":
        return "fa-receipt";
      case "documentos_darf":
        return "fa-file-invoice-dollar";
      case "documentos_gps":
        return "fa-shield-alt";
      case "linha_evento_ob":
        return "fa-money-bill-wave";
      default:
        return "fa-file";
    }
  }

  getDocumentIconColor(docType) {
    switch (docType) {
      case "documentos_dar":
        return "#f44336";
      case "documentos_darf":
        return "#ff9800";
      case "documentos_gps":
        return "#2196f3";
      case "linha_evento_ob":
        return "#4caf50";
      default:
        return "#666";
    }
  }

  getFinancialDocValue(doc, docType) {
    switch (docType) {
      case "documentos_dar":
        return (
          (parseFloat(doc.va_multa) || 0) +
          (parseFloat(doc.va_juros) || 0) +
          (parseFloat(doc.va_principal) || 0)
        );
      case "documentos_darf":
        return (
          (parseFloat(doc.va_juros) || 0) +
          (parseFloat(doc.va_receita) || 0) +
          (parseFloat(doc.va_multa) || 0)
        );
      case "documentos_gps":
        return parseFloat(doc.va_inss) || 0;
      case "linha_evento_ob":
        return parseFloat(doc.va_linha_evento) || 0;
      default:
        return 0;
    }
  }

  extractDateFromFinancialDoc(doc) {
    // Handle different document types with different date fields

    // For OB documents - use saque_bacen fields
    if (
      doc.id_ano_saque_bacen &&
      doc.id_mes_saque_bacen &&
      doc.id_dia_saque_bacen
    ) {
      const day = doc.id_dia_saque_bacen.toString().padStart(2, "0");
      const month = doc.id_mes_saque_bacen.toString().padStart(2, "0");
      const year = doc.id_ano_saque_bacen;
      return `${day}/${month}/${year}`;
    }

    // For DARF/DAR/GPS documents - use vencimento fields
    if (
      doc.id_ano_vencimento_doc &&
      doc.id_mes_vencimento_doc &&
      doc.id_dia_vencimento_doc
    ) {
      const day = doc.id_dia_vencimento_doc.toString().padStart(2, "0");
      const month = doc.id_mes_vencimento_doc.toString().padStart(2, "0");
      const year = doc.id_ano_vencimento_doc;
      return `${day}/${month}/${year}`;
    }

    // Fallback to other date fields
    return doc.dt_documento || doc.dt_operacao || "N/A";
  }

  // Parse date string to Date object for comparison purposes
  parseDateForComparison(dateString) {
    if (!dateString) return null;

    const str = String(dateString);

    try {
      // Handle YYYYMMDD format (8 digits)
      if (/^\d{8}$/.test(str)) {
        const year = str.substring(0, 4);
        const month = str.substring(4, 6);
        const day = str.substring(6, 8);
        return new Date(year, parseInt(month) - 1, parseInt(day));
      }

      // Handle DD/MM/YYYY format (Brazilian format)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const parts = str.split("/");
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }

      // Handle YYYY-MM-DD format (ISO format)
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return new Date(str);
      }

      // Try default parsing
      return new Date(str);
    } catch (error) {
      console.warn(`Failed to parse date for comparison: ${dateString}`, error);
      return null;
    }
  }

  extractMonth(dateString) {
    if (!dateString) return null;

    const str = String(dateString);

    // Check if it's in YYYYMMDD format (8 digits) - common for orçamentário dates
    if (str.length === 8 && /^\d{8}$/.test(str)) {
      const year = str.substr(0, 4);
      const month = str.substr(4, 2);
      return `${year}-${month}`;
    }

    // Check if it's in DD/MM/YYYY format (Brazilian format)
    const ddmmyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmmyyMatch = str.match(ddmmyyRegex);
    if (ddmmyyMatch) {
      const [, day, month, year] = ddmmyyMatch;
      const monthPadded = month.padStart(2, "0");
      return `${year}-${monthPadded}`;
    }

    // Try regular date parsing (assumes MM/DD/YYYY or other standard formats)
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
      }
    } catch (error) {
      // Fall through
    }

    // If all else fails, try to extract year and month manually
    const yearMatch = str.match(/(\d{4})/);
    const monthMatch = str.match(/\/(\d{1,2})\//);
    if (yearMatch && monthMatch) {
      const year = yearMatch[1];
      const month = monthMatch[1].padStart(2, "0");
      return `${year}-${month}`;
    }

    return null;
  }

  extractMonthFromFinancialDoc(doc) {
    // For OB documents - use saque_bacen fields
    if (doc.id_ano_saque_bacen && doc.id_mes_saque_bacen) {
      const year = doc.id_ano_saque_bacen;
      const month = doc.id_mes_saque_bacen.toString().padStart(2, "0");
      return `${year}-${month}`;
    }

    // For DARF/DAR/GPS documents - use vencimento fields
    if (doc.id_ano_vencimento_doc && doc.id_mes_vencimento_doc) {
      const year = doc.id_ano_vencimento_doc;
      const month = doc.id_mes_vencimento_doc.toString().padStart(2, "0");
      return `${year}-${month}`;
    }

    // Fallback to extracting from formatted date
    const dateString = this.extractDateFromFinancialDoc(doc);
    if (dateString !== "N/A") {
      const extractedMonth = this.extractMonth(dateString);
      return extractedMonth;
    }

    return null;
  }

  getItemDescription(itemId, empenho) {
    const neItems = empenho.ne_item || [];
    const item = neItems.find((item) => item.id_item === itemId);
    return item ? item.ds_item : `Item ${itemId}`;
  }

  formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  }

  // Handle orçamentário operation dates (dt_operacao) - may be in YYYYMMDD format
  formatDateFromOperacao(dtOperacao) {
    if (!dtOperacao) return "N/A";

    const str = String(dtOperacao);

    // Check if it's in YYYYMMDD format (8 digits)
    if (str.length === 8 && /^\d{8}$/.test(str)) {
      const year = str.substr(0, 4);
      const month = str.substr(4, 2);
      const day = str.substr(6, 2);
      return `${day}/${month}/${year}`;
    }

    // Check if it's already in DD/MM/YYYY format (Brazilian)
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const ddmmyyyyMatch = str.match(ddmmyyyyRegex);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      // It's already in the correct format, just ensure proper padding
      const dayPadded = day.padStart(2, "0");
      const monthPadded = month.padStart(2, "0");
      return `${dayPadded}/${monthPadded}/${year}`;
    }

    // Check if it's in YYYY-MM-DD format (ISO)
    const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    const yyyymmddMatch = str.match(yyyymmddRegex);
    if (yyyymmddMatch) {
      const [, year, month, day] = yyyymmddMatch;
      const dayPadded = day.padStart(2, "0");
      const monthPadded = month.padStart(2, "0");
      return `${dayPadded}/${monthPadded}/${year}`;
    }

    // If not in a recognized format, try regular date parsing as last resort
    try {
      const date = new Date(dtOperacao);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR");
      }
    } catch (error) {
      // Fall through to return original
    }

    return dtOperacao; // Return as-is if can't parse
  }

  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(value));
  }

  formatCurrencyShort(value) {
    if (value >= 1000000000) return `R$ ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
    return `R$ ${value.toFixed(0)}`;
  }

  calculateStatusPercentage(financas, orcamentario) {
    // Calculate percentage: Finanças / Orçamentário * 100
    if (!orcamentario || orcamentario === 0) {
      return {
        percentage: 0,
        display: "0%",
      };
    }

    // Handle case where financas might be null, undefined, or zero
    const financasValue = financas || 0;
    const percentage = (financasValue / orcamentario) * 100;

    return {
      percentage: percentage,
      display: `${percentage.toFixed(1)}%`,
    };
  }

  getPercentageStatusBadge(percentage) {
    // Color coding based on financial execution percentage: Finanças / Orçamentário * 100
    // Higher percentage = more of the budget has been financially processed
    if (percentage >= 80) {
      return "badge-success"; // Green: 80-100% financially processed (excellent execution)
    } else if (percentage >= 50) {
      return "badge-warning"; // Yellow: 50-79% financially processed (good execution)
    } else if (percentage >= 20) {
      return "badge-info"; // Blue: 20-49% financially processed (moderate execution)
    } else if (percentage > 0) {
      return "badge-secondary"; // Gray: 1-19% financially processed (low execution)
    } else if (percentage === 0) {
      return "badge-light"; // Light gray: 0% financially processed (no execution yet)
    } else {
      return "badge-danger"; // Red: negative percentage (unusual case)
    }
  }

  getStatusBadge(status) {
    switch (status?.toLowerCase()) {
      case "ativo":
        return "badge-success";
      case "finalizado":
        return "badge-secondary";
      case "cancelado":
        return "badge-danger";
      default:
        return "badge-primary";
    }
  }

  showError(message) {
    console.error(message);
    // Show user-friendly error message
    Object.values(this.containers).forEach((container) => {
      if (container && container.tagName === "TBODY") {
        container.innerHTML = `
          <tr>
            <td colspan="100%" class="text-center text-danger p-4">
              <i class="fas fa-exclamation-triangle"></i><br>
              ${message}
            </td>
          </tr>
        `;
      }
    });
  }

  // Excel Export Functionality
  exportToExcel() {
    try {
      console.log("Starting Excel export with enhanced formatting...");

      if (!this.state.rawData || !this.state.rawData.empenhos_data) {
        alert("Não há dados para exportar. Carregue os dados primeiro.");
        return;
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Get current date for filename
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const contractId = this.state.currentContractId;

      // 1. Export Empenhos Originais with formatting
      const empenhosData = this.prepareEmpenhosDataForExport();
      const empenhosWS = XLSX.utils.json_to_sheet(empenhosData);
      this.formatWorksheet(empenhosWS, empenhosData, "empenhos");
      XLSX.utils.book_append_sheet(wb, empenhosWS, "Empenhos Originais");

      // 2. Export Grid Financeiro with formatting
      const financeiroData = this.prepareFinanceiroDataForExport();
      const financeiroWS = XLSX.utils.json_to_sheet(financeiroData);
      this.formatWorksheet(financeiroWS, financeiroData, "financeiro");
      XLSX.utils.book_append_sheet(wb, financeiroWS, "Grid Financeiro");

      // 3. Export Movimentações Orçamentárias with formatting
      const movimentacoesData = this.prepareMovimentacoesDataForExport();
      const movimentacoesWS = XLSX.utils.json_to_sheet(movimentacoesData);
      this.formatWorksheet(movimentacoesWS, movimentacoesData, "movimentacoes");
      XLSX.utils.book_append_sheet(wb, movimentacoesWS, "Movimentações");

      // Write and download the file
      const filename = `Encontro_de_Contas_Contrato_${contractId}_${dateStr}.xlsx`;
      XLSX.writeFile(wb, filename);

      console.log("Excel export with formatting completed successfully");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert(
        "Erro ao exportar para Excel. Verifique os dados e tente novamente."
      );
    }
  }

  // Enhanced worksheet formatting function
  formatWorksheet(ws, data, sheetType) {
    if (!ws || !data || data.length === 0) return;

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws["!ref"]);

    // Define color schemes for different sheet types
    const colorSchemes = {
      empenhos: {
        header: { fgColor: { rgb: "1976D2" } }, // Blue
        headerText: { color: { rgb: "FFFFFF" } },
        alternateRow: { fgColor: { rgb: "F5F5F5" } },
        border: { style: "thin", color: { rgb: "CCCCCC" } },
      },
      financeiro: {
        header: { fgColor: { rgb: "4CAF50" } }, // Green
        headerText: { color: { rgb: "FFFFFF" } },
        alternateRow: { fgColor: { rgb: "E8F5E8" } },
        border: { style: "thin", color: { rgb: "CCCCCC" } },
      },
      movimentacoes: {
        header: { fgColor: { rgb: "FF9800" } }, // Orange
        headerText: { color: { rgb: "FFFFFF" } },
        alternateRow: { fgColor: { rgb: "FFF3E0" } },
        border: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };

    const colors = colorSchemes[sheetType];

    // Set column widths
    const colWidths = [];
    const headers = Object.keys(data[0] || {});

    headers.forEach((header, colIndex) => {
      let maxWidth = header.length;

      // Calculate optimal column width based on content
      data.forEach((row) => {
        const cellValue = String(row[header] || "");
        maxWidth = Math.max(maxWidth, cellValue.length);
      });

      // Set reasonable limits (min 10, max 50 characters)
      colWidths.push({ wch: Math.min(Math.max(maxWidth + 2, 10), 50) });
    });

    ws["!cols"] = colWidths;

    // Format header row (row 1)
    for (let colIndex = 0; colIndex <= range.e.c; colIndex++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        fill: colors.header,
        font: {
          bold: true,
          size: 12,
          color: colors.headerText,
        },
        border: {
          top: colors.border,
          bottom: colors.border,
          left: colors.border,
          right: colors.border,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      };
    }

    // Format data rows with alternating colors
    for (let rowIndex = 1; rowIndex <= range.e.r; rowIndex++) {
      const isAlternateRow = rowIndex % 2 === 0;

      for (let colIndex = 0; colIndex <= range.e.c; colIndex++) {
        const cellAddress = XLSX.utils.encode_cell({
          r: rowIndex,
          c: colIndex,
        });
        if (!ws[cellAddress]) continue;

        const cellStyle = {
          border: {
            top: colors.border,
            bottom: colors.border,
            left: colors.border,
            right: colors.border,
          },
          alignment: {
            horizontal: this.getCellAlignment(headers[colIndex]),
            vertical: "center",
          },
        };

        // Add alternate row coloring
        if (isAlternateRow) {
          cellStyle.fill = colors.alternateRow;
        }

        // Special formatting for currency columns
        if (this.isCurrencyColumn(headers[colIndex])) {
          cellStyle.numFmt = '"R$ "#,##0.00';
        }

        // Special formatting for date columns
        if (this.isDateColumn(headers[colIndex])) {
          cellStyle.numFmt = "dd/mm/yyyy";
        }

        ws[cellAddress].s = cellStyle;
      }
    }

    // Add freeze panes (freeze header row)
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  }

  // Helper function to determine cell alignment
  getCellAlignment(columnName) {
    const centerColumns = ["Nº", "Tipo", "Status"];
    const rightColumns = [
      "Valor",
      "Orçamentário",
      "Finanças",
      "Saldo de Empenho",
      "Parcial",
      "Nominal",
    ];

    if (centerColumns.some((col) => columnName.includes(col))) return "center";
    if (rightColumns.some((col) => columnName.includes(col))) return "right";
    return "left";
  }

  // Helper function to identify currency columns
  isCurrencyColumn(columnName) {
    const currencyColumns = [
      "Valor",
      "Orçamentário",
      "Finanças",
      "Saldo de Empenho",
      "Parcial",
      "Nominal",
    ];
    return currencyColumns.some((col) => columnName.includes(col));
  }

  // Helper function to identify date columns
  isDateColumn(columnName) {
    return columnName.includes("Data");
  }

  prepareEmpenhosDataForExport() {
    const data = [];

    this.state.rawData.empenhos_data.forEach((empenho, index) => {
      const orcamentarioTotal = this.calculateOrcamentarioTotal(empenho);
      const financasTotal = this.calculateFinancasTotal(empenho);
      const empenhado = empenho.empenho?.empenhado || 0;
      const pago = empenho.empenho?.pago || 0;
      const saldo = orcamentarioTotal - financasTotal; // Saldo de empenho = Orçamentário - Finanças

      // Calculate percentage status for export: Finanças / Orçamentário * 100
      const percentageStatus = this.calculateStatusPercentage(
        financasTotal,
        orcamentarioTotal
      );
      data.push({
        Nº: index + 1,
        Empenho: empenho.empenho?.numero || "N/A",
        Data: this.formatDateForExcel(empenho.empenho?.data_emissao),
        Valor: empenhado,
        Espécie: "Original",
        Orçamentário: orcamentarioTotal,
        Finanças: financasTotal,
        "Saldo de Empenho": saldo,
        Status: percentageStatus.display,
      });
    });

    return data;
  }

  prepareFinanceiroDataForExport() {
    const data = [];
    let index = 1;

    this.state.rawData.empenhos_data.forEach((empenho) => {
      const financas = empenho.Finanças || empenho;

      // Process DARF documents
      (financas.documentos_darf || []).forEach((doc) => {
        data.push({
          Nº: index++,
          Data: this.formatDateForExcel(this.buildDateFromDARF(doc)),
          Pagamento: this.formatDocumentId(doc.id_doc_darf),
          Tipo: "DARF",
          Parcial: doc.va_receita || 0,
          Nominal: doc.va_receita || 0,
        });
      });

      // Process DAR documents
      (financas.documentos_dar || []).forEach((doc) => {
        data.push({
          Nº: index++,
          Data: this.formatDateForExcel(this.buildDateFromDAR(doc)),
          Pagamento: this.formatDocumentId(doc.id_doc_dar),
          Tipo: "DAR",
          Parcial: doc.va_principal || 0,
          Nominal: doc.va_principal || 0,
        });
      });

      // Process GPS documents
      (financas.documentos_gps || []).forEach((doc) => {
        data.push({
          Nº: index++,
          Data: this.formatDateForExcel(this.buildDateFromGPS(doc)),
          Pagamento: this.formatDocumentId(doc.id_doc_gps),
          Tipo: "GPS",
          Parcial: doc.va_receita || 0,
          Nominal: doc.va_receita || 0,
        });
      });

      // Process OB documents
      (financas.linha_evento_ob || empenho.linha_evento_ob || []).forEach(
        (doc) => {
          data.push({
            Nº: index++,
            Data: this.formatDateForExcel(this.buildDateFromOB(doc)),
            Pagamento: this.formatDocumentId(
              doc.id_doc_ob || doc.id_linha_evento_ob
            ),
            Tipo: "OB",
            Parcial: doc.va_linha_evento || 0,
            Nominal: doc.va_linha_evento || 0,
          });
        }
      );
    });

    return data;
  }

  prepareMovimentacoesDataForExport() {
    const data = [];
    let index = 1;

    this.state.rawData.empenhos_data.forEach((empenho) => {
      const orcamentario =
        empenho.Orçamentário?.operacoes ||
        empenho.Ne_item?.operacoes ||
        empenho.Orçamentário ||
        [];

      if (Array.isArray(orcamentario)) {
        orcamentario.forEach((op) => {
          data.push({
            Nº: index++,
            Data: this.formatDateForExcel(op.dt_operacao),
            Empenho: empenho.empenho?.numero || "N/A",
            Espécie: op.no_operacao || "N/A",
            Valor: op.va_operacao || 0,
          });
        });
      }
    });

    return data;
  }

  formatDateForExcel(dateInput) {
    if (!dateInput) return "";

    // Handle different date formats
    if (typeof dateInput === "string") {
      // Try to parse ISO date or other formats
      const date = new Date(dateInput);
      if (!isNaN(date)) {
        return date.toLocaleDateString("pt-BR");
      }
    }

    if (dateInput instanceof Date) {
      return dateInput.toLocaleDateString("pt-BR");
    }

    return dateInput.toString();
  }

  // Date building methods for financial documents
  buildDateFromDARF(doc) {
    // DARF uses vencimento fields
    if (
      doc.id_ano_vencimento_doc &&
      doc.id_mes_vencimento_doc &&
      doc.id_dia_vencimento_doc
    ) {
      const day = doc.id_dia_vencimento_doc.toString().padStart(2, "0");
      const month = doc.id_mes_vencimento_doc.toString().padStart(2, "0");
      const year = doc.id_ano_vencimento_doc;
      return `${day}/${month}/${year}`;
    }
    return "N/A";
  }

  buildDateFromDAR(doc) {
    // DAR likely uses same structure as DARF
    return this.buildDateFromDARF(doc);
  }

  buildDateFromGPS(doc) {
    // GPS likely uses same structure as DARF
    return this.buildDateFromDARF(doc);
  }

  buildDateFromOB(doc) {
    // OB uses saque_bacen fields
    if (
      doc.id_ano_saque_bacen &&
      doc.id_mes_saque_bacen &&
      doc.id_dia_saque_bacen
    ) {
      const day = doc.id_dia_saque_bacen.toString().padStart(2, "0");
      const month = doc.id_mes_saque_bacen.toString().padStart(2, "0");
      const year = doc.id_ano_saque_bacen;
      return `${day}/${month}/${year}`;
    }
    return "N/A";
  }

  // Public methods for external calls
  static showEmpenhoDetails(empenhoNumero) {
    // Implementation should be provided by the consuming application
    throw new Error("showEmpenhoDetails method must be implemented");
  }

  static showDocumentDetails(documentId, type) {
    // Implementation should be provided by the consuming application
    throw new Error("showDocumentDetails method must be implemented");
  }

  static showMovimentacaoDetails(empenho, date) {
    // Implementation should be provided by the consuming application
    throw new Error("showMovimentacaoDetails method must be implemented");
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.EncontroContas = new EncontroContas();
});

// Static method for HTML button access
window.exportToExcel = function () {
  if (window.EncontroContas) {
    window.EncontroContas.exportToExcel();
  } else {
    alert(
      "Sistema não inicializado. Aguarde o carregamento completo da página."
    );
  }
};

// Export for module usage
export default EncontroContas;
