/**
 * Traduz erros do Supabase Auth em mensagens claras para o usuário
 */

interface AuthError {
  message?: string;
  status?: number;
  code?: string;
}

export function getAuthErrorMessage(error: AuthError | null | undefined): string {
  if (!error) {
    return 'Erro desconhecido ao autenticar';
  }

  const message = error.message || '';
  const status = error.status;

  // Erros de Email/Senha
  if (message.includes('Invalid login credentials')) {
    return 'Email ou senha inválidos';
  }

  if (message.includes('Email not confirmed')) {
    return 'Email ainda não foi confirmado. Verifique sua caixa de entrada.';
  }

  if (message.includes('User already registered')) {
    return 'Este email já está registrado';
  }

  if (message.includes('Password should be different')) {
    return 'A nova senha deve ser diferente da senha atual';
  }

  if (message.includes('New password should be different')) {
    return 'A nova senha deve ser diferente da senha atual';
  }

  // Erros de validação
  if (message.includes('Otp expired')) {
    return 'Código expirou. Por favor, solicite um novo código.';
  }

  if (message.includes('Invalid Otp')) {
    return 'Código inválido. Tente novamente.';
  }

  // Erros de OAuth
  if (status === 401 && message.includes('oauth')) {
    return 'Falha na autenticação OAuth. Verifique as configurações.';
  }

  if (message.includes('OAuth client was not found')) {
    return 'Provedor OAuth não configurado corretamente';
  }

  if (message.includes('invalid_client')) {
    return 'Credenciais OAuth inválidas';
  }

  // Erros de rede
  if (message.includes('Failed to fetch') || message.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  // Erro genérico
  return message || 'Erro ao autenticar. Tente novamente.';
}

/**
 * Formata uma mensagem de erro com contexto para logging
 */
export function formatAuthErrorLog(
  action: string,
  error: AuthError | null | undefined,
  details?: Record<string, unknown>
) {
  return {
    action,
    message: getAuthErrorMessage(error),
    status: error?.status,
    code: error?.code,
    fullMessage: error?.message,
    details,
    timestamp: new Date().toISOString(),
  };
}
