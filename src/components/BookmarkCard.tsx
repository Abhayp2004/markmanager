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
  X,
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
  priority?: 'normal' | 'important' | 'pinned' | 'reference';
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
  onUpdatePriority?: (
    id: string,
    priority: 'important' | 'pinned' | 'reference' | 'normal'
  ) => void;
}

export function BookmarkCard({
  bookmark,
  folders,
  onDelete,
  onMove,
  onTagClick,
  onRetag,
  onUpdateNotes,
  onUpdatePriority,
}: BookmarkCardProps) {
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
        document
          .querySelectorAll(
            'script[src*="platform.twitter.com/widgets.js"]'
          )
          .forEach((s) => s.remove());
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
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all duration-300',
        'hover:shadow-card',
        bookmark.priority === 'pinned' && 'border-yellow-400/60',
        bookmark.priority === 'important' && 'border-orange-400/60',
        bookmark.priority === 'reference' && 'border-blue-400/60',
        (!bookmark.priority || bookmark.priority === 'normal') &&
          'border-border hover:border-primary/30'
      )}
    >
      {/* Priority badge */}
      {bookmark.priority && bookmark.priority !== 'normal' && (
        <div className="absolute left-2 top-2 z-10 text-lg">
          {bookmark.priority === 'important' && '⭐'}
          {bookmark.priority === 'pinned' && '📌'}
          {bookmark.priority === 'reference' && '🔖'}
        </div>
      )}

      {/* Action menu */}
      <div className="absolute right-2 top-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8 bg-card/90 backdrop-blur-sm border border-border"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
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
              onClick={() =>
                navigator.clipboard.writeText(bookmark.tweet_url)
              }
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

            {/* Priority section */}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Set priority
            </div>

            <DropdownMenuItem
              onClick={() =>
                onUpdatePriority?.(bookmark.id, 'important')
              }
            >
              ⭐ Mark as Important
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                onUpdatePriority?.(bookmark.id, 'pinned')
              }
            >
              📌 Pin
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                onUpdatePriority?.(bookmark.id, 'reference')
              }
            >
              🔖 Mark as Reference
            </DropdownMenuItem>

            {bookmark.priority !== 'normal' && (
              <DropdownMenuItem
                onClick={() =>
                  onUpdatePriority?.(bookmark.id, 'normal')
                }
                className="text-muted-foreground"
              >
                Remove priority
              </DropdownMenuItem>
            )}

            {/* Folder section */}
            <DropdownMenuSeparator />

            {folders.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Move to folder
                </div>

                {bookmark.folder_id && (
                  <DropdownMenuItem
                    onClick={() => onMove(bookmark.id, null)}
                  >
                    <FolderInput className="h-4 w-4 mr-2" />
                    Remove from folder
                  </DropdownMenuItem>
                )}

                {folders
                  .filter((f) => f.id !== bookmark.folder_id)
                  .map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() =>
                        onMove(bookmark.id, folder.id)
                      }
                    >
                      <FolderInput className="h-4 w-4 mr-2" />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
              </>
            )}

            <DropdownMenuSeparator />

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

      {/* Tweet embed */}
      {bookmark.embed_html ? (
        <div
          ref={containerRef}
          className="min-h-[200px] p-3 sm:p-4 [&_.twitter-tweet]:!my-0 [&_.twitter-tweet]:!mx-auto"
        />
      ) : (
        <div className="p-4">
          <div className="flex flex-col gap-3 rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LinkIcon className="h-4 w-4" />
              <span className="text-sm">
                Tweet preview unavailable
              </span>
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

      {/* Notes */}
      {(bookmark.notes || isEditingNotes) && (
        <div className="border-t border-border px-4 py-3 bg-primary/5">
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) =>
                  setNotesValue(e.target.value)
                }
                placeholder="Why did you save this? Add context..."
                className="min-h-[60px] bg-background text-sm resize-none"
                autoFocus
              />
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelNotes}
                >
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
              <p className="text-sm text-muted-foreground flex-1">
                {bookmark.notes}
              </p>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/notes:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      )}

      {/* Add note */}
      {!bookmark.notes && !isEditingNotes && (
        <button
          onClick={() => setIsEditingNotes(true)}
          className="w-full border-t border-border px-4 py-3 bg-secondary/20 text-sm text-muted-foreground hover:bg-secondary/40 transition-colors flex items-center gap-1.5 justify-center"
        >
          <StickyNote className="h-3 w-3" />
          Add note
        </button>
      )}

      {/* Footer */}
      <div className="border-t border-border px-4 py-2 bg-secondary/30">
        <p className="text-xs text-muted-foreground">
          Saved{' '}
          {new Date(bookmark.created_at).toLocaleDateString(
            'en-US',
            {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }
          )}
        </p>
      </div>
    </div>
  );
}
