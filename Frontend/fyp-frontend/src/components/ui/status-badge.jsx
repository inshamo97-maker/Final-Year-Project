import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  secondary: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({ variant = "default", children, className }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variantStyles[variant], className)}>
      {children}
    </span>
  );
}
