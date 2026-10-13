import { desc, eq } from 'drizzle-orm';
import { db, type DbOrTx } from '../../db/client';
import { activityEvents } from '../../db/schema/progress';

export type ActivityKind =
  | 'enrolled'
  | 'lesson_completed'
  | 'exam_passed'
  | 'exam_failed'
  | 'lab_passed'
  | 'course_completed';

export interface ActivityInput {
  userId: string;
  kind: ActivityKind;
  title: string;
  href?: string;
  meta?: Record<string, unknown>;
}

export async function recordActivity(input: ActivityInput, tx: DbOrTx = db): Promise<void> {
  await tx.insert(activityEvents).values({
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    href: input.href ?? null,
    meta: input.meta ?? {},
  });
}

export async function recentActivity(userId: string, limit = 10) {
  return db
    .select({
      id: activityEvents.id,
      kind: activityEvents.kind,
      title: activityEvents.title,
      href: activityEvents.href,
      meta: activityEvents.meta,
      createdAt: activityEvents.createdAt,
    })
    .from(activityEvents)
    .where(eq(activityEvents.userId, userId))
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit);
}
