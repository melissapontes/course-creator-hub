import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User, ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';
import { AppRole } from '@/types/auth';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['PROFESSOR', 'ESTUDANTE']),
});

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PROFESSOR' | 'ESTUDANTE'>('ESTUDANTE');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registerSchema.safeParse({ fullName, email, password, role });
    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      let message = 'Ocorreu um erro ao criar conta';
      if (error.message.includes('already registered')) {
        message = 'Este email já está cadastrado';
      } else if (error.message.includes('Password')) {
        message = 'Senha muito fraca. Use pelo menos 8 caracteres';
      }
      
      toast({
        title: 'Erro ao criar conta',
        description: message,
        variant: 'destructive',
      });
      setLoading(false);
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
              <span className="text-2xl font-display font-bold text-foreground">EduFlow</span>
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
                  value={role}
                  onValueChange={(value) => setRole(value as 'PROFESSOR' | 'ESTUDANTE')}
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
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
