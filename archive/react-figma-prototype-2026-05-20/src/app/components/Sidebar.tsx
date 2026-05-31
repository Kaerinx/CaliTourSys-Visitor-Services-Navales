import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Bell,
  RefreshCw,
  Settings,
  Users,
  FileCheck,
  BarChart3,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
  userRole: "business_owner" | "tourism_staff" | "admin";
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

const businessOwnerMenu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "business-profile", label: "Business Profile", icon: Building2 },
  { id: "apply", label: "Apply for Accreditation", icon: FileText },
  { id: "applications", label: "My Applications", icon: FileCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "renewal", label: "Renewal", icon: RefreshCw },
  { id: "settings", label: "Account Settings", icon: Settings },
];

const tourismStaffMenu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "applications", label: "Applications", icon: FileText },
  { id: "records", label: "Accreditation Records", icon: Building2 },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Account Settings", icon: Settings },
];

const adminMenu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: Users },
  { id: "roles", label: "Role Management", icon: Shield },
  { id: "audit", label: "Audit Logs", icon: FileCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "System Settings", icon: Settings },
];

export function Sidebar({ userRole, currentView, onNavigate, onLogout }: SidebarProps) {
  const menu =
    userRole === "business_owner"
      ? businessOwnerMenu
      : userRole === "tourism_staff"
      ? tourismStaffMenu
      : adminMenu;

  return (
    <div className="flex flex-col h-full bg-white border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-lg bg-[var(--color-gov-blue)]">
            <Building2 className="size-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg">LGU Tourism</h2>
            <p className="text-xs text-muted-foreground">
              Accreditation System
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                    {
                      "bg-[var(--color-gov-blue)] text-white": isActive,
                      "text-foreground hover:bg-accent": !isActive,
                    }
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="size-5 mr-3" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
