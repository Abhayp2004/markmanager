import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Link, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Platform, Priority, PLATFORM_CONFIG, detectPlatform, extractVideoId } from '@/types/bookmark';

interface Folder {
  id: string;
  name: string;
}

interface AddBookmarkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  selectedFolder: string | null;
  selectedPlatform: Platform;
  onBookmarkAdded: () => void;
}

export function AddBookmarkModal({
  open,
  onOpenChange,
  folders,
  selectedFolder,
  selectedPlatform,
  onBookmarkAdded,
}: AddBookmarkModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [folderId, setFolderId] = useState<string | null>(selectedFolder);
  const [priority, setPriority] = useState<Priority>('normal');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFolderId(selectedFolder);
  }, [selectedFolder]);

  const extractTweetId = (url: string): string | null => {
    const patterns = [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /(?:twitter\.com|x\.com)\/\w+\/statuses\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const extractTextFromHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !user) return;

    const trimmedUrl = url.trim();
    const detectedPlatform = detectPlatform(trimmedUrl);

    // Validate URL matches selected platform
    if (detectedPlatform !== selectedPlatform) {
      toast({
        title: 'Invalid URL',
        description: `Please enter a valid ${PLATFORM_CONFIG[selectedPlatform].label} URL`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let embedHtml: string | null = null;
      let authorName: string | null = null;
      let authorUrl: string | null = null;
      let content = '';

      if (selectedPlatform === 'twitter') {
        const tweetId = extractTweetId(trimmedUrl);
        if (!tweetId) {
          toast({
            title: 'Invalid URL',
            description: 'Please enter a valid X/Twitter post URL',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // Fetch Twitter oEmbed
        try {
          const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(trimmedUrl)}&omit_script=true`;
          const response = await fetch(oembedUrl);
          if (response.ok) {
            const data = await response.json();
            embedHtml = data.html;
            authorName = data.author_name;
            authorUrl = data.author_url;
            content = extractTextFromHtml(data.html);
          }
        } catch {
          console.log('oEmbed fetch failed');
        }
      } else if (selectedPlatform === 'youtube') {
        const videoId = extractVideoId(trimmedUrl);
        if (videoId) {
          // For YouTube, we'll use the video ID for thumbnail
          // Try to get video info via noembed
          try {
            const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(trimmedUrl)}`);
            if (response.ok) {
              const data = await response.json();
              content = data.title || '';
              authorName = data.author_name || '';
            }
          } catch {
            console.log('noembed fetch failed');
          }
        }
      } else if (selectedPlatform === 'linkedin') {
        // Try noembed for LinkedIn
        try {
          const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(trimmedUrl)}`);
          if (response.ok) {
            const data = await response.json();
            content = data.title || '';
            authorName = data.author_name || '';
          }
        } catch {
          console.log('noembed fetch failed for LinkedIn');
        }
        if (!content) content = 'LinkedIn Post';
      } else if (selectedPlatform === 'reddit') {
        // Try Reddit oEmbed
        try {
          const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(trimmedUrl)}`);
          if (response.ok) {
            const data = await response.json();
            content = data.title || '';
            authorName = data.author_name || '';
          }
        } catch {
          console.log('noembed fetch failed for Reddit');
        }
        if (!content) content = 'Reddit Post';
    } else if (selectedPlatform === 'medium') {
        // Try noembed for Medium articles
        try {
          const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(trimmedUrl)}`);
          if (response.ok) {
            const data = await response.json();
            content = data.title || '';
            authorName = data.author_name || '';
          }
        } catch {
          console.log('noembed fetch failed for Medium');
        }
        if (!content) content = 'Medium Article';
      }

      // AI tagging
      let tags: string[] = [];
      let summary = '';

      try {
        const aiResponse = await supabase.functions.invoke('ai-bookmarks', {
          body: {
            action: 'analyze',
            content: content,
            tweetUrl: trimmedUrl,
          },
        });

        if (aiResponse.data && !aiResponse.error) {
          tags = aiResponse.data.tags || [];
          summary = aiResponse.data.summary || '';
        }
      } catch {
        console.log('AI tagging failed');
      }

      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        tweet_url: trimmedUrl,
        folder_id: folderId || null,
        embed_html: embedHtml,
        author_name: authorName,
        author_url: authorUrl,
        tags: tags.length > 0 ? tags : ['other'],
        content: content || summary,
        priority,
        platform: selectedPlatform,
      });

      if (error) throw error;

      toast({
        title: 'Bookmark saved',
        description: priority !== 'normal'
          ? `Saved as ${priority}`
          : `Your ${PLATFORM_CONFIG[selectedPlatform].label} bookmark has been saved`,
      });

      setUrl('');
      setFolderId(selectedFolder);
      setPriority('normal');
      onOpenChange(false);
      onBookmarkAdded();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save bookmark. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const platformConfig = PLATFORM_CONFIG[selectedPlatform];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add {platformConfig.label} Bookmark
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" />
            AI will automatically categorize your bookmark
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <div className="space-y-2">
            <Label>{platformConfig.label} URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={platformConfig.placeholder}
                className="pl-10 h-11 bg-secondary"
                required
              />
            </div>
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label>Folder (optional)</Label>
            <Select
              value={folderId || 'none'}
              onValueChange={(val) =>
                setFolderId(val === 'none' ? null : val)
              }
            >
              <SelectTrigger className="h-11 bg-secondary">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(val) => setPriority(val as Priority)}
            >
              <SelectTrigger className="h-11 bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="important">⭐ Important</SelectItem>
                <SelectItem value="pinned">📌 Pinned</SelectItem>
                <SelectItem value="reference">🔖 Reference</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 w-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                'Save Bookmark'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
