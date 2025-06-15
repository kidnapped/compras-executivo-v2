import React from "react";
import ReactECharts from "echarts-for-react";

type Props = {
  onYearSelect: (year: string) => void;
};

const MyChart: React.FC<Props> = ({ onYearSelect }) => {
  const option = {
    title: {
      text: "Sample Chart",
    },
    tooltip: {},
    xAxis: {
      data: ["A", "B", "C", "D", "E"],
    },
    yAxis: {},
    series: [
      {
        name: "Value",
        type: "bar",
        data: [5, 20, 36, 10, 10],
      },
    ],
  };

  const handleClick = (params: any) => {
    if (params?.name) {
      onYearSelect(params.name);
    }
  };

  const onEvents: Record<string, (params: any) => void> = {
    click: handleClick,
  };

  return (
    <ReactECharts
      option={option}
      onEvents={onEvents}
      style={{ height: "400px" }}
      className=""
    />
  );
};

export default MyChart;
