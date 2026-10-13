import type { FastifyRequest } from 'fastify';
import { db } from '../../db/client';
import { auditLog } from '../../db/schema/system';

export interface AuditEntry {
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

/** Records who did what. Never include secrets or message bodies in `meta`. */
export async function audit(request: FastifyRequest, entry: AuditEntry): Promise<void> {
  await db.insert(auditLog).values({
    actorId: request.currentUser?.id ?? null,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    meta: entry.meta ?? {},
    ip: request.ip,
  });
}
