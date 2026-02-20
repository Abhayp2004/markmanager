import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Download, Trash2, Lock, Eye, Server } from 'lucide-react';

const SECTIONS = [
  {
    icon: Shield,
    title: 'What we collect',
    body: 'We store your email address for authentication and any bookmarks you explicitly save. We do not track browsing history, sell data, or use analytics cookies.',
  },
  {
    icon: Lock,
    title: 'How data is stored',
    body: 'All data is stored in encrypted databases with row-level security. Each user can only access their own data. We use industry-standard TLS encryption for all data in transit.',
  },
  {
    icon: Eye,
    title: 'Third-party access',
    body: 'AI features (summarization, tagging) process content through secure APIs. No third party retains your data after processing. We never share or sell your personal information.',
  },
  {
    icon: Download,
    title: 'Data export',
    body: 'You can export all your bookmarks, notes, and tags at any time from Settings. We believe your data belongs to you.',
  },
  {
    icon: Trash2,
    title: 'Account deletion',
    body: 'You can permanently delete your account and all associated data from Settings → Delete Account. This action is irreversible and removes everything within 30 days.',
  },
  {
    icon: Server,
    title: 'Data retention',
    body: 'Active accounts retain data indefinitely. Deleted accounts have all data purged within 30 days. We do not keep backups of deleted user data.',
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Privacy & Data Policy
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: February 2026. We keep it simple and transparent.
          </p>

          <div className="space-y-8">
            {SECTIONS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 border-t border-border pt-8 text-xs text-muted-foreground/60">
            <p>
              Questions? Reach out on{' '}
              <a
                href="https://x.com/abhxy03"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/70 hover:text-primary"
              >
                X @abhxy03
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
