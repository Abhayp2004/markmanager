import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { Loader2 } from 'lucide-react';
import Landing from '@/pages/Landing';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return <Dashboard />;
}
