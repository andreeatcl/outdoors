import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function ProfileCharts({ pieData, timelineData }) {
  return (
    <>
      {pieData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-base text-text-primary mb-4">
            Distribuție activitate după tipul evenimentului
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${v}`}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E7E5E4",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ fontSize: 12, color: "#78716C" }}>{v}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {timelineData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-base text-text-primary mb-4">
            Activitate în ultima lună
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timelineData}>
              <CartesianGrid stroke="#E7E5E4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#78716C" }}
                axisLine={{ stroke: "#E7E5E4" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#78716C" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E7E5E4",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => (
                  <span style={{ fontSize: 12, color: "#78716C" }}>{v}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="created"
                name="Create"
                stroke="#F97316"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="participations"
                name="Participări"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total evenimente"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
