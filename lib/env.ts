export function getPublicEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const missing: string[] = [];

  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(', ')}`);
  }

  return {
    supabaseUrl: supabaseUrl as string,
    supabaseAnonKey: supabaseAnonKey as string,
    appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000',
  };
}

export function getOptionalServerEnvironment() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null,
    openAiApiKey: process.env.OPENAI_API_KEY?.trim() || null,
    asaasApiKey: process.env.ASAAS_API_KEY?.trim() || null,
  };
}
