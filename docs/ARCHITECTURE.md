# Plataforma de Cursos - Arquitetura

## Estrutura de Pastas

```
/src
  /app           # Configuração global (rotas, RBAC, providers)
  /components    # Componentes reutilizáveis
    /layout      # Layouts (Public, Authed, Teacher, Student, Admin)
    /ui          # shadcn-ui components
  /features      # Módulos por domínio
    /auth        # Autenticação
    /users       # Perfis de usuários
    /courses     # Cursos, seções, aulas
    /uploads     # Upload de vídeos
  /lib           # Utilitários (env, supabase client, error handling)
  /hooks         # Hooks customizados
  /integrations  # Integrações externas (Supabase auto-gerado)

/supabase
  /migrations    # SQL migrations
  /functions     # Edge functions

/docs            # Documentação
```

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui
- Lovable Cloud (Supabase)
- React Router v6
- Zod para validação

## RBAC
- PROFESSOR: Cria/edita cursos próprios
- ESTUDANTE: Visualiza cursos públicos
- ADMIN: Acesso total (criado manualmente)

## RLS
Todas as tabelas têm Row Level Security ativo com policies por role.
