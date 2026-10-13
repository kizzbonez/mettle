'use client';

import { FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { Notice } from '@/design/patterns/notice';
import { Button } from '@/design/primitives/button';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { Spinner } from '@/design/primitives/spinner';
import { useToast } from '@/design/primitives/toast';
import { api, errorMessage } from '@/lib/api';
import type { LabVerdict } from '@/types/content-admin';
import { VerifyVerdict } from './verify-result';

interface LabVerifyProps {
  /** Null until the lab has been saved once. */
  labId: string | null;
  /** When the saved lab last changed; a verdict from before then is out of date. */
  savedAt: string | null;
  /** The form has changes that are not saved, which a check would not see. */
  dirty: boolean;
}

/** Runs the saved lab's solution and starter in the sandbox and shows whether the lab is sound. */
export function LabVerify({ labId, savedAt, dirty }: LabVerifyProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ verdict: LabVerdict; of: string | null } | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function verify() {
    if (!labId) return;
    setBusy(true);
    setError(null);
    try {
      const verdict = await api.post<LabVerdict>(`/admin/labs/${labId}/verify`);
      setResult({ verdict, of: savedAt });
      if (verdict.sound) toast.success('The lab is sound.');
      else toast.error('The lab is not sound. The sandbox check shows why.');
    } catch (cause) {
      setError(cause);
      toast.error(errorMessage(cause));
    }
    setBusy(false);
  }

  return (
    <Plate>
      <PlateHeader className="flex-col sm:flex-row" title="Sandbox check" caption="Runs the reference solution and the starter against every test, in the sandbox learners' code runs in."
        action={<Button variant="secondary" onClick={() => void verify()} loading={busy} disabled={!labId || dirty} icon={<FlaskConical className="size-4" />}>Verify in sandbox</Button>} />
      <div className="space-y-5 p-5">
        {!labId ? <p className="text-sm text-steel">Create the lab first. The check runs the saved lab, so there is nothing to verify yet.</p> : null}
        {labId && dirty ? <Notice tone="warning">You have unsaved changes. The check runs the saved lab, so save before verifying.</Notice> : null}
        {error ? <Notice tone="error" title="The check could not be run">{errorMessage(error)}</Notice> : null}
        {busy ? (
          <p className="flex items-center gap-3 text-sm text-ink-2" role="status">
            <Spinner className="size-5 text-ember" label="Verifying" /> Running the solution, then the starter. A lab that compiles can take a little while.
          </p>
        ) : null}
        {result && !busy && result.of !== savedAt ? <Notice tone="warning">The lab has been saved since this check ran. Verify again to check what is saved now.</Notice> : null}
        {result && !busy ? <VerifyVerdict verdict={result.verdict} /> : null}
        {labId && !dirty && !busy && !result && !error ? (
          <p className="text-sm text-steel">A lab is sound when the reference solution passes every test, and the starter builds but does not pass.</p>
        ) : null}
      </div>
    </Plate>
  );
}
