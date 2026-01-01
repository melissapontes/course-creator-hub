import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { authUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (authUser) {
    // Redirect to appropriate dashboard based on role
    const dashboardPath = authUser.role === 'PROFESSOR' 
      ? '/teacher' 
      : authUser.role === 'ESTUDANTE' 
        ? '/student' 
        : '/admin';
    
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
