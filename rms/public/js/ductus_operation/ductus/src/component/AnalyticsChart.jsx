import {
  AreaChart,
  Area,
  ResponsiveContainer
} from "recharts";
import GlassCard from "./GlassCard";

const data = [
  { value: 20 },
  { value: 25 },
  { value: 30 },
  { value: 28 },
  { value: 40 },
  { value: 35 },
  { value: 48 },
  { value: 60 },
  { value: 55 },
  { value: 70 }
];

export default function AnalyticsChart() {
  return (
    <GlassCard className="analytics-card">
      <h3>Repair Performance</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient
                id="color"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#4f8cff"
                  stopOpacity={0.4}
                />
                <stop
                  offset="100%"
                  stopColor="#8b5cf6"
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="#4f8cff"
              strokeWidth={2}
              fill="url(#color)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}