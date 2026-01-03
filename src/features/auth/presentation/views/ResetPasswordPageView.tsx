// Reset Password Page View
// Implements MVVM pattern - acts as the View

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResetPasswordViewModel } from '../viewmodels/useResetPasswordViewModel';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, BookOpen, CheckCircle } from 'lucide-react';

export default function ResetPasswordPageView() {
  const viewModel = useResetPasswordViewModel();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If no session (no valid reset token), redirect to forgot password
    if (!session) {
      const timer = setTimeout(() => {
        if (!session) {
          navigate('/forgot-password');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await viewModel.submit();

    if (!result.success) {
      toast({
        title: 'Erro',
        description: result.error?.message || 'Ocorreu um erro ao redefinir a senha. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Senha alterada!',
      description: 'Sua senha foi redefinida com sucesso.',
    });

    // Redirect after a moment
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-subtle">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">EduFlow</span>
          </Link>

          {!viewModel.isSuccess ? (
            <>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Nova senha
              </h1>
              <p className="mt-2 text-muted-foreground">
                Digite sua nova senha
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Senha alterada!
              </h1>
              <p className="mt-2 text-muted-foreground">
                Você será redirecionado para o login...
              </p>
            </>
          )}
        </div>

        {!viewModel.isSuccess && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={viewModel.formData.password}
                    onChange={(e) => viewModel.setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={viewModel.formData.confirmPassword}
                    onChange={(e) => viewModel.setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>

            {viewModel.validationError && (
              <p className="text-sm text-destructive">{viewModel.validationError}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={viewModel.isSubmitting}>
              {viewModel.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Redefinir senha'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
