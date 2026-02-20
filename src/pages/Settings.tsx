import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  Keyboard,
  LayoutGrid,
  LayoutList,
  Moon,
  Sun,
  Trash2,
  Download,
  User,
  Shield,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'Quick search' },
  { keys: ['⌘', 'N'], action: 'New bookmark' },
  { keys: ['⌘', 'B'], action: 'Toggle sidebar' },
  { keys: ['⌘', '1-5'], action: 'Switch platform' },
];

export default function Settings() {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [defaultView, setDefaultView] = useState<'cards' | 'list'>('cards');
  const [darkMode, setDarkMode] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: folders } = await supabase
        .from('folders')
        .select('*')
        .order('created_at');

      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        bookmarks: bookmarks || [],
        folders: folders || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `markmanager-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Exported!', description: 'Your data has been downloaded.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to export data.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete all user data
      await supabase.from('bookmarks').delete().eq('user_id', user.id);
      await supabase.from('folders').delete().eq('user_id', user.id);
      await signOut();
      toast({ title: 'Account deleted', description: 'All your data has been removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete account.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to bookmarks
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-10">Settings</h1>

          {/* Account */}
          <Section icon={User} title="Account">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          </Section>

          {/* Appearance */}
          <Section icon={darkMode ? Moon : Sun} title="Appearance">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Dark mode</Label>
                <Switch
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Default view</Label>
                <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
                  <button
                    onClick={() => setDefaultView('cards')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      defaultView === 'cards'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Cards
                  </button>
                  <button
                    onClick={() => setDefaultView('list')}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      defaultView === 'list'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    List
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* Keyboard shortcuts */}
          <Section icon={Keyboard} title="Keyboard shortcuts">
            <div className="space-y-3">
              {SHORTCUTS.map((s) => (
                <div key={s.action} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.action}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-secondary/80 px-1.5 text-xs font-mono text-muted-foreground border border-border/50"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Data */}
          <Section icon={Shield} title="Data & Privacy">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Export all data</p>
                  <p className="text-xs text-muted-foreground">Download bookmarks, folders, and notes as JSON</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="gap-1.5"
                >
                  {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Privacy policy</p>
                  <p className="text-xs text-muted-foreground">How we handle your data</p>
                </div>
                <Link to="/privacy">
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </div>

              <div className="border-t border-border pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete account & all data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all bookmarks, folders, notes, and tags.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Yes, delete everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Section>
        </motion.div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-border bg-card/50 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
