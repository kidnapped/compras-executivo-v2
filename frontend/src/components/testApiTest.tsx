import React, { useState } from "react";
import ReactECharts from "echarts-for-react";
import { BrCard, BrButton, Typography } from "@govbr-ds/react-components";
import "./DashboardCard.css";

interface DashboardCardProps {
  title: string;
  subtitle: string;
  iconClass: string;
  anos: string[];
  valores: number[];
  onYearClick?: (year: string) => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  iconClass,
  anos,
  valores,
  onYearClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const option = {
    tooltip: {},
    grid: {
      top: 10,
      bottom: 0,
      left: 0,
      right: 0,
      containLabel: true,
    },
    toolbox: {
      show: true,
      orient: "horizontal",
      top: "bottom",
      bottom: "auto",
      right: 10,
      feature: {
        magicType: {
          type: ["line", "bar"],
          title: {
            line: "Switch to Line",
            bar: "Switch to Bar",
          },
        },
        restore: {
          title: "Reset",
        },
        saveAsImage: {
          title: "Save Image",
        },
      },
    },
    xAxis: {
      data: anos,
    },
    yAxis: {},
    series: [
      {
        name: "Contratos",
        type: "bar",
        data: valores,
      },
    ],
  };

  // ✅ define click handler and onEvents
  const handleChartClick = (params: any) => {
    if (params?.name && onYearClick) {
      onYearClick(params.name);
    }
  };

  const onEvents = {
    click: handleChartClick,
  };

  return (
    <BrCard className="dashboard-card p-0">
      <div className="dashboard-card-header">
        <i className={`dashboard-icon ${iconClass}`} aria-hidden="true"></i>
        <div className="dashboard-text">
          <Typography size="down-01" weight="medium">
            {title}
          </Typography>
          <Typography size="down-03" weight="medium">
            {subtitle}
          </Typography>
        </div>
        <BrButton
          circle
          icon="ellipsis-v"
          onClick={() => setCollapsed(!collapsed)}
          className="dashboard-floating-button"
        />
      </div>
      <div className={`chart-wrapper ${collapsed ? "collapsed" : ""}`}>
        <ReactECharts
          option={option}
          onEvents={onEvents}
          style={{ flexGrow: 1, height: 120 }}
        />
      </div>
    </BrCard>
  );
};

export default DashboardCard;
