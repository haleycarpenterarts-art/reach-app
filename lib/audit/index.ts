import "server-only";
import { prisma } from "@/lib/prisma";
import type { AuditEventType, Prisma } from "@/lib/generated/prisma/client";

/**
 * Emit an audit event. Per CLAUDE.md rule 8: the audit log is not optional.
 * This helper is the single entry point for writing audit records.
 *
 * Design notes:
 * - Writes MUST NOT fail the caller. If the DB is down, the operational
 *   action should still proceed and the emit failure is logged to stderr.
 *   A future hardening will queue failed emits to a retry channel.
 * - BigInt ids are created by Postgres; we do not return them here.
 * - `metadata` is typed loosely on purpose — each event type has its own
 *   shape contract documented alongside the enum in schema.prisma.
 */
export type EmitInput = {
  type: AuditEventType;
  actorId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function emit(input: EmitInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        type: input.type,
        actorId: input.actorId ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? {},
      },
    });
  } catch (err) {
    console.error("[audit] emit failed", {
      type: input.type,
      actorId: input.actorId,
      err,
    });
  }
}
