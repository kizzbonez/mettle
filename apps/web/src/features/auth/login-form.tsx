'use client';

import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { PasswordField, TextField } from '@/design/primitives/field';
import { api, ApiError, errorMessage, fieldErrors } from '@/lib/api';
import { FormHeading } from './auth-shell';
import { safeNext } from './safe-next';

type Step = 'credentials' | 'code';

/** Second step, shown only for accounts with two-factor on. */
function CodeStep({ code, onChange, error, useRecovery, onToggle }: {
  code: string;
  onChange: (value: string) => void;
  error?: string;
  useRecovery: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="animate-rise space-y-4">
      <div className="flex items-center gap-3 border border-rule bg-white px-4 py-3 text-sm text-ink-2">
        <ShieldCheck className="size-5 shrink-0 text-patina" />
        Password accepted. One more step.
      </div>
      <TextField
        label={useRecovery ? 'Recovery code' : 'Authenticator code'}
        value={code}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        autoFocus
        autoComplete="one-time-code"
        inputMode={useRecovery ? 'text' : 'numeric'}
        placeholder={useRecovery ? 'xxxx-xxxx-xxxx' : '123 456'}
        className="font-mono text-lg tracking-[0.3em]"
        hint={useRecovery ? 'Each recovery code works once.' : 'The 6-digit code from your authenticator app.'}
      />
      <button type="button" onClick={onToggle} className="flex items-center gap-1.5 text-sm font-medium text-ember-deep hover:underline">
        <KeyRound className="size-4" />
        {useRecovery ? 'Use my authenticator app instead' : 'I lost my device: use a recovery code'}
      </button>
    </div>
  );
}

export function LoginForm({ registrationOpen }: { registrationOpen: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/login', { email, password, ...(step === 'code' ? { code } : {}) });
      router.replace(safeNext(params.get('next')));
      router.refresh();
    } catch (cause) {
      // Not an error to show: the server is asking for the second factor.
      if (cause instanceof ApiError && cause.code === 'totp_required') setStep('code');
      else setError(cause);
      setBusy(false);
    }
  }

  const codeError = error instanceof ApiError && error.code === 'totp_invalid' ? error.message : undefined;
  const fields = fieldErrors(error);

  return (
    <form onSubmit={submit} noValidate>
      <FormHeading step={step === 'code' ? 'Step 2 of 2' : 'Welcome back'} title={step === 'code' ? 'Verify it’s you' : 'Sign in'}>
        {step === 'code' ? `Signing in as ${email}.` : 'Pick up where you left off.'}
      </FormHeading>

      {params.get('reset') === '1' && !error ? <Notice tone="success" className="mb-5">Your password was changed. Sign in with the new one.</Notice> : null}
      {error && !codeError ? <Notice tone="error" className="mb-5">{errorMessage(error)}</Notice> : null}

      {step === 'credentials' ? (
        <div className="space-y-4">
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} autoComplete="email" autoFocus required wrapperClassName="animate-rise" />
          <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} error={fields.password} autoComplete="current-password" required wrapperClassName="animate-rise [animation-delay:60ms]" />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-ember-deep hover:underline">Forgot your password?</Link>
          </div>
        </div>
      ) : (
        <CodeStep code={code} onChange={setCode} error={codeError} useRecovery={useRecovery} onToggle={() => { setUseRecovery((v) => !v); setCode(''); }} />
      )}

      <Button type="submit" size="lg" loading={busy} className="mt-7 w-full" icon={busy ? undefined : <ArrowRight className="order-last size-4" />}>
        {step === 'code' ? 'Verify and sign in' : 'Sign in'}
      </Button>

      {step === 'code' ? (
        <button type="button" onClick={() => { setStep('credentials'); setCode(''); setError(null); }} className="mt-5 w-full text-center text-sm text-steel hover:text-ink">
          Use a different account
        </button>
      ) : registrationOpen ? (
        <p className="mt-6 text-center text-sm text-steel">
          New here? <Link href="/register" className="font-semibold text-ink underline decoration-ember decoration-2 underline-offset-4">Create an account</Link>
        </p>
      ) : null}
    </form>
  );
}
