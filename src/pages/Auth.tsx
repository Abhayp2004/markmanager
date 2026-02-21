import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  Loader2,
  Layers,
  Shield,
  Zap,
  FolderOpen,
  Sparkles,
  Lock,
  Eye,
} from 'lucide-react';
import { z } from 'zod';
import { GeometricBackground } from '@/components/GeometricBackground';
import { lovable } from '@/integrations/lovable/index';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const FEATURES = [
  {
    icon: Zap,
    title: 'Multi-platform',
    desc: 'X, YouTube, Reddit, Medium — all in one place.',
  },
  {
    icon: Sparkles,
    title: 'AI-powered',
    desc: 'Auto-tag, summarize, and ask questions about your saves.',
  },
  {
    icon: FolderOpen,
    title: 'Smart organization',
    desc: 'Folders, priority pins, and full-text search.',
  },
];

const TRUST_POINTS = [
  { icon: Shield, text: 'End-to-end encrypted storage' },
  { icon: Lock, text: 'Your data is never sold or shared' },
  { icon: Eye, text: 'Export or delete everything anytime' },
];

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center ocean-gradient-bg">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full animate-pulse" />
          <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'Validation Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setIsSubmitting(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('User already registered')) {
        message = 'This email is already registered. Try logging in instead.';
      } else if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please try again.';
      }

      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } else if (!isLogin) {
      toast({
        title: 'Account created!',
        description: 'You can now log in with your credentials.',
      });
      setIsLogin(true);
    }
  };

  return (
    <div className="relative min-h-screen ocean-gradient-bg overflow-hidden">
      <GeometricBackground />

      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[100px]" />
      </div>

      {/* Main content: split layout on desktop */}
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row lg:items-center lg:justify-center">
        {/* Left side — branding & value prop */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 lg:max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex flex-col items-center lg:items-start gap-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl glass-card-elevated glow-ring">
                <Layers className="h-8 w-8 text-primary" />
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight text-center lg:text-left">
                <span className="text-gradient">Mark</span>
                <span className="font-light italic tracking-wide">Manager</span>
              </h1>
            </div>

            <p className="mt-3 text-lg text-muted-foreground max-w-md leading-relaxed">
              The unified bookmark manager that makes saving, organizing,
              and rediscovering content effortless.
            </p>

            {/* Feature bullets */}
            <div className="mt-8 space-y-4 max-w-md">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="mt-6 flex flex-wrap gap-3"
            >
              {TRUST_POINTS.map((t) => (
                <div
                  key={t.text}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground/80"
                >
                  <t.icon className="h-3 w-3 text-primary/60" />
                  {t.text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Right side — auth form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full max-w-sm"
          >
            <div className="glass-card-elevated rounded-3xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  {isLogin ? 'Welcome back' : 'Get started'}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isLogin
                    ? 'Sign in to access your bookmarks'
                    : 'Create your account in seconds'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/30 rounded-xl transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/30 rounded-xl transition-all duration-200"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl text-base font-medium gap-3 border-border/50 hover:bg-secondary/50 transition-all duration-200"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    toast({
                      title: 'Error',
                      description: error.message || 'Failed to sign in with Google',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>

            </div>

            {/* Footer links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground/60"
            >
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <span>·</span>
              <a
                href="https://x.com/abhxy03"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                By Abhay Parekh
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
