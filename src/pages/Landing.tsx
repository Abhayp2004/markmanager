import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  ArrowRight,
  Zap,
  Sparkles,
  FolderOpen,
  Search,
  MessageSquare,
  
  FileText,
  BookOpen,
  Shield,
  Lock,
  Eye,
  ExternalLink,
  Star,
  Globe,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroScene } from '@/components/hero/HeroScene';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const PLATFORMS = [
  { name: 'Twitter / X', icon: '𝕏', color: 'text-foreground' },
  { name: 'YouTube', icon: <Play className="h-4 w-4" />, color: 'text-red-400' },
  { name: 'Reddit', icon: '⊙', color: 'text-orange-400' },
  { name: 'Medium', icon: 'M', color: 'text-foreground' },
  
  { name: 'Any URL', icon: <Globe className="h-4 w-4" />, color: 'text-primary' },
];

const FEATURES = [
  {
    icon: Zap,
    title: 'Multi‑platform capture',
    desc: 'Save tweets, YouTube videos, Reddit threads, Medium articles, and any URL — all funneled into one unified inbox.',
    detail: 'No more scattered browser tabs. Paste a link and we auto‑detect the platform, pull metadata, thumbnails, and content.',
  },
  {
    icon: Sparkles,
    title: 'AI search & summaries',
    desc: 'Semantic search across everything you\'ve saved. Get instant summaries, topic grouping, and ask questions about any bookmark.',
    detail: 'Powered by AI that understands context — search by meaning, not just keywords. "That article about React server components" just works.',
  },
  {
    icon: FolderOpen,
    title: 'Smart collections',
    desc: 'Organize docs, tutorials, and references into folders. Priority pins keep important stuff surfaced.',
    detail: 'Tag by topic, pin critical references, and find anything instantly with powerful filters.',
  },
];

const AI_CAPABILITIES = [
  { icon: Search, label: 'Semantic search', desc: 'Find by meaning, not keywords' },
  { icon: MessageSquare, label: 'Ask your docs', desc: 'Chat with any saved content' },
  { icon: Sparkles, label: 'Auto‑tagging', desc: 'Smart categories applied instantly' },
  { icon: FileText, label: 'Instant summaries', desc: 'TL;DR for any bookmark' },
];

const DEV_WORKFLOWS = [
  { icon: Star, label: 'Save references', desc: 'Track important threads and discussions' },
  { icon: BookOpen, label: 'Tutorial collections', desc: 'Group learning resources by topic or stack' },
  { icon: FileText, label: 'Documentation hub', desc: 'Quick‑access your most‑referenced docs' },
];

const TRUST = [
  { icon: Shield, text: 'End‑to‑end encrypted' },
  { icon: Lock, text: 'Your data is never sold' },
  { icon: Eye, text: 'Export or delete anytime' },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'transparent' }}>
      <HeroScene />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-primary/6 blur-[150px]" />
        <div className="absolute right-1/3 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* ── Nav ── */}
        <nav className="flex items-center justify-between px-6 py-5 lg:px-16 xl:px-24">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg glass-card-elevated">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              <span className="text-gradient">Mark</span>
              <span className="font-light italic">Manager</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button size="sm" className="gap-1.5">
                Sign in / Sign up <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="px-6 pt-16 pb-20 lg:px-16 xl:px-24 max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 rounded-full glass-card px-4 py-1.5 text-xs text-muted-foreground mb-8">
              <Star className="h-3 w-3 text-primary" />
              Built for everyone
            </div>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto"
          >
            One inbox for all your{' '}
            <span className="text-gradient">important bookmarks & links</span>
            {' '}across multiple platforms with smart search and summaries.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            Stop losing great content across platforms. Save anything, find everything, understand it instantly.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-base px-8 h-12">
                Start saving for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 rounded-full glass-card px-4 py-2 text-sm"
              >
                <span className={p.color}>{p.icon}</span>
                <span className="text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ── App Preview ── */}
        <section className="px-6 lg:px-16 xl:px-24 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-2xl glass-card-elevated overflow-hidden p-1"
          >
            <div className="rounded-xl bg-card/80 p-6 md:p-8">
              {/* Mock app header */}
              <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-accent/40" />
                    <div className="h-3 w-3 rounded-full bg-primary/50" />
                  </div>
                <div className="flex-1 h-7 rounded-lg bg-secondary/60 max-w-xs flex items-center px-3">
                  <Search className="h-3 w-3 text-muted-foreground mr-2" />
                  <span className="text-xs text-muted-foreground">Search bookmarks…</span>
                </div>
              </div>

              {/* Mock bookmark cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { platform: '𝕏', title: 'The future of AI agents in software development', tags: ['ai', 'tech'], time: '2h ago' },
                  { platform: '𝕏', title: 'Why crypto markets are shifting towards DeFi', tags: ['crypto', 'business'], time: '5h ago' },
                  { platform: '𝕏', title: 'Science behind meditation and productivity', tags: ['science', 'spiritual'], time: '1d ago' },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="rounded-lg bg-secondary/40 p-4 border border-border/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-primary">{b.platform}</span>
                      <span className="text-[10px] text-muted-foreground">{b.time}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-3 leading-snug">{b.title}</p>
                    <div className="flex gap-1.5">
                      {b.tags.map((t) => (
                        <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Features ── */}
        <section className="px-6 py-24 lg:px-16 xl:px-24 max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Everything you need, nothing you don't
            </motion.h2>
          </motion.div>

          <div className="space-y-20">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className={`flex flex-col ${i % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}
              >
                {/* Text */}
                <motion.div variants={fadeUp} custom={0} className="flex-1 max-w-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-5">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">{f.detail}</p>
                </motion.div>

                {/* Visual */}
                <motion.div variants={fadeUp} custom={1} className="flex-1 w-full">
                  <div className="rounded-xl glass-card p-5">
                    {i === 0 && (
                      <div className="space-y-3">
                        {PLATFORMS.slice(0, 4).map((p) => (
                          <div key={p.name} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
                            <span className={`text-sm ${p.color}`}>{p.icon}</span>
                            <span className="text-sm text-foreground">{p.name}</span>
                            <span className="ml-auto text-xs text-primary">Connected</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {i === 1 && (
                      <div className="space-y-3">
                        {AI_CAPABILITIES.map((c) => (
                          <div key={c.label} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
                            <c.icon className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{c.label}</p>
                              <p className="text-xs text-muted-foreground">{c.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {i === 2 && (
                      <div className="space-y-3">
                        {DEV_WORKFLOWS.map((w) => (
                          <div key={w.label} className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
                            <w.icon className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{w.label}</p>
                              <p className="text-xs text-muted-foreground">{w.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Social proof / Built by ── */}
        <section className="px-6 py-20 lg:px-16 xl:px-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex h-16 w-16 items-center justify-center rounded-2xl glass-card-elevated glow-ring mb-6">
              <Layers className="h-8 w-8 text-primary" />
            </motion.div>

            <motion.h2 variants={fadeUp} custom={1} className="text-3xl font-bold text-foreground mb-4">
              Built for everyone
            </motion.h2>

            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
              I was tired of losing great tweets, tutorials, and threads across 10 tabs.
              So I built the tool I wanted. MarkManager is opinionated, fast, and designed for how everyone actually consumes content.
            </motion.p>

            <motion.a
              variants={fadeUp}
              custom={3}
              href="https://x.com/abhxy03"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-accent transition-colors"
            >
              Follow @abhxy03 on X <ExternalLink className="h-3.5 w-3.5" />
            </motion.a>

            {/* Trust badges */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-10 flex flex-wrap items-center justify-center gap-6"
            >
              {TRUST.map((t) => (
                <div key={t.text} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <t.icon className="h-3.5 w-3.5 text-primary/50" />
                  {t.text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ── CTA ── */}
        <section className="px-6 pb-12 lg:px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center glass-card-elevated rounded-2xl p-10"
          >
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Stop losing great content
            </h2>
            <p className="text-muted-foreground mb-6">
              Join developers who save smarter, not harder.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8 h-12 text-base">
                Sign up — it's free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* ── Footer ── */}
        <footer className="px-6 py-8 lg:px-16 xl:px-24 border-t border-border/30">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
              <Layers className="h-4 w-4 text-primary/50" />
              <span>MarkManager</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <span>·</span>
              <a href="https://x.com/abhxy03" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                By Abhay Parekh
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
