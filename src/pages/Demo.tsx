import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard } from '@/components/AnimatedCard';
import { TagBadge } from '@/components/TagBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  ExternalLink,
  Sparkles,
  Search,
  X,
  Bookmark,
  Play,
  FolderOpen,
  Layers,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DemoPlatform = 'twitter' | 'youtube' | 'vault';

const DEMO_BOOKMARKS: Record<DemoPlatform, Array<{
  id: string;
  title: string;
  url: string;
  domain: string;
  tags: string[];
  summary: string;
  priority?: string;
}>> = {
  twitter: [
    {
      id: '1',
      title: 'Andrej Karpathy on LLM training efficiency',
      url: 'https://x.com/karpathy/status/123',
      domain: 'x.com',
      tags: ['ai', 'deep-learning', 'training'],
      summary: 'New techniques for reducing compute costs in large language model training by 40% using curriculum learning strategies.',
      priority: 'important',
    },
    {
      id: '2',
      title: 'Tailwind CSS v4 announcement',
      url: 'https://x.com/tailwindcss/status/456',
      domain: 'x.com',
      tags: ['css', 'frontend', 'design'],
      summary: 'Major rewrite with new engine, zero-config content detection, and native CSS cascade layers support.',
    },
    {
      id: '3',
      title: 'Indie hacker shares $10K MRR journey',
      url: 'https://x.com/indiehacker/status/789',
      domain: 'x.com',
      tags: ['startup', 'saas', 'growth'],
      summary: 'From idea to $10K MRR in 8 months with a niche B2B tool. Key insight: solve boring problems well.',
      priority: 'pinned',
    },
  ],
  youtube: [
    {
      id: '4',
      title: 'Building a RAG system from scratch',
      url: 'https://youtube.com/watch?v=abc',
      domain: 'youtube.com',
      tags: ['ai', 'rag', 'tutorial'],
      summary: 'Step-by-step guide to building a production-ready Retrieval Augmented Generation pipeline with embeddings and vector search.',
      priority: 'pinned',
    },
    {
      id: '5',
      title: 'System Design: Distributed caching',
      url: 'https://youtube.com/watch?v=def',
      domain: 'youtube.com',
      tags: ['system-design', 'backend', 'caching'],
      summary: 'Deep dive into Redis, Memcached, and CDN caching strategies for high-traffic applications.',
    },
  ],
  vault: [
    {
      id: '6',
      title: 'The Art of Debugging — blog post',
      url: 'https://blog.example.com/debugging',
      domain: 'blog.example.com',
      tags: ['engineering', 'debugging', 'best-practices'],
      summary: "A senior engineer\u2019s framework for systematic debugging: reproduce, isolate, fix, verify.",
    },
    {
      id: '7',
      title: 'React Server Components explained',
      url: 'https://react.dev/blog/rsc',
      domain: 'react.dev',
      tags: ['react', 'frontend', 'architecture'],
      summary: 'Official guide to RSC: when to use them, how they differ from SSR, and migration patterns.',
      priority: 'reference',
    },
  ],
};

const PLATFORM_TABS: { key: DemoPlatform; label: string; icon: React.ReactNode }[] = [
  { key: 'twitter', label: 'Twitter / X', icon: <span className="text-sm">𝕏</span> },
  { key: 'youtube', label: 'YouTube', icon: <Play className="h-4 w-4 text-red-500" fill="currentColor" /> },
  { key: 'vault', label: 'Internet Vault', icon: <Globe className="h-4 w-4" /> },
];

export default function Demo() {
  const [platform, setPlatform] = useState<DemoPlatform>('twitter');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const bookmarks = DEMO_BOOKMARKS[platform];
  const allTags = [...new Set(bookmarks.flatMap((b) => b.tags))];

  const filtered = bookmarks.filter((b) => {
    if (selectedTag && !b.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.tags.some((t) => t.includes(q)) ||
        b.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold">
              <span className="text-gradient">Mark</span>
              <span className="font-light italic tracking-wide">Manager</span>
            </h1>
            <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Demo
            </span>
          </div>
        </div>

        <Link to="/auth">
          <Button size="sm" className="gap-1.5">
            Create account <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </header>

      <div className="flex">
        {/* Mini sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border p-4 min-h-[calc(100vh-53px)]">
          <div className="mb-4 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Platforms
          </div>
          <div className="space-y-1">
            {PLATFORM_TABS.map((p) => (
              <button
                key={p.key}
                onClick={() => { setPlatform(p.key); setSelectedTag(null); }}
                className={cn(
                  'relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  platform === p.key
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/50'
                )}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-6 mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Collections
          </div>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
            <Bookmark className="h-4 w-4" />
            All bookmarks
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
            <FolderOpen className="h-4 w-4" />
            Research
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/50 transition-colors">
            <FolderOpen className="h-4 w-4" />
            Inspiration
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-6">
          {/* Mobile tabs */}
          <div className="flex md:hidden gap-2 mb-4 overflow-x-auto">
            {PLATFORM_TABS.map((p) => (
              <button
                key={p.key}
                onClick={() => { setPlatform(p.key); setSelectedTag(null); }}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap border transition',
                  platform === p.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/40 text-muted-foreground border-border'
                )}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search demo bookmarks..."
              className="pl-10 h-10 bg-secondary/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
              {allTags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  active={selectedTag === tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                />
              ))}
            </div>
          )}

          {/* Bookmark cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={platform}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((b, i) => (
                <AnimatedCard key={b.id} index={i}>
                  <Card className="group relative overflow-hidden transition-all duration-300 border-border/60 hover:shadow-[0_8px_30px_hsl(187_72%_40%/0.12)] hover:border-primary/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{b.domain}</span>
                        {b.priority === 'pinned' && <span className="text-sm">📌</span>}
                        {b.priority === 'important' && <span className="text-sm">⭐</span>}
                        {b.priority === 'reference' && <span className="text-sm">🔖</span>}
                      </div>

                      <h3 className="text-sm font-medium leading-snug line-clamp-2">
                        {b.title}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {b.summary}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {b.tags.map((tag) => (
                          <TagBadge
                            key={tag}
                            tag={tag}
                            onClick={() => setSelectedTag(tag)}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-evenly pt-1 border-t border-border/40">
                        <span className="text-xs text-primary flex items-center gap-1 cursor-pointer hover:underline">
                          <ExternalLink className="h-3 w-3" /> Open
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground">
                          <Sparkles className="h-3 w-3" /> Summarize
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground mt-20">
              <p>No matching bookmarks in demo</p>
            </div>
          )}

          {/* CTA banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-12 rounded-2xl glass-card-elevated p-8 text-center"
          >
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Ready to save your own bookmarks?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Create a free account in seconds. Your data stays yours.
            </p>
            <Link to="/auth">
              <Button className="gap-2">
                Get started free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
