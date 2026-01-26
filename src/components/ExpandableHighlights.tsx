import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Clock, Hash, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Highlight {
  timestamp: string;
  title: string;
  summary: string;
}

interface ExpandableHighlightsProps {
  highlights: Highlight[];
  summary?: string;
  keyTopics?: string[];
  transcript?: string;
  isLoading?: boolean;
  onGenerateHighlights?: () => void;
  videoUrl?: string;
}

export function ExpandableHighlights({
  highlights,
  summary,
  keyTopics,
  transcript,
  isLoading,
  onGenerateHighlights,
  videoUrl,
}: ExpandableHighlightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'highlights' | 'transcript'>('highlights');

  const hasContent = highlights.length > 0 || summary || transcript;

  if (!hasContent && !onGenerateHighlights) {
    return null;
  }

  const handleTimestampClick = (timestamp: string) => {
    if (!videoUrl) return;
    
    // Parse timestamp (e.g., "2:30" -> 150 seconds)
    const parts = timestamp.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    // Open YouTube at timestamp
    const url = new URL(videoUrl);
    url.searchParams.set('t', String(seconds));
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="border-t border-border">
      {/* Header toggle */}
      <button
        onClick={() => hasContent && setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between",
          "text-sm font-medium transition-colors",
          hasContent ? "hover:bg-secondary/40 cursor-pointer" : "cursor-default",
          isExpanded && "bg-secondary/20"
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Highlights</span>
          {highlights.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
              {highlights.length}
            </span>
          )}
        </div>
        
        {hasContent ? (
          isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateHighlights?.();
            }}
            disabled={isLoading}
            className="h-7 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Generate
              </>
            )}
          </Button>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && hasContent && (
        <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Tabs */}
          {transcript && (
            <div className="flex gap-1 p-1 bg-secondary/30 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('highlights')}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-colors",
                  activeTab === 'highlights' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Highlights
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-colors",
                  activeTab === 'transcript' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3 w-3 inline mr-1" />
                Transcript
              </button>
            </div>
          )}

          {activeTab === 'highlights' && (
            <>
              {/* Summary */}
              {summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-foreground/90">{summary}</p>
                </div>
              )}

              {/* Key Topics */}
              {keyTopics && keyTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {keyTopics.map((topic, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                    >
                      <Hash className="h-3 w-3" />
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Highlights list */}
              {highlights.length > 0 && (
                <div className="space-y-2">
                  {highlights.map((highlight, idx) => (
                    <div 
                      key={idx}
                      className="flex gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors group"
                    >
                      <button
                        onClick={() => handleTimestampClick(highlight.timestamp)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-secondary text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                      >
                        <Clock className="h-3 w-3" />
                        {highlight.timestamp}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{highlight.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{highlight.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'transcript' && transcript && (
            <div className="max-h-60 overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
