import { Save, Trash2 } from 'lucide-react';
import { Button, ButtonLink } from '@/design/primitives/button';

interface EditorActionsProps {
  /** The id of the form the save button submits; the buttons sit outside it. */
  formId: string;
  busy: boolean;
  /** Nothing has changed since the last save, so there is nothing to send. */
  unchanged?: boolean;
  saveLabel: string;
  /** The list this editor belongs to. */
  backHref: string;
  /** Present for something already saved. */
  onDelete?: () => void;
}

/** Delete, cancel and save for an editor page. Shown in the page header and again under a long form. */
export function EditorActions({ formId, busy, unchanged, saveLabel, backHref, onDelete }: EditorActionsProps) {
  return (
    <>
      {onDelete ? (
        <Button variant="ghost" onClick={onDelete} disabled={busy} icon={<Trash2 className="size-4" />} className="text-crimson hover:bg-crimson-soft">Delete</Button>
      ) : null}
      <ButtonLink href={backHref} variant="secondary">{unchanged ? 'Back to the list' : 'Cancel'}</ButtonLink>
      <Button type="submit" form={formId} loading={busy} disabled={unchanged} icon={<Save className="size-4" />}>{saveLabel}</Button>
    </>
  );
}

/** The same actions, repeated at the foot of a form too long to see whole. */
export function EditorFooter(props: EditorActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-rule pt-6">
      <EditorActions {...props} />
    </div>
  );
}
