'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { DataTable, type Column } from '@/design/patterns/data-table';
import { LoadState } from '@/design/patterns/load-state';
import { Notice } from '@/design/patterns/notice';
import { PageHeader } from '@/design/patterns/page-header';
import { toQuery, useListState } from '@/design/patterns/use-list-state';
import { Badge, StatusBadge } from '@/design/primitives/badge';
import { Button, ButtonLink } from '@/design/primitives/button';
import { Checkbox, TextField } from '@/design/primitives/field';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { useToast } from '@/design/primitives/toast';
import { api, errorMessage, fieldErrors } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { EmailLogRow, SiteSettings } from '@/types/admin';

const TEMPLATE_LABEL: Record<string, string> = {
  welcome: 'Welcome',
  password_reset: 'Password reset',
  password_changed: 'Password changed',
  admin_message: 'From an admin',
  account_suspended: 'Suspension notice',
};

const emailColumns: Column<EmailLogRow>[] = [
  { key: 'sent', header: 'Sent', render: (row) => <span className="text-[13px] text-steel tabular-nums">{formatDateTime(row.createdAt)}</span> },
  { key: 'to', header: 'To', render: (row) => <span className="font-medium">{row.toEmail}</span> },
  { key: 'template', header: 'Kind', render: (row) => <Badge>{TEMPLATE_LABEL[row.template] ?? row.template}</Badge> },
  { key: 'subject', header: 'Subject', render: (row) => <span className="text-ink-2">{row.subject}</span> },
  { key: 'status', header: 'Result', render: (row) => <span title={row.error ?? undefined}><StatusBadge status={row.status} /></span> },
];

/** Every message the site tried to send. Bodies are not stored. */
export function EmailLogView() {
  const [state, setState] = useListState({ sort: 'createdAt' });
  const { data, error } = useApi<Page<EmailLogRow>>(`/admin/email-log?${toQuery(state)}`, { keepPreviousData: true });
  return (
    <>
      <PageHeader eyebrow="Admin" title="Email" description="Every message the site has sent or tried to send. To write to people, select them on the Users page."
        actions={<ButtonLink href="/admin/users" variant="secondary">Choose recipients</ButtonLink>} />
      <Plate>
        <DataTable label="Email log" columns={emailColumns} data={data} error={error} state={state} onState={setState} rowKey={(row) => row.id}
          empty={{ title: 'No email has been sent yet', hint: 'Welcome messages, password resets and your own messages will be listed here.' }} />
      </Plate>
    </>
  );
}

function SettingsForm({ initial, onSaved }: { initial: SiteSettings; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => setForm(initial), [initial]);
  const dirty = form.name !== initial.name || form.registrationOpen !== initial.registrationOpen;

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.put('/admin/settings', form);
      toast.success('Settings saved.');
      onSaved();
    } catch (cause) {
      setError(cause);
    }
    setBusy(false);
  }

  return (
    <Plate className="max-w-2xl">
      <PlateHeader title="Site" caption="How the site presents itself, and who may join." />
      <form onSubmit={save} className="space-y-6 p-5">
        {error && !fieldErrors(error).name ? <Notice tone="error">{errorMessage(error)}</Notice> : null}
        <TextField label="Site name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} error={fieldErrors(error).name} maxLength={40}
          hint="Shown in the header, in emails and in authenticator apps." />
        <div className="border border-rule bg-white p-4">
          <Checkbox checked={form.registrationOpen} onChange={(event) => setForm({ ...form, registrationOpen: event.target.checked })}
            label={<span><span className="font-semibold text-ink">Let anyone create an account</span><span className="mt-0.5 block text-steel">When this is off, the sign-up page is closed and you add people yourself on the Users page.</span></span>} />
        </div>
        <Button type="submit" loading={busy} disabled={!dirty || form.name.trim() === ''}>Save settings</Button>
      </form>
    </Plate>
  );
}

export function SettingsView() {
  const { data, error, mutate } = useApi<{ site: SiteSettings }>('/admin/settings');
  return (
    <>
      <PageHeader eyebrow="Admin" title="Settings" />
      <LoadState data={data} error={error} onRetry={() => void mutate()}>
        {(settings) => <SettingsForm initial={settings.site} onSaved={() => void mutate()} />}
      </LoadState>
    </>
  );
}
