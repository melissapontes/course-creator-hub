// Register Page View
// Implements MVVM pattern - acts as the View

import { Link } from 'react-router-dom';
import { useRegisterViewModel, RegisterRole } from '../viewmodels/useRegisterViewModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';

export default function RegisterPageView() {
  const viewModel = useRegisterViewModel();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await viewModel.submit();

    if (!result.success) {
      toast({
        title: 'Erro ao criar conta',
        description: result.error?.message || 'Ocorreu um erro ao criar conta',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Conta criada com sucesso!',
      description: 'Você será redirecionado para o dashboard',
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <div className="max-w-lg text-center text-primary-foreground animate-slide-up">
          <h2 className="text-4xl font-display font-bold mb-4">
            Comece sua jornada
          </h2>
          <p className="text-lg opacity-90">
            Junte-se à nossa comunidade de aprendizado. Seja você um professor
            compartilhando conhecimento ou um estudante buscando evolução.
          </p>
          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4 bg-primary-foreground/10 p-4 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Para Professores</div>
                <div className="text-sm opacity-80">Crie e venda seus cursos</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-primary-foreground/10 p-4 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Para Estudantes</div>
                <div className="text-sm opacity-80">Aprenda com os melhores</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">LearnBridge</span>
            </Link>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Criar conta
            </h1>
            <p className="mt-2 text-muted-foreground">
              Preencha os dados para começar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label>Tipo de conta</Label>
                <RadioGroup
                  value={viewModel.formData.role}
                  onValueChange={(value) => viewModel.setRole(value as RegisterRole)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="ESTUDANTE"
                      id="estudante"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="estudante"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <Users className="mb-2 h-6 w-6" />
                      <span className="font-medium">Estudante</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Quero aprender
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="PROFESSOR"
                      id="professor"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="professor"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                    >
                      <GraduationCap className="mb-2 h-6 w-6" />
                      <span className="font-medium">Professor</span>
                      <span className="text-xs text-muted-foreground text-center mt-1">
                        Quero ensinar
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome"
                    value={viewModel.formData.fullName}
                    onChange={(e) => viewModel.setFullName(e.target.value)}
                    className="pl-10"
                    required
                    maxLength={100}
                  />
                </div>
              </div>

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
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
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
                <p className="text-xs text-muted-foreground">
                  Mínimo de 8 caracteres
                </p>
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
                  Criar conta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
