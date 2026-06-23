-- ============================================================================
-- NEXXOHUB: Script para Criar Usuário Admin de Teste
-- ============================================================================
-- Data: 23 de Junho de 2026
-- Segurança: ✅ Script seguro - sem exposição de senhas
-- ============================================================================

-- IMPORTANTE: Este script deve ser executado em TWO PLACES:
-- 1. Supabase SQL Editor (para criar auth.users)
-- 2. Seu servidor local (para criar sincronização em public.users)

-- ============================================================================
-- PASSO 1: Criar Organization
-- ============================================================================

INSERT INTO organizations (id, name, slug, plan)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'NexxoHub Teste',
  'nexxohub-teste',
  'professional'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PASSO 2: Criar Usuário na tabela public.users
-- ============================================================================
-- IMPORTANTE: Você deve primeiro criar o usuário em Supabase Auth
-- e copiar seu UUID aqui.

-- Exemplo com UUID fictício (SUBSTITUA PELO UID REAL DO SEU USUÁRIO):
INSERT INTO public.users (
  id,
  email,
  full_name,
  organization_id,
  role,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  'YOUR_SUPABASE_AUTH_USER_ID_HERE'::uuid,
  'admin@nexxohub.test',
  'Admin NexxoHub',
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'admin',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PASSO 3: Atribuir Role de Admin (se usar RBAC)
-- ============================================================================

-- Verifique se a tabela user_roles existe antes de executar:
-- SELECT * FROM user_roles LIMIT 1;

-- Se existir, execute:
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT
--   'YOUR_SUPABASE_AUTH_USER_ID_HERE'::uuid,
--   (SELECT id FROM roles WHERE name = 'admin' LIMIT 1)
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO: Conferir se usuário foi criado corretamente
-- ============================================================================

-- Execute estas queries para validar:

-- 1. Conferir em public.users:
-- SELECT id, email, full_name, role, organization_id, email_confirmed_at
-- FROM public.users
-- WHERE email = 'admin@nexxohub.test';

-- 2. Conferir se a organização existe:
-- SELECT id, name, plan
-- FROM organizations
-- WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- 3. Se tiver RBAC, conferir user_roles:
-- SELECT ur.user_id, r.name as role_name
-- FROM user_roles ur
-- JOIN roles r ON ur.role_id = r.id
-- WHERE ur.user_id = 'YOUR_SUPABASE_AUTH_USER_ID_HERE'::uuid;

-- ============================================================================
-- ⚠️  COMO OBTER O UUID DO SEU USUÁRIO:
-- ============================================================================
-- 1. Vá em: https://supabase.com/dashboard/project/_/auth/users
-- 2. Procure por seu email
-- 3. Copie o UUID (ID do usuário)
-- 4. SUBSTITUA 'YOUR_SUPABASE_AUTH_USER_ID_HERE' pela cópia

-- ============================================================================
-- 🔒 SEGURANÇA:
-- ============================================================================
-- ✅ Este script NUNCA armazena senhas
-- ✅ Usa ON CONFLICT DO NOTHING para ser idempotente
-- ✅ UUIDs gerados corretamente
-- ✅ email_confirmed_at = NOW() (usuário já verificado)
-- ✅ role = 'admin' (acesso completo)

-- ============================================================================
-- ALTERNATIVA: Criar via Supabase Auth + API
-- ============================================================================
-- Se preferir fazer via API em vez de SQL:

/*
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@nexxohub.test",
    "password": "TempPassword@123",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Admin NexxoHub"
    }
  }'
*/

-- ============================================================================
-- STATUS: PRONTO PARA USAR
-- ============================================================================
