'use client';

import { useState, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { StatusBadge } from '@/design/primitives/badge';
import { Button } from '@/design/primitives/button';
import { PasswordField, TextField } from '@/design/primitives/field';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { useToast } from '@/design/primitives/toast';
import { useAuth } from '@/features/auth/auth-provider';
import { PasswordMeter, passwordIsAcceptable } from '@/features/auth/password-rules';
import { api, errorMessage, fieldErrors } from '@/lib/api';

export function AccountPanel() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [displayName, setName] = useState(user.displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.patch('/account', { displayName });
      await refresh();
      toast.success('Your name was updated.');
    } catch (cause) {
      setError(cause);
    }
    setBusy(false);
  }

  return (
    <Plate className="max-w-2xl">
      <PlateHeader title="Account" action={<StatusBadge status={user.role} />} />
      <form onSubmit={save} className="space-y-5 p-5">
        <TextField label="Name" value={displayName} onChange={(event) => setName(event.target.value)} error={fieldErrors(error).displayName} autoComplete="name"
          hint="Shown on your dashboard and to administrators." />
        <TextField label="Email" value={user.email} readOnly disabled hint="Your sign-in address. Ask an administrator if it needs to change." />
        <Button type="submit" loading={busy} disabled={displayName.trim() === user.displayName || displayName.trim().length < 2}>Save</Button>
      </form>
    </Plate>
  );
}

const EMPTY = { currentPassword: '', password: '', confirmPassword: '' };

export function PasswordPanel() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fields = fieldErrors(error);
  const mismatch = form.confirmPassword !== '' && form.confirmPassword !== form.password;
  const ready = form.currentPassword !== '' && passwordIsAcceptable(form.password) && form.password === form.confirmPassword;

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/account/password', form);
      setForm(EMPTY);
      toast.success('Password changed. Your other devices were signed out.');
    } catch (cause) {
      setError(cause);
    }
    setBusy(false);
  }

  return (
    <Plate>
      <PlateHeader title="Password" caption="Changing it signs out every other device." />
      <form onSubmit={save} className="space-y-4 p-5">
        {error && Object.keys(fields).length === 0 ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        <PasswordField label="Current password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} error={fields.currentPassword} autoComplete="current-password" />
        <div className="space-y-2.5">
          <PasswordField label="New password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={fields.password} autoComplete="new-password" />
          <PasswordMeter password={form.password} />
        </div>
        <PasswordField label="Confirm new password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          error={fields.confirmPassword ?? (mismatch ? 'The passwords do not match yet.' : undefined)} autoComplete="new-password" />
        <Button type="submit" loading={busy} disabled={!ready}>Change password</Button>
      </form>
    </Plate>
  );
}
