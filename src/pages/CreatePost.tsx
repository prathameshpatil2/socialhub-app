import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2 } from "lucide-react";

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!content.trim() && !imageUrl.trim()) {
      toast({ title: "Please add some content", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
    });
    if (error) {
      toast({ title: "Error creating post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post created! 🎉" });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="py-4 space-y-4">
        <h1 className="text-2xl font-serif font-bold">Create Post</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] text-base resize-none"
            maxLength={2000}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <ImagePlus size={16} /> Image URL (optional)
            </label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          {imageUrl && (
            <img src={imageUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-xl border" onError={(e) => (e.currentTarget.style.display = "none")} />
          )}
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading && <Loader2 className="animate-spin mr-2" size={18} />}
            Share Post
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default CreatePost;
