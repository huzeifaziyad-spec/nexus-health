
import { Bell, Check, Clock } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-8 h-auto py-1" 
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.$id}
                  className={cn(
                    "relative flex flex-col gap-1 p-4 text-sm transition-colors hover:bg-accent cursor-pointer",
                    !notification.isRead && "bg-accent/40"
                  )}
                  onClick={() => !notification.isRead && markAsRead(notification.$id)}
                >
                  {!notification.isRead && (
                    <span className="absolute left-2 top-4 flex h-2 w-2 rounded-full bg-primary" />
                  )}
                  <div className="flex items-start justify-between gap-2 pl-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold leading-none">
                        {notification.title}
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">
                      {formatDistanceToNow(new Date(notification.$createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {notification.link && (
                    <Link 
                      to={notification.link} 
                      className="absolute inset-0 z-0"
                      onClick={(e) => {
                        if (!notification.isRead) markAsRead(notification.$id);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2">
           <Button variant="ghost" className="w-full text-xs" size="sm">
             View all notifications
           </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
