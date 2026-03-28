import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";

const SearchUsers = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url")
      .ilike("username", `%${value.trim()}%`)
      .limit(20);
    setResults(data ?? []);
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="py-4 space-y-4">
        <h1 className="text-2xl font-serif font-bold">Search</h1>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No users found</p>
        )}

        <div className="space-y-2">
          {results.map((u) => (
            <Link
              key={u.id}
              to={`/profile/${u.id}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {u.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm">@{u.username}</p>
                {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default SearchUsers;
