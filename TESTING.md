# Guia de Testes

Este documento explica como executar e criar testes no projeto.

## Stack de Testes

- **Test Runner**: [Vitest](https://vitest.dev/) - Framework de testes moderno e rápido para Vite
- **Testing Library**: [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) - Para testes de componentes React
- **DOM Environment**: [jsdom](https://github.com/jsdom/jsdom) - Simulação de ambiente de navegador

## Estrutura de Pastas

```
tests/
├── setup.ts                    # Configuração global dos testes
├── helpers/
│   ├── factories.ts            # Factories para criação de dados de teste
│   └── mocks.ts                # Mocks de repositórios e serviços
└── unit/
    ├── lib/
    │   └── utils.test.ts
    └── features/
        ├── auth/
        │   └── domain/
        │       ├── entities/
        │       │   └── AuthResult.test.ts
        │       └── usecases/
        │           ├── SignInUseCase.test.ts
        │           ├── SignUpUseCase.test.ts
        │           ├── ResetPasswordUseCase.test.ts
        │           └── UpdatePasswordUseCase.test.ts
        ├── cart/
        │   └── domain/
        │       └── usecases/
        │           └── GetCartSummaryUseCase.test.ts
        ├── courses/
        │   └── domain/
        │       ├── entities/
        │       │   └── Course.test.ts
        │       └── usecases/
        │           └── GetPublishedCoursesUseCase.test.ts
        └── teacher/
            └── domain/
                └── usecases/
                    ├── DeleteCommentUseCase.test.ts
                    └── GetCourseCommentsUseCase.test.ts
```

## Comandos Disponíveis

### Executar Todos os Testes
```bash
npm run test
```

### Executar Testes Unitários
```bash
npm run test:unit
```

### Modo Watch (Desenvolvimento)
```bash
npm run test:watch
```

### Relatório de Cobertura
```bash
npm run test:coverage
```

O relatório será gerado em `./coverage/` em formato HTML, JSON e texto.

## Criando Novos Testes

### 1. Localize o arquivo correspondente

Os testes devem espelhar a estrutura do código fonte:

| Código | Teste |
|--------|-------|
| `src/lib/utils.ts` | `tests/unit/lib/utils.test.ts` |
| `src/features/auth/domain/usecases/SignInUseCase.ts` | `tests/unit/features/auth/domain/usecases/SignInUseCase.test.ts` |

### 2. Estrutura básica de um teste

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MinhaClasse } from '@/features/modulo/domain/usecases/MinhaClasse';
import { createMockRepository } from '@tests/helpers/mocks';

describe('MinhaClasse', () => {
  let instancia: MinhaClasse;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    instancia = new MinhaClasse(mockRepository);
  });

  describe('meuMetodo', () => {
    it('deve fazer X quando Y', async () => {
      // Arrange - Preparar dados e mocks
      mockRepository.algumMetodo.mockResolvedValue({ data: 'teste' });

      // Act - Executar ação
      const resultado = await instancia.meuMetodo('input');

      // Assert - Verificar resultado
      expect(resultado).toBe('esperado');
      expect(mockRepository.algumMetodo).toHaveBeenCalledWith('input');
    });
  });
});
```

### 3. Usando Factories

Use as factories em `tests/helpers/factories.ts` para criar dados de teste consistentes:

```typescript
import { createMockUser, createMockCourse, createMockCartItem } from '@tests/helpers/factories';

const usuario = createMockUser({ email: 'custom@email.com' });
const curso = createMockCourse({ title: 'Meu Curso', price: 99.90 });
```

### 4. Usando Mocks

Use os mocks em `tests/helpers/mocks.ts` para isolar dependências:

```typescript
import { createMockAuthRepository, createMockCourseRepository } from '@tests/helpers/mocks';

const mockAuthRepo = createMockAuthRepository();
mockAuthRepo.signIn.mockResolvedValue({ success: true, user: mockUser });
```

### 5. Testando datas

Para testes determinísticos com datas, use os helpers do setup:

```typescript
import { mockDate, restoreDate } from '@tests/setup';

describe('filtro por data', () => {
  beforeEach(() => {
    mockDate('2024-06-15T12:00:00Z');
  });

  afterEach(() => {
    restoreDate();
  });

  it('deve filtrar cursos de hoje', () => {
    // Agora new Date() retornará 2024-06-15T12:00:00Z
  });
});
```

## Padrões de Qualidade

### Estrutura AAA (Arrange/Act/Assert)

```typescript
it('deve calcular subtotal corretamente', async () => {
  // Arrange
  const items = [
    createMockCartItem({ course: { ...defaultCourse, price: 50 } }),
    createMockCartItem({ course: { ...defaultCourse, price: 100 } }),
  ];
  mockRepository.getCartItems.mockResolvedValue(items);

  // Act
  const result = await useCase.execute('user-123');

  // Assert
  expect(result.subtotal).toBe(150);
});
```

### Nomes claros e descritivos

```typescript
// ✅ Bom
it('should return INVALID_EMAIL error when email lacks @', () => {});
it('should filter courses by category when category is not "all"', () => {});

// ❌ Evitar
it('test email', () => {});
it('works', () => {});
```

### Testar casos de sucesso, erro e bordas

```typescript
describe('validação de senha', () => {
  it('should accept password with exactly 8 characters', () => {}); // borda
  it('should reject password with 7 characters', () => {}); // erro
  it('should accept strong password', () => {}); // sucesso
  it('should reject empty password', () => {}); // borda/erro
});
```

## Cobertura Mínima

- **Áreas críticas**: 70% de cobertura
- **Use Cases**: Cobertura completa de validações
- **Entidades**: Funções utilitárias e constantes
- **Utils**: Todas as funções públicas

## Dicas

1. **Não teste implementação, teste comportamento** - Foque no que o código faz, não em como faz
2. **Um assertion principal por teste** - Testes focados são mais fáceis de manter
3. **Mocks simples** - Não replique lógica complexa nos mocks
4. **Testes independentes** - Cada teste deve poder rodar isoladamente
5. **Evite dados mágicos** - Use factories com valores explícitos

## CI/CD

Os testes podem ser integrados em pipelines de CI com:

```yaml
# Exemplo GitHub Actions
- name: Run Tests
  run: npm run test:unit

- name: Coverage Report
  run: npm run test:coverage
```
