import getEcharts from "../../util/echarts.js";

/**
 * DetalhesEmpenhosChart - ECharts visualization for empenhos data
 * Creates a line chart with two lines:
 * - Red line for "Anulação" (negative values)
 * - Green line for other types (positive values)
 */
const DetalhesEmpenhosChart = {
  /**
   * Initialize the chart component (without loading data)
   */
  async initialize() {
    console.log("Initializing DetalhesEmpenhos Chart...");

    try {
      // Load ECharts library
      this.echarts = await getEcharts();
      console.log("ECharts loaded successfully");

      // Show loading state in chart container
      this.showLoadingState();
    } catch (error) {
      console.error("Error initializing DetalhesEmpenhos Chart:", error);
      this.showError("Erro ao inicializar componente de gráfico");
    }
  },

  /**
   * Show loading state in chart container
   */
  showLoadingState() {
    const chartContainer = document.getElementById("detalhes-empenhos-chart");
    if (chartContainer) {
      chartContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
          <div style="text-align: center;">
            <div class="br-loading medium" role="progressbar" aria-label="carregando gráfico"></div>
            <br />
            <span style="font-size: 12px;">Carregando dados do gráfico...</span>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render chart with provided data
   * @param {Array} empenhos - Array of empenho objects
   * @param {Array} pagamentos - Array of pagamento objects (optional)
   */
  async renderWithData(empenhos, pagamentos = []) {
    try {
      console.log("Rendering chart with provided data...");

      if (!empenhos || empenhos.length === 0) {
        this.showError("Nenhum dado disponível para o gráfico");
        return;
      }

      // Cache the data for future use
      this.cacheEmpenhos(empenhos);
      this.cachePagamentos(pagamentos);

      // Prepare chart data
      const chartData = this.prepareChartData(empenhos, null, pagamentos);

      // Render chart
      await this.renderChart(chartData);

      console.log(
        "Chart rendered successfully with",
        empenhos.length,
        "empenhos and",
        pagamentos.length,
        "pagamentos"
      );
    } catch (error) {
      console.error("Error rendering chart with data:", error);
      this.showError("Erro ao renderizar gráfico");
    }
  },

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const chartContainer = document.getElementById("detalhes-empenhos-chart");
    if (chartContainer) {
      chartContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #dc3545;">
          <div style="text-align: center;">
            <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
            <br />
            ${message}
          </div>
        </div>
      `;
    } else {
      // Fallback to console and alert
      console.error("Chart error:", message);
      alert(`Erro no gráfico: ${message}`);
    }
  },

  /**
   * Show chart with empenhos data (refresh with highlighting)
   * @param {string} empenhoId - Specific empenho ID to highlight (optional)
   */
  async showChart(empenhoId = null) {
    try {
      console.log(
        `Refreshing chart${
          empenhoId ? ` with highlight for empenho ${empenhoId}` : ""
        }`
      );

      // If we don't have cached data, load it
      if (!this.cachedEmpenhos) {
        const empenhosData = await this.loadEmpenhosData();

        if (!empenhosData.success) {
          this.showError(empenhosData.error);
          return;
        }

        this.cachedEmpenhos = empenhosData.data.empenhos;
        this.cachedPagamentos = empenhosData.data.pagamentos || [];
      }

      // Prepare chart data with highlighting
      const chartData = this.prepareChartData(
        this.cachedEmpenhos,
        empenhoId,
        this.cachedPagamentos
      );

      // Re-render chart with highlighting
      await this.renderChart(chartData);

      // If highlighting specific empenho, scroll to chart
      if (empenhoId) {
        const chartContainer = document.getElementById(
          "detalhes-empenhos-chart-container"
        );
        if (chartContainer) {
          chartContainer.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    } catch (error) {
      console.error("Error showing chart:", error);
      this.showError("Erro ao atualizar gráfico dos empenhos");
    }
  },

  /**
   * Cache empenhos data for future use
   * @param {Array} empenhos - Array of empenho objects
   */
  cacheEmpenhos(empenhos) {
    this.cachedEmpenhos = empenhos;
  },

  /**
   * Cache pagamentos data for future use
   * @param {Array} pagamentos - Array of pagamento objects
   */
  cachePagamentos(pagamentos) {
    this.cachedPagamentos = pagamentos;
  },

  /**
   * Load empenhos data from JSON file
   */
  async loadEmpenhosData() {
    try {
      const response = await fetch("/static/js/encontro/empenhos-data.json");

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: Failed to load empenhos data`
        );
      }

      const data = await response.json();

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error loading empenhos data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Prepare data for chart visualization
   * @param {Array} empenhos - Array of empenho objects
   * @param {string} empenhoId - Specific empenho ID to highlight (optional)
   * @param {Array} pagamentos - Array of pagamento objects (optional)
   */
  prepareChartData(empenhos, empenhoId = null, pagamentos = []) {
    console.log(
      "Preparing chart data for",
      empenhos.length,
      "empenhos and",
      pagamentos.length,
      "pagamentos"
    );

    // Sort empenhos by date
    const sortedEmpenhos = empenhos.sort((a, b) => {
      const dateA = this.parseDate(a.data);
      const dateB = this.parseDate(b.data);
      return dateA - dateB;
    });

    // Sort pagamentos by date
    const sortedPagamentos = pagamentos.sort((a, b) => {
      const dateA = this.parseDate(a.data);
      const dateB = this.parseDate(b.data);
      return dateA - dateB;
    });

    // Combine and sort all dates
    const allDates = [
      ...new Set([
        ...sortedEmpenhos.map((e) => e.data),
        ...sortedPagamentos.map((p) => p.data),
      ]),
    ].sort((a, b) => {
      const dateA = this.parseDate(a);
      const dateB = this.parseDate(b);
      return dateA - dateB;
    });

    // Create data arrays
    const dates = [];
    const cumulativeEmpenhos = [];
    const cumulativePagamentos = [];
    const allData = [];
    let runningEmpenhoTotal = 0;
    let runningPagamentoTotal = 0;

    allDates.forEach((date) => {
      // Find empenhos for this date
      const empenhosOnDate = sortedEmpenhos.filter((e) => e.data === date);
      // Find pagamentos for this date
      const pagamentosOnDate = sortedPagamentos.filter((p) => p.data === date);

      // Add empenho values
      empenhosOnDate.forEach((empenho) => {
        runningEmpenhoTotal += empenho.nominal_valor;
      });

      // Add pagamento values
      pagamentosOnDate.forEach((pagamento) => {
        runningPagamentoTotal += pagamento.nominal_valor;
      });

      // Check for highlighting
      const isHighlighted =
        empenhoId && empenhosOnDate.some((e) => e.empenho === empenhoId);

      dates.push(date);
      cumulativeEmpenhos.push({
        value: runningEmpenhoTotal,
        itemStyle: isHighlighted
          ? {
              color: "#007bff",
              borderWidth: 4,
              borderColor: "#0056b3",
            }
          : undefined,
      });

      cumulativePagamentos.push({
        value: runningPagamentoTotal,
      });

      // Store data for tooltip
      const dateData = {
        date: date,
        empenhos: empenhosOnDate,
        pagamentos: pagamentosOnDate,
        cumulativeEmpenhoValue: runningEmpenhoTotal,
        cumulativePagamentoValue: runningPagamentoTotal,
      };

      allData.push(dateData);
    });

    const result = {
      dates,
      cumulativeEmpenhos,
      cumulativePagamentos,
      allData,
      highlightedEmpenho: empenhoId,
    };

    console.log("Chart data prepared:", {
      totalDates: result.dates.length,
      finalEmpenhoValue: runningEmpenhoTotal,
      finalPagamentoValue: runningPagamentoTotal,
      dataPoints: result.cumulativeEmpenhos.length,
    });

    return result;
  },

  /**
   * Render the ECharts chart
   * @param {Object} chartData - Prepared chart data
   */
  async renderChart(chartData) {
    const chartContainer = document.getElementById("detalhes-empenhos-chart");

    if (!chartContainer) {
      console.warn("Chart container not found, chart will not be displayed");
      return;
    }

    console.log("Rendering chart with data:", {
      dates: chartData.dates.length,
      cumulativeEmpenhos: chartData.cumulativeEmpenhos.length,
      cumulativePagamentos: chartData.cumulativePagamentos.length,
      highlighted: chartData.highlightedEmpenho,
    });

    // Dispose existing chart if any
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }

    // Initialize chart
    this.chartInstance = this.echarts.init(chartContainer);

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#6a7985",
          },
        },
        formatter: (params) => {
          // Find the actual data point
          const dataIndex = params[0].dataIndex;
          const dateData = chartData.allData[dataIndex];

          if (!dateData) return "";

          let tooltipContent = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">
                <i class="fas fa-calendar"></i> ${dateData.date}
              </div>
          `;

          // Show empenhos for this date
          if (dateData.empenhos.length > 0) {
            tooltipContent += `<div style="margin-bottom: 8px;"><strong>Empenhos:</strong></div>`;
            dateData.empenhos.forEach((empenho) => {
              tooltipContent += `
                <div style="margin-bottom: 4px; padding: 4px; background: #f8f9fa; border-radius: 3px;">
                  <div style="font-size: 11px;">
                    <strong>${empenho.empenho}</strong> - 
                    <span style="color: ${
                      empenho.especie.toLowerCase() === "anulação"
                        ? "#dc3545"
                        : "#28a745"
                    };">
                      ${empenho.especie}
                    </span>
                  </div>
                  <div style="font-size: 11px;">Valor: ${empenho.nominal}</div>
                </div>
              `;
            });
          }

          // Show pagamentos for this date
          if (dateData.pagamentos.length > 0) {
            tooltipContent += `<div style="margin-bottom: 8px; margin-top: 8px;"><strong>Pagamentos:</strong></div>`;
            dateData.pagamentos.forEach((pagamento) => {
              tooltipContent += `
                <div style="margin-bottom: 4px; padding: 4px; background: #fff5f5; border-radius: 3px;">
                  <div style="font-size: 11px;">
                    <strong>${pagamento.empenho}</strong> - 
                    <span style="color: #dc3545;">Pagamento</span>
                  </div>
                  <div style="font-size: 11px;">Valor: ${pagamento.nominal}</div>
                </div>
              `;
            });
          }

          // Show cumulative totals
          tooltipContent += `
            <div style="border-top: 1px solid #eee; margin-top: 8px; padding-top: 8px;">
              <div style="margin-bottom: 3px;">
                <span style="font-weight: bold;">Total Empenhos:</span> 
                <span style="color: #007bff; font-weight: bold;">
                  ${this.formatCurrencyValue(dateData.cumulativeEmpenhoValue)}
                </span>
              </div>
              <div style="margin-bottom: 3px;">
                <span style="font-weight: bold;">Total Pagamentos:</span> 
                <span style="color: #dc3545; font-weight: bold;">
                  ${this.formatCurrencyValue(dateData.cumulativePagamentoValue)}
                </span>
              </div>
            </div>
            </div>
          `;

          return tooltipContent;
        },
      },
      legend: {
        data: [
          "Valor Acumulado dos Empenhos",
          "Valor Acumulado dos Pagamentos",
        ],
        top: "5%",
        textStyle: {
          fontSize: 11,
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "25%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: chartData.dates,
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          formatter: (value) => {
            // Format date to dd/mm
            const [day, month] = value.split("/");
            return `${day}/${month}`;
          },
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 10,
          formatter: (value) => {
            // Format as currency (millions)
            if (Math.abs(value) >= 1000000) {
              return `R$ ${(value / 1000000).toFixed(1)}M`;
            } else if (Math.abs(value) >= 1000) {
              return `R$ ${(value / 1000).toFixed(0)}K`;
            } else {
              return `R$ ${value}`;
            }
          },
        },
      },
      series: [
        {
          name: "Valor Acumulado dos Empenhos",
          type: "line",
          smooth: true,
          lineStyle: {
            color: "#007bff",
            width: 3,
          },
          itemStyle: {
            color: "#007bff",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(0, 123, 255, 0.3)" },
                { offset: 1, color: "rgba(0, 123, 255, 0.1)" },
              ],
            },
          },
          symbol: "circle",
          symbolSize: 6,
          data: chartData.cumulativeEmpenhos,
        },
        {
          name: "Valor Acumulado dos Pagamentos",
          type: "line",
          smooth: true,
          lineStyle: {
            color: "#dc3545",
            width: 3,
          },
          itemStyle: {
            color: "#dc3545",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(220, 53, 69, 0.3)" },
                { offset: 1, color: "rgba(220, 53, 69, 0.1)" },
              ],
            },
          },
          symbol: "circle",
          symbolSize: 6,
          data: chartData.cumulativePagamentos,
        },
      ],
      animation: true,
      animationDuration: 800,
      animationEasing: "cubicOut",
    };

    // Set chart option
    this.chartInstance.setOption(option);

    // Make chart responsive
    window.addEventListener("resize", () => {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    });
  },

  /**
   * Parse date string to Date object
   * @param {string} dateString - Date in DD/MM/YYYY format
   */
  parseDate(dateString) {
    const [day, month, year] = dateString.split("/");
    return new Date(year, month - 1, day);
  },

  /**
   * Format currency value for display
   * @param {number} value - Numeric value to format
   * @returns {string} Formatted currency string
   */
  formatCurrencyValue(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return "R$ 0,00";
    }

    // Convert to absolute value for formatting, but keep track of sign
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formattedValue;

    if (absValue >= 1000000) {
      // Format as millions
      formattedValue = `R$ ${(absValue / 1000000)
        .toFixed(2)
        .replace(".", ",")}M`;
    } else if (absValue >= 1000) {
      // Format as thousands
      formattedValue = `R$ ${(absValue / 1000).toFixed(0).replace(".", ",")}K`;
    } else {
      // Format as regular currency
      formattedValue = `R$ ${absValue.toFixed(2).replace(".", ",")}`;
    }

    // Add negative sign if needed
    return isNegative ? `-${formattedValue}` : formattedValue;
  },

  /**
   * Dispose chart instance
   */
  dispose() {
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  },
};

// Expose to global scope for onclick handlers
window.DetalhesEmpenhosChart = DetalhesEmpenhosChart;

export default DetalhesEmpenhosChart;
