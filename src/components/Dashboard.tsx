import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { BookmarkCard } from "@/components/BookmarkCard";
import { AddBookmarkModal } from "@/components/AddBookmarkModal";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Bookmark, Loader2, Sparkles, X, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

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
}

const AVAILABLE_TAGS = [
  "tech",
  "ai",
  "crypto",
  "sports",
  "funny",
  "news",
  "politics",
  "science",
  "business",
  "lifestyle",
  "entertainment",
  "education",
  "health",
  "art",
  "music",
  "gaming",
  "travel",
  "food",
  "spiritual",
  "motivation",
];

export function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<string[] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchFolders = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("folders").select("*").order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching folders:", error);
    } else {
      setFolders(data || []);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;

    let query = supabase.from("bookmarks").select("*").order("created_at", { ascending: false });

    if (selectedFolder) {
      query = query.eq("folder_id", selectedFolder);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching bookmarks:", error);
    } else {
      setBookmarks(data || []);
    }
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

  const performSemanticSearch = useCallback(async () => {
    if (!searchQuery.trim() || bookmarks.length === 0) {
      setSemanticResults(null);
      return;
    }

    setIsSemanticSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-bookmarks", {
        body: {
          action: "semantic-search",
          query: searchQuery,
          bookmarks: bookmarks.map((b) => ({
            id: b.id,
            author_name: b.author_name,
            tweet_url: b.tweet_url,
            tags: b.tags,
            content: b.content,
          })),
        },
      });

      if (error) throw error;
      setSemanticResults(data.results || []);
    } catch (error) {
      console.error("Semantic search error:", error);
      toast({
        title: "Search error",
        description: "AI search failed, showing text matches instead",
        variant: "destructive",
      });
      setSemanticResults(null);
    } finally {
      setIsSemanticSearching(false);
    }
  }, [searchQuery, bookmarks, toast]);

  // Debounced semantic search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSemanticResults(null);
      return;
    }

    const timer = setTimeout(() => {
      performSemanticSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, performSemanticSearch]);

  const handleDeleteBookmark = async (id: string) => {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete bookmark",
        variant: "destructive",
      });
    } else {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      toast({
        title: "Deleted",
        description: "Bookmark has been removed",
      });
    }
  };

  const handleMoveBookmark = async (id: string, folderId: string | null) => {
    const { error } = await supabase.from("bookmarks").update({ folder_id: folderId }).eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to move bookmark",
        variant: "destructive",
      });
    } else {
      fetchBookmarks();
      toast({
        title: "Moved",
        description: folderId ? "Bookmark moved to folder" : "Bookmark removed from folder",
      });
    }
  };

  const handleRetagBookmark = async (bookmark: BookmarkType) => {
    toast({ title: "Analyzing...", description: "AI is categorizing this bookmark" });

    try {
      const { data, error } = await supabase.functions.invoke("ai-bookmarks", {
        body: {
          action: "analyze",
          content: bookmark.content,
          tweetUrl: bookmark.tweet_url,
        },
      });

      if (error) throw error;

      const newTags = data.tags || ["other"];

      await supabase
        .from("bookmarks")
        .update({ tags: newTags, content: data.summary || bookmark.content })
        .eq("id", bookmark.id);

      fetchBookmarks();
      toast({
        title: "Tagged",
        description: `Updated tags: ${newTags.join(", ")}`,
      });
    } catch (error) {
      console.error("Retag error:", error);
      toast({
        title: "Error",
        description: "Failed to analyze bookmark",
        variant: "destructive",
      });
    }
  };

  const handleRetagAll = async () => {
    const untaggedBookmarks = bookmarks.filter((b) => !b.tags || b.tags.length === 0);
    if (untaggedBookmarks.length === 0) {
      toast({ title: "All bookmarks are tagged" });
      return;
    }

    toast({ title: "Analyzing...", description: `Tagging ${untaggedBookmarks.length} bookmarks` });

    for (const bookmark of untaggedBookmarks) {
      await handleRetagBookmark(bookmark);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .update({ notes: notes || null })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } else {
      setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, notes: notes || null } : b)));
      toast({
        title: "Note saved",
        description: "Your note has been updated",
      });
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
    setSemanticResults(null);
  };

  // Get filtered bookmarks
  const getFilteredBookmarks = () => {
    let filtered = bookmarks;

    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter((b) => b.tags?.includes(selectedTag));
    }

    // Filter by semantic search results or text search
    if (searchQuery.trim()) {
      if (semanticResults !== null) {
        filtered = filtered.filter((b) => semanticResults.includes(b.id));
      } else {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.tweet_url.toLowerCase().includes(search) ||
            b.author_name?.toLowerCase().includes(search) ||
            b.tags?.some((t) => t.toLowerCase().includes(search)) ||
            b.content?.toLowerCase().includes(search),
        );
      }
    }

    return filtered;
  };

  const filteredBookmarks = getFilteredBookmarks();
  const currentFolder = folders.find((f) => f.id === selectedFolder);

  // Get unique tags from all bookmarks
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

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-0 sm:h-16 shrink-0 gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 sm:flex-none">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">
                {currentFolder ? currentFolder.name : "All Bookmarks"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? "s" : ""}
                {selectedTag && ` tagged "${selectedTag}"`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-72">
              {isSemanticSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
              ) : (
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              )}
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="AI-powered search..."
                className="w-full sm:w-72 pl-10 bg-secondary text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSemanticResults(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {bookmarks.some((b) => !b.tags || b.tags.length === 0) && (
              <Button variant="outline" onClick={handleRetagAll} size="sm" className="hidden sm:flex">
                <Sparkles className="h-4 w-4 mr-2" />
                Tag All
              </Button>
            )}
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="flex-shrink-0">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Bookmark</span>
            </Button>
          </div>
        </header>

        {/* Tag filter bar */}
        {usedTags.length > 0 && (
          <div className="border-b border-border px-4 sm:px-6 py-2 sm:py-3 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2 flex-wrap min-w-max sm:min-w-0">
              <span className="text-xs text-muted-foreground mr-2 whitespace-nowrap">Filter by tag:</span>
              {usedTags.map((tag) => (
                <TagBadge key={tag} tag={tag} active={selectedTag === tag} onClick={() => handleTagClick(tag)} />
              ))}
              {selectedTag && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedTag(null)} className="h-6 text-xs whitespace-nowrap">
                  Clear filter
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBookmarks.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBookmarks.map((bookmark, index) => (
                <div key={bookmark.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <BookmarkCard
                    bookmark={bookmark}
                    folders={folders}
                    onDelete={handleDeleteBookmark}
                    onMove={handleMoveBookmark}
                    onTagClick={handleTagClick}
                    onRetag={handleRetagBookmark}
                    onUpdateNotes={handleUpdateNotes}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Bookmark className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {searchQuery || selectedTag ? "No bookmarks found" : "No bookmarks yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                {searchQuery || selectedTag
                  ? "Try adjusting your search or filter"
                  : "Start by adding your first tweet bookmark using the button above"}
              </p>
              {!searchQuery && !selectedTag && (
                <Button onClick={() => setIsAddModalOpen(true)} className="mt-4" variant="glow">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first bookmark
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border px-4 sm:px-6 py-2 sm:py-3 shrink-0">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Created by{" "}
            <a
              href="https://x.com/abhxy03"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Abhay Parekh
            </a>
          </p>
        </footer>
      </main>

      <AddBookmarkModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        folders={folders}
        selectedFolder={selectedFolder}
        onBookmarkAdded={fetchBookmarks}
      />
    </div>
  );
}
