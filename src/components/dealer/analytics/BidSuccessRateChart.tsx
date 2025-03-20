
import { BidAnalyticsData } from "./types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from "recharts";
import { useState } from "react";

interface BidSuccessRateChartProps {
  analyticsData: BidAnalyticsData;
}

export function BidSuccessRateChart({ analyticsData }: BidSuccessRateChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const data = analyticsData.bidsByStatus.map(item => ({
    name: capitalizeFirstLetter(item.status),
    value: item.count,
    fill: getColorForStatus(item.status)
  }));

  const config = {
    won: { label: "Won", theme: { light: "#4ADE80", dark: "#4ADE80" } },
    active: { label: "Active", theme: { light: "#3B82F6", dark: "#3B82F6" } },
    outbid: { label: "Outbid", theme: { light: "#F97316", dark: "#F97316" } },
    lost: { label: "Lost", theme: { light: "#EF4444", dark: "#EF4444" } },
    pending: { label: "Pending", theme: { light: "#A855F7", dark: "#A855F7" } }
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
          {payload.name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`${value} bids (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="h-80 w-full">
      <ChartContainer config={config} className="h-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend 
            content={<ChartLegendContent />} 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center" 
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getColorForStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'won':
      return "#4ADE80";
    case 'active':
      return "#3B82F6";
    case 'outbid':
      return "#F97316";
    case 'lost':
      return "#EF4444";
    default:
      return "#A855F7";
  }
}
