# Notas de Migração e Dívida Técnica

Este documento lista riscos conhecidos, pontos frágeis, TODOs e próximos passos para o EduFlow.

## 🚨 Riscos Conhecidos

### Alta Prioridade

| Risco | Descrição | Impacto | Mitigação |
|-------|-----------|---------|-----------|
| **Sem pagamento real** | Checkout simulado, sem integração de pagamento | Não pode monetizar | Integrar Stripe |
| **Vídeos apenas YouTube** | Upload de vídeo não implementado | Limitação de conteúdo | Implementar upload para Supabase Storage |
| **Sem rate limiting** | APIs podem ser abusadas | DoS, custos | Implementar rate limiting |

### Média Prioridade

| Risco | Descrição | Impacto | Mitigação |
|-------|-----------|---------|-----------|
| **Sem 2FA** | Apenas email/senha | Segurança reduzida | Adicionar 2FA via Supabase |
| **Sem backup automático** | Dependente do Supabase | Perda de dados | Configurar backups |
| **Sem CDN para assets** | Vídeos servidos direto | Performance | Usar CDN (Cloudflare) |

### Baixa Prioridade

| Risco | Descrição | Impacto | Mitigação |
|-------|-----------|---------|-----------|
| **Sem i18n** | Apenas português | Mercado limitado | Implementar i18n |
| **Sem PWA** | Não funciona offline | UX mobile | Adicionar service worker |

## ⚠️ Pontos Frágeis

### Código

```typescript
// TODO: TeacherDashboardPage.tsx:219
// Link para página inexistente após consolidação de rotas
<Link to={`/teacher/courses/${course.id}/edit`}>
// Deveria ser /learn/:id para professores
```

```typescript
// WARNING: useCart.ts
// Não há validação de estoque/disponibilidade
// Pode vender curso despublicado se estiver no carrinho
```

```typescript
// NOTE: CourseRepositoryImpl.ts:46-93
// Métodos de sections/lessons/ratings não implementados
// Throw "Not implemented" - pode causar crashes
```

### Database

```sql
-- WARNING: Sem índices em colunas de busca
-- Pode ficar lento com muitos cursos
CREATE INDEX idx_courses_title ON courses(title);
CREATE INDEX idx_courses_category ON courses(category);
```

```sql
-- TODO: Sem soft delete
-- Deletar curso remove dados permanentemente
-- Considerar adicionar deleted_at
```

### Frontend

- **Bundle size**: shadcn/ui importa muitos componentes
- **Hydration**: Possível mismatch em temas
- **Memory leaks**: Subscriptions não limpas em alguns components

## 📋 TODOs por Prioridade

### P0 - Crítico (Antes de Produção)

- [ ] Implementar pagamentos (Stripe)
- [ ] Adicionar rate limiting nas APIs
- [ ] Configurar backups automáticos
- [ ] Adicionar error tracking (Sentry)
- [ ] Revisar todas as RLS policies
- [ ] Testes de carga

### P1 - Alta (Próximo Sprint)

- [ ] Upload de vídeo para Storage
- [ ] Certificados de conclusão
- [ ] Email de boas-vindas
- [ ] Notificações por email
- [ ] Analytics do professor

### P2 - Média (Backlog)

- [ ] Sistema de cupons
- [ ] Programa de afiliados
- [ ] 2FA
- [ ] Exportar dados (LGPD)
- [ ] Modo offline básico
- [ ] Push notifications

### P3 - Baixa (Nice to Have)

- [ ] App mobile
- [ ] Gamificação
- [ ] Live streaming
- [ ] Chat entre alunos
- [ ] Fórum de discussão

## 🔄 Próximos Passos Recomendados

### Curto Prazo (1-2 semanas)

1. **Integrar Stripe**
   - Configurar conta Stripe
   - Implementar edge function de checkout
   - Webhook para confirmação de pagamento
   - Atualizar fluxo de matrícula

2. **Melhorar Segurança**
   - Auditar RLS policies
   - Adicionar logs de auditoria
   - Implementar rate limiting

3. **Monitoramento**
   - Configurar Sentry
   - Dashboard de métricas
   - Alertas de erro

### Médio Prazo (1-2 meses)

1. **Funcionalidades de Conteúdo**
   - Upload de vídeo
   - Certificados PDF
   - Recursos para download

2. **Marketing**
   - Sistema de cupons
   - Programa de referência
   - SEO avançado

3. **Analytics**
   - Dashboard do professor
   - Métricas de engajamento
   - Relatórios de vendas

### Longo Prazo (3-6 meses)

1. **Escala**
   - CDN para assets
   - Otimização de queries
   - Cache agressivo

2. **Expansão**
   - Internacionalização
   - App mobile
   - API pública

## 🏗 Refatorações Pendentes

### Alta Prioridade

1. **Separar queries do Supabase**
   - Mover queries inline para Data Sources
   - Usar o padrão Clean Architecture consistentemente

2. **Consolidar tratamento de erros**
   - Criar error boundaries globais
   - Padronizar mensagens de erro

3. **Melhorar tipagem**
   - Reduzir uso de `any`
   - Adicionar strict null checks

### Média Prioridade

1. **Componentizar páginas longas**
   - `LearnCoursePage.tsx` (474 linhas)
   - `CourseCatalogPage.tsx` (487 linhas)

2. **Extrair hooks customizados**
   - Lógica de paginação
   - Lógica de filtros

3. **Otimizar re-renders**
   - Adicionar `React.memo`
   - Usar `useCallback` consistentemente

## 📊 Métricas de Qualidade

### Cobertura de Testes

| Área | Cobertura | Meta |
|------|-----------|------|
| Use Cases | ~60% | 80% |
| Entities | ~70% | 90% |
| Repositories | ~20% | 60% |
| Components | ~5% | 40% |
| **Total** | **~30%** | **60%** |

### Dívida Técnica Estimada

| Categoria | Horas | Prioridade |
|-----------|-------|------------|
| Testes faltantes | 40h | Alta |
| Refatorações | 20h | Média |
| Documentação | 10h | Baixa |
| Performance | 15h | Média |
| **Total** | **85h** | - |

## 🔧 Dependências Desatualizadas

Verificar periodicamente:

```bash
npm outdated
```

Dependências críticas para manter atualizadas:
- `@supabase/supabase-js`
- `react`
- `react-router-dom`
- `@tanstack/react-query`

## 📝 Notas para Onboarding

### Primeiro Dia

1. Leia README.md e docs/ARCHITECTURE.md
2. Configure ambiente local (docs/SETUP.md)
3. Explore a estrutura de pastas
4. Execute os testes existentes

### Primeira Semana

1. Entenda o fluxo de autenticação
2. Crie uma feature simples seguindo o padrão
3. Adicione testes para sua feature
4. Faça code review de PRs existentes

### Convenções Importantes

- Código em **inglês**, UI em **português**
- Clean Architecture rigorosa
- Commits semânticos (feat:, fix:, docs:)
- PRs pequenos e focados
