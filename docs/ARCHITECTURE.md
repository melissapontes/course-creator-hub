# Plataforma de Cursos - Arquitetura

## Estrutura de Pastas (Clean Architecture)

```
/src
  /features              # Módulos por domínio (Clean Architecture)
    /auth                # Feature de Autenticação
      /domain            # Camada de Domínio
        /entities        # Entidades e Value Objects
        /repositories    # Interfaces dos Repositórios
        /usecases        # Casos de Uso (regras de negócio)
      /data              # Camada de Dados
        /datasources     # Fontes de dados (Supabase)
        /repositories    # Implementações dos Repositórios
      /presentation      # Camada de Apresentação (MVVM)
        /viewmodels      # ViewModels (hooks com lógica de apresentação)
        /views           # Views (componentes React)
        /context         # Contextos React
      /di                # Injeção de Dependência
    /courses             # Feature de Cursos (a refatorar)
    /users               # Feature de Usuários (a refatorar)
    /uploads             # Feature de Uploads (a refatorar)
  
  /components            # Componentes reutilizáveis (compartilhados)
    /layout              # Layouts (Public, Authed, Teacher, Student, Admin)
    /ui                  # shadcn-ui components
  
  /contexts              # Contextos globais (legado - migrar para features)
  /hooks                 # Hooks globais (legado - migrar para features)
  /pages                 # Páginas (re-exportam views das features)
  /lib                   # Utilitários (env, error handling)
  /integrations          # Integrações externas (Supabase auto-gerado)
  /types                 # Tipos globais (legado - migrar para features)

/supabase
  /migrations            # SQL migrations
  /functions             # Edge functions

/docs                    # Documentação
```

## Clean Architecture - Camadas

### Domain Layer (Domínio)
- **Entities**: Modelos de domínio puros, sem dependências de framework
- **Repositories (Interfaces)**: Contratos para acesso a dados
- **Use Cases**: Um caso de uso por funcionalidade, encapsulando regras de negócio

### Data Layer (Dados)
- **DataSources (Interfaces)**: Contratos para fontes de dados
- **DataSources (Implementações)**: Implementações usando Supabase
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
- TanStack Query para cache (onde aplicável)

## RBAC
- PROFESSOR: Cria/edita cursos próprios
- ESTUDANTE: Visualiza cursos públicos
- ADMIN: Acesso total (criado manualmente)

## RLS
Todas as tabelas têm Row Level Security ativo com policies por role.

## Fluxo de Dados (Auth Feature)

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
DataSource Interface (IXxxDataSource)
    ↓ (injeção de dependência)
DataSource Implementation (SupabaseXxxDataSource)
    ↓ chamadas de API
Supabase Client
```
