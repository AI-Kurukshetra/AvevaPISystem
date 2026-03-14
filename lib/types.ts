export type MachineStatus = "RUNNING" | "WARNING" | "DOWN";

export interface SensorTag {
  tag_name: string;
}

export interface SensorDataPoint {
  id: string;
  sensor_id: string;
  timestamp: string;
  value: number;
  is_anomaly?: boolean;
  sensors?: SensorTag | SensorTag[] | null;
}

export interface MetricCard {
  title: string;
  value: string;
  trend?: string;
  status?: "normal" | "warning" | "danger";
}
