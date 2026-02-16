import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  MoreVertical,
  Trash2,
  FolderInput,
  Pin,
  Star,
  BookmarkIcon,
  Loader2,
  Globe,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { TagBadge } from "@/components/TagBadge";
import { SummarizeButton } from "@/components/SummarizeButton";
import { Bookmark, Folder, Priority } from "@/types/bookmark";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VaultCardProps {
  bookmark: Bookmark;
  folders: Folder[];
  onDelete: (id: string) => void;
  onMove: (id: string, folderId: string | null) => void;
  onTagClick: (tag: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdatePriority: (id: string, priority: Priority) => void;
}

export function VaultCard({
  bookmark,
  folders,
  onDelete,
  onMove,
  onTagClick,
  onUpdateNotes,
  onUpdatePriority,
}: VaultCardProps) {
  const { toast } = useToast();
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(bookmark.notes || "");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(bookmark.content || "");

  const handleSaveNotes = () => {
    onUpdateNotes(bookmark.id, notes);
    setIsEditingNotes(false);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const response = await supabase.functions.invoke("scrape-summarize", {
        body: { url: bookmark.tweet_url },
      });

      if (response.data?.summary) {
        setSummary(response.data.summary);
        // Save summary to DB
        await supabase
          .from("bookmarks")
          .update({ content: response.data.summary })
          .eq("id", bookmark.id);
        toast({ title: "Summarized!", description: "AI summary generated successfully." });
      } else {
        toast({ title: "Error", description: response.data?.error || "Failed to summarize.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to summarize content.", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const domain = (() => {
    try {
      return new URL(bookmark.tweet_url).hostname.replace("www.", "");
    } catch {
      return "unknown";
    }
  })();

  const priorityIndicator = bookmark.priority === "pinned"
    ? "📌"
    : bookmark.priority === "important"
    ? "⭐"
    : bookmark.priority === "reference"
    ? "🔖"
    : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg border-border/60",
        bookmark.priority === "pinned" && "ring-1 ring-primary/40",
        bookmark.priority === "important" && "ring-1 ring-yellow-500/40"
      )}
    >
      {/* Thumbnail */}
      {bookmark.thumbnail_url && (
        <div className="relative w-full h-36 overflow-hidden bg-muted">
          <img
            src={bookmark.thumbnail_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{domain}</span>
            {priorityIndicator && <span className="text-sm">{priorityIndicator}</span>}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdatePriority(bookmark.id, bookmark.priority === "pinned" ? "normal" : "pinned")}>
                <Pin className="h-4 w-4 mr-2" />
                {bookmark.priority === "pinned" ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdatePriority(bookmark.id, bookmark.priority === "important" ? "normal" : "important")}>
                <Star className="h-4 w-4 mr-2" />
                {bookmark.priority === "important" ? "Unmark" : "Important"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdatePriority(bookmark.id, bookmark.priority === "reference" ? "normal" : "reference")}>
                <BookmarkIcon className="h-4 w-4 mr-2" />
                {bookmark.priority === "reference" ? "Unmark" : "Reference"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {folders.map((folder) => (
                <DropdownMenuItem key={folder.id} onClick={() => onMove(bookmark.id, folder.id)}>
                  <FolderInput className="h-4 w-4 mr-2" />
                  Move to {folder.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsEditingNotes(true)}>
                <StickyNote className="h-4 w-4 mr-2" />
                {bookmark.notes ? "Edit Notes" : "Add Notes"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(bookmark.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title / Content */}
        <div>
          <h3 className="text-sm font-medium line-clamp-2 leading-snug">
            {bookmark.author_name || bookmark.content?.slice(0, 80) || domain}
          </h3>
          {summary && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-4 leading-relaxed">
              {summary}
            </p>
          )}
        </div>

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bookmark.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} onClick={() => onTagClick(tag)} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <a
            href={bookmark.tweet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 ml-auto"
            onClick={handleSummarize}
            disabled={isSummarizing}
          >
            {isSummarizing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {summary ? "Re-summarize" : "Summarize"}
          </Button>
        </div>

        {/* Notes editing */}
        {isEditingNotes && (
          <div className="space-y-2 pt-2 border-t border-border">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes..."
              className="text-xs min-h-[60px] bg-secondary/50"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingNotes(false)}>
                Cancel
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleSaveNotes}>
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Display notes */}
        {!isEditingNotes && bookmark.notes && (
          <div className="text-xs text-muted-foreground bg-secondary/30 rounded p-2 border border-border/50">
            <span className="font-medium">Notes: </span>
            {bookmark.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
