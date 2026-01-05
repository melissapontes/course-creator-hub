# Arquitetura do LearnBridge LMS

Este documento descreve a arquitetura técnica do projeto, padrões de design e decisões arquiteturais.

## 📐 Visão Geral da Arquitetura

O LearnBridge segue **Clean Architecture** combinada com **MVVM (Model-View-ViewModel)** no frontend, garantindo separação de responsabilidades e testabilidade.

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │  Components │  │  Contexts/Providers │  │
│  │  (Views)    │  │    (UI)     │  │   (State Global)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         └────────────────┼─────────────────────┘              │
│                          ▼                                    │
│                   ┌─────────────┐                            │
│                   │ ViewModels  │ (Hooks com lógica)         │
│                   │  (Hooks)    │                            │
│                   └──────┬──────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                      DOMAIN                                  │
│                          ▼                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Entities   │  │  Use Cases  │  │ Repository Interfaces│  │
│  │  (Models)   │  │  (Business) │  │    (Contracts)       │  │
│  └─────────────┘  └──────┬──────┘  └──────────┬──────────┘  │
└──────────────────────────┼─────────────────────┼─────────────┘
                           │                     │
┌──────────────────────────┼─────────────────────┼─────────────┐
│                      DATA                      │              │
│                          ▼                     ▼              │
│  ┌─────────────────────────────┐  ┌─────────────────────┐   │
│  │   Repository Implementations │  │    Data Sources     │   │
│  │      (Adapters)              │  │    (Supabase)       │   │
│  └─────────────────────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## 🏗 Estrutura de Features

Cada feature segue o padrão Clean Architecture:

```
src/features/{feature}/
├── data/                      # Camada de Dados
│   ├── datasources/           # Implementações Supabase
│   │   ├── IDataSource.ts     # Interface do data source
│   │   └── SupabaseDS.ts      # Implementação Supabase
│   └── repositories/          # Implementações de repositório
│       └── RepositoryImpl.ts
│
├── domain/                    # Camada de Domínio (CORE)
│   ├── entities/              # Entidades e Value Objects
│   │   ├── User.ts
│   │   └── index.ts
│   ├── repositories/          # Interfaces de repositório
│   │   └── IRepository.ts
│   └── usecases/              # Casos de uso (regras de negócio)
│       ├── SignInUseCase.ts
│       └── index.ts
│
├── di/                        # Injeção de Dependência
│   └── container.ts           # Factory de instâncias
│
├── presentation/              # Camada de Apresentação
│   ├── context/               # Contextos React
│   ├── viewmodels/            # ViewModels (hooks)
│   └── views/                 # Componentes de view
│
└── index.ts                   # Barrel export
```

## 🎯 Decisões Arquiteturais

### 1. Por que Clean Architecture?

| Benefício | Descrição |
|-----------|-----------|
| **Testabilidade** | Use cases e lógica de negócio são facilmente testáveis |
| **Manutenibilidade** | Código organizado por responsabilidade |
| **Flexibilidade** | Troca de frameworks/libs sem afetar domínio |
| **Escalabilidade** | Novas features seguem o mesmo padrão |

### 2. Injeção de Dependência

Utilizamos o padrão **Container** para gerenciar instâncias singleton:

```typescript
// src/features/auth/di/authContainer.ts
let authRepository: IAuthRepository | null = null;

export function getAuthRepository(): IAuthRepository {
  if (!authRepository) {
    const dataSource = new SupabaseAuthDataSource();
    authRepository = new AuthRepositoryImpl(dataSource);
  }
  return authRepository;
}

export function createSignInUseCase(): SignInUseCase {
  return new SignInUseCase(getAuthRepository());
}
```

### 3. ViewModels como Hooks

Os ViewModels são implementados como hooks React, conectando a UI aos use cases:

```typescript
export function useAuthViewModel() {
  const [state, setState] = useState<AuthState>(initialState);
  
  const signIn = async (email: string, password: string) => {
    const useCase = createSignInUseCase();
    const result = await useCase.execute({ email, password });
    // ...atualiza estado
  };

  return { ...state, signIn };
}
```

### 4. Separação de Entidades

Entidades de domínio são **puras** e não dependem de frameworks:

```typescript
// ✅ Correto - Entidade pura
export interface User {
  id: string;
  email: string;
  role: AppRole;
}

// ❌ Incorreto - Não misture com Supabase
export interface User extends SupabaseUser { }
```

## 📊 Fluxo de Dados

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

## 🗂 Módulos do Sistema

| Módulo | Responsabilidade | Status |
|--------|------------------|--------|
| `auth` | Autenticação, perfil, roles | ✅ Completo |
| `courses` | Cursos, seções, aulas, matrículas | ✅ Completo |
| `cart` | Carrinho de compras, checkout | ✅ Completo |
| `teacher` | Dashboard e gestão do professor | ✅ Completo |
| `student` | Dashboard e progresso do estudante | ✅ Completo |
| `admin` | Gestão administrativa da plataforma | ✅ Completo |

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas críticas possuem RLS habilitado com policies por operação.

### Validação de Papéis

- **Frontend**: `ProtectedRoute` verifica roles
- **Backend**: RLS + functions `has_role()` e `is_course_owner()`
- **ADMIN**: Não pode ser auto-registrado (bloqueio por trigger)

## 🎨 Design System

O projeto utiliza um design system baseado em tokens CSS:

```css
:root {
  --primary: 222 67% 48%;        /* Azul profundo */
  --accent: 174 72% 40%;          /* Teal vibrante */
  --background: 210 20% 98%;
  --foreground: 222 47% 11%;
}
```

Componentes utilizam **exclusivamente** tokens semânticos.

## 📚 Como Adicionar uma Nova Feature

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

4. **Presentation Layer**
   - Criar viewmodels em `features/[feature]/presentation/viewmodels/`
   - Criar views em `features/[feature]/presentation/views/`
   - Criar context se necessário

## 📖 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [MVVM Pattern](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
