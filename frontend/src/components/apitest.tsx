import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  BrCard,
  BrButton,
  BrAvatar,
  BrLoading,
} from "@govbr-ds/react-components";

interface ApiChartProps {
  className: string;
}

type ApiResponse = {
  titulo: string;
  subtitulo: string;
  icone: string;
  anos: string[];
  valores: number[];
};

const ApiChart: React.FC<ApiChartProps> = ({ className }) => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:80/dashboard/contratos-por-exercicio", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => {
        console.error("Error:", err);
        setError(
          "Erro ao carregar os dados. Verifique sua conexão ou autenticação."
        );
      });
  }, []);

  const option = {
    grid: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      containLabel: true,
    },
    tooltip: {},
    xAxis: { data: data?.anos || [] },
    yAxis: {},
    series: [
      {
        name: "Contratos",
        type: "bar",
        data: data?.valores || [],
      },
    ],
  };

  const onChartClick = (params: any) => {
    const year = params.name;
    setSelectedYear(year);
  };

  const onEvents = {
    click: onChartClick,
  };

  const index = data?.anos.indexOf(selectedYear || "") ?? -1;
  const selectedValue = index >= 0 && data ? data.valores[index] : null;

  return (
    <BrCard className={className}>
      <div
        className="dashboard-card-header"
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <BrAvatar />
        <div style={{ flexGrow: 1 }}>
          <h3 className="dashboard-title">
            {data?.titulo || "Contratos por exercício"}
          </h3>
          <p className="dashboard-subtitle">{data?.subtitulo || ""}</p>
        </div>
        <BrButton
          icon="ellipsis-v"
          circle
          onClick={() => console.log("Menu clicked")}
          style={{ marginLeft: "auto", marginRight: "-0.25rem" }}
        />
      </div>

      {loading ? (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <BrLoading large />
        </div>
      ) : error ? (
        <div style={{ padding: "1rem", color: "red", textAlign: "center" }}>
          {error}
        </div>
      ) : (
        <>
          <ReactECharts
            option={option}
            onEvents={onEvents}
            style={{ height: "100px" }}
          />

          {selectedYear && (
            <div style={{ paddingTop: "0.5rem" }}>
              <h4 style={{ margin: 0 }}>Ano Selecionado: {selectedYear}</h4>
              <p style={{ margin: 0 }}>Total de Contratos: {selectedValue}</p>
            </div>
          )}
        </>
      )}
    </BrCard>
  );
};

export default ApiChart;
