import 'server-only';

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError, ValidationError, getErrorResponse } from '../errors';

export const CONSENT_VERSION = 'privacy-v1.0';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,128}$/;

export const inviteParticipantsSchema = z.object({
  employeeIds: z.array(z.string().uuid()).min(1).max(100),
  expiresInHours: z.number().int().min(1).max(168).default(72),
});

export const consentSchema = z.object({
  accepted: z.literal(true),
  consentVersion: z.literal(CONSENT_VERSION),
});

export const answersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        value: z.number().int().min(0).max(4),
      })
    )
    .min(1)
    .max(50)
    .superRefine((answers, context) => {
      const ids = new Set(answers.map((answer) => answer.questionId));
      if (ids.size !== answers.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Não envie a mesma questão mais de uma vez',
        });
      }
    }),
});

export function createOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string) {
  if (!TOKEN_PATTERN.test(token)) {
    throw new AppError(404, 'COLLECTION_NOT_FOUND', 'Convite ou sessão inválida');
  }
  return `\\x${createHash('sha256').update(token, 'utf8').digest('hex')}`;
}

export function createCorrelationId() {
  return randomUUID();
}

export function requestFingerprint(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const userAgent = request.headers.get('user-agent') || '';
  return createHash('sha256').update(`${forwardedFor}|${userAgent}`, 'utf8').digest('hex');
}

export function rateLimitKey(tokenHash: string, fingerprint: string, action: string) {
  return `\\x${createHash('sha256')
    .update(`${tokenHash}|${fingerprint}|${action}`, 'utf8')
    .digest('hex')}`;
}

export function bearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new AppError(401, 'COLLECTION_SESSION_REQUIRED', 'Sessão da avaliação ausente');
  }
  return match[1];
}

export function consentEvidence(inviteHash: string, consentVersion: string, correlationId: string) {
  return createHash('sha256')
    .update(`${inviteHash}|${consentVersion}|${correlationId}`, 'utf8')
    .digest('hex');
}

export function collectionResponse(body: unknown, init: { status?: number } = {}) {
  return NextResponse.json(body, {
    status: init.status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function collectionError(error: unknown) {
  if (error instanceof z.ZodError) {
    const validationError = new ValidationError(error.issues[0]?.message || 'Dados inválidos');
    const result = getErrorResponse(validationError);
    return collectionResponse(result, { status: result.statusCode });
  }

  const message = error instanceof Error ? error.message : '';
  if (/invalid|expired|not open|not available|not editable|cannot be submitted/i.test(message)) {
    return collectionResponse(
      {
        statusCode: 409,
        code: 'COLLECTION_UNAVAILABLE',
        message: 'Este convite ou sessão não está mais disponível',
      },
      { status: 409 }
    );
  }
  if (/all required questions/i.test(message)) {
    return collectionResponse(
      {
        statusCode: 422,
        code: 'INCOMPLETE_ASSESSMENT',
        message: 'Responda todas as questões obrigatórias antes de concluir',
      },
      { status: 422 }
    );
  }

  const result = getErrorResponse(error);
  if (result.statusCode >= 500) {
    return collectionResponse(
      {
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Não foi possível processar a avaliação',
      },
      { status: 500 }
    );
  }
  return collectionResponse(result, { status: result.statusCode });
}
