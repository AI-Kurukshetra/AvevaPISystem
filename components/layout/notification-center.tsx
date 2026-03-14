"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type AlertItem = {
  id: string;
  created_at: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  priority?: "P1" | "P2" | "P3";
};

export function NotificationCenter({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [seenIds, setSeenIds] = useState<Record<string, true>>({});

  async function loadAlerts() {
    const response = await fetch("/api/alerts");
    const body = await response.json();
    if (!response.ok) {
      return;
    }
    setAlerts((body.data ?? []).slice(0, 20));
  }

  useEffect(() => {
    void loadAlerts();

    const channel = supabase
      .channel("notification-center-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        void loadAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSeenIds((current) => {
      const next = { ...current };
      for (const alert of alerts) {
        next[alert.id] = true;
      }
      return next;
    });
  }, [alerts, open]);

  const unreadCount = useMemo(() => alerts.filter((alert) => !seenIds[alert.id]).length, [alerts, seenIds]);

  return (
    <div className={cn("relative z-[60]", compact ? "w-8 md:w-9" : "w-11")}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open notifications"
        className={cn(
          "relative flex items-center justify-center rounded-full border border-border bg-surface/95 text-foreground shadow-lg transition-colors hover:bg-surface",
          compact ? "h-8 w-8 md:h-9 md:w-9" : "h-11 w-11"
        )}
      >
        <Bell className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-danger px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-2xl ring-1 ring-white/10 backdrop-blur-md",
            compact ? "top-10 right-0 md:top-11 md:left-0 md:right-auto" : "top-12 right-0"
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notification Center</h3>
            <p className="text-xs text-muted">Live alert updates</p>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {alerts.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted">No notifications yet.</p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "mb-2 rounded-lg border px-3 py-2",
                    seenIds[alert.id] ? "border-border/60 bg-card" : "border-accent/40 bg-accent/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-foreground/80">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      {alert.priority ?? "P3"} • {alert.severity}
                    </span>
                    <span className="text-muted">{new Date(alert.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
