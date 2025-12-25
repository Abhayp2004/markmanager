import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tagColors: Record<string, string> = {
  tech: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ai: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  crypto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  sports: 'bg-green-500/20 text-green-400 border-green-500/30',
  funny: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  news: 'bg-red-500/20 text-red-400 border-red-500/30',
  politics: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  science: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  business: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  lifestyle: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  entertainment: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  education: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  health: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  art: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  music: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  gaming: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  travel: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  food: 'bg-orange-400/20 text-orange-300 border-orange-400/30',
  motivation: 'bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30',
  other: 'bg-muted text-muted-foreground border-border',
};

interface TagBadgeProps {
  tag: string;
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'default';
}

export function TagBadge({ tag, onClick, active, size = 'default' }: TagBadgeProps) {
  const colorClass = tagColors[tag.toLowerCase()] || tagColors.other;
  
  return (
    <Badge
      variant="outline"
      className={cn(
        colorClass,
        'cursor-pointer transition-all duration-200 border',
        size === 'sm' && 'text-[10px] px-1.5 py-0',
        active && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        onClick && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      {tag}
    </Badge>
  );
}