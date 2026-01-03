import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BookMarked,
  PlusCircle,
  User,
  LogOut,
  GraduationCap,
  Menu,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import logoImage from '@/assets/logo.png';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { authUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const teacherNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/teacher', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Meus Cursos', href: '/teacher/courses', icon: <BookMarked className="w-5 h-5" /> },
    { label: 'Novo Curso', href: '/teacher/courses/new', icon: <PlusCircle className="w-5 h-5" /> },
  ];

  const studentNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/student', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Explorar Cursos', href: '/courses', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Professores', href: '/admin/professors', icon: <Users className="w-5 h-5" /> },
    { label: 'Estudantes', href: '/admin/students', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  const navItems = authUser?.role === 'ADMIN' 
    ? adminNavItems 
    : authUser?.role === 'PROFESSOR' 
      ? teacherNavItems 
      : studentNavItems;

  const getInitials = () => {
    if (authUser?.profile?.full_name) {
      return authUser.profile.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <Link to="/" className="flex items-center gap-2">
          <img src={logoImage} alt="Learning Bridge" className="w-8 h-8 object-contain" />
          <span className="text-lg font-display font-bold">Learning Bridge</span>
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-sidebar text-sidebar-foreground transform transition-all duration-200 ease-in-out lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-sidebar-border justify-between">
            <Link to="/" className="flex items-center gap-2 overflow-hidden">
              <img src={logoImage} alt="Learning Bridge" className="w-8 h-8 object-contain flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-lg font-display font-bold whitespace-nowrap">Learning Bridge</span>
              )}
            </Link>
            {/* Desktop collapse button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    sidebarCollapsed && 'lg:justify-center lg:px-2',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span className="lg:block">{item.label}</span>}
                  {sidebarCollapsed && <span className="lg:hidden">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className={cn("flex items-center gap-3 mb-3", sidebarCollapsed && "lg:justify-center")}>
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-medium flex-shrink-0">
                {getInitials()}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 lg:block">
                  <p className="text-sm font-medium truncate">{authUser?.profile?.full_name}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{authUser?.email}</p>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="flex-1 min-w-0 lg:hidden">
                  <p className="text-sm font-medium truncate">{authUser?.profile?.full_name}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{authUser?.email}</p>
                </div>
              )}
            </div>
            <div className={cn("flex items-center gap-2", sidebarCollapsed && "lg:flex-col")}>
              <Link to="/profile" className={cn("flex-1", sidebarCollapsed && "lg:w-full")} onClick={() => setSidebarOpen(false)}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  title={sidebarCollapsed ? "Perfil" : undefined}
                  className={cn(
                    "w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                    sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-start"
                  )}
                >
                  <User className={cn("w-4 h-4", !sidebarCollapsed && "mr-2")} />
                  {!sidebarCollapsed && <span className="lg:inline">Perfil</span>}
                  {sidebarCollapsed && <span className="lg:hidden">Perfil</span>}
                </Button>
              </Link>
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              title={sidebarCollapsed ? "Sair" : undefined}
              className={cn(
                "w-full mt-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10",
                sidebarCollapsed ? "lg:justify-center lg:px-2" : "justify-start"
              )}
            >
              <LogOut className={cn("w-4 h-4", !sidebarCollapsed && "mr-2")} />
              {!sidebarCollapsed && <span className="lg:inline">Sair</span>}
              {sidebarCollapsed && <span className="lg:hidden">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-200",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <div className="pt-16 lg:pt-0 p-6">{children}</div>
      </main>
    </div>
  );
}
