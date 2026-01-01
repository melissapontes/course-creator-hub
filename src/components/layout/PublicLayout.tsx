import { ReactNode } from 'react';
import { Header } from './Header';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">{children}</main>
      <footer className="py-8 px-4 border-t border-border bg-background">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} EduFlow. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
