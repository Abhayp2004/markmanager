import { useState, useEffect } from "react";
import mediumLogo from '@/assets/medium_logo.jpg';
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { AnimatedCard } from "@/components/AnimatedCard";
import { BookmarkCard } from "@/components/BookmarkCard";
import { YouTubeCard } from "@/components/YouTubeCard";
import { RedditCard } from "@/components/RedditCard";
import { VaultCard } from "@/components/VaultCard";
import { MediumCard } from "@/components/MediumCard";
import { AddBookmarkModal } from "@/components/AddBookmarkModal";
import { BulkImportModal } from "@/components/BulkImportModal";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Bookmark,
  Loader2,
  X,
  Menu,
  Play,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Platform, PLATFORM_CONFIG, Bookmark as BookmarkType, Folder, Highlight } from "@/types/bookmark";

// Helper to parse highlights from JSON
const parseBookmarks = (data: any[]): BookmarkType[] => {
  return data.map(item => ({
    ...item,
    highlights: Array.isArray(item.highlights) ? item.highlights as Highlight[] : [],
  }));
};

const priorityOrder: Record<string, number> = {
  pinned: 0,
  important: 1,
  reference: 2,
  normal: 3,
};

const PLATFORM_HEADER_ICONS: Record<Platform, React.ReactNode> = {
  twitter: <span className="text-xl">𝕏</span>,
  youtube: <Play className="h-6 w-6 text-red-500" fill="currentColor" />,
  reddit: <span className="text-xl">🔴</span>,
  medium: <img src={mediumLogo} alt="Medium" className="h-6 w-auto dark:invert" style={{ clipPath: 'inset(25% 5% 25% 5%)' }} />,
  vault: <span className="text-xl">🌐</span>,
};

export function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('twitter');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "pinned" | "important" | "reference"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

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
      .eq("platform", selectedPlatform)
      .order("created_at", { ascending: false });

    if (selectedFolder) {
      query = query.eq("folder_id", selectedFolder);
    }

    const { data } = await query;
    setBookmarks(data ? parseBookmarks(data) : []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFolders();
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    setSelectedTag(null);
    fetchBookmarks();
  }, [user, selectedFolder, selectedPlatform]);

  const updatePriority = async (
    id: string,
    priority: "important" | "pinned" | "reference" | "normal"
  ) => {
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

  const handleUpdateHighlights = (id: string, highlights: Highlight[]) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, highlights, archived_at: new Date().toISOString() } : b))
    );
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
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
  const platformConfig = PLATFORM_CONFIG[selectedPlatform];

  const renderBookmarkCard = (bookmark: BookmarkType) => {
    const commonProps = {
      key: bookmark.id,
      bookmark,
      folders,
      onDelete: handleDeleteBookmark,
      onMove: handleMoveBookmark,
      onTagClick: handleTagClick,
      onUpdateNotes: handleUpdateNotes,
      onUpdatePriority: updatePriority,
    };

    switch (bookmark.platform) {
      case 'youtube':
        return <YouTubeCard {...commonProps} onUpdateHighlights={handleUpdateHighlights} />;
      case 'medium':
        return <MediumCard {...commonProps} />;
      case 'reddit':
        return <RedditCard {...commonProps} />;
      case 'vault':
        return <VaultCard {...commonProps} />;
      default:
        return <BookmarkCard {...commonProps} />;
    }
  };

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[150px] animate-pulse" />
        <div className="absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full bg-accent/4 blur-[120px]" />
      </div>
      <Sidebar
        folders={folders}
        selectedFolder={selectedFolder}
        selectedPlatform={selectedPlatform}
        onSelectFolder={setSelectedFolder}
        onSelectPlatform={setSelectedPlatform}
        onFolderCreated={fetchFolders}
        isOpen={isMobile ? isSidebarOpen : true}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  className="shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                {PLATFORM_HEADER_ICONS[selectedPlatform]}
                <h1 className="text-xl font-bold">
                  <span className="text-gradient">Mark</span><span className="font-light italic tracking-wide">Manager</span> — {platformConfig.label}
                </h1>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bookmarks..."
                  className="pl-10 h-10 bg-secondary/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Add Bookmark Button */}
              {selectedPlatform === 'vault' ? (
                <Button onClick={() => setIsBulkImportOpen(true)} className="h-10 gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Import URLs</span>
                  <span className="sm:hidden">Import</span>
                </Button>
              ) : (
                <Button onClick={() => setIsAddModalOpen(true)} className="h-10 gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Bookmark</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
            </div>
          </div>

          {/* Tags */}
          {usedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear filter
                </button>
              )}
              {usedTags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  active={selectedTag === tag}
                  onClick={() => handleTagClick(tag)}
                />
              ))}
            </div>
          )}
        </header>

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
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center h-64"
              >
                <div className="relative">
                  <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
                  <Loader2 className="relative h-8 w-8 animate-spin text-primary" />
                </div>
              </motion.div>
            ) : filteredBookmarks.length > 0 ? (
              <motion.div
                key={`${selectedPlatform}-${selectedFolder}-${selectedTag}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {filteredBookmarks.map((bookmark, i) => (
                  <AnimatedCard key={bookmark.id} index={i}>
                    {renderBookmarkCard(bookmark)}
                  </AnimatedCard>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center text-muted-foreground mt-20"
              >
                <p>No {platformConfig.label} bookmarks found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => selectedPlatform === 'vault' ? setIsBulkImportOpen(true) : setIsAddModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedPlatform === 'vault' ? 'Import your first URLs' : `Add your first ${platformConfig.label} bookmark`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AddBookmarkModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          folders={folders}
          selectedFolder={selectedFolder}
          selectedPlatform={selectedPlatform}
          onBookmarkAdded={fetchBookmarks}
        />

        <BulkImportModal
          open={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
          folders={folders}
          selectedFolder={selectedFolder}
          onBookmarksAdded={fetchBookmarks}
        />
      </main>
    </div>
  );
}
