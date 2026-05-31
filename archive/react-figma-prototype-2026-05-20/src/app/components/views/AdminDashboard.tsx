import { StatCard } from "../StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  Download,
  FileCheck,
  Lock,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

const securityAlerts = [
  {
    title: "Failed login attempt",
    description: "Ana Reyes had a failed login attempt today.",
    severity: "High",
  },
  {
    title: "Inactive staff account",
    description: "Ana Reyes has been inactive since April 20, 2026.",
    severity: "Medium",
  },
  {
    title: "Role permissions changed",
    description: "Tourism Staff permissions were updated by Admin User.",
    severity: "Medium",
  },
];

const recentActivity = [
  {
    id: "AUD-2026-1057",
    action: "Updated role permissions",
    actor: "Admin User",
    time: "May 14, 2026 4:45 PM",
  },
  {
    id: "AUD-2026-1056",
    action: "Approved APP-2026-001",
    actor: "Maria Santos",
    time: "May 14, 2026 3:20 PM",
  },
  {
    id: "AUD-2026-1055",
    action: "Failed login attempt",
    actor: "Ana Reyes",
    time: "May 14, 2026 1:05 PM",
  },
];

const roleSummary = [
  { role: "Business Owner", users: 1, status: "Self-service" },
  { role: "Tourism Staff", users: 2, status: "Managed" },
  { role: "Tourism Officer", users: 1, status: "Managed" },
  { role: "System Administrator", users: 1, status: "Protected" },
];

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1>System Administrator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system access, security alerts, and administrative activity
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onNavigate("audit")}>
            <ClipboardList className="size-4 mr-2" />
            View Audit Logs
          </Button>
          <Button onClick={() => onNavigate("users")}>
            <UserPlus className="size-4 mr-2" />
            Add New User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="5" icon={Users} color="blue" />
        <StatCard title="Active Users" value="4" icon={FileCheck} color="green" />
        <StatCard
          title="Security Alerts"
          value="3"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard title="Admin Changes" value="7" icon={Shield} color="orange" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Security and Access Alerts</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("notifications")}
            >
              <Bell className="size-4 mr-2" />
              Notifications
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {securityAlerts.map((alert) => (
              <div
                key={alert.title}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Lock className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={alert.severity === "High" ? "rejected" : "pending"}
                  className="shrink-0"
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => onNavigate("users")}
            >
              <Users className="size-4 mr-2" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => onNavigate("roles")}
            >
              <Shield className="size-4 mr-2" />
              Manage Roles
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => onNavigate("audit")}
            >
              <ClipboardList className="size-4 mr-2" />
              Review Logs
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="size-4 mr-2" />
              Export Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Role Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleSummary.map((item) => (
              <div
                key={item.role}
                className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{item.role}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.users} user{item.users !== 1 ? "s" : ""}
                  </p>
                </div>
                <Badge variant="default">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent System Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("audit")}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-border p-4 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.id} by {activity.actor}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground md:text-right">
                  {activity.time}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
