# Plataforma de Cursos - Arquitetura

## Estrutura de Pastas (Clean Architecture)

```
/src
  /features                    # Módulos por domínio (Clean Architecture)
    /auth                      # Feature de Autenticação
      /domain
        /entities              # User, AuthCredentials, AuthResult
        /repositories          # IAuthRepository, IUserRepository
        /usecases              # SignIn, SignUp, SignOut, ResetPassword, UpdateProfile
      /data
        /datasources           # SupabaseAuthDataSource, SupabaseUserDataSource
        /repositories          # AuthRepositoryImpl, UserRepositoryImpl
      /presentation
        /viewmodels            # useAuthViewModel, useLoginViewModel, etc.
        /views                 # LoginPageView, RegisterPageView, etc.
        /context               # AuthContext (Provider)
      /di                      # authContainer (DI factory)
    
    /courses                   # Feature de Cursos
      /domain
        /entities              # Course, Section, Lesson, Enrollment, Rating
        /repositories          # ICourseRepository, IEnrollmentRepository
        /usecases              # GetPublishedCourses, GetCourseDetails, etc.
      /data
        /datasources           # SupabaseCourseDataSource, SupabaseEnrollmentDataSource
        /repositories          # CourseRepositoryImpl, EnrollmentRepositoryImpl
      /di                      # coursesContainer
    
    /cart                      # Feature de Carrinho
      /domain
        /entities              # CartItem, CartSummary
        /repositories          # ICartRepository
        /usecases              # GetCartSummary, AddToCart, Checkout
      /data
        /datasources           # SupabaseCartDataSource
        /repositories          # CartRepositoryImpl
      /di                      # cartContainer
    
    /teacher                   # Feature do Professor
      /domain
        /entities              # TeacherStats, TeacherCourse
        /repositories          # ITeacherRepository
        /usecases              # GetTeacherDashboard
      /data
        /datasources           # SupabaseTeacherDataSource
        /repositories          # TeacherRepositoryImpl
      /di                      # teacherContainer
    
    /student                   # Feature do Estudante
      /domain
        /entities              # StudentStats (re-exports de courses)
        /usecases              # Re-exports de courses
      /di                      # Re-exports de courses
    
    /admin                     # Feature de Administração
      /domain
        /entities              # AdminStats, ProfessorData, StudentData
        /repositories          # IAdminRepository
        /usecases              # GetAdminDashboard, GetProfessorsData, etc.
      /data
        /datasources           # SupabaseAdminDataSource
        /repositories          # AdminRepositoryImpl
      /di                      # adminContainer
  
  /components                  # Componentes reutilizáveis (compartilhados)
    /layout                    # DashboardLayout, PublicLayout
    /ui                        # shadcn-ui components
    /lesson                    # VideoPlayer, LessonSidebar, etc.
    /cart                      # CartSheet
  
  /contexts                    # Contextos globais (re-exports de features)
  /hooks                       # Hooks globais
  /pages                       # Páginas (re-exports de features/views)
  /lib                         # Utilitários
  /integrations                # Supabase client (auto-gerado)
  /types                       # Tipos globais (re-exports de features)

/supabase
  /migrations                  # SQL migrations
  /functions                   # Edge functions

/docs                          # Documentação
```

## Clean Architecture - Camadas

### Domain Layer (Domínio)
- **Entities**: Modelos de domínio puros, sem dependências de framework
- **Repositories (Interfaces)**: Contratos para acesso a dados
- **Use Cases**: Um caso de uso por funcionalidade, encapsulando regras de negócio

### Data Layer (Dados)
- **DataSources (Interfaces/Impl)**: Acesso direto às fontes de dados (Supabase)
- **Repositories (Implementações)**: Implementam interfaces do domínio usando DataSources

### Presentation Layer (Apresentação - MVVM)
- **ViewModels**: Hooks React que gerenciam estado e lógica de apresentação
- **Views**: Componentes React que renderizam UI
- **Context**: Providers React para estado compartilhado

### DI Layer (Injeção de Dependência)
- **Container**: Factory functions que criam e fornecem dependências
- Singletons para DataSources e Repositories
- Factory functions para Use Cases

## Princípios Aplicados

1. **Baixo Acoplamento**: Camadas comunicam-se através de interfaces
2. **Alta Coesão**: Cada módulo tem responsabilidade única
3. **Inversão de Dependência**: Domínio não depende de detalhes de implementação
4. **Injeção de Dependência**: Dependências são fornecidas, não criadas internamente
5. **Testabilidade**: Use Cases e Repositories podem ser testados isoladamente

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui
- Lovable Cloud (Supabase)
- React Router v6
- Zod para validação
- TanStack Query para cache

## RBAC
- PROFESSOR: Cria/edita cursos próprios
- ESTUDANTE: Visualiza cursos públicos
- ADMIN: Acesso total (criado manualmente)

## RLS
Todas as tabelas têm Row Level Security ativo com policies por role.

## Features Implementadas com Clean Architecture

| Feature | Domain | Data | Presentation | DI |
|---------|--------|------|--------------|-----|
| Auth | ✅ | ✅ | ✅ (MVVM) | ✅ |
| Courses | ✅ | ✅ | Parcial | ✅ |
| Cart | ✅ | ✅ | Parcial | ✅ |
| Teacher | ✅ | ✅ | Parcial | ✅ |
| Student | ✅ | (via courses) | Parcial | ✅ |
| Admin | ✅ | ✅ | Parcial | ✅ |

## Fluxo de Dados

```
View (React Component)
    ↓ eventos de usuário
ViewModel (useXxxViewModel hook)
    ↓ chamadas de métodos
Use Case (classe com execute())
    ↓ operações de negócio
Repository Interface (IXxxRepository)
    ↓ (injeção de dependência)
Repository Implementation (XxxRepositoryImpl)
    ↓ orquestração
DataSource (SupabaseXxxDataSource)
    ↓ chamadas de API
Supabase Client
```

## Como Adicionar uma Nova Feature

1. **Domain Layer**
   - Criar entities em `features/[feature]/domain/entities/`
   - Definir interfaces de repository em `features/[feature]/domain/repositories/`
   - Implementar use cases em `features/[feature]/domain/usecases/`

2. **Data Layer**
   - Criar datasource em `features/[feature]/data/datasources/`
   - Implementar repository em `features/[feature]/data/repositories/`

3. **DI Layer**
   - Criar container em `features/[feature]/di/`
   - Expor factory functions para repositories e use cases

4. **Presentation Layer** (quando aplicável)
   - Criar viewmodels em `features/[feature]/presentation/viewmodels/`
   - Criar views em `features/[feature]/presentation/views/`
   - Criar context se necessário em `features/[feature]/presentation/context/`
