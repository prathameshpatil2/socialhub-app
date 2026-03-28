import { useState } from "react";
import { Heart, MessageCircle, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/timeago";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CommentSection from "./CommentSection";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    created_at: string;
    profiles: { username: string; avatar_url: string | null };
    likes: { user_id: string }[];
    comments: { id: string }[];
  };
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLiked = post.likes?.some((l) => l.user_id === user?.id) ?? false;
  const likeCount = post.likes?.length ?? 0;
  const commentCount = post.comments?.length ?? 0;

  const handleLike = async () => {
    if (!user) return;
    if (isLiked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", post.id);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: post.id });
      // Create notification if not own post
      if (post.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          from_user_id: user.id,
          type: "like",
          post_id: post.id,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const handleDelete = async () => {
    if (!user || post.user_id !== user.id) return;
    setDeleting(true);
    await supabase.from("posts").delete().eq("id", post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    toast({ title: "Post deleted" });
    setDeleting(false);
  };

  return (
    <div className="bg-card rounded-2xl border shadow-sm animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Link to={`/profile/${post.user_id}`}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {post.profiles?.username?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.user_id}`} className="font-semibold text-sm hover:underline">
            {post.profiles?.username ?? "unknown"}
          </Link>
          <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
        </div>
        {user?.id === post.user_id && (
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={deleting} className="text-muted-foreground hover:text-destructive">
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
          </Button>
        )}
      </div>

      {/* Content */}
      {post.content && <p className="px-4 pb-2 text-sm leading-relaxed">{post.content}</p>}
      {post.image_url && (
        <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2 border-t">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
            isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
          )}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
          <span className="font-medium">{likeCount}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle size={18} />
          <span className="font-medium">{commentCount}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} postOwnerId={post.user_id} />}
    </div>
  );
};

export default PostCard;
