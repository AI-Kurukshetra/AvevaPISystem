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
      <h3 className="mb-2 text-sm text-muted">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData}>
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--muted)" }}
            tickLine={{ stroke: "var(--muted)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={{ stroke: "var(--muted)" }}
            tickLine={{ stroke: "var(--muted)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
              borderRadius: "8px"
            }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          {chartData
            .filter((point) => point.is_anomaly)
            .map((point) => (
              <ReferenceDot key={point.id} x={point.time} y={point.value} r={5} fill="var(--danger)" stroke="none" />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
