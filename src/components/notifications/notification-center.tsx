"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, MailOpen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/notification-actions";
import { formatDistanceToNow } from "date-fns";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev].slice(0, 10));
          setUnreadCount((count) => count + 1);

          // Browser notification if supported
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(payload.new.title, { body: payload.new.message });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative rounded-full hover:bg-muted group"
        )}
      >
        <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in duration-300">
            {unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-2xl shadow-2xl border-primary/10 overflow-hidden"
        align="end"
      >
        <div className="p-4 bg-primary text-white flex items-center justify-between">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full font-bold transition-colors flex items-center gap-1"
            >
              <MailOpen className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b border-muted last:border-none hover:bg-muted/30 transition-colors relative flex gap-3 ${!n.is_read ? "bg-primary/[0.03]" : ""}`}
              >
                {!n.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}
                <div
                  className={`mt-1 p-2 rounded-xl shrink-0 ${!n.is_read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4
                      className={`text-xs font-bold leading-tight ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {n.title}
                    </h4>
                    <span 
                      className="text-[10px] text-muted-foreground whitespace-nowrap ml-2"
                      suppressHydrationWarning
                    >
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {n.message}
                  </p>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="text-[10px] text-primary font-bold hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-muted/20 text-center border-t border-muted">
          <button className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">
            View all notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
