import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import PostCard from "@/components/post/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, Settings, UserPlus, UserMinus } from "lucide-react";

const Profile = () => {
  const { userId } = useParams();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // If no userId param, show current user's profile
  const profileId = userId || user?.id;
  const isOwnProfile = !userId || userId === user?.id;

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", profileId).single();
      return data;
    },
    enabled: !!profileId,
  });

  // Fetch user's posts
  const { data: posts = [] } = useQuery({
    queryKey: ["posts", "user", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase
        .from("posts")
        .select("*, profiles:user_id(username, avatar_url), likes(user_id), comments(id)")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!profileId,
  });

  // Fetch follow stats
  const { data: followStats } = useQuery({
    queryKey: ["follow-stats", profileId],
    queryFn: async () => {
      if (!profileId) return { followers: 0, following: 0 };
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
      ]);
      return { followers: followers ?? 0, following: following ?? 0 };
    },
    enabled: !!profileId,
  });

  // Check if current user follows this profile
  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", user?.id, profileId],
    queryFn: async () => {
      if (!user || !profileId || isOwnProfile) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profileId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!profileId && !isOwnProfile,
  });

  const handleFollow = async () => {
    if (!user || !profileId) return;
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profileId });
      await supabase.from("notifications").insert({
        user_id: profileId,
        from_user_id: user.id,
        type: "follow",
      });
    }
    queryClient.invalidateQueries({ queryKey: ["is-following"] });
    queryClient.invalidateQueries({ queryKey: ["follow-stats"] });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      username: username.trim(),
      bio: bio.trim(),
    }).eq("id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
    setSaving(false);
  };

  const startEditing = () => {
    setBio(profile?.bio || "");
    setUsername(profile?.username || "");
    setEditing(true);
  };

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">User not found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-4 space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-3">
          <Avatar className="h-20 w-20 mx-auto">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {profile.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {editing ? (
            <div className="space-y-3 max-w-xs mx-auto">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" maxLength={30} />
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write a bio..." maxLength={200} className="resize-none" />
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                  {saving && <Loader2 size={16} className="animate-spin mr-1" />} Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-serif font-bold">@{profile.username}</h1>
              {profile.bio && <p className="text-sm text-muted-foreground max-w-xs mx-auto">{profile.bio}</p>}
            </>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg">{posts.length}</p>
              <p className="text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{followStats?.followers ?? 0}</p>
              <p className="text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{followStats?.following ?? 0}</p>
              <p className="text-muted-foreground">Following</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-2">
            {isOwnProfile ? (
              <>
                {!editing && (
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Settings size={16} className="mr-1" /> Edit Profile
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut size={16} className="mr-1" /> Sign Out
                </Button>
              </>
            ) : user ? (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
              >
                {isFollowing ? <><UserMinus size={16} className="mr-1" /> Unfollow</> : <><UserPlus size={16} className="mr-1" /> Follow</>}
              </Button>
            ) : null}
          </div>
        </div>

        {/* User's Posts */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg font-serif">Posts</h2>
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No posts yet</p>
          ) : (
            posts.map((post: any) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
