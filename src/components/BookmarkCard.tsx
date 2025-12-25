import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TagBadge } from '@/components/TagBadge';
import { 
  MoreHorizontal, 
  Trash2, 
  FolderInput, 
  ExternalLink,
  Link as LinkIcon,
  Sparkles,
  StickyNote,
  Pencil,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Bookmark {
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

interface Folder {
  id: string;
  name: string;
}

interface BookmarkCardProps {
  bookmark: Bookmark;
  folders: Folder[];
  onDelete: (id: string) => void;
  onMove: (id: string, folderId: string | null) => void;
  onTagClick?: (tag: string) => void;
  onRetag?: (bookmark: Bookmark) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
}

export function BookmarkCard({ bookmark, folders, onDelete, onMove, onTagClick, onRetag, onUpdateNotes }: BookmarkCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(bookmark.notes || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookmark.embed_html && containerRef.current) {
      containerRef.current.innerHTML = bookmark.embed_html;
      
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);

      return () => {
        const existingScripts = document.querySelectorAll('script[src*="platform.twitter.com/widgets.js"]');
        existingScripts.forEach(s => s.remove());
      };
    }
  }, [bookmark.embed_html]);

  const handleSaveNotes = () => {
    onUpdateNotes?.(bookmark.id, notesValue);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesValue(bookmark.notes || '');
    setIsEditingNotes(false);
  };

  const tags = bookmark.tags || [];

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300",
      "hover:border-primary/30 hover:shadow-card"
    )}>
      {/* Actions menu */}
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-8 w-8 bg-card/90 backdrop-blur-sm border border-border"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <a 
                href={bookmark.tweet_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open on X
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(bookmark.tweet_url)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy link
            </DropdownMenuItem>
            {onRetag && (
              <DropdownMenuItem onClick={() => onRetag(bookmark)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Re-analyze tags
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            
            {folders.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Move to folder
                </div>
                {bookmark.folder_id && (
                  <DropdownMenuItem onClick={() => onMove(bookmark.id, null)}>
                    <FolderInput className="h-4 w-4 mr-2" />
                    Remove from folder
                  </DropdownMenuItem>
                )}
                {folders
                  .filter(f => f.id !== bookmark.folder_id)
                  .map(folder => (
                    <DropdownMenuItem 
                      key={folder.id}
                      onClick={() => onMove(bookmark.id, folder.id)}
                    >
                      <FolderInput className="h-4 w-4 mr-2" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))
                }
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem 
              onClick={() => onDelete(bookmark.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete bookmark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {tags.map((tag) => (
            <TagBadge 
              key={tag} 
              tag={tag} 
              size="sm"
              onClick={() => onTagClick?.(tag)}
            />
          ))}
        </div>
      )}

      {/* Tweet embed or fallback */}
      {bookmark.embed_html ? (
        <div 
          ref={containerRef}
          className="min-h-[200px] p-4 [&_.twitter-tweet]:!my-0 [&_.twitter-tweet]:!mx-auto"
        />
      ) : (
        <div className="p-4">
          <div className="flex flex-col gap-3 rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LinkIcon className="h-4 w-4" />
              <span className="text-sm">Tweet preview unavailable</span>
            </div>
            <a 
              href={bookmark.tweet_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline truncate"
            >
              {bookmark.tweet_url}
            </a>
            {bookmark.author_name && (
              <p className="text-sm text-muted-foreground">
                By {bookmark.author_name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes section */}
      {(bookmark.notes || isEditingNotes) && (
        <div className="border-t border-border px-4 py-3 bg-primary/5">
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Why did you save this? Add context..."
                className="min-h-[60px] bg-background text-sm resize-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={handleCancelNotes}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes}>
                  <Check className="h-3 w-3 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex items-start gap-2 cursor-pointer group/notes"
              onClick={() => setIsEditingNotes(true)}
            >
              <StickyNote className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground flex-1">{bookmark.notes}</p>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/notes:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      )}

      {/* Add note button when no notes exist */}
      {!bookmark.notes && !isEditingNotes && (
        <button
          onClick={() => setIsEditingNotes(true)}
          className="w-full border-t border-border px-4 py-2 bg-secondary/20 text-xs text-muted-foreground hover:bg-secondary/40 transition-colors flex items-center gap-1.5 justify-center"
        >
          <StickyNote className="h-3 w-3" />
          Add note
        </button>
      )}

      {/* Footer with timestamp */}
      <div className="border-t border-border px-4 py-2 bg-secondary/30">
        <p className="text-xs text-muted-foreground">
          Saved {new Date(bookmark.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}