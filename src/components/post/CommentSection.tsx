import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Send, Loader2 } from "lucide-react";
import { timeAgo } from "@/lib/timeago";
import { Link } from "react-router-dom";

interface CommentSectionProps {
  postId: string;
  postOwnerId: string;
}

const CommentSection = ({ postId, postOwnerId }: CommentSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles:user_id(username)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setSubmitting(true);
    await supabase.from("comments").insert({ user_id: user.id, post_id: postId, text: text.trim() });
    // Notification
    if (postOwnerId !== user.id) {
      await supabase.from("notifications").insert({
        user_id: postOwnerId,
        from_user_id: user.id,
        type: "comment",
        post_id: postId,
      });
    }
    setText("");
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  return (
    <div className="border-t px-4 py-3 space-y-3">
      {isLoading && <p className="text-xs text-muted-foreground">Loading comments...</p>}
      {comments.map((c: any) => (
        <div key={c.id} className="flex items-start gap-2 group">
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <Link to={`/profile/${c.user_id}`} className="font-semibold hover:underline mr-1.5">
                {c.profiles?.username ?? "user"}
              </Link>
              {c.text}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(c.created_at)}</p>
          </div>
          {user?.id === c.user_id && (
            <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-9 text-sm"
            maxLength={500}
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={submitting || !text.trim()}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </form>
      )}
    </div>
  );
};

export default CommentSection;
