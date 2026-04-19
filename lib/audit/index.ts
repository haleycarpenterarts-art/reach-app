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
    // Trusted-core visibility (CLAUDE.md rule 8): never swallow silently.
    // Log with full structured context so failures are grep-able in Vercel
    // runtime logs. A proper ops channel (Sentry) will subscribe in Phase 2.
    const e = err as {
      message?: string;
      code?: string;
      stack?: string;
      name?: string;
    };
    console.error(
      "[audit.emit] FAILED " +
        JSON.stringify({
          eventType: input.type,
          actorId: input.actorId ?? null,
          resourceType: input.resourceType ?? null,
          resourceId: input.resourceId ?? null,
          errorName: e?.name,
          errorMessage: e?.message,
          errorCode: e?.code,
          errorStack: e?.stack,
        }),
    );
  }
}
