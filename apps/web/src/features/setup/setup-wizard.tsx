'use client';

import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button, ButtonLink } from '@/design/primitives/button';
import { Checkbox } from '@/design/primitives/field';
import { RecoveryCodes } from '@/features/account/recovery-codes';
import { TotpEnrollmentPanel } from '@/features/account/totp-enrollment';
import { FormHeading } from '@/features/auth/auth-shell';
import { passwordIsAcceptable } from '@/features/auth/password-rules';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { TotpEnrollment } from '@/types/account';
import { AccountStep, SiteStep, TokenStep, type SetupForm } from './setup-steps';

export const SETUP_STEPS = [
  { title: 'Unlock', short: 'Unlock', intro: 'Enter the one-time token from the server log.' },
  { title: 'Administrator', short: 'Admin', intro: 'Create the account that runs this site.' },
  { title: 'Two-factor', short: '2FA', intro: 'Administrators sign in with a password and a code.' },
  { title: 'Your site', short: 'Site', intro: 'Name it and decide who may join.' },
  { title: 'Recovery codes', short: 'Codes', intro: 'Your way back in if you lose your authenticator.' },
] as const;

const INITIAL: SetupForm = {
  token: '', displayName: '', email: '', password: '', confirmPassword: '', totpCode: '', siteName: 'Mettle', registrationOpen: true,
};

function canContinue(step: number, form: SetupForm): boolean {
  if (step === 0) return form.token.trim().length > 0;
  if (step === 1) {
    const filled = form.displayName.trim().length >= 2 && form.email.includes('@');
    return filled && passwordIsAcceptable(form.password) && form.password === form.confirmPassword;
  }
  if (step === 2) return form.totpCode.replace(/\s/g, '').length === 6;
  return form.siteName.trim().length > 0;
}

/** Progress through the wizard, shown above the form on every step. */
function StepRail({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-start gap-1.5" aria-label="Setup progress">
      {SETUP_STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-1 flex-col gap-1.5" aria-current={index === current ? 'step' : undefined}>
          <span className={cn('h-1.5 transition-colors duration-300', index < current ? 'bg-patina' : index === current ? 'bg-ember' : 'bg-rule')} />
          <span className={cn('label-spec hidden sm:block', index === current ? 'text-ink' : 'text-steel-2')}>{step.short}</span>
        </li>
      ))}
    </ol>
  );
}

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const errors = fieldErrors(error);

  const set = <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  /** What "Continue" does on each step. Only the last call writes anything on the server. */
  async function advance(): Promise<void> {
    if (step === 0) await api.post('/setup/verify', { token: form.token });
    if (step === 1) setEnrollment(await api.post<TotpEnrollment>('/setup/totp', { token: form.token, email: form.email }));
    if (step === 3) {
      const body = { ...form, totpSecret: enrollment?.secret, totpCode: form.totpCode.replace(/\s/g, '') };
      setCodes((await api.post<{ recoveryCodes: string[] }>('/setup/complete', body)).recoveryCodes);
    }
    setStep((current) => current + 1);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await advance();
    } catch (cause) {
      setError(cause);
      // A wrong code is found out at the end; send the user back to where they can fix it.
      if (fieldErrors(cause).totpCode) setStep(2);
    }
    setBusy(false);
  }

  const info = SETUP_STEPS[step] ?? SETUP_STEPS[0];
  const stepProps = { form, set, errors };

  return (
    <form onSubmit={submit} noValidate>
      <StepRail current={step} />
      <FormHeading step={`Step ${step + 1} of ${SETUP_STEPS.length}`} title={info.title}>{info.intro}</FormHeading>
      {error && Object.keys(errors).length === 0 ? <Notice tone="error" className="mb-5">{errorMessage(error)}</Notice> : null}

      <div key={step} className="animate-rise">
        {step === 0 ? <TokenStep {...stepProps} /> : null}
        {step === 1 ? <AccountStep {...stepProps} /> : null}
        {step === 2 && enrollment ? (
          <TotpEnrollmentPanel enrollment={enrollment} code={form.totpCode} onCodeChange={(value) => set('totpCode', value)} error={errors.totpCode} />
        ) : null}
        {step === 3 ? <SiteStep {...stepProps} /> : null}
        {step === 4 ? (
          <div className="space-y-5">
            <RecoveryCodes codes={codes} siteName={form.siteName} />
            <Checkbox checked={saved} onChange={(event) => setSaved(event.target.checked)} label="I have saved my recovery codes somewhere safe." />
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && step < 4 ? (
          <Button variant="ghost" onClick={() => { setStep(step - 1); setError(null); }} icon={<ArrowLeft className="size-4" />}>Back</Button>
        ) : null}
        {step < 4 ? (
          <Button type="submit" size="lg" loading={busy} disabled={!canContinue(step, form)} className="ml-auto" icon={busy ? undefined : <ArrowRight className="order-last size-4" />}>
            {step === 3 ? 'Finish setup' : 'Continue'}
          </Button>
        ) : (
          <ButtonLink href="/admin" size="lg" aria-disabled={!saved} className="w-full" icon={<Check className="size-4" />}>
            Open the admin panel
          </ButtonLink>
        )}
      </div>
    </form>
  );
}
