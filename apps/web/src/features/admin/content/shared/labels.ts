import type { PublishStatus, QuestionType } from '@mettle/shared';

export const STATUS_LABEL: Record<PublishStatus, string> = { draft: 'Draft', published: 'Published', archived: 'Archived' };

export const TYPE_LABEL: Record<QuestionType, string> = {
  single: 'Single answer',
  multiple: 'Multiple answers',
  true_false: 'True or false',
};


/** The non-empty lines of a text box: one outcome or objective per line. */
export function toLines(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

/** Markdown flattened to one line of plain text, for a table cell. */
export function excerpt(markdown: string, max = 150): string {
  const flat = markdown
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/^[#>]+\s*/gm, '')
    .replace(/[`*]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export function slugify(title: string): string {
  return title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/**
 * Sets the title. While something new still has the slug its title suggests,
 * the slug follows along; a saved slug is never changed behind the author's back.
 */
export function followTitle<T extends { title: string; slug: string }>(form: T, title: string, creating: boolean): T {
  const following = creating && form.slug === slugify(form.title);
  return { ...form, title, slug: following ? slugify(title) : form.slug };
}

/** A whole number from a number box. An empty box is 0, which the API then rejects where 0 is not allowed. */
export function toInt(text: string): number {
  return Number(text);
}
