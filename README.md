# LearnBridge LMS

> Plataforma de cursos online desenvolvida com React, TypeScript, Vite e Supabase seguindo Clean Architecture.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Início Rápido](#-início-rápido)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Documentação](#-documentação)
- [Licença](#-licença)

## 🎯 Visão Geral

O **LearnBridge** é uma plataforma de Learning Management System (LMS) que conecta professores e estudantes. Permite a criação, venda e consumo de cursos online com recursos avançados como:

- 🎓 **Três papéis de usuário**: Estudante, Professor e Administrador
- 📚 **Gestão de cursos**: Criação, edição, publicação e organização em seções/aulas
- 🎥 **Múltiplos tipos de conteúdo**: Vídeo (YouTube/upload), texto rico e quizzes
- 🛒 **Carrinho de compras**: Sistema de compra e matrícula
- 📊 **Dashboards personalizados**: Para cada papel de usuário
- 🌓 **Tema claro/escuro**: Design system moderno
- ✅ **Progresso de aulas**: Tracking de conclusão para estudantes

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Estilização** | Tailwind CSS, shadcn/ui (Radix) |
| **Estado** | TanStack Query (React Query) |
| **Roteamento** | React Router DOM v6 |
| **Backend** | Lovable Cloud (Supabase) |
| **Autenticação** | Supabase Auth |
| **Banco de Dados** | PostgreSQL (via Supabase) |
| **Armazenamento** | Supabase Storage |
| **Arquitetura** | Clean Architecture + MVVM |
| **Testes** | Vitest, Testing Library |

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd learnbridge

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

> **Nota**: O projeto Lovable Cloud já configura essas variáveis automaticamente.

## 📁 Estrutura do Projeto

```
src/
├── assets/              # Imagens e recursos estáticos
├── components/          # Componentes reutilizáveis
│   ├── ui/              # Componentes shadcn/ui
│   ├── auth/            # Componentes de autenticação
│   ├── layout/          # Layouts (Dashboard, Public)
│   ├── lesson/          # Componentes de aula
│   ├── cart/            # Componentes de carrinho
│   └── teacher/         # Componentes do professor
├── contexts/            # Contextos React (Auth, Theme)
├── features/            # Features organizadas por Clean Architecture
│   ├── auth/            # Autenticação
│   ├── courses/         # Cursos e matrículas
│   ├── cart/            # Carrinho de compras
│   ├── teacher/         # Área do professor
│   ├── student/         # Área do estudante
│   └── admin/           # Área administrativa
├── hooks/               # Hooks customizados
├── integrations/        # Integrações externas (Supabase)
├── lib/                 # Utilitários
├── pages/               # Páginas da aplicação
└── types/               # Tipos TypeScript globais

tests/
├── unit/                # Testes unitários
├── helpers/             # Factories e mocks
└── setup.ts             # Configuração global

docs/                    # Documentação técnica
supabase/                # Configuração Supabase
```

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Visualiza o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run test` | Executa os testes |
| `npm run test:unit` | Executa apenas testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Relatório de cobertura |

## 📖 Documentação

Documentação técnica detalhada está disponível na pasta `/docs`:

| Documento | Descrição |
|-----------|-----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura e decisões técnicas |
| [SETUP.md](docs/SETUP.md) | Setup local e ambientes |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy e variáveis |
| [ROUTES.md](docs/ROUTES.md) | Rotas e endpoints |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Modelo de dados |
| [AUTH_RBAC.md](docs/AUTH_RBAC.md) | Autenticação e RBAC |
| [ERRORS_LOGGING.md](docs/ERRORS_LOGGING.md) | Tratamento de erros |
| [TESTING.md](TESTING.md) | Testes |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de mudanças |
| [MIGRATION_NOTES.md](MIGRATION_NOTES.md) | Notas de migração |

## 🔧 Desenvolvimento

### Como rodar testes

```bash
# Executar todos os testes
npm run test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Como adicionar uma nova feature

1. Criar estrutura em `src/features/[nova-feature]/`
2. Seguir o padrão Clean Architecture (domain → data → di → presentation)
3. Adicionar testes unitários
4. Documentar no CHANGELOG.md

### Deploy

Opção 1: **Lovable** - Clique em Share > Publish

Opção 2: **Vercel** - Conecte o repositório e configure variáveis

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para detalhes.

## 📄 Licença

Este projeto é privado e de uso restrito.

---

Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)
