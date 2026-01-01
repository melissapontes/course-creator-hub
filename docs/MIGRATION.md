# Guia de Migração

## Mapeamento Repo Base → Novo Projeto

| Origem (Repo Base)         | Destino (Novo)                    |
|---------------------------|-----------------------------------|
| `/src/pages/`             | `/src/features/*/pages/`          |
| `/src/components/`        | `/src/components/` ou `/features/`|
| `/supabase/migrations/`   | `/supabase/migrations/`           |
| `/vercel.json`            | `/vercel.json`                    |
| `tailwind.config.ts`      | `tailwind.config.ts`              |

## Checklist de Migração

1. [ ] Copiar componentes de UI customizados para `/src/components/`
2. [ ] Mover páginas para dentro de `/src/features/*/pages/`
3. [ ] Atualizar imports para usar `@/` alias
4. [ ] Verificar se schemas Zod batem com os novos
5. [ ] Testar RLS policies com novo schema

## Estrutura Esperada
O novo projeto segue arquitetura feature-first para melhor organização.
