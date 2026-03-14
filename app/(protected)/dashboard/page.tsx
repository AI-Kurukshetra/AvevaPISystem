import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { supabaseServer } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const [{ data: sensorData }, { count: alertCount }, { data: sensors }, { data: recentAlerts }] = await Promise.all([
    supabaseServer
      .from("sensor_data")
      .select("id, sensor_id, timestamp, value, is_anomaly")
      .order("timestamp", { ascending: false })
      .limit(400),
    supabaseServer.from("alerts").select("id", { count: "exact", head: true }).eq("status", "OPEN"),
    supabaseServer.from("sensors").select("id, tag_name"),
    supabaseServer.from("alerts").select("id, message, severity, created_at, status, sensor_id").order("created_at", { ascending: false }).limit(20)
  ]);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Realtime Industrial Dashboard</h2>
      <ClientDashboard
        initialData={(sensorData ?? []).reverse()}
        initialAlerts={alertCount ?? 0}
        sensorTags={sensors ?? []}
        initialTimelineAlerts={recentAlerts ?? []}
      />
    </div>
  );
}
