import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

const colors = [
  "#8b5cf6",
  "#06b6d4"
];

export function TrendChart({
  data
}) {
  return (
    <div className="chart-card">

      <div className="chart-header">
        RMA Trend
      </div>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />

          <Line
            type="monotone"
            dataKey="rma"
            stroke="#8b5cf6"
            strokeWidth={4}
          />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}

export function WarrantyChart({
  data
}) {
  return (
    <div className="chart-card">

      <div className="chart-header">
        Warranty Status
      </div>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            outerRadius={100}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={colors[index]}
              />
            ))}
          </Pie>

          <Tooltip />

        </PieChart>
      </ResponsiveContainer>

    </div>
  );
}

export function TechnicianChart({
  data
}) {
  return (
    <div className="chart-card">

      <div className="chart-header">
        Technician Performance
      </div>

      <ResponsiveContainer
        width="100%"
        height={300}
      >
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />

          <Bar
            dataKey="jobs"
            fill="#8b5cf6"
            radius={[8,8,0,0]}
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}