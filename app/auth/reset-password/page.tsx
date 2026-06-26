'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ZodError } from 'zod';
import { Alert } from '../../../components/ui/alert';
import { InputField } from '../../../components/ui/input-field';
import { Spinner } from '../../../components/ui/spinner';
import { getAuthErrorMessage } from '../../../lib/auth-errors';
import { authClient } from '../../../lib/supabase/auth';
import { updatePasswordSchema } from '../../../lib/validations/auth';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    try {
      const input = updatePasswordSchema.parse(formData);
      setLoading(true);
      const { error: updateError } = await authClient.updatePassword(input.password);
      if (updateError) {
        setError(getAuthErrorMessage(updateError));
        return;
      }
      setSuccess(true);
    } catch (validationError) {
      if (validationError instanceof ZodError) {
        setFieldErrors(
          Object.fromEntries(
            validationError.errors.map((item) => [item.path.join('.'), item.message])
          )
        );
      } else {
        setError('Não foi possível atualizar sua senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-white shadow-2xl">
        <h1 className="text-2xl font-semibold">Definir nova senha</h1>
        <p className="mt-2 text-sm text-slate-400">
          Use uma senha forte e diferente das anteriores.
        </p>

        {success ? (
          <div className="mt-6">
            <Alert type="success" message="Senha atualizada com sucesso." />
            <Link
              href="/auth/login"
              className="mt-5 block rounded-xl bg-blue-600 px-4 py-3 text-center font-medium hover:bg-blue-500"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
            {error && (
              <Alert type="error" message={error} dismissible onDismiss={() => setError(null)} />
            )}
            <InputField
              id="password"
              label="Nova senha"
              type="password"
              value={formData.password}
              onChange={(value) => setFormData((current) => ({ ...current, password: value }))}
              error={fieldErrors.password}
              autoComplete="new-password"
              required
              disabled={loading}
            />
            <InputField
              id="confirmPassword"
              label="Confirmar nova senha"
              type="password"
              value={formData.confirmPassword}
              onChange={(value) =>
                setFormData((current) => ({
                  ...current,
                  confirmPassword: value,
                }))
              }
              error={fieldErrors.confirmPassword}
              autoComplete="new-password"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              {loading && <Spinner size="sm" />}
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
