'use client';

import { ROLES } from '@mettle/shared';
import { Ban, Mail, Pencil, ShieldCheck, ShieldOff, Undo2, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable, type Column } from '@/design/patterns/data-table';
import { PageHeader } from '@/design/patterns/page-header';
import { TableToolbar } from '@/design/patterns/pagination';
import { toQuery, useListState } from '@/design/patterns/use-list-state';
import { StatusBadge } from '@/design/primitives/badge';
import { Button } from '@/design/primitives/button';
import { InlineSelect } from '@/design/primitives/field';
import { Plate } from '@/design/primitives/plate';
import { useAuth } from '@/features/auth/auth-provider';
import { formatDate, initials, timeAgo } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { AdminUser } from '@/types/admin';
import { BanUserDialog, CreateUserDialog, EditUserDialog, EmailUsersDialog } from './user-dialogs';

type Dialog = { kind: 'edit' | 'ban'; user: AdminUser } | { kind: 'email'; users: AdminUser[] } | { kind: 'create' } | null;

function IconButton({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className="grid size-8 place-items-center text-steel hover:bg-rule-soft hover:text-ink disabled:pointer-events-none disabled:opacity-30">
      {children}
    </button>
  );
}

function columns(open: (dialog: Dialog) => void, myId: string): Column<AdminUser>[] {
  return [
    {
      key: 'user', header: 'User', sortKey: 'displayName',
      render: (user) => (
        <div className="flex items-center gap-3">
          <span className="clip-hallmark display grid size-8 shrink-0 place-items-center bg-rule text-xs text-ink-2">{initials(user.displayName)}</span>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.displayName}{user.id === myId ? <span className="label-spec ml-2 text-steel-2">You</span> : null}</p>
            <p className="truncate text-[13px] text-steel">{user.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortKey: 'role', render: (user) => <StatusBadge status={user.role} /> },
    { key: 'status', header: 'Status', sortKey: 'status', render: (user) => <StatusBadge status={user.status} /> },
    {
      key: '2fa', header: '2FA',
      render: (user) => user.totpEnabledAt
        ? <span className="flex items-center gap-1 text-[13px] text-patina"><ShieldCheck className="size-4" /> On</span>
        : <span className="flex items-center gap-1 text-[13px] text-steel-2"><ShieldOff className="size-4" /> Off</span>,
    },
    { key: 'seen', header: 'Last seen', sortKey: 'lastSeenAt', render: (user) => <span className="text-[13px] text-steel">{timeAgo(user.lastSeenAt)}</span> },
    { key: 'joined', header: 'Joined', sortKey: 'createdAt', render: (user) => <span className="text-[13px] text-steel tabular-nums">{formatDate(user.createdAt)}</span> },
    {
      key: 'actions', header: '', className: 'w-28 text-right',
      render: (user) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <IconButton label={`Email ${user.displayName}`} onClick={() => open({ kind: 'email', users: [user] })}><Mail className="size-4" /></IconButton>
          <IconButton label={`Edit ${user.displayName}`} onClick={() => open({ kind: 'edit', user })}><Pencil className="size-4" /></IconButton>
          <IconButton label={user.status === 'banned' ? `Reinstate ${user.displayName}` : `Suspend ${user.displayName}`} disabled={user.id === myId} onClick={() => open({ kind: 'ban', user })}>
            {user.status === 'banned' ? <Undo2 className="size-4" /> : <Ban className="size-4" />}
          </IconButton>
        </div>
      ),
    },
  ];
}

export function UsersView() {
  const { user: me } = useAuth();
  const [state, setState] = useListState({ sort: 'createdAt', filters: ['role', 'status'] });
  const { data, error, mutate } = useApi<Page<AdminUser>>(`/admin/users?${toQuery(state)}`, { keepPreviousData: true });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<Dialog>(null);
  const cols = useMemo(() => columns(setDialog, me.id), [me.id]);
  const picked = (data?.items ?? []).filter((user) => selected.has(user.id));
  const close = () => setDialog(null);
  const reload = () => { setSelected(new Set()); void mutate(); };

  return (
    <>
      <PageHeader eyebrow="Admin" title="Users" description="Everyone with an account. Sorting, filtering and search run on the server, so this stays fast at any size."
        actions={<Button onClick={() => setDialog({ kind: 'create' })} icon={<UserPlus className="size-4" />}>Add user</Button>} />
      <Plate>
        <TableToolbar state={state} onState={setState} searchPlaceholder="Search by name or email"
          bulk={selected.size > 0 ? (
            <>
              <span className="text-sm font-semibold">{selected.size} selected</span>
              <Button size="sm" variant="secondary" disabled={picked.length === 0} onClick={() => setDialog({ kind: 'email', users: picked })} icon={<Mail className="size-4" />}>Email selected</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </>
          ) : undefined}
          filters={
            <>
              <InlineSelect label="Filter by role" value={state.filters.role} onChange={(event) => setState({ filters: { role: event.target.value } })}>
                <option value="">All roles</option>
                {ROLES.map((role) => <option key={role} value={role}>{role[0]?.toUpperCase() + role.slice(1)}s</option>)}
              </InlineSelect>
              <InlineSelect label="Filter by status" value={state.filters.status} onChange={(event) => setState({ filters: { status: event.target.value } })}>
                <option value="">Any status</option>
                <option value="active">Active</option>
                <option value="banned">Suspended</option>
              </InlineSelect>
            </>
          } />
        <DataTable label="Users" columns={cols} data={data} error={error} state={state} onState={setState} rowKey={(user) => user.id}
          selection={{ selected, onChange: setSelected }} onRowClick={(user) => setDialog({ kind: 'edit', user })}
          empty={{ title: 'No users yet', hint: 'Accounts appear here as people sign up.' }} />
      </Plate>
      <EditUserDialog user={dialog?.kind === 'edit' ? dialog.user : null} onClose={close} onDone={reload} />
      <BanUserDialog user={dialog?.kind === 'ban' ? dialog.user : null} onClose={close} onDone={reload} />
      <CreateUserDialog open={dialog?.kind === 'create'} onClose={close} onDone={reload} />
      <EmailUsersDialog recipients={dialog?.kind === 'email' ? dialog.users : []} onClose={close} onDone={reload} />
    </>
  );
}
