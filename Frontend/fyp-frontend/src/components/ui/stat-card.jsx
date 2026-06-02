import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-card text-card-foreground",
  primary: "stat-card-gradient text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

const iconVariantStyles = {
  default: "bg-secondary text-secondary-foreground",
  primary: "bg-primary-foreground/20 text-primary-foreground",
  accent: "bg-accent-foreground/20 text-accent-foreground",
  warning: "bg-warning-foreground/20 text-warning-foreground",
  destructive: "bg-destructive-foreground/20 text-destructive-foreground",
};

export function StatCard({ title, value, icon: Icon, variant = "default", onClick, className }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg p-5 shadow-card transition-all duration-200", variantStyles[variant], onClick && "cursor-pointer hover:shadow-elevated hover:-translate-y-0.5", className)} onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn("text-sm font-medium", variant === "default" ? "text-muted-foreground" : "opacity-90")}>{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn("rounded-lg p-2.5", iconVariantStyles[variant])}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}
