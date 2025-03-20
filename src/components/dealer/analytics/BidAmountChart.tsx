
import { BidAnalyticsData } from "./types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface BidAmountChartProps {
  analyticsData: BidAnalyticsData;
}

export function BidAmountChart({ analyticsData }: BidAmountChartProps) {
  // Prepare data for the bar chart showing bid amounts by car type
  const data = analyticsData.bidsByCarType
    .filter(item => item.count > 0) // Filter out entries with no bids
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .slice(0, 10) // Take top 10 for readability
    .map(item => ({
      name: item.carType,
      count: item.count,
      successRate: item.successRate,
    }));

  const config = {
    count: { 
      label: "Bid Count", 
      theme: { light: "#3B82F6", dark: "#3B82F6" } 
    },
    successRate: { 
      label: "Success Rate (%)", 
      theme: { light: "#4ADE80", dark: "#4ADE80" } 
    }
  };

  return (
    <div className="h-80 w-full">
      <ChartContainer config={config} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
            <YAxis yAxisId="right" orientation="right" stroke="#4ADE80" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar yAxisId="left" dataKey="count" name="Bid Count" fill="#3B82F6" />
            <Bar yAxisId="right" dataKey="successRate" name="Success Rate (%)" fill="#4ADE80" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
