// Login Page View
// Implements MVVM pattern - acts as the View

import { Link } from 'react-router-dom';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, ArrowRight, BookOpen } from 'lucide-react';

export default function LoginPageView() {
  const viewModel = useLoginViewModel();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await viewModel.submit();

    if (!result.success) {
      toast({
        title: 'Erro ao entrar',
        description: result.error?.message || 'Ocorreu um erro ao fazer login',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Bem-vindo de volta!',
      description: 'Login realizado com sucesso',
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">EduFlow</span>
            </Link>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Entre na sua conta para continuar aprendendo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={viewModel.formData.email}
                    onChange={(e) => viewModel.setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
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
                <>
                  Entrar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground animate-slide-up">
          <h2 className="text-4xl font-display font-bold mb-4">
            Aprenda no seu ritmo
          </h2>
          <p className="text-lg opacity-90">
            Acesse cursos de alta qualidade ministrados por especialistas.
            Desenvolva novas habilidades e alcance seus objetivos profissionais.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-80">Cursos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">50k+</div>
              <div className="text-sm opacity-80">Alunos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">100+</div>
              <div className="text-sm opacity-80">Professores</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
