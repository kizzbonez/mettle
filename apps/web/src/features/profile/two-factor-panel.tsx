'use client';

import { ShieldCheck, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { PasswordField, TextField } from '@/design/primitives/field';
import { Modal } from '@/design/primitives/modal';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { useToast } from '@/design/primitives/toast';
import { RecoveryCodes } from '@/features/account/recovery-codes';
import { TotpEnrollmentPanel } from '@/features/account/totp-enrollment';
import { useAuth } from '@/features/auth/auth-provider';
import { api, errorMessage } from '@/lib/api';
import type { TotpEnrollment } from '@/types/account';

type Flow = { kind: 'enroll'; enrollment: TotpEnrollment } | { kind: 'codes'; codes: string[] } | { kind: 'disable' } | { kind: 'regenerate' } | null;

/** Shared by "turn off" and "new recovery codes": both need the password again. */
function ConfirmForm({ needCode, busy, error, onSubmit }: { needCode: boolean; busy: boolean; error: unknown; onSubmit: (password: string, code: string) => void }) {
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  return (
    <form id="two-factor-confirm" className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(password, code); }}>
      {error ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
      <PasswordField label="Your password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" autoFocus />
      {needCode ? <TextField label="Authenticator or recovery code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" className="font-mono" /> : null}
      <Button type="submit" loading={busy} className="sr-only">Confirm</Button>
    </form>
  );
}

export function TwoFactorPanel() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [flow, setFlow] = useState<Flow>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const close = () => { setFlow(null); setCode(''); setError(null); };

  async function attempt(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (cause) {
      setError(cause);
    }
    setBusy(false);
  }

  const begin = () => attempt(async () => setFlow({ kind: 'enroll', enrollment: await api.post<TotpEnrollment>('/account/2fa/setup') }));
  const enable = () => attempt(async () => {
    const { recoveryCodes } = await api.post<{ recoveryCodes: string[] }>('/account/2fa/enable', { code: code.replace(/\s/g, '') });
    await refresh();
    setFlow({ kind: 'codes', codes: recoveryCodes });
  });
  const disable = (password: string, secondFactor: string) => attempt(async () => {
    await api.post('/account/2fa/disable', { password, code: secondFactor });
    await refresh();
    close();
    toast.success('Two-factor authentication is off.');
  });
  const regenerate = (password: string) => attempt(async () => {
    const { recoveryCodes } = await api.post<{ recoveryCodes: string[] }>('/account/2fa/recovery-codes', { password });
    setFlow({ kind: 'codes', codes: recoveryCodes });
  });

  return (
    <Plate>
      <PlateHeader title="Two-factor authentication" caption="A password plus a code from an app on your phone." />
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          {user.totpEnabled ? <ShieldCheck className="mt-0.5 size-5 shrink-0 text-patina" /> : <ShieldOff className="mt-0.5 size-5 shrink-0 text-steel-2" />}
          <div className="text-sm">
            <p className="font-semibold">{user.totpEnabled ? 'On' : 'Off'}</p>
            <p className="mt-0.5 text-steel">
              {user.totpEnabled ? 'Signing in asks for a code from your authenticator app.' : user.role === 'admin' ? 'Required for administrators. The admin panel is locked until this is on.' : 'Recommended. A stolen password alone would not be enough to sign in.'}
            </p>
          </div>
        </div>
        {error && flow === null ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        {user.totpEnabled ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFlow({ kind: 'regenerate' })}>New recovery codes</Button>
            {user.role !== 'admin' ? <Button variant="ghost" size="sm" onClick={() => setFlow({ kind: 'disable' })}>Turn off</Button> : null}
          </div>
        ) : (
          <Button loading={busy && flow === null} onClick={begin}>Set up two-factor</Button>
        )}
      </div>

      <Modal open={flow?.kind === 'enroll'} onClose={close} size="lg" title="Set up two-factor authentication"
        footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button loading={busy} disabled={code.replace(/\s/g, '').length !== 6} onClick={enable}>Turn on</Button></>}>
        {flow?.kind === 'enroll' ? <TotpEnrollmentPanel enrollment={flow.enrollment} code={code} onCodeChange={setCode} error={error ? errorMessage(error) : undefined} /> : null}
      </Modal>
      <Modal open={flow?.kind === 'codes'} onClose={close} size="lg" title="Your recovery codes" footer={<Button onClick={close}>I have saved them</Button>}>
        {flow?.kind === 'codes' ? <RecoveryCodes codes={flow.codes} /> : null}
      </Modal>
      <Modal open={flow?.kind === 'disable' || flow?.kind === 'regenerate'} onClose={close}
        title={flow?.kind === 'disable' ? 'Turn off two-factor authentication?' : 'Create new recovery codes?'}
        description={flow?.kind === 'disable' ? 'Your account will be protected by your password alone.' : 'Your current recovery codes stop working.'}
        footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button type="submit" form="two-factor-confirm" variant={flow?.kind === 'disable' ? 'danger' : 'primary'} loading={busy}>{flow?.kind === 'disable' ? 'Turn off' : 'Create codes'}</Button></>}>
        <ConfirmForm key={flow?.kind} needCode={flow?.kind === 'disable'} busy={busy} error={error} onSubmit={(password, second) => void (flow?.kind === 'disable' ? disable(password, second) : regenerate(password))} />
      </Modal>
    </Plate>
  );
}
