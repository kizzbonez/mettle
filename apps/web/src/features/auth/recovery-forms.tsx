'use client';

import { ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button, ButtonLink } from '@/design/primitives/button';
import { PasswordField, TextField } from '@/design/primitives/field';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import { FormHeading } from './auth-shell';
import { PasswordMeter, passwordIsAcceptable } from './password-rules';

const BackToSignIn = () => (
  <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-steel hover:text-ink">
    <ArrowLeft className="size-4" /> Back to sign in
  </Link>
);

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (cause) {
      setError(cause);
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="animate-rise">
        <div className="mb-6 grid size-14 animate-stamp place-items-center bg-patina text-white clip-hallmark">
          <MailCheck className="size-6" />
        </div>
        <FormHeading title="Check your inbox">
          If <strong className="text-ink">{email}</strong> belongs to an account, a reset link is on its way. It works once and
          expires in one hour.
        </FormHeading>
        <Notice>Nothing after a few minutes? Check the spam folder, or try again with the address you signed up with.</Notice>
        <BackToSignIn />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormHeading step="Account recovery" title="Forgot your password?">
        Enter your email and we will send you a link to choose a new one.
      </FormHeading>
      {error ? <Notice tone="error" className="mb-5">{errorMessage(error)}</Notice> : null}
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors(error).email} autoComplete="email" autoFocus required wrapperClassName="animate-rise" />
      <Button type="submit" size="lg" loading={busy} disabled={!email.includes('@')} className="mt-7 w-full">
        Send reset link
      </Button>
      <BackToSignIn />
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fields = fieldErrors(error);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/reset-password', { token, password, confirmPassword });
      router.replace('/login?reset=1');
    } catch (cause) {
      setError(cause);
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="animate-rise">
        <FormHeading title="This link is incomplete">Open the link from your email again, or request a new one.</FormHeading>
        <ButtonLink href="/forgot-password" size="lg" className="w-full">Request a new link</ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <FormHeading step="Account recovery" title="Choose a new password">
        Every device signed in to your account will be signed out.
      </FormHeading>
      {error && Object.keys(fields).length === 0 ? (
        <Notice tone="error" className="mb-5">
          {errorMessage(error)} <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>
        </Notice>
      ) : null}
      <div className="space-y-4">
        <div className="animate-rise space-y-2.5">
          <PasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} error={fields.password} autoComplete="new-password" autoFocus required />
          <PasswordMeter password={password} />
        </div>
        <PasswordField label="Confirm new password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} error={fields.confirmPassword} autoComplete="new-password" required wrapperClassName="animate-rise [animation-delay:60ms]" />
      </div>
      <Button type="submit" size="lg" loading={busy} disabled={!passwordIsAcceptable(password) || password !== confirmPassword} className="mt-7 w-full">
        Change password
      </Button>
      <BackToSignIn />
    </form>
  );
}
