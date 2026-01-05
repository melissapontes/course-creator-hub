// Forgot Password Page View
// Implements MVVM pattern - acts as the View

import { Link } from 'react-router-dom';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPageView() {
  const viewModel = useForgotPasswordViewModel();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await viewModel.submit();

    if (!result.success) {
      toast({
        title: 'Erro',
        description: result.error?.message || 'Ocorreu um erro ao enviar o email. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-subtle">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">LearnBridge</span>
          </Link>

          {!viewModel.isEmailSent ? (
            <>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Esqueceu a senha?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Digite seu email e enviaremos um link para redefinir sua senha
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Email enviado!
              </h1>
              <p className="mt-2 text-muted-foreground">
                Verifique sua caixa de entrada e clique no link para redefinir sua senha
              </p>
            </>
          )}
        </div>

        {!viewModel.isEmailSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={viewModel.email}
                  onChange={(e) => viewModel.setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {viewModel.validationError && (
              <p className="text-sm text-destructive">{viewModel.validationError}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={viewModel.isSubmitting}>
              {viewModel.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>
          </form>
        ) : (
          <Button asChild className="w-full" size="lg" variant="outline">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para login
            </Link>
          </Button>
        )}

        {!viewModel.isEmailSent && (
          <p className="text-center text-muted-foreground">
            <Link to="/login" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar para login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
