
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis } from "recharts";
import { ChartDataPoint } from "./useBidHistory";

interface BidChartProps {
  chartData: ChartDataPoint[];
}

export const BidChart = ({ chartData }: BidChartProps) => {
  if (chartData.length <= 1) {
    return null;
  }

  return (
    <div className="h-48 w-full">
      <ChartContainer
        config={{
          bidLine: {
            theme: {
              light: "#0284c7",
              dark: "#38bdf8"
            }
          }
        }}
      >
        <LineChart data={chartData}>
          <XAxis 
            dataKey="time" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent 
                formatter={(value: any, name: any) => [
                  `$${value}`, 
                  "Bid Amount"
                ]}
              />
            }
          />
          <Line 
            type="monotone" 
            dataKey="amount" 
            strokeWidth={2} 
            name="bidLine"
            dot={{ 
              stroke: "#0284c7", 
              strokeWidth: 2,
              r: 4
            }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};
