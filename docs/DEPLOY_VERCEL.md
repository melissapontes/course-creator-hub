# Deploy na Vercel

## Configuração SPA

O arquivo `vercel.json` já está configurado para evitar 404 no refresh:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

## Reset Password

A rota `/reset-password` funciona via link enviado por e-mail.
O Lovable Cloud envia o token automaticamente.

## Variáveis de Ambiente

As variáveis `VITE_SUPABASE_*` são injetadas automaticamente pelo Lovable Cloud.
