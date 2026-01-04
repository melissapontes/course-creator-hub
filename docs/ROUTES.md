# Rotas e Navegação

Este documento mapeia todas as rotas da aplicação EduFlow.

## 📍 Mapa de Rotas

### Rotas Públicas

Acessíveis sem autenticação:

| Rota | Página | Componente | Descrição |
|------|--------|------------|-----------|
| `/` | Landing Page | `LandingPage.tsx` | Página inicial do site |
| `/courses` | Catálogo | `CourseCatalogPage.tsx` | Lista de cursos públicos |
| `/courses/:id` | Detalhes | `CourseDetailPage.tsx` | Detalhes de um curso |
| `/login` | Login | `LoginPage.tsx` | Autenticação |
| `/register` | Registro | `RegisterPage.tsx` | Criação de conta |
| `/forgot-password` | Esqueci Senha | `ForgotPasswordPage.tsx` | Reset de senha |
| `/reset-password` | Nova Senha | `ResetPasswordPage.tsx` | Definir nova senha |

### Rotas Protegidas (Qualquer Usuário Autenticado)

| Rota | Página | Componente | Descrição |
|------|--------|------------|-----------|
| `/profile` | Perfil | `ProfilePage.tsx` | Edição de perfil |
| `/checkout` | Checkout | `CheckoutPage.tsx` | Finalizar compra |

### Rotas do Professor (PROFESSOR)

| Rota | Página | Componente | Descrição |
|------|--------|------------|-----------|
| `/teacher` | Dashboard | `TeacherDashboardPage.tsx` | Painel do professor |
| `/teacher/courses` | Meus Cursos | `TeacherCoursesPage.tsx` | Lista de cursos do professor |
| `/teacher/courses/new` | Novo Curso | `NewCoursePage.tsx` | Criação de curso |
| `/teacher/courses/:id/curriculum` | Currículo | `CurriculumPage.tsx` | Edição de seções/aulas |
| `/teacher/courses/:id/comments` | Comentários | `CourseCommentsPage.tsx` | Moderação de comentários |

### Rotas do Estudante (ESTUDANTE)

| Rota | Página | Componente | Descrição |
|------|--------|------------|-----------|
| `/student` | Dashboard | `StudentDashboardPage.tsx` | Painel do estudante |
| `/learn/:id` | Player | `LearnCoursePage.tsx` | Assistir curso* |

> \* A rota `/learn/:id` também é acessível por professores (donos do curso).

### Rotas do Administrador (ADMIN)

| Rota | Página | Componente | Descrição |
|------|--------|------------|-----------|
| `/admin` | Dashboard | `AdminDashboardPage.tsx` | Painel administrativo |
| `/admin/professors` | Professores | `AdminProfessorsPage.tsx` | Gestão de professores |
| `/admin/students` | Estudantes | `AdminStudentsPage.tsx` | Gestão de estudantes |

## 🔒 Controle de Acesso

### Componente ProtectedRoute

```tsx
<ProtectedRoute allowedRoles={['PROFESSOR']}>
  <TeacherDashboardPage />
</ProtectedRoute>
```

**Comportamento**:
1. Usuário não autenticado → Redireciona para `/login`
2. Usuário sem role permitida → Redireciona para seu dashboard
3. Usuário autorizado → Renderiza a página

### Mapeamento de Roles para Dashboards

| Role | Dashboard Padrão |
|------|------------------|
| `PROFESSOR` | `/teacher` |
| `ESTUDANTE` | `/student` |
| `ADMIN` | `/admin` |

## 🧭 Fluxos de Navegação

### Fluxo de Autenticação

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   /login     │────▶│ Autenticado  │────▶│  Dashboard   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   /profile   │
                     └──────────────┘
```

### Fluxo de Compra

```
/courses/:id  ──▶  Adicionar ao Carrinho  ──▶  /checkout  ──▶  Matrícula  ──▶  /learn/:id
```

### Fluxo do Professor

```
/teacher  ──▶  /teacher/courses/new  ──▶  Criar Curso  ──▶  /learn/:id (Modo Edição)
                                                                    │
                                                                    ▼
                                                    ┌───────────────────────────┐
                                                    │ - Editar Informações      │
                                                    │ - Gerenciar Currículo     │
                                                    │ - Moderar Comentários     │
                                                    └───────────────────────────┘
```

## 🔗 Deep Links

### Reset de Senha

A aplicação suporta deep links para reset de senha:

```
https://app.eduflow.com/reset-password#access_token=xxx&type=recovery
```

> **Importante**: Configure o redirect URL no Supabase Auth.

### Navegação Direta

Todas as rotas suportam navegação direta (SPA routing configurado).

## 📱 Responsividade

| Rota | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| `/` | ✅ | ✅ | ✅ |
| `/courses` | ✅ | ✅ | ✅ |
| `/learn/:id` | ✅ (sidebar recolhível) | ✅ | ✅ |
| Dashboards | ✅ (sidebar drawer) | ✅ | ✅ |

## 🚧 Rotas Planejadas (TODO)

| Rota | Descrição | Status |
|------|-----------|--------|
| `/teacher/analytics` | Analytics do professor | 🔜 Planejado |
| `/student/certificates` | Certificados | 🔜 Planejado |
| `/admin/courses` | Gestão de cursos (admin) | 🔜 Planejado |
| `/settings` | Configurações da conta | 🔜 Planejado |

## 🔧 Configuração de Rotas

### React Router (App.tsx)

```tsx
<Routes>
  {/* Public */}
  <Route path="/" element={<LandingPage />} />
  
  {/* Auth */}
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  
  {/* Protected */}
  <Route path="/teacher" element={
    <ProtectedRoute allowedRoles={['PROFESSOR']}>
      <TeacherDashboardPage />
    </ProtectedRoute>
  } />
  
  {/* Catch-all */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Vercel Rewrites (vercel.json)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## 📊 Hierarquia de Rotas

```
/
├── /courses
│   └── /:id
├── /login
├── /register
├── /forgot-password
├── /reset-password
├── /profile
├── /checkout
├── /learn/:id
├── /teacher
│   ├── /courses
│   │   ├── /new
│   │   └── /:id
│   │       ├── /curriculum
│   │       └── /comments
├── /student
└── /admin
    ├── /professors
    └── /students
```
