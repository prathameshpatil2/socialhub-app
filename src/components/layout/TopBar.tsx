import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TopBar = () => {
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      return count ?? 0;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-card/80 backdrop-blur-lg">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between px-4">
        <Link to="/" className="text-xl font-serif font-bold text-primary">
          Socialite
        </Link>
        <Link to="/notifications" className="relative p-2 rounded-full hover:bg-accent transition-colors">
          <Bell size={22} className="text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
