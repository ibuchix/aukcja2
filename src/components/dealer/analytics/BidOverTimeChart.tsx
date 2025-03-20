
import { BidAnalyticsData } from "./types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface BidOverTimeChartProps {
  analyticsData: BidAnalyticsData;
}

export function BidOverTimeChart({ analyticsData }: BidOverTimeChartProps) {
  // Format the date for better display
  const data = analyticsData.bidOverTime.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

  const config = {
    count: { 
      label: "Bid Count", 
      theme: { light: "#3B82F6", dark: "#3B82F6" } 
    },
    amount: { 
      label: "Avg. Bid Amount ($)", 
      theme: { light: "#4ADE80", dark: "#4ADE80" } 
    }
  };

  return (
    <div className="h-80 w-full">
      <ChartContainer config={config} className="h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
            <YAxis yAxisId="right" orientation="right" stroke="#4ADE80" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              name="Bid Count"
              stroke="#3B82F6"
              activeDot={{ r: 8 }}
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="amount" 
              name="Avg. Bid Amount ($)" 
              stroke="#4ADE80" 
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
