# Autenticação e Controle de Acesso (RBAC)

Este documento descreve o sistema de autenticação e autorização do LearnBridge.

## 🔐 Visão Geral

O LearnBridge utiliza **Supabase Auth** para autenticação e um sistema **RBAC (Role-Based Access Control)** customizado para autorização.

```
┌──────────────────────────────────────────────────────────────┐
│                     AUTENTICAÇÃO                              │
│                                                               │
│   Email/Senha  ──▶  Supabase Auth  ──▶  JWT Token            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     AUTORIZAÇÃO (RBAC)                        │
│                                                               │
│   JWT Token  ──▶  user_roles table  ──▶  RLS Policies        │
│                                                               │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│   │  ESTUDANTE  │  │  PROFESSOR  │  │    ADMIN    │         │
│   └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 👥 Papéis (Roles)

### ESTUDANTE

| Permissão | Descrição |
|-----------|-----------|
| ✅ Ver catálogo de cursos | Acesso público |
| ✅ Comprar cursos | Via carrinho |
| ✅ Assistir cursos matriculados | `/learn/:id` |
| ✅ Marcar aulas como concluídas | Progresso |
| ✅ Comentar em aulas | Aulas matriculadas |
| ✅ Avaliar cursos | Cursos concluídos |
| ✅ Editar próprio perfil | `/profile` |
| ❌ Criar cursos | Não permitido |
| ❌ Acessar área de professor | Bloqueado |
| ❌ Acessar área de admin | Bloqueado |

### PROFESSOR

| Permissão | Descrição |
|-----------|-----------|
| ✅ Todas as permissões de ESTUDANTE | - |
| ✅ Criar cursos | `/teacher/courses/new` |
| ✅ Editar próprios cursos | Currículo, informações |
| ✅ Publicar/despublicar cursos | Controle de status |
| ✅ Ver dashboard de vendas | Receita, matrículas |
| ✅ Moderar comentários | Próprios cursos |
| ✅ Visualizar curso como aluno | Modo professor |
| ❌ Editar cursos de outros | Bloqueado por RLS |
| ❌ Acessar área de admin | Bloqueado |

### ADMIN

| Permissão | Descrição |
|-----------|-----------|
| ✅ Todas as permissões anteriores | - |
| ✅ Ver todos os usuários | Professores e estudantes |
| ✅ Bloquear/desbloquear usuários | Gestão de status |
| ✅ Ver estatísticas globais | Dashboard admin |
| ✅ Acessar todos os cursos | Auditoria |
| ⚠️ Não pode ser auto-criado | Apenas via banco |

## 🔄 Fluxo de Autenticação

### Registro

```
1. Usuário preenche formulário (nome, email, senha, papel)
2. Frontend chama signUp() do AuthContext
3. Supabase Auth cria usuário
4. Trigger handle_new_user() executa:
   - Cria registro em profiles
   - Cria registro em user_roles
   - Bloqueia se role = ADMIN
5. Retorna para login
```

### Login

```
1. Usuário entra com email/senha
2. Supabase Auth valida credenciais
3. Retorna JWT com user_id
4. AuthContext busca perfil e role
5. Redireciona para dashboard apropriado
```

### Logout

```
1. Usuário clica em sair
2. signOut() limpa sessão local
3. Supabase Auth invalida tokens
4. Redireciona para landing page
```

### Reset de Senha

```
1. Usuário solicita reset em /forgot-password
2. Email enviado com link magic
3. Link redireciona para /reset-password
4. Usuário define nova senha
5. Redireciona para login
```

## 🛡 Row Level Security (RLS)

### Princípios

1. **RLS sempre habilitado** em tabelas com dados sensíveis
2. **Funções SECURITY DEFINER** para verificações de role
3. **Políticas específicas** por operação (SELECT, INSERT, UPDATE, DELETE)

### Políticas Principais

#### profiles

```sql
-- Qualquer autenticado pode ver profiles
CREATE POLICY "profiles_select" ON profiles
FOR SELECT TO authenticated USING (true);

-- Usuário só edita próprio perfil (exceto role)
CREATE POLICY "profiles_update" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

#### courses

```sql
-- Todos podem ver cursos publicados
CREATE POLICY "courses_select_published" ON courses
FOR SELECT USING (status = 'PUBLICADO');

-- Dono pode ver todos os seus cursos
CREATE POLICY "courses_select_owner" ON courses
FOR SELECT USING (instructor_id = auth.uid());

-- Apenas professores podem criar
CREATE POLICY "courses_insert" ON courses
FOR INSERT WITH CHECK (
  instructor_id = auth.uid() AND
  has_role(auth.uid(), 'PROFESSOR')
);

-- Dono pode editar
CREATE POLICY "courses_update" ON courses
FOR UPDATE USING (instructor_id = auth.uid());

-- Dono pode deletar
CREATE POLICY "courses_delete" ON courses
FOR DELETE USING (instructor_id = auth.uid());
```

#### enrollments

```sql
-- Usuário vê próprias matrículas
CREATE POLICY "enrollments_select" ON enrollments
FOR SELECT USING (user_id = auth.uid());

-- Admin vê todas
CREATE POLICY "enrollments_admin" ON enrollments
FOR SELECT USING (has_role(auth.uid(), 'ADMIN'));
```

#### lesson_progress

```sql
-- Usuário vê/edita próprio progresso
CREATE POLICY "progress_own" ON lesson_progress
FOR ALL USING (user_id = auth.uid());
```

### Funções de Segurança

```sql
-- Verifica role do usuário (evita recursão)
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Verifica ownership de curso
CREATE FUNCTION is_course_owner(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses
    WHERE id = _course_id AND instructor_id = _user_id
  )
$$;
```

## 🚧 Proteção no Frontend

### ProtectedRoute

```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

// Uso
<ProtectedRoute allowedRoles={['PROFESSOR']}>
  <TeacherDashboardPage />
</ProtectedRoute>
```

**Comportamento**:
- Sem autenticação → Redireciona para `/login`
- Role não permitida → Redireciona para dashboard do role atual
- Autorizado → Renderiza children

### PublicRoute

```tsx
// Rotas apenas para usuários NÃO autenticados
<PublicRoute>
  <LoginPage />
</PublicRoute>
```

**Comportamento**:
- Autenticado → Redireciona para dashboard
- Não autenticado → Renderiza children

## ⚠️ Restrições de Segurança

### ADMIN não pode ser auto-registrado

```sql
-- No trigger handle_new_user()
IF user_role = 'ADMIN' THEN
  user_role := 'ESTUDANTE';
END IF;
```

### Usuário não pode alterar próprio role

```sql
-- Política de update em profiles
-- Role não está incluída nos campos editáveis
```

### Tokens JWT expiram

- Access token: 1 hora (configurável)
- Refresh token: 1 semana
- Auto-refresh pelo Supabase Client

## 🔍 Debug de Autenticação

### Verificar sessão atual

```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('User:', session?.user);
console.log('Token:', session?.access_token);
```

### Verificar role do usuário

```typescript
const { authUser } = useAuth();
console.log('Role:', authUser?.role);
```

### Testar RLS no SQL

```sql
-- Como um usuário específico
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM courses;
```

## 📋 Checklist de Segurança

- [x] RLS habilitado em todas as tabelas
- [x] Roles armazenados em tabela separada
- [x] Funções SECURITY DEFINER para verificações
- [x] ADMIN bloqueado de auto-registro
- [x] Proteção de rotas no frontend
- [x] Tokens com expiração
- [x] Refresh automático de sessão
- [ ] 2FA (futuro)
- [ ] Rate limiting (futuro)
- [ ] Audit logs (futuro)
