# Tratamento de Erros e Logging

Este documento descreve as práticas de tratamento de erros e logging do LearnBridge.

## 🚨 Tratamento de Erros

### Camadas de Tratamento

```
┌─────────────────────────────────────────────────────────────┐
│                     UI (Componentes)                         │
│   Toast notifications, Loading states, Error boundaries      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    ViewModels (Hooks)                        │
│        try/catch, Error mapping, State management            │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      Use Cases                               │
│            Business validation, Domain errors                │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Repositories                              │
│              Data source errors, Network errors              │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Data Sources                              │
│               Supabase errors, HTTP errors                   │
└─────────────────────────────────────────────────────────────┘
```

### Padrão de Erro do Domínio

```typescript
// src/features/auth/domain/entities/AuthResult.ts

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_IN_USE'
  | 'WEAK_PASSWORD'
  | 'NETWORK_ERROR'
  | 'USER_BLOCKED'
  | 'UNKNOWN_ERROR';

export interface AuthResult {
  success: boolean;
  error?: AuthError;
}

export function createAuthError(code: AuthErrorCode): AuthError {
  const messages: Record<AuthErrorCode, string> = {
    INVALID_EMAIL: 'Email inválido',
    INVALID_CREDENTIALS: 'Email ou senha incorretos',
    EMAIL_IN_USE: 'Este email já está em uso',
    WEAK_PASSWORD: 'A senha deve ter no mínimo 8 caracteres',
    NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
    USER_BLOCKED: 'Usuário bloqueado. Contate o suporte.',
    UNKNOWN_ERROR: 'Ocorreu um erro inesperado',
  };

  return { code, message: messages[code] };
}
```

### Tratamento em Use Cases

```typescript
// src/features/auth/domain/usecases/SignInUseCase.ts

export class SignInUseCase {
  async execute(credentials: LoginCredentials): Promise<AuthResult> {
    // Validação de domínio
    if (!credentials.email || !credentials.email.includes('@')) {
      return { success: false, error: createAuthError('INVALID_EMAIL') };
    }

    if (!credentials.password) {
      return { success: false, error: createAuthError('INVALID_CREDENTIALS') };
    }

    // Delega para repositório
    return this.authRepository.signIn(credentials);
  }
}
```

### Tratamento em ViewModels

```typescript
// Padrão de ViewModel com tratamento de erro

export function useLoginViewModel() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const useCase = createSignInUseCase();
      const result = await useCase.execute({ email, password });

      if (!result.success) {
        setError(result.error?.message || 'Erro desconhecido');
        return result;
      }

      // Sucesso
      return result;
    } catch (err) {
      // Erro inesperado
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
      return { success: false, error: { code: 'UNKNOWN_ERROR', message } };
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, error, isLoading };
}
```

### Notificações (Toast)

```typescript
import { toast } from 'sonner';

// Sucesso
toast.success('Curso criado com sucesso!');

// Erro
toast.error('Erro ao salvar. Tente novamente.');

// Info
toast.info('Você já está matriculado neste curso.');

// Warning
toast.warning('Sua sessão expirará em 5 minutos.');

// Loading
const toastId = toast.loading('Salvando...');
// ...depois
toast.dismiss(toastId);
toast.success('Salvo!');
```

### React Query Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['courses'],
  queryFn: fetchCourses,
  retry: 1, // Tenta novamente 1 vez
});

// Mutation com callbacks
const mutation = useMutation({
  mutationFn: createCourse,
  onSuccess: () => {
    toast.success('Curso criado!');
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  },
  onError: (error: Error) => {
    toast.error(error.message || 'Erro ao criar curso');
  },
});
```

## 📝 Logging

### Console Logging (Desenvolvimento)

```typescript
// Níveis de log
console.log('Info:', data);
console.warn('Warning:', message);
console.error('Error:', error);

// Logs estruturados
console.log('[AuthService]', 'User signed in:', { userId });
console.error('[CourseRepository]', 'Failed to fetch:', { courseId, error });
```

### Padrão de Log

```typescript
// Formato recomendado
// [Módulo] Ação: Contexto

console.log('[Auth] signIn: Attempting login', { email });
console.log('[Auth] signIn: Success', { userId });
console.error('[Auth] signIn: Failed', { email, error });
```

### Supabase Logs

Os logs do Supabase estão disponíveis no dashboard:

- **Auth logs**: Tentativas de login, registros
- **Database logs**: Queries, erros de RLS
- **Edge function logs**: Execuções de funções

### TODO: Monitoramento de Produção

Para produção, considere implementar:

- [ ] **Sentry** - Error tracking
- [ ] **LogRocket** - Session replay
- [ ] **Posthog** - Product analytics
- [ ] **Datadog** - APM

## 🔍 Debug de Erros Comuns

### "Invalid JWT"

**Causa**: Token expirado ou inválido.

**Solução**:
```typescript
// O Supabase client faz refresh automático
// Se persistir, faça logout e login novamente
await supabase.auth.signOut();
```

### "Row Level Security violation"

**Causa**: Usuário tentando acessar dados não permitidos.

**Debug**:
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'courses';

-- Testar como usuário
SET request.jwt.claim.sub = 'user-id';
SELECT * FROM courses WHERE id = 'course-id';
```

### "Network Error"

**Causa**: Problema de conectividade.

**Tratamento**:
```typescript
try {
  await supabase.from('courses').select();
} catch (error) {
  if (error.message.includes('Failed to fetch')) {
    toast.error('Sem conexão com internet');
  }
}
```

### "Unique constraint violation" (23505)

**Causa**: Tentativa de inserir dado duplicado.

**Tratamento**:
```typescript
const { error } = await supabase.from('cart_items').insert(item);

if (error?.code === '23505') {
  toast.error('Este item já está no carrinho');
}
```

## 📊 Métricas de Erro

### Erros a Monitorar

| Tipo | Severidade | Ação |
|------|------------|------|
| Auth failures | High | Alertar se > 10/min |
| RLS violations | High | Investigar imediatamente |
| Network errors | Medium | Monitorar tendência |
| Validation errors | Low | Log para análise |

### Exemplo de Agregação

```typescript
// Utilitário para tracking (futuro)
interface ErrorEvent {
  code: string;
  message: string;
  context: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
}

function trackError(event: ErrorEvent) {
  // Enviar para serviço de monitoramento
  console.error('[ErrorTracker]', event);
}
```

## ✅ Boas Práticas

### DO ✅

```typescript
// Sempre retornar resultado tipado
return { success: false, error: createAuthError('INVALID_EMAIL') };

// Usar mensagens amigáveis
toast.error('Não foi possível salvar. Tente novamente.');

// Log com contexto
console.error('[Module] Action failed:', { id, error: error.message });
```

### DON'T ❌

```typescript
// Não expor stack traces ao usuário
toast.error(error.stack); // ❌

// Não ignorar erros
try {
  await riskyOperation();
} catch {} // ❌ - Silencia erro

// Não usar alert()
alert('Erro!'); // ❌
```
