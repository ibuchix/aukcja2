import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BidPatternsChartProps {
  data: Array<{
    hour: number;
    bid_count: number;
  }>;
}

export const BidPatternsChart = ({ data }: BidPatternsChartProps) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="hour" 
            tickFormatter={(hour) => `${hour}:00`}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(hour) => `Time: ${hour}:00`}
            formatter={(value) => [`${value} bids`, "Count"]}
          />
          <Bar dataKey="bid_count" fill="#DC143C" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};