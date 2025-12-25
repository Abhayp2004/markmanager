import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BookmarkCard } from "@/components/BookmarkCard";
import { AddBookmarkModal } from "@/components/AddBookmarkModal";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Bookmark,
  Loader2,
  Sparkles,
  X,
  Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Folder {
  id: string;
  name: string;
}

interface BookmarkType {
  id: string;
  tweet_url: string;
  embed_html: string | null;
  author_name: string | null;
  folder_id: string | null;
  created_at: string;
  tags?: string[];
  content?: string | null;
  notes?: string | null;
  priority?: "normal" | "important" | "pinned" | "reference";
}

const priorityOrder: Record<string, number> = {
  pinned: 0,
  important: 1,
  reference: 2,
  normal: 3,
};

export function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "pinned" | "important" | "reference"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<string[] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchFolders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("folders")
      .select("*")
      .order("created_at");
    setFolders(data || []);
  };

  const fetchBookmarks = async () => {
    if (!user) return;

    let query = supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (selectedFolder) {
      query = query.eq("folder_id", selectedFolder);
    }

    const { data } = await query;
    setBookmarks((data as BookmarkType[]) || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFolders();
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    setSemanticResults(null);
    fetchBookmarks();
  }, [user, selectedFolder]);

  const updatePriority = async (
    id: string,
    priority: "important" | "pinned" | "reference" | "normal"
  ) => {
    // Limit pinned bookmarks to 3
    if (priority === "pinned") {
      const pinnedCount = bookmarks.filter((b) => b.priority === "pinned").length;
      const isAlreadyPinned = bookmarks.find((b) => b.id === id)?.priority === "pinned";
      
      if (pinnedCount >= 3 && !isAlreadyPinned) {
        toast({
          title: "Pin limit reached",
          description: "You can only pin up to 3 bookmarks. Unpin one first.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase
      .from("bookmarks")
      .update({ priority } as any)
      .eq("id", id);
    
    if (!error) {
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, priority } : b))
      );
      toast({
        title: "Priority updated",
        description: `Bookmark marked as ${priority}`,
      });
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleMoveBookmark = async (id: string, folderId: string | null) => {
    await supabase
      .from("bookmarks")
      .update({ folder_id: folderId })
      .eq("id", id);
    fetchBookmarks();
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    await supabase
      .from("bookmarks")
      .update({ notes: notes || null })
      .eq("id", id);

    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, notes } : b))
    );
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
    setSemanticResults(null);
  };

  const getFilteredBookmarks = () => {
    let filtered = [...bookmarks];

    if (priorityFilter !== "all") {
      filtered = filtered.filter((b) => b.priority === priorityFilter);
    }

    if (selectedTag) {
      filtered = filtered.filter((b) => b.tags?.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.tweet_url.toLowerCase().includes(q) ||
          b.author_name?.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q)) ||
          b.content?.toLowerCase().includes(q)
      );
    }

    return filtered.sort(
      (a, b) =>
        (priorityOrder[a.priority || "normal"] ?? 3) -
        (priorityOrder[b.priority || "normal"] ?? 3)
    );
  };

  const filteredBookmarks = getFilteredBookmarks();
  const usedTags = [...new Set(bookmarks.flatMap((b) => b.tags || []))];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onFolderCreated={fetchFolders}
        isOpen={isMobile ? isSidebarOpen : true}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER OMITTED FOR BREVITY — unchanged */}

        {/* Priority filter */}
        <div className="border-b border-border px-4 sm:px-6 py-2 flex gap-2 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "pinned", label: "📌 Pinned" },
            { key: "important", label: "⭐ Important" },
            { key: "reference", label: "🔖 Reference" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setPriorityFilter(item.key as any)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition",
                priorityFilter === item.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  folders={folders}
                  onDelete={handleDeleteBookmark}
                  onMove={handleMoveBookmark}
                  onTagClick={handleTagClick}
                  onUpdateNotes={handleUpdateNotes}
                  onUpdatePriority={updatePriority}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground mt-20">
              No bookmarks found
            </div>
          )}
        </div>

        <AddBookmarkModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          folders={folders}
          selectedFolder={selectedFolder}
          onBookmarkAdded={fetchBookmarks}
        />
      </main>
    </div>
  );
}
