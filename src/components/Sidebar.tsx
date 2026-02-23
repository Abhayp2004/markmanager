import { useState } from 'react';
import mediumLogo from '@/assets/medium_logo.jpg';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bookmark, 
  Folder, 
  Plus, 
  LogOut, 
  ChevronRight,
  X,
  Loader2,
  Play,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Platform, PLATFORM_CONFIG } from '@/types/bookmark';

interface FolderType {
  id: string;
  name: string;
}

interface SidebarProps {
  folders: FolderType[];
  selectedFolder: string | null;
  selectedPlatform: Platform;
  onSelectFolder: (folderId: string | null) => void;
  onSelectPlatform: (platform: Platform) => void;
  onFolderCreated: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  twitter: <span className="text-base">𝕏</span>,
  youtube: <Play className="h-4 w-4 text-red-500" fill="currentColor" />,
  reddit: <span className="text-base">🔴</span>,
  medium: <img src={mediumLogo} alt="Medium" className="h-4 w-auto dark:invert" />,
  vault: <span className="text-base">🌐</span>,
};

export function Sidebar({ 
  folders, 
  selectedFolder,
  selectedPlatform,
  onSelectFolder,
  onSelectPlatform,
  onFolderCreated,
  isOpen = true,
  onClose
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSelectFolder = (folderId: string | null) => {
    onSelectFolder(folderId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleSelectPlatform = (platform: Platform) => {
    onSelectPlatform(platform);
    onSelectFolder(null); // Reset folder when changing platform
    if (isMobile && onClose) {
      onClose();
    }
  };

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

  const handleSignOut = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    console.log('[auth] signOut pressed');

    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      if (isMobile && onClose) onClose();
      window.location.assign('/auth');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside 
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-transform duration-300 ease-in-out",
          "fixed lg:static z-50",
          "w-64",
          "inset-y-0 left-0",
          "overflow-hidden",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
        style={{ 
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4 shrink-0 flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Bookmark className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground">Bookmarks</span>
          {isMobile && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

      {/* Navigation - Scrollable area */}
      <nav 
        className="flex-1 overflow-y-auto overflow-x-hidden p-3" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          minHeight: 0,
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Platforms Section */}
        <div className="mb-4">
          <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Platforms
          </div>
          
          <div className="space-y-1">
            {(Object.keys(PLATFORM_CONFIG) as Platform[]).map((platform) => (
              <button
                key={platform}
                onClick={() => handleSelectPlatform(platform)}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  selectedPlatform === platform
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {selectedPlatform === platform && (
                  <motion.div
                    layoutId="activePlatform"
                    className="absolute inset-0 bg-sidebar-accent rounded-lg"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  {PLATFORM_ICONS[platform]}
                  {PLATFORM_CONFIG[platform].label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Collections */}
        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Collections
        </div>

        {/* All Bookmarks */}
        <button
          onClick={() => handleSelectFolder(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            selectedFolder === null
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Bookmark className="h-4 w-4" />
          All {PLATFORM_CONFIG[selectedPlatform].label}
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
                onClick={() => handleSelectFolder(folder.id)}
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

      {/* User section - Fixed at bottom with spacing */}
      <div className="border-t border-border px-4 pt-3 pb-10 shrink-0 flex-shrink-0 space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
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
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            onPointerUp={handleSignOut}
            disabled={isSigningOut}
            style={{ touchAction: 'manipulation' }}
            className="h-10 w-10 text-muted-foreground hover:text-foreground active:bg-accent"
          >
            {isSigningOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}
