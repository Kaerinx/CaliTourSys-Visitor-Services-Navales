import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TopNavProps {
  userName: string;
  userRole: string;
  notificationCount?: number;
  onMenuClick?: () => void;
  onNotificationsClick?: () => void;
}

export function TopNav({
  userName,
  userRole,
  notificationCount = 0,
  onMenuClick,
  onNotificationsClick,
}: TopNavProps) {
  return (
    <div className="h-16 border-b border-border bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search applications, businesses..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative" onClick={onNotificationsClick}>
          <Bell className="size-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center size-5 rounded-full bg-destructive text-white text-xs">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userRole}</p>
          </div>
          <div className="flex items-center justify-center size-9 rounded-full bg-[var(--color-gov-blue)] text-white">
            <User className="size-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
