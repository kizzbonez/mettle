'use client';

import { Terminal } from 'lucide-react';
import { Checkbox, PasswordField, TextField } from '@/design/primitives/field';
import { PasswordMeter } from '@/features/auth/password-rules';

export interface SetupForm {
  token: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  totpCode: string;
  siteName: string;
  registrationOpen: boolean;
}

export interface StepProps {
  form: SetupForm;
  set: <K extends keyof SetupForm>(key: K, value: SetupForm[K]) => void;
  errors: Record<string, string>;
}

export function TokenStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="border border-forge-rule bg-forge p-4 font-mono text-[13px] leading-6 text-forge-text">
        <p className="label-spec mb-2 flex items-center gap-2 text-forge-muted">
          <Terminal className="size-3.5" /> On the server
        </p>
        <p><span className="text-ember">$</span> docker compose logs api</p>
        <p className="text-forge-muted">Mettle is not set up yet.</p>
        <p className="text-forge-muted">Open the site and enter this one-time setup token:</p>
        <p className="text-[#4fc3a1]">    xXxXxXxXxXxXxXxXxXxXxXxX</p>
      </div>
      <TextField
        label="Setup token"
        value={form.token}
        onChange={(event) => set('token', event.target.value)}
        error={errors.token}
        autoFocus
        autoComplete="off"
        spellCheck={false}
        className="font-mono"
        hint="It proves you operate this server. It stops working once setup is finished."
      />
    </div>
  );
}

export function AccountStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <TextField label="Your name" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} error={errors.displayName} autoComplete="name" autoFocus />
      <TextField label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} autoComplete="email" />
      <div className="space-y-2.5">
        <PasswordField label="Password" value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} autoComplete="new-password" />
        <PasswordMeter password={form.password} />
      </div>
      <PasswordField
        label="Confirm password"
        value={form.confirmPassword}
        onChange={(e) => set('confirmPassword', e.target.value)}
        error={errors.confirmPassword ?? (form.confirmPassword && form.confirmPassword !== form.password ? 'The passwords do not match yet.' : undefined)}
        autoComplete="new-password"
      />
    </div>
  );
}

export function SiteStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <TextField
        label="Site name"
        value={form.siteName}
        onChange={(e) => set('siteName', e.target.value)}
        error={errors.siteName}
        autoFocus
        hint="Shown in the header, in emails and in authenticator apps."
      />
      <div className="border border-rule bg-white p-4">
        <Checkbox
          checked={form.registrationOpen}
          onChange={(event) => set('registrationOpen', event.target.checked)}
          label={
            <span>
              <span className="font-semibold text-ink">Let anyone create an account</span>
              <span className="mt-0.5 block text-steel">
                Turn this off to run a private site where you create every account yourself. You can change it later in
                Settings.
              </span>
            </span>
          }
        />
      </div>
    </div>
  );
}
