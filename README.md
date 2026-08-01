# Painel administrativo do Quiz Bíblico MIRJE

Projeto Next.js com Supabase SSR, cookies, RLS e painel administrativo em `/admin`.

## Configuração

1. Copie `.env.example` para `.env.local`.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Rode `npm install` e `npm run build`.
4. Crie um usuário no Supabase Auth e adicione o UUID dele em `public.admin_profiles`.
5. Publique na Vercel e adicione as mesmas variáveis de ambiente.

O acesso ao painel depende da sessão válida e da existência do usuário em `admin_profiles`.
