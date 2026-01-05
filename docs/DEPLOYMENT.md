# Guia de Deployment

Este documento descreve como fazer deploy do LearnBridge em produção.

## 🚀 Plataformas Suportadas

O LearnBridge é uma **Single Page Application (SPA)** e pode ser deployado em:

| Plataforma | Recomendado | Notas |
|------------|-------------|-------|
| **Vercel** | ⭐ Sim | Configuração incluída |
| **Netlify** | Sim | Requer configuração de redirects |
| **Cloudflare Pages** | Sim | Performance excelente |
| **AWS S3 + CloudFront** | Sim | Maior controle |
| **Lovable** | ⭐ Sim | Deploy automático |

## 📋 Pré-requisitos de Deploy

1. ✅ Build sem erros (`npm run build`)
2. ✅ Variáveis de ambiente configuradas
3. ✅ Banco de dados Supabase configurado
4. ✅ RLS policies aplicadas

## 🟢 Deploy no Vercel

### Configuração Automática

O projeto já inclui `vercel.json` para SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Passos

1. **Conecte o repositório no Vercel**
2. **Configure as variáveis de ambiente**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. **Deploy automático** a cada push

### Build Settings no Vercel

| Setting | Valor |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

## 🔵 Deploy no Netlify

### Criar `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Variáveis de Ambiente

Configure em **Site settings > Environment variables**:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI...
```

## 🟣 Deploy via Lovable

Se você está usando o Lovable:

1. Clique em **Share** > **Publish**
2. O deploy é automático
3. URL gerada: `seu-projeto.lovable.app`

### Domínio Customizado

1. Vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

## 🔐 Variáveis de Ambiente de Produção

### Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) | `eyJ...` |

### Opcionais

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto |

> ⚠️ **NUNCA** exponha a `SERVICE_ROLE_KEY` no frontend!

## 🔄 CI/CD

### GitHub Actions (Exemplo)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## ✅ Checklist Pré-Deploy

- [ ] Testes passando (`npm run test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Lint limpo (`npm run lint`)
- [ ] Variáveis de ambiente configuradas
- [ ] RLS policies verificadas
- [ ] Storage buckets configurados
- [ ] Auth email templates configurados
- [ ] Domínio SSL configurado

## 🔍 Verificação Pós-Deploy

Após o deploy, verifique:

1. **Homepage carrega** - Acesse a URL
2. **Autenticação funciona** - Teste login/registro
3. **Assets carregam** - Imagens e estilos
4. **Rotas funcionam** - Navegação direta (ex: `/courses`)
5. **API responde** - Listagem de cursos

## ⚠️ Cuidados de Produção

### Performance

- ✅ Build minificado
- ✅ Code splitting automático (Vite)
- ✅ Lazy loading de rotas

### Segurança

- ✅ HTTPS obrigatório
- ✅ Headers de segurança
- ✅ RLS no Supabase
- ❌ Não exponha secrets no frontend

### Monitoramento

Considere adicionar:
- Error tracking (Sentry)
- Analytics (Plausible, Posthog)
- Uptime monitoring

## 🔄 Rollback

### Vercel

1. Vá em **Deployments**
2. Encontre o deploy anterior estável
3. Clique em **...** > **Promote to Production**

### Lovable

1. Vá em **Versions**
2. Selecione versão anterior
3. Clique em **Restore**

## 📚 Referências

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
