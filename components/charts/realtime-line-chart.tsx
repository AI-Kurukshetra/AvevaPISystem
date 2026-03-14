"use client";

import { Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SensorDataPoint } from "@/lib/types";

interface Props {
  title: string;
  color: string;
  data: SensorDataPoint[];
}

function formatUtcTime(value: string) {
  const date = new Date(value);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function RealtimeLineChart({ title, color, data }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    time: formatUtcTime(point.timestamp)
  }));

  return (
    <div className="h-64 rounded-xl border border-border bg-card/80 p-4">
      <h3 className="mb-2 text-sm text-slate-300">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData}>
          <XAxis dataKey="time" stroke="#6b7a90" tick={{ fontSize: 11 }} />
          <YAxis stroke="#6b7a90" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#0b1320", border: "1px solid #1e2c3f" }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          {chartData
            .filter((point) => point.is_anomaly)
            .map((point) => (
              <ReferenceDot key={point.id} x={point.time} y={point.value} r={5} fill="#ff5d73" stroke="none" />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
