import { DashboardSidebar } from "./DashboardSidebar";

export function DashboardLayout({
  children,
  userRole,
  userName,
  userId,
  pageTitle,
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar userRole={userRole} userName={userName} userId={userId} />
      
      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 pl-16 lg:pl-6">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{pageTitle}</h1>
          </div>
        </header>
        
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
