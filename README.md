# NEXXOHUB Platform

Plataforma SaaS Multi-Tenant - Hierarquia: Organizações > Clínicas > Empresas > Colaboradores

## Stack Tecnológico

- Next.js 15 com App Router
- React 19
- TypeScript 5
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- JWT Authentication

## Deployment

- **URL Principal:** https://nexxohub.com.br
- **URL Vercel:** https://nexxohub-plataforma.vercel.app
- **Platform:** Vercel (Auto-deploy from main branch)

## Setup Local

1. Clone: `git clone https://github.com/judeansilva046-cpu/NEXXOHUB-PLATAFORMA.git`
2. Install: `npm install`
3. Configure `.env.local` com credenciais Supabase
4. Run: `npm run dev`

## Variáveis de Ambiente

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Arquitetura Multi-Tenant

- Row Level Security (RLS) habilitado no Supabase
- Políticas de acesso por organização
- Isolamento de dados entre tenants
