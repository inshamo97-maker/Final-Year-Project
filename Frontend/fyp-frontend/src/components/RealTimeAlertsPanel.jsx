import { Bell } from "lucide-react";

const fmt = (ts) => (ts ? new Date(ts).toLocaleString() : "—");

export default function RealTimeAlertsPanel({ alerts }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-5 w-5 text-warning" />
        <h3 className="text-base font-semibold">Real-time AI Alerts</h3>
      </div>

      <div className="space-y-2 max-h-72 overflow-auto">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Waiting for incoming alerts...</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.event_id || alert.id || `${alert.type}-${alert.timestamp}`}
              className="rounded-md border border-border p-3 bg-muted/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{alert.type || "unknown"}</p>
                {alert.severity ? (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-background border border-border">
                    {String(alert.severity).toUpperCase()}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {fmt(alert.timestamp)} • Hall: {alert.hall_id ?? alert.hallId ?? "—"} •{" "}
                {alert.status ? `Status: ${alert.status}` : "Status: —"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
