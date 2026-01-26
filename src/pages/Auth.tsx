import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, Layers } from 'lucide-react';
import { z } from 'zod';
import { GeometricBackground } from '@/components/GeometricBackground';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

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
    <div className="relative flex min-h-screen items-center justify-center ocean-gradient-bg p-4 overflow-hidden">
      {/* Three.js Background */}
      <GeometricBackground />

      {/* Ambient glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl glass-card-elevated glow-ring">
            <Layers className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Bookmark<span className="text-gradient">Hub</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Your unified bookmark manager
          </p>
        </div>

        {/* Auth form */}
        <div 
          className="glass-card-elevated rounded-3xl p-8 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
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

          <div className="mt-6 text-center">
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

        {/* Creator credit */}
        <footer 
          className="mt-8 text-center animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <p className="text-sm text-muted-foreground/70">
            Created by{" "}
            <a
              href="https://x.com/abhxy03"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/80 hover:text-primary transition-colors font-medium"
            >
              Abhay Parekh
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
