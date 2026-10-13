'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { PasswordField, TextField } from '@/design/primitives/field';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import { FormHeading } from './auth-shell';
import { PasswordMeter, passwordIsAcceptable } from './password-rules';

/** Shown under "confirm password" as soon as both boxes have something in them. */
function MatchHint({ password, confirm }: { password: string; confirm: string }) {
  if (!confirm) return null;
  return password === confirm ? (
    <span className="flex items-center gap-1 text-patina">
      <Check className="size-3.5" strokeWidth={3} /> The passwords match.
    </span>
  ) : (
    <span className="text-crimson">The passwords do not match yet.</span>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fields = fieldErrors(error);

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const ready =
    form.displayName.trim().length >= 2 &&
    form.email.includes('@') &&
    passwordIsAcceptable(form.password) &&
    form.password === form.confirmPassword;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/register', form);
      router.replace('/dashboard?welcome=1');
      router.refresh();
    } catch (cause) {
      setError(cause);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormHeading step="Free account" title="Start your first level">
        Every track opens at Basic. No card, no trial clock.
      </FormHeading>

      {error && Object.keys(fields).length === 0 ? <Notice tone="error" className="mb-5">{errorMessage(error)}</Notice> : null}

      <div className="space-y-4">
        <TextField label="Your name" value={form.displayName} onChange={set('displayName')} error={fields.displayName} autoComplete="name" autoFocus required wrapperClassName="animate-rise" />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={fields.email} autoComplete="email" required wrapperClassName="animate-rise [animation-delay:50ms]" />
        <div className="animate-rise space-y-2.5 [animation-delay:100ms]">
          <PasswordField label="Password" value={form.password} onChange={set('password')} error={fields.password} autoComplete="new-password" required />
          <PasswordMeter password={form.password} />
        </div>
        <PasswordField
          label="Confirm password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={fields.confirmPassword}
          hint={<MatchHint password={form.password} confirm={form.confirmPassword} />}
          autoComplete="new-password"
          required
          wrapperClassName="animate-rise [animation-delay:150ms]"
        />
      </div>

      <Button type="submit" size="lg" loading={busy} disabled={!ready} className="mt-7 w-full" icon={busy ? undefined : <ArrowRight className="order-last size-4" />}>
        Create account
      </Button>
      <p className="mt-6 text-center text-sm text-steel">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-ink underline decoration-ember decoration-2 underline-offset-4">Sign in</Link>
      </p>
    </form>
  );
}
