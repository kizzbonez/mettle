'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '@/design/patterns/page-header';
import { Plate } from '@/design/primitives/plate';
import { Tabs, type TabItem } from '@/design/primitives/tabs';
import { api } from '@/lib/api';
import type { AdminCourse, AdminLabDetail } from '@/types/content-admin';
import { EditorActions, EditorFooter } from '../shared/editor-actions';
import { FormError } from '../shared/form-error';
import { useFormDraft, type FormDraft } from '../shared/use-editor';
import { useSave } from '../shared/use-save';
import { DeleteLabDialog } from './delete-lab';
import { LabCode } from './lab-code';
import { LabBrief, LabDetails } from './lab-details';
import { LabFixtures } from './lab-fixtures';
import { blankLab, flaggedTabs, LAB_FIELDS, LAB_TABS, labBodyOf, labFormOf, LABS, type LabForm, type LabTab } from './lab-model';
import { LabTests } from './lab-tests';
import { LabVerify } from './lab-verify';

const FORM_ID = 'lab-form';
const TAB_LABEL: Record<LabTab, string> = { details: 'Details', brief: 'Brief', code: 'Code', fixtures: 'Fixtures', tests: 'Test cases' };

/** The tab strip, with a count on the list tabs and a mark on any tab holding a refused field. */
function tabItems(form: LabForm, flagged: LabTab[]): TabItem<LabTab>[] {
  const counts: Partial<Record<LabTab, number>> = { fixtures: form.fixtures.length, tests: form.tests.length };
  return LAB_TABS.map((key) => ({
    key,
    count: counts[key],
    label: flagged.includes(key)
      ? <>{TAB_LABEL[key]}<span className="size-1.5 rounded-full bg-crimson" aria-hidden /><span className="sr-only">has errors</span></>
      : TAB_LABEL[key],
  }));
}

interface PanelProps {
  tab: LabTab;
  draft: FormDraft<LabForm>;
  courses: AdminCourse[];
  error: unknown;
  creating: boolean;
}

function LabPanel({ tab, draft, courses, error, creating }: PanelProps) {
  if (tab === 'details') return <LabDetails draft={draft} courses={courses} error={error} creating={creating} />;
  if (tab === 'brief') return <LabBrief draft={draft} error={error} />;
  if (tab === 'code') return <LabCode draft={draft} error={error} />;
  if (tab === 'fixtures') return <LabFixtures draft={draft} error={error} />;
  return <LabTests draft={draft} error={error} />;
}

interface LabFormProps {
  /** The lab to edit, with its test cases, or null to create one. */
  detail: AdminLabDetail | null;
  courses: AdminCourse[];
  startCourseId: string;
  /** Reloads the saved copy after a change. */
  onSaved: () => Promise<unknown>;
}

export function LabFormView({ detail, courses, startCourseId, onSaved }: LabFormProps) {
  const router = useRouter();
  const saved = useMemo(() => (detail ? labFormOf(detail) : blankLab(startCourseId)), [detail, startCourseId]);
  const draft = useFormDraft(saved);
  const { busy, error, run } = useSave();
  const [tab, setTab] = useState<LabTab>('details');
  const [deleting, setDeleting] = useState(false);
  const lab = detail?.lab ?? null;
  const flagged = useMemo(() => flaggedTabs(error), [error]);

  // A refused save may be about a field on another tab: go to the first tab that needs attention.
  useEffect(() => {
    const first = flagged[0];
    if (first) setTab((current) => (flagged.includes(current) ? current : first));
  }, [flagged]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const title = draft.form.title.trim() || 'The lab';
    const body = labBodyOf(draft.form);
    draft.markSent();
    if (lab) {
      if (await run(() => api.put(`/admin/labs/${lab.id}`, body), `${title} was saved.`)) await onSaved();
      return;
    }
    const created = await run(() => api.post<{ id: string }>('/admin/labs', body), `${title} was created.`);
    if (created) router.replace(`${LABS}/${created.id}`);
  }

  const actions = {
    formId: FORM_ID, busy, unchanged: lab !== null && !draft.dirty, saveLabel: lab ? 'Save lab' : 'Create lab',
    backHref: LABS, onDelete: lab ? () => setDeleting(true) : undefined,
  };

  return (
    <>
      <PageHeader crumbs={[{ label: 'Labs', href: LABS }, { label: lab ? 'Edit lab' : 'New lab' }]} title={lab?.title ?? 'New lab'} actions={<EditorActions {...actions} />} />
      <div className="space-y-6">
        <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-6">
          <FormError error={error} placed={LAB_FIELDS} />
          <Plate>
            <Tabs items={tabItems(draft.form, flagged)} value={tab} onChange={setTab} className="px-3" />
            <div role="tabpanel" aria-label={TAB_LABEL[tab]} className="p-5">
              <LabPanel tab={tab} draft={draft} courses={courses} error={error} creating={lab === null} />
            </div>
          </Plate>
        </form>
        <LabVerify labId={lab?.id ?? null} savedAt={lab?.updatedAt ?? null} dirty={draft.dirty} />
        <EditorFooter {...actions} />
      </div>
      <DeleteLabDialog lab={deleting ? lab : null} onClose={() => setDeleting(false)} onDone={() => router.push(LABS)} />
    </>
  );
}
