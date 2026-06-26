# 🔍 CHECKLIST DE VERIFICAÇÃO - LOGIN QUEBRADO

## PASSO 1: Verificar se usuário existe em auth.users

1. Abra o **Supabase Dashboard**: https://app.supabase.com
2. Acesse seu projeto NexxoHub
3. Vá em **Authentication → Users**
4. Procure por: `judeansilva319@gmail.com`

### Se NÃO encontrar:

- ❌ **PROBLEMA ENCONTRADO!** O usuário não existe em `auth.users`
- Solução: Criar manualmente a conta com:
  - Email: `judeansilva319@gmail.com`
  - Senha: `Judean16@`

### Se encontrar:

- ✅ Usuário existe
- Próximo passo: Verificar se está confirmado

---

## PASSO 2: Se encontrou - Verificar status

Na página do usuário em Auth → Users, procure por:

- **Email Confirmed?** Deve ser **SIM**
- **Status**: Deve ser **Active**

### Se NÃO confirmado:

- Clique em "**Verify Email**" para confirmar

---

## PASSO 3: Testar login com Debug Endpoint

Assim que o Netlify terminar deploy, acesse:

```
https://illustrious-cascaron-bd22da2.netlify.app/api/auth/debug?email=judeansilva319@gmail.com&password=Judean16@
```

Isso vai retornar:

- ✅ `success: true` = Login funcionando
- ❌ `success: false` = Mostrará exatamente o erro

---

## PASSO 4: Se Debug mostrar erro

Copie o `error.message` e `error.code` e nos mostre.

---

## CHECKLIST RÁPIDO NO SUPABASE:

```sql
-- Query para ver se usuário existe
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'judeansilva319@gmail.com';
```

Execute no **Supabase SQL Editor** (aba Query da sidebar esquerda)
