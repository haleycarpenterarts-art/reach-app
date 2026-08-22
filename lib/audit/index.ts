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
 *
 * Tenant and actor:
 * - `tenantId` is optional because platform-level events — a failed sign-in,
 *   a denied request with no session — happen before any tenant is resolved.
 *   Those rows match no tenant policy and are reachable only by the service
 *   role, which is intended: they are platform records, not tenant records.
 * - `actorEmail` and `actorName` are denormalised HERE, at emit time, on
 *   purpose. An identity is never deleted, but it can be renamed or
 *   deactivated, and Principle 9 requires a record to carry its author as it
 *   stood when the thing happened. Pass them wherever they are known.
 *
 * The table is append-only, enforced by a database trigger. An UPDATE or
 * DELETE against it raises, including from the service role.
 */
export type EmitInput = {
  type: AuditEventType;
  tenantId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function emit(input: EmitInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        type: input.type,
        tenantId: input.tenantId ?? null,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorName: input.actorName ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        metadata: input.metadata ?? {},
      },
    });
  } catch (err) {
    console.error("[audit] emit failed", {
      type: input.type,
      tenantId: input.tenantId,
      actorId: input.actorId,
      err,
    });
  }
}
