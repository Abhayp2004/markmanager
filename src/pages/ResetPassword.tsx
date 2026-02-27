import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2, Layers, ArrowLeft } from 'lucide-react';
import { GeometricBackground } from '@/components/GeometricBackground';

export default function ResetPassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
      setLoading(false);
    });

    // Also check current session hash for recovery token
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    
    // Fallback timeout
    setTimeout(() => setLoading(false), 2000);

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Password updated! 🎉', description: 'You can now sign in with your new password.' });
        await supabase.auth.signOut({ scope: 'local' });
        navigate('/auth');
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center ocean-gradient-bg">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="relative min-h-screen ocean-gradient-bg overflow-hidden">
        <GeometricBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
            <div className="glass-card-elevated rounded-3xl p-8 text-center">
              <Layers className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Invalid Reset Link</h2>
              <p className="text-muted-foreground text-sm mb-6">This link is expired or invalid. Please request a new password reset.</p>
              <Link to="/auth">
                <Button className="w-full h-12 rounded-xl"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen ocean-gradient-bg overflow-hidden">
      <GeometricBackground />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card-elevated rounded-3xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Set new password</h2>
              <p className="text-muted-foreground mt-1">Enter your new password below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-foreground font-medium">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/30 rounded-xl"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold gap-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Update Password <ArrowRight className="h-5 w-5" /></>}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
