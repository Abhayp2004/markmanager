import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SummarizeButtonProps {
  bookmarkId: string;
  content?: string | null;
  url: string;
  platform: string;
  existingSummary?: string | null;
  onSummaryGenerated?: (id: string, summary: string) => void;
}

export function SummarizeButton({
  bookmarkId,
  content,
  url,
  platform,
  existingSummary,
  onSummaryGenerated,
}: SummarizeButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(existingSummary || '');
  const [isExpanded, setIsExpanded] = useState(!!existingSummary);

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-bookmarks', {
        body: {
          action: 'summarize',
          content: content || '',
          tweetUrl: url,
          platform,
        },
      });

      if (error) throw error;

      if (data?.summary) {
        setSummary(data.summary);
        setIsExpanded(true);
        onSummaryGenerated?.(bookmarkId, data.summary);
        toast({ title: 'Summary generated', description: 'AI summary is ready.' });
      } else {
        toast({ title: 'No summary', description: 'Could not generate a summary.', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Summarize error:', err);
      toast({ title: 'Error', description: 'Failed to generate summary.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!summary) {
    return (
      <button
        onClick={handleSummarize}
        disabled={isLoading}
        className="w-full border-t border-border px-4 py-3 bg-secondary/20 text-sm text-muted-foreground hover:bg-secondary/40 transition-colors flex items-center gap-1.5 justify-center disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Summarizing...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3" />
            Summarize with AI
          </>
        )}
      </button>
    );
  }

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between text-sm font-medium transition-colors",
          "hover:bg-secondary/40 cursor-pointer",
          isExpanded && "bg-secondary/20"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Summary</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{summary}</p>
          </div>
          <button
            onClick={handleSummarize}
            disabled={isLoading}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
