import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/timeago";

const iconMap: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

const textMap: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
};

const Notifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("notifications")
        .select("*, from_profile:from_user_id(username)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user,
  });

  // Mark all as read on mount
  useEffect(() => {
    if (!user) return;
    const markRead = async () => {
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
    };
    markRead();
  }, [user, queryClient]);

  return (
    <AppLayout>
      <div className="py-4 space-y-4">
        <h1 className="text-2xl font-serif font-bold">Notifications</h1>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">No notifications yet</p>
        ) : (
          <div className="space-y-1">
            {notifications.map((n: any) => {
              const Icon = iconMap[n.type] || Heart;
              return (
                <Link
                  key={n.id}
                  to={n.type === "follow" ? `/profile/${n.from_user_id}` : `/`}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${n.read ? "hover:bg-accent" : "bg-accent hover:bg-accent/80"}`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {(n.from_profile as any)?.username?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{(n.from_profile as any)?.username ?? "Someone"}</span>{" "}
                      {textMap[n.type] ?? "interacted"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                  </div>
                  <Icon size={18} className="text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
