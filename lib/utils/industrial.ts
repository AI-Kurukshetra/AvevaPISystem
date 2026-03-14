import { SensorDataPoint } from "@/lib/types";

export function detectAnomaly(points: SensorDataPoint[], currentValue: number): boolean {
  if (points.length < 5) return false;

  const rollingWindow = points.slice(-10);
  const avg = rollingWindow.reduce((acc, p) => acc + p.value, 0) / rollingWindow.length;
  const deviation = Math.abs(currentValue - avg) / (avg || 1);

  return deviation > 0.2;
}

export function calculateOEE({
  availability,
  performance,
  quality
}: {
  availability: number;
  performance: number;
  quality: number;
}) {
  return availability * performance * quality;
}

export function randomInRange(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}
