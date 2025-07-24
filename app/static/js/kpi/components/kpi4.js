// KPI 4 - Top Fornecedores
import {
  fetchKpiData,
  renderKpiCard,
  showKpiError,
} from "../shared/kpi-utils.js";
import { setupKpiDropdown } from "../shared/kpi-dropdown.js";

export const initKpi4 = async () => {
  try {
    const kpiData = await fetchKpiData("/kpis/kpi4");

    // Convert values to millions and format labels without contract count
    const processedData = kpiData.fornecedores.map((f) => {
      const supplierName = f.fornecedor_nome || `Fornecedor ${f.fornecedor_id}`;
      const truncatedName =
        supplierName.length > 10
          ? supplierName.substring(0, 10) + "..."
          : supplierName;

      return {
        ...f,
        valueInMillions: (f.valor_total_contratos || 0) / 1000000,
        labelOnly: truncatedName,
        fullName: supplierName, // Keep full name for tooltip
      };
    });

    await renderKpiCard({
      containerId: "card-kpi-top-fornecedores",
      cardTitle: kpiData.titulo,
      cardSubtitle: kpiData.subtitulo,
      chartType: "bar",
      labels: processedData.map((f) => f.labelOnly),
      values: processedData.map((f) => f.valueInMillions),
      customOption: (labels, values, option) => {
        return {
          ...option,
          legend: { show: false },
          xAxis: {
            ...option.xAxis,
            axisLabel: {
              show: true,
              rotate: 30,
              fontSize: 11,
              interval: 0,
              formatter: (value) => value,
            },
          },
          yAxis: {
            ...option.yAxis,
            name: "Valor (Milhões R$)",
            nameLocation: "middle",
            nameGap: 50,
            axisLabel: {
              formatter: (value) => `${value.toFixed(1)}M`,
            },
          },
          series: [
            {
              ...option.series[0],
              label: {
                show: false,
                position: "inside",
                formatter: (params) => {
                  const dataIndex = params.dataIndex;
                  const supplier = processedData[dataIndex];
                  return `R$${params.value.toFixed(1)}M`;
                },
                fontSize: 15,
                color: "#333",
                lineHeight: 12,
                rotate: 90,
                align: "center",
                verticalAlign: "bottom",
                offset: [0, 0],
              },
            },
          ],
          tooltip: {
            formatter: (params) => {
              const dataIndex = params.dataIndex;
              const supplier = processedData[dataIndex];
              return `
                <strong>${supplier.fullName}</strong><br/>
                Valor Total: R$ ${(
                  supplier.valor_total_contratos / 1000000
                ).toFixed(2)} milhões<br/>
                Total de Contratos: ${supplier.total_contratos}
              `;
            },
          },
        };
      },
    });

    setupKpiDropdown("card-kpi-top-fornecedores");
  } catch (err) {
    showKpiError(["card-kpi-top-fornecedores"], err);
  }
};
