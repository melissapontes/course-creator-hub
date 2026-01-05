# Setup do Ambiente de Desenvolvimento

Este documento descreve como configurar o ambiente de desenvolvimento local do LearnBridge.

## 📋 Pré-requisitos

| Ferramenta | Versão Mínima | Verificação |
|------------|---------------|-------------|
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | 2.x | `git --version` |

> **Alternativa**: Você também pode usar `bun` como package manager.

## 🚀 Instalação Passo a Passo

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd learnbridge
```

### 2. Instale as Dependências

```bash
npm install
# ou
bun install
```

### 3. Configure as Variáveis de Ambiente

```bash
# Copie o template
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://cyrxtfqgfeufsyxhzcyn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SUPABASE_PROJECT_ID=cyrxtfqgfeufsyxhzcyn
```

> **Nota Lovable Cloud**: Se você está usando o Lovable, as variáveis já são configuradas automaticamente.

### 4. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 📁 Estrutura de Arquivos de Configuração

```
.
├── .env                    # Variáveis de ambiente (não commitado)
├── .env.example            # Template de variáveis
├── vite.config.ts          # Configuração do Vite
├── vitest.config.ts        # Configuração de testes
├── tailwind.config.ts      # Configuração do Tailwind
├── tsconfig.json           # Configuração TypeScript base
├── tsconfig.app.json       # Configuração TS para a aplicação
├── tsconfig.test.json      # Configuração TS para testes
├── eslint.config.js        # Configuração ESLint
└── components.json         # Configuração shadcn/ui
```

## 🔧 Configurações Importantes

### Path Aliases (tsconfig.json)

O projeto utiliza aliases para imports mais limpos:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

**Uso**:
```typescript
// Em vez de:
import { Button } from '../../../components/ui/button';

// Use:
import { Button } from '@/components/ui/button';
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
```

## 🧪 Ambiente de Testes

### Configuração

```bash
# Executar todos os testes
npm run test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Aliases de Teste

```typescript
// tsconfig.test.json
{
  "paths": {
    "@/*": ["./src/*"],
    "@tests/*": ["./tests/*"]
  }
}
```

## 🗄 Supabase Local (Opcional)

Para desenvolvimento offline com Supabase CLI:

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie o Supabase local
supabase start

# Aplique migrations
supabase db reset
```

> **Nota**: O projeto Lovable Cloud já fornece um ambiente Supabase gerenciado.

## 🔍 Verificação do Setup

Execute o checklist abaixo para verificar se tudo está funcionando:

```bash
# 1. Verificar dependências
npm ls

# 2. Verificar tipos
npx tsc --noEmit

# 3. Verificar lint
npm run lint

# 4. Executar testes
npm run test

# 5. Build de produção
npm run build
```

Se todos os comandos executarem sem erros, seu ambiente está pronto!

## ❗ Troubleshooting

### Erro: "Cannot find module '@/...'"

**Causa**: Path aliases não configurados corretamente.

**Solução**: Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

### Erro: "supabase is not defined"

**Causa**: Variáveis de ambiente não carregadas.

**Solução**: 
1. Verifique se `.env` existe
2. Reinicie o servidor
3. Verifique se as variáveis começam com `VITE_`

### Erro: Porta 5173 em uso

**Solução**: 
```bash
# Encontre o processo
lsof -i :5173

# Mate o processo ou use outra porta
npm run dev -- --port 3000
```

## 📱 Ambientes

| Ambiente | URL | Descrição |
|----------|-----|-----------|
| Local | `localhost:5173` | Desenvolvimento |
| Preview | `*.lovable.app` | Preview automático do Lovable |
| Produção | Seu domínio | Deploy via Vercel/Netlify |

## 🔗 Links Úteis

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
