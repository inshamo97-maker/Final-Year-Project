export function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <span className="h-6 w-6 mr-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label}
    </div>
  );
}
