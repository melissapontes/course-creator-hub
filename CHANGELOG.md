# Changelog

Histórico de mudanças e evolução do LearnBridge LMS.

## Formato

O changelog segue o padrão [Keep a Changelog](https://keepachangelog.com/).

- **Added**: Novas funcionalidades
- **Changed**: Mudanças em funcionalidades existentes
- **Deprecated**: Funcionalidades que serão removidas
- **Removed**: Funcionalidades removidas
- **Fixed**: Correções de bugs
- **Security**: Correções de segurança

---

## [Unreleased]

### Added
- Documentação técnica completa (ARCHITECTURE, SETUP, ROUTES, etc.)
- JSDoc em funções críticas

---

## [1.0.0] - 2025-01-04

### Added

#### Infraestrutura
- Setup inicial com Vite + React 18 + TypeScript
- Configuração Tailwind CSS com design system customizado
- Integração Lovable Cloud (Supabase)
- Sistema de temas (claro/escuro)

#### Arquitetura
- Clean Architecture com MVVM
- Estrutura de features modular
- Injeção de dependência via containers
- Separação de camadas (Domain, Data, Presentation)

#### Autenticação
- Login com email/senha
- Registro de usuários (PROFESSOR, ESTUDANTE)
- Reset de senha
- Proteção de rotas por role
- Auto-confirm de email

#### RBAC
- Sistema de papéis (PROFESSOR, ESTUDANTE, ADMIN)
- Proteção via RLS no banco
- Funções de segurança (has_role, is_course_owner)
- Bloqueio de auto-registro de ADMIN

#### Cursos
- Criação de cursos (professor)
- Seções e aulas organizadas
- Tipos de conteúdo: YouTube, upload de vídeo, texto, quiz
- Publicação/despublicação
- Catálogo público com filtros

#### Sistema de Aulas
- Player de vídeo (YouTube embed)
- Conteúdo de texto formatado
- Sistema de quiz com perguntas e opções
- Progresso de conclusão por aula
- Comentários em aulas

#### Carrinho e Compras
- Adicionar/remover cursos do carrinho
- Checkout (simulado)
- Verificação de matrícula existente

#### Dashboards
- Dashboard do Professor (vendas, cursos, receita)
- Dashboard do Estudante (cursos matriculados, progresso)
- Dashboard do Admin (estatísticas gerais)

#### Gestão (Professor)
- Edição de informações do curso (modal)
- Edição de currículo (seções/aulas)
- Moderação de comentários
- Modo professor no player

#### UI/UX
- Design system com tokens semânticos
- Componentes shadcn/ui
- Responsividade mobile-first
- Animações e transições

#### Testes
- Setup Vitest com Testing Library
- Testes unitários para Use Cases
- Testes para entidades de domínio
- Factories e mocks reutilizáveis

### Changed
- Migração do AuthContext para Clean Architecture
- Consolidação de rotas de edição de curso

### Fixed
- Navegação do botão voltar no modo professor
- Redirecionamento após login baseado em role

### Security
- RLS em todas as tabelas críticas
- Proteção contra escalação de privilégios
- Validação de ownership em operações sensíveis

---

## [0.1.0] - 2024-12 (Milestone Inicial)

### Added
- Estrutura inicial do projeto
- Configuração básica de autenticação
- Primeiras páginas e layouts
- Integração inicial com Supabase

---

## Roadmap (Planejado)

### v1.1.0
- [ ] Sistema de pagamentos (Stripe)
- [ ] Certificados de conclusão
- [ ] Upload de vídeo direto (não YouTube)

### v1.2.0
- [ ] Analytics para professores
- [ ] Sistema de cupons de desconto
- [ ] Avaliações com moderação

### v2.0.0
- [ ] App mobile (React Native)
- [ ] Gamificação (badges, pontos)
- [ ] Marketplace de afiliados

---

## Notas de Versão

### Sobre Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades retrocompatíveis
- **PATCH**: Correções de bugs

### Contribuindo

Ao adicionar mudanças ao changelog:

1. Adicione na seção `[Unreleased]`
2. Use a categoria apropriada (Added, Changed, etc.)
3. Seja conciso mas descritivo
4. Inclua referências a issues/PRs quando aplicável
