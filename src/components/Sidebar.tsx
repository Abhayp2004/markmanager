import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bookmark, 
  Folder, 
  Plus, 
  LogOut, 
  ChevronRight,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Folder {
  id: string;
  name: string;
}

interface SidebarProps {
  folders: Folder[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onFolderCreated: () => void;
}

export function Sidebar({ 
  folders, 
  selectedFolder, 
  onSelectFolder,
  onFolderCreated 
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !user) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from('folders')
      .insert({ name: newFolderName.trim(), user_id: user.id });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
    } else {
      setNewFolderName('');
      setIsCreating(false);
      onFolderCreated();
      toast({
        title: 'Folder created',
        description: `"${newFolderName}" has been created`,
      });
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Bookmark className="h-5 w-5 text-primary" />
        </div>
        <span className="font-semibold text-foreground">X Bookmarks</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Collections
        </div>

        {/* All Bookmarks */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            selectedFolder === null
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Bookmark className="h-4 w-4" />
          All Bookmarks
        </button>

        {/* Folders */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Folders
            </span>
            <button
              onClick={() => setIsCreating(true)}
              className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* New folder form */}
          {isCreating && (
            <form onSubmit={handleCreateFolder} className="mb-2 px-1">
              <div className="flex items-center gap-2">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  className="h-8 text-sm bg-secondary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setNewFolderName('');
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {isSubmitting && (
                <div className="mt-2 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </form>
          )}

          {/* Folder list */}
          <div className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group",
                  selectedFolder === folder.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Folder className="h-4 w-4" />
                <span className="flex-1 truncate text-left">{folder.name}</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>

          {folders.length === 0 && !isCreating && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No folders yet. Create one to organize your bookmarks.
            </p>
          )}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
