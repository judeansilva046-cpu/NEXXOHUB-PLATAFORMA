import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getOptionalServerEnvironment, getPublicEnvironment } from '../env';

export function createAdminClient() {
  const { supabaseUrl } = getPublicEnvironment();
  const { serviceRoleKey } = getOptionalServerEnvironment();

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente no ambiente do servidor');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
