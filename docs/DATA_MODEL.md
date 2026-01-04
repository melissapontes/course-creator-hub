# Modelo de Dados

Este documento descreve o schema do banco de dados e as entidades de domínio do EduFlow.

## 📊 Diagrama ER

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles     │────▶│    user_roles   │     │     courses     │
│   (usuários)    │     │   (papéis)      │◀────│    (cursos)     │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │                                               │
         ▼                                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   enrollments   │     │  course_ratings │     │    sections     │
│  (matrículas)   │     │  (avaliações)   │     │    (seções)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ lesson_progress │◀────│     lessons     │────▶│ lesson_comments │
│   (progresso)   │     │    (aulas)      │     │  (comentários)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ quiz_questions  │────▶│  quiz_options   │     │  quiz_attempts  │
│   (perguntas)   │     │   (opções)      │     │  (tentativas)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📋 Tabelas

### profiles

Armazena informações do perfil do usuário (extende `auth.users`).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | - | PK, referência auth.users |
| `email` | text | ❌ | - | Email do usuário |
| `full_name` | text | ❌ | - | Nome completo |
| `avatar_url` | text | ✅ | null | URL do avatar |
| `role` | app_role | ❌ | 'ESTUDANTE' | Papel do usuário |
| `status` | text | ❌ | 'ATIVO' | Status da conta |
| `created_at` | timestamptz | ❌ | now() | Data de criação |
| `updated_at` | timestamptz | ❌ | now() | Última atualização |

### user_roles

Tabela de papéis (para RLS seguro).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `user_id` | uuid | ❌ | - | FK → auth.users |
| `role` | app_role | ❌ | - | Papel |

**Unique constraint**: `(user_id, role)`

### courses

Cursos da plataforma.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `title` | text | ❌ | - | Título do curso |
| `subtitle` | text | ✅ | null | Subtítulo |
| `description` | text | ✅ | null | Descrição completa |
| `thumbnail_url` | text | ✅ | null | URL da thumbnail |
| `category` | text | ❌ | - | Categoria |
| `level` | text | ❌ | 'INICIANTE' | Nível de dificuldade |
| `language` | text | ✅ | 'Português' | Idioma |
| `status` | text | ❌ | 'RASCUNHO' | Status de publicação |
| `price` | numeric | ✅ | 0 | Preço em BRL |
| `instructor_id` | uuid | ❌ | - | FK → profiles |
| `created_at` | timestamptz | ❌ | now() | Data de criação |
| `updated_at` | timestamptz | ❌ | now() | Última atualização |

### sections

Seções/módulos de um curso.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `course_id` | uuid | ❌ | - | FK → courses |
| `title` | text | ❌ | - | Título da seção |
| `order` | integer | ❌ | 0 | Ordem de exibição |
| `created_at` | timestamptz | ❌ | now() | Data de criação |

### lessons

Aulas de uma seção.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `section_id` | uuid | ❌ | - | FK → sections |
| `title` | text | ❌ | - | Título da aula |
| `order` | integer | ❌ | 0 | Ordem de exibição |
| `content_type` | text | ❌ | 'VIDEO_UPLOAD' | Tipo de conteúdo |
| `video_file_url` | text | ✅ | null | URL do vídeo upload |
| `youtube_url` | text | ✅ | null | URL do YouTube |
| `text_content` | text | ✅ | null | Conteúdo de texto |
| `duration_seconds` | integer | ✅ | null | Duração em segundos |
| `is_preview_free` | boolean | ❌ | false | Aula gratuita |
| `created_at` | timestamptz | ❌ | now() | Data de criação |
| `updated_at` | timestamptz | ❌ | now() | Última atualização |

**content_type values**: `'YOUTUBE_LINK'`, `'VIDEO_UPLOAD'`, `'TEXTO'`, `'QUIZ'`

### enrollments

Matrículas de estudantes em cursos.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `user_id` | uuid | ❌ | - | FK → auth.users |
| `course_id` | uuid | ❌ | - | FK → courses |
| `status` | text | ❌ | 'ATIVO' | Status da matrícula |
| `enrolled_at` | timestamptz | ❌ | now() | Data da matrícula |

### lesson_progress

Progresso do estudante nas aulas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `user_id` | uuid | ❌ | - | FK → auth.users |
| `lesson_id` | uuid | ❌ | - | FK → lessons |
| `completed` | boolean | ❌ | false | Aula concluída |
| `completed_at` | timestamptz | ✅ | null | Data de conclusão |
| `created_at` | timestamptz | ❌ | now() | Data de criação |
| `updated_at` | timestamptz | ❌ | now() | Última atualização |

### cart_items

Itens no carrinho de compras.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `user_id` | uuid | ❌ | - | FK → auth.users |
| `course_id` | uuid | ❌ | - | FK → courses |
| `created_at` | timestamptz | ❌ | now() | Data de adição |

### course_ratings

Avaliações de cursos.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `course_id` | uuid | ❌ | - | FK → courses |
| `user_id` | uuid | ❌ | - | FK → auth.users |
| `rating` | integer | ❌ | - | Nota (1-5) |
| `comment` | text | ✅ | null | Comentário |
| `created_at` | timestamptz | ❌ | now() | Data de criação |
| `updated_at` | timestamptz | ❌ | now() | Última atualização |

### lesson_comments

Comentários em aulas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `lesson_id` | uuid | ❌ | - | FK → lessons |
| `user_id` | uuid | ❌ | - | FK → auth.users |
| `content` | text | ❌ | - | Conteúdo do comentário |
| `parent_id` | uuid | ✅ | null | FK → lesson_comments |
| `created_at` | timestamptz | ❌ | now() | Data de criação |
| `updated_at` | timestamptz | ❌ | now() | Última atualização |

### quiz_questions

Perguntas de quiz.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `lesson_id` | uuid | ❌ | - | FK → lessons |
| `question` | text | ❌ | - | Texto da pergunta |
| `question_order` | integer | ❌ | 0 | Ordem |
| `created_at` | timestamptz | ❌ | now() | Data de criação |

### quiz_options

Opções de resposta.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `question_id` | uuid | ❌ | - | FK → quiz_questions |
| `option_text` | text | ❌ | - | Texto da opção |
| `option_order` | integer | ❌ | 0 | Ordem |
| `is_correct` | boolean | ❌ | false | É a resposta correta |

### quiz_attempts

Tentativas de quiz.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | ❌ | gen_random_uuid() | PK |
| `user_id` | uuid | ❌ | - | FK → auth.users |
| `lesson_id` | uuid | ❌ | - | FK → lessons |
| `score` | integer | ❌ | 0 | Pontuação |
| `total_questions` | integer | ❌ | 0 | Total de perguntas |
| `passed` | boolean | ❌ | false | Passou no quiz |
| `completed_at` | timestamptz | ❌ | now() | Data de conclusão |

## 🔢 Enums

### app_role

```sql
CREATE TYPE app_role AS ENUM ('PROFESSOR', 'ESTUDANTE', 'ADMIN');
```

## ⚡ Funções do Banco

### has_role

Verifica se usuário tem um papel específico.

```sql
SELECT has_role('user-uuid', 'PROFESSOR');
-- Retorna: boolean
```

### is_course_owner

Verifica se usuário é dono de um curso.

```sql
SELECT is_course_owner('user-uuid', 'course-uuid');
-- Retorna: boolean
```

### is_lesson_owner

Verifica se usuário é dono de uma aula.

```sql
SELECT is_lesson_owner('user-uuid', 'lesson-uuid');
-- Retorna: boolean
```

### is_section_owner

Verifica se usuário é dono de uma seção.

```sql
SELECT is_section_owner('user-uuid', 'section-uuid');
-- Retorna: boolean
```

### get_user_role

Obtém o papel de um usuário.

```sql
SELECT get_user_role('user-uuid');
-- Retorna: app_role
```

## 🔄 Triggers

### update_updated_at

Atualiza automaticamente `updated_at` em modificações.

Aplicado em: `profiles`, `courses`, `lessons`, `lesson_progress`, `course_ratings`, `lesson_comments`

### handle_new_user

Cria automaticamente perfil e role quando um usuário se registra.

```sql
-- Trigger em auth.users AFTER INSERT
-- Cria profiles + user_roles
-- Bloqueia criação de ADMIN via signup
```

## 📦 Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `uploads` | ❌ | Vídeos e arquivos privados |
| `thumbnails` | ✅ | Thumbnails de cursos |

## 🏗 Entidades de Domínio (TypeScript)

### User

```typescript
interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: 'ATIVO' | 'BLOQUEADO';
  role: 'PROFESSOR' | 'ESTUDANTE' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}
```

### Course

```typescript
interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  category: string;
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';
  language: string;
  status: 'RASCUNHO' | 'PUBLICADO';
  price: number;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Lesson

```typescript
interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  order: number;
  contentType: 'YOUTUBE_LINK' | 'VIDEO_UPLOAD' | 'TEXTO' | 'QUIZ';
  videoFileUrl: string | null;
  youtubeUrl: string | null;
  textContent: string | null;
  durationSeconds: number | null;
  isPreviewFree: boolean;
  createdAt: string;
  updatedAt: string;
}
```
