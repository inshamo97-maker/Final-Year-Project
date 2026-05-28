import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, AlertTriangle, Building2, Users, LogOut,
  FileText, Grid3X3, Eye, Menu, BookOpen, Bell,
  ShieldAlert, Server,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { logout as apiLogout } from "@/services/api";

const invigilatorNavItems = [
  { to: "/invigilator/dashboard",  icon: LayoutDashboard, label: "Dashboard"         },
  { to: "/invigilator/alerts",     icon: Bell,            label: "Alerts"            },
  { to: "/invigilator/violations", icon: ShieldAlert,     label: "Violations"        },
  { to: "/invigilator/exam-halls", icon: Building2,       label: "Exam Hall Details" },
  { to: "/invigilator/students",   icon: Users,           label: "Student List"      },
];

const adminNavItems = [
  { to: "/admin/dashboard",    icon: LayoutDashboard, label: "Overview"      },
  { to: "/admin/invigilators", icon: Users,           label: "Invigilators"  },
  { to: "/admin/students",     icon: Users,           label: "Students"      },
  { to: "/admin/schedule",     icon: BookOpen,        label: "Exam Schedule" },
  { to: "/admin/hardware",     icon: Server,          label: "Hardware"      },
  { to: "/admin/violations",   icon: ShieldAlert,     label: "Violations"    },
  { to: "/admin/alerts",       icon: Bell,            label: "Alerts"        },
  { to: "/admin/seating",      icon: Grid3X3,         label: "Seating Plan"  },
  { to: "/admin/reports",      icon: FileText,        label: "Reports"       },
];
function SidebarContent({ userRole, userName, userId, onNavigate }) {
  const navigate = useNavigate();
  const navItems = userRole === "admin" ? adminNavItems : invigilatorNavItems;

  const handleLogout = () => {
    apiLogout();
    onNavigate?.();
    navigate("/");
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
          <Eye className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">EYESON AI</h1>
          <p className="text-xs text-sidebar-foreground/60">Exam Proctoring</p>
        </div>
      </div>

      {/* User */}
      <div className="border-b border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-sidebar-primary/30">
            <AvatarImage src="" />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium">
              {(userName || "U").split(" ").map((n) => n[0]).filter(Boolean).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName || "User"}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole || ""}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar({ userRole, userName, userId }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background shadow-md">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent
              userRole={userRole}
              userName={userName}
              userId={userId}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 lg:flex lg:flex-col">
        <SidebarContent userRole={userRole} userName={userName} userId={userId} />
      </aside>
    </>
  );
}