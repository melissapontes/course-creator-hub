import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BookOpen, ArrowRight, GraduationCap, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { authUser } = useAuth();

  const getDashboardLink = () => {
    if (!authUser) return '/register';
    switch (authUser.role) {
      case 'PROFESSOR':
        return '/teacher';
      case 'ESTUDANTE':
        return '/student';
      case 'ADMIN':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-hero flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">EduFlow</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/courses" className="hidden sm:block">
              <Button variant="ghost">Explorar Cursos</Button>
            </Link>
            <ThemeToggle />
            {authUser ? (
              <Link to={getDashboardLink()}>
                <Button>Ir ao Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/register" className="hidden sm:block">
                  <Button>Começar Grátis</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Play className="w-4 h-4" />
            Plataforma de cursos online
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-foreground mb-6 animate-slide-up">
            Aprenda novas habilidades.{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Transforme sua carreira.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up animation-delay-100">
            Acesse centenas de cursos ministrados por especialistas. 
            Desenvolva suas habilidades no seu próprio ritmo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
            <Link to={authUser ? getDashboardLink() : '/register'}>
              <Button size="lg" className="text-lg px-8 w-full sm:w-auto">
                {authUser ? 'Ir ao Dashboard' : 'Criar conta grátis'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/courses">
              <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-auto">
                Explorar cursos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Por que escolher o EduFlow?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para aprender e ensinar
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="card-elevated p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Professores Especialistas</h3>
              <p className="text-muted-foreground text-sm">
                Aprenda com profissionais experientes em suas áreas
              </p>
            </div>
            <div className="card-elevated p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Play className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Aprenda no Seu Ritmo</h3>
              <p className="text-muted-foreground text-sm">
                Acesse o conteúdo quando e onde quiser
              </p>
            </div>
            <div className="card-elevated p-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">Certificados</h3>
              <p className="text-muted-foreground text-sm">
                Receba certificados ao concluir os cursos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-hero rounded-2xl p-12 text-center text-primary-foreground max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Crie sua conta gratuita e comece a aprender hoje mesmo
            </p>
            <Link to={authUser ? getDashboardLink() : '/register'}>
              <Button size="lg" variant="secondary" className="text-lg px-8">
                {authUser ? 'Acessar Dashboard' : 'Criar conta grátis'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} EduFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
