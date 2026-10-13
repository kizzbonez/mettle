'use client';

import { ROLES, type Role } from '@mettle/shared';
import { useEffect, useState, type FormEvent } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { PasswordField, SelectField, TextAreaField, TextField } from '@/design/primitives/field';
import { Modal } from '@/design/primitives/modal';
import { useToast } from '@/design/primitives/toast';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import type { AdminUser } from '@/types/admin';

const ROLE_HELP: Record<Role, string> = {
  learner: 'Takes courses, exams and labs.',
  instructor: 'Also manages lessons, questions, exams and labs.',
  admin: 'Also manages users, email and settings. Must use two-factor authentication.',
};

interface DialogProps {
  onClose: () => void;
  /** Called after a successful change, to reload the table. */
  onDone: () => void;
}

/** Runs a request and reports the outcome; returns whether it worked. */
function useAction(onDone: () => void, onClose: () => void) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function run(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError(null);
    try {
      await work();
      toast.success(success);
      onDone();
      onClose();
    } catch (cause) {
      setError(cause);
    }
    setBusy(false);
  }
  return { busy, error, run };
}

function RoleSelect({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <SelectField label="Role" value={value} onChange={(event) => onChange(event.target.value as Role)} hint={ROLE_HELP[value]}>
      {ROLES.map((role) => <option key={role} value={role}>{role[0]?.toUpperCase() + role.slice(1)}</option>)}
    </SelectField>
  );
}

export function EditUserDialog({ user, onClose, onDone }: DialogProps & { user: AdminUser | null }) {
  const [displayName, setName] = useState('');
  const [role, setRole] = useState<Role>('learner');
  const { busy, error, run } = useAction(onDone, onClose);

  useEffect(() => {
    if (user) {
      setName(user.displayName);
      setRole(user.role);
    }
  }, [user]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (user) void run(() => api.patch(`/admin/users/${user.id}`, { displayName, role }), `${displayName} was updated.`);
  };

  return (
    <Modal open={user !== null} onClose={onClose} title="Edit user" description={user?.email}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="edit-user" loading={busy}>Save changes</Button></>}>
      <form id="edit-user" onSubmit={submit} className="space-y-4">
        {error && !fieldErrors(error).displayName ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        <TextField label="Name" value={displayName} onChange={(event) => setName(event.target.value)} error={fieldErrors(error).displayName} />
        <RoleSelect value={role} onChange={setRole} />
      </form>
    </Modal>
  );
}

export function BanUserDialog({ user, onClose, onDone }: DialogProps & { user: AdminUser | null }) {
  const [reason, setReason] = useState('');
  const { busy, error, run } = useAction(onDone, onClose);
  useEffect(() => setReason(''), [user]);
  const suspended = user?.status === 'banned';

  const confirm = () => {
    if (!user) return;
    if (suspended) void run(() => api.post(`/admin/users/${user.id}/unban`), `${user.displayName} can sign in again.`);
    else void run(() => api.post(`/admin/users/${user.id}/ban`, { reason }), `${user.displayName} was suspended.`);
  };

  return (
    <Modal open={user !== null} onClose={onClose} title={suspended ? 'Lift the suspension?' : 'Suspend this user?'} description={user ? `${user.displayName} · ${user.email}` : undefined}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={suspended ? 'primary' : 'danger'} loading={busy} onClick={confirm}>{suspended ? 'Reinstate' : 'Suspend'}</Button></>}>
      <div className="space-y-4">
        {error ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        {suspended ? (
          <p className="text-sm text-ink-2">They will be able to sign in again. Their progress was kept.{user?.banReason ? ` Reason on record: "${user.banReason}".` : ''}</p>
        ) : (
          <>
            <p className="text-sm text-ink-2">They are signed out of every device at once and cannot sign in again. Their progress is kept, and they are told by email.</p>
            <TextAreaField label="Reason (included in the email)" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={300} className="min-h-20" />
          </>
        )}
      </div>
    </Modal>
  );
}

export function CreateUserDialog({ open, onClose, onDone }: DialogProps & { open: boolean }) {
  const blank = { displayName: '', email: '', password: '', role: 'learner' as Role };
  const [form, setForm] = useState(blank);
  const { busy, error, run } = useAction(onDone, onClose);
  const fields = fieldErrors(error);
  useEffect(() => {
    if (open) setForm({ displayName: '', email: '', password: '', role: 'learner' });
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void run(() => api.post('/admin/users', form), `An account was created for ${form.displayName}.`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a user" description="Give them the password yourself; they can change it after signing in."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="create-user" loading={busy}>Create account</Button></>}>
      <form id="create-user" onSubmit={submit} className="space-y-4">
        {error && Object.keys(fields).length === 0 ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        <TextField label="Name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} error={fields.displayName} />
        <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={fields.email} />
        <PasswordField label="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={fields.password} hint="At least 10 characters, with a letter and a number." autoComplete="new-password" />
        <RoleSelect value={form.role} onChange={(role) => setForm({ ...form, role })} />
      </form>
    </Modal>
  );
}

interface EmailDialogProps extends DialogProps {
  recipients: AdminUser[];
}

export function EmailUsersDialog({ recipients, onClose, onDone }: EmailDialogProps) {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fields = fieldErrors(error);
  useEffect(() => {
    if (recipients.length === 0) return;
    setSubject('');
    setMessage('');
    setError(null);
  }, [recipients.length]);

  async function send(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.post<{ sent: number; failed: number }>('/admin/email', { userIds: recipients.map((user) => user.id), subject, message });
      if (result.failed > 0) toast.error(`${result.sent} sent, ${result.failed} could not be delivered. See the email log.`);
      else toast.success(`Sent to ${result.sent} ${result.sent === 1 ? 'person' : 'people'}.`);
      onDone();
      onClose();
    } catch (cause) {
      setError(cause);
    }
    setBusy(false);
  }

  const names = recipients.slice(0, 3).map((user) => user.displayName).join(', ');
  return (
    <Modal open={recipients.length > 0} onClose={onClose} size="lg" title={`Email ${recipients.length} ${recipients.length === 1 ? 'user' : 'users'}`}
      description={`To: ${names}${recipients.length > 3 ? ` and ${recipients.length - 3} more` : ''}. Each person gets their own copy.`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="email-users" loading={busy}>Send</Button></>}>
      <form id="email-users" onSubmit={send} className="space-y-4">
        {error && Object.keys(fields).length === 0 ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        <TextField label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} error={fields.subject} maxLength={120} />
        <TextAreaField label="Message" value={message} onChange={(event) => setMessage(event.target.value)} error={fields.message} className="min-h-44" hint="Plain text. A blank line starts a new paragraph. It is sent in the site's email design, addressed to each person by name." />
      </form>
    </Modal>
  );
}
