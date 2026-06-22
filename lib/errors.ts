export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(400, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Não autenticado') {
    super(401, 'AUTHENTICATION_ERROR', message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Acesso não autorizado') {
    super(403, 'AUTHORIZATION_ERROR', message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} não encontrado`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Erro interno do servidor') {
    super(500, 'INTERNAL_SERVER_ERROR', message);
    this.name = 'InternalServerError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      field: error instanceof ValidationError ? error.field : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Erro desconhecido',
  };
}
