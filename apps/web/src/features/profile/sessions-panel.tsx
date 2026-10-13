'use client';

import { Laptop, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/design/primitives/badge';
import { Button } from '@/design/primitives/button';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { Skeleton } from '@/design/primitives/spinner';
import { useToast } from '@/design/primitives/toast';
import { api, errorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { DeviceSession } from '@/types/account';

/** "Chrome on Windows" from a user-agent string. Good enough to recognize your own devices. */
export function describeDevice(userAgent: string | null): { name: string; mobile: boolean } {
  if (!userAgent) return { name: 'Unknown device', mobile: false };
  const browser = /Edg\//.test(userAgent) ? 'Edge' : /Firefox\//.test(userAgent) ? 'Firefox' : /Chrome\//.test(userAgent) ? 'Chrome' : /Safari\//.test(userAgent) ? 'Safari' : 'A browser';
  const system = /Windows/.test(userAgent) ? 'Windows' : /Android/.test(userAgent) ? 'Android' : /iPhone|iPad/.test(userAgent) ? 'iOS' : /Mac OS X/.test(userAgent) ? 'macOS' : /Linux/.test(userAgent) ? 'Linux' : 'an unknown system';
  return { name: `${browser} on ${system}`, mobile: /Android|iPhone|Mobile/.test(userAgent) };
}

function Row({ session, onRevoke, busy }: { session: DeviceSession; onRevoke: () => void; busy: boolean }) {
  const device = describeDevice(session.userAgent);
  const Icon = device.mobile ? Smartphone : Laptop;
  return (
    <li className="flex items-center gap-4 px-5 py-3.5">
      <Icon className="size-5 shrink-0 text-steel" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{device.name}</span>
          {session.current ? <Badge tone="patina">This device</Badge> : null}
        </p>
        <p className="text-[13px] text-steel">{session.ip ?? 'Unknown address'} · active {timeAgo(session.lastUsedAt)} · signed in {timeAgo(session.createdAt)}</p>
      </div>
      {session.current ? null : <Button variant="ghost" size="sm" loading={busy} onClick={onRevoke}>Sign out</Button>}
    </li>
  );
}

export function SessionsPanel() {
  const toast = useToast();
  const { data, mutate } = useApi<{ sessions: DeviceSession[] }>('/account/sessions');
  const [busy, setBusy] = useState<string | null>(null);

  async function act(key: string, work: () => Promise<unknown>, done: string) {
    setBusy(key);
    try {
      await work();
      await mutate();
      toast.success(done);
    } catch (error) {
      toast.error(errorMessage(error));
    }
    setBusy(null);
  }

  const others = (data?.sessions ?? []).filter((session) => !session.current).length;
  return (
    <Plate>
      <PlateHeader title="Signed-in devices" caption="Signing a device out takes effect on its next request."
        action={others > 0 ? <Button variant="secondary" size="sm" loading={busy === 'all'} onClick={() => void act('all', () => api.post('/account/sessions/revoke-others'), 'Every other device was signed out.')}>Sign out all others</Button> : null} />
      {data ? (
        <ul className="divide-y divide-rule-soft">
          {data.sessions.map((session) => (
            <Row key={session.id} session={session} busy={busy === session.id}
              onRevoke={() => void act(session.id, () => api.delete(`/account/sessions/${session.id}`), 'That device was signed out.')} />
          ))}
        </ul>
      ) : (
        <div className="space-y-3 p-5"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
      )}
    </Plate>
  );
}
