import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bell, CheckCheck, Trash2, FileText, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { formatDateTime } from "../../../lib/utils";

interface NotificationsPageProps {
  userRole?: "business_owner" | "tourism_staff" | "admin";
}

const roleNotifications = {
  business_owner: [
    {
      id: 1,
      type: "update",
      icon: FileText,
      title: "Application Under Review",
      message: "Your application APP-2026-001 is now under review by tourism staff",
      timestamp: "2026-05-11T14:15:00",
      read: false,
      color: "blue",
    },
    {
      id: 2,
      type: "success",
      icon: CheckCircle,
      title: "Documents Verified",
      message: "All required documents for APP-2026-001 have been verified successfully",
      timestamp: "2026-05-11T16:30:00",
      read: false,
      color: "green",
    },
    {
      id: 3,
      type: "warning",
      icon: Clock,
      title: "Site Inspection Scheduled",
      message: "On-site inspection scheduled for May 15, 2026 at 10:00 AM",
      timestamp: "2026-05-12T09:00:00",
      read: false,
      color: "orange",
    },
    {
      id: 4,
      type: "info",
      icon: Bell,
      title: "Renewal Reminder",
      message: "Your accreditation for Mountain View Inn will expire in 30 days",
      timestamp: "2026-05-10T08:00:00",
      read: true,
      color: "blue",
    },
    {
      id: 5,
      type: "success",
      icon: CheckCircle,
      title: "Application Approved",
      message: "Congratulations! Your renewal application APP-2025-042 has been approved",
      timestamp: "2026-05-01T11:20:00",
      read: true,
      color: "green",
    },
  ],
  tourism_staff: [
    {
      id: 1,
      type: "update",
      icon: FileText,
      title: "New Application Submitted",
      message: "APP-2026-006 from Ocean Breeze Hotel is ready for review.",
      timestamp: "2026-05-14T10:15:00",
      read: false,
      color: "blue",
    },
    {
      id: 2,
      type: "warning",
      icon: AlertCircle,
      title: "Revision Response Received",
      message: "Sunset Beach Resort uploaded a revised barangay clearance.",
      timestamp: "2026-05-14T09:30:00",
      read: false,
      color: "orange",
    },
    {
      id: 3,
      type: "success",
      icon: CheckCircle,
      title: "Application Approved",
      message: "ACC-2026-045 was issued for Sunset Beach Resort.",
      timestamp: "2026-05-13T16:10:00",
      read: true,
      color: "green",
    },
  ],
  admin: [
    {
      id: 1,
      type: "warning",
      icon: AlertCircle,
      title: "Inactive Staff Account",
      message: "Ana Reyes has been inactive since April 20, 2026. Review account access if needed.",
      timestamp: "2026-05-14T08:30:00",
      read: false,
      color: "orange",
    },
    {
      id: 2,
      type: "update",
      icon: Bell,
      title: "New User Added",
      message: "A Tourism Officer account was created by the system administrator.",
      timestamp: "2026-05-13T15:45:00",
      read: false,
      color: "blue",
    },
    {
      id: 3,
      type: "success",
      icon: CheckCircle,
      title: "Role Permissions Updated",
      message: "Permission settings for Tourism Staff were saved successfully.",
      timestamp: "2026-05-12T11:20:00",
      read: true,
      color: "green",
    },
    {
      id: 4,
      type: "update",
      icon: FileText,
      title: "Audit Log Export Ready",
      message: "The latest system audit export is available for download.",
      timestamp: "2026-05-11T17:05:00",
      read: true,
      color: "blue",
    },
  ],
};

export function NotificationsPage({
  userRole = "business_owner",
}: NotificationsPageProps) {
  const [notifications, setNotifications] = useState(
    roleNotifications[userRole]
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );
  };

  const handleMarkRead = (id: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleRemove = (id: number) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== id)
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <Trash2 className="size-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                  !notification.read
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'border-border hover:bg-accent'
                }`}
              >
                <div
                  className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${
                    notification.color === 'blue'
                      ? 'bg-blue-100 text-blue-600'
                      : notification.color === 'green'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  <Icon className="size-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium">{notification.title}</h4>
                    {!notification.read && (
                      <Badge variant="review" className="shrink-0">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(notification.timestamp)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <CheckCheck className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(notification.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {notifications.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No notifications to show.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
