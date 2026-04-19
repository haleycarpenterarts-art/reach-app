-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EXECUTIVE', 'OPS_ADMIN', 'PM', 'DESIGN_ENGINEER', 'ESTIMATOR', 'PROGRAMMER', 'WAREHOUSE', 'TECH_LEAD', 'TECH_USER', 'FINANCE', 'SALES', 'SERVICE');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('SIGN_IN', 'SIGN_OUT', 'SIGN_IN_FAILED', 'MFA_ENROLL', 'MFA_CHALLENGE_PASS', 'MFA_CHALLENGE_FAIL', 'AUTHZ_DENIED', 'PERMISSION_GRANT_CHANGED', 'THRESHOLD_CHANGED', 'APPROVAL_RECORDED', 'STATE_TRANSITION', 'MONEY_CHANGE', 'CUSTOMER_DOC_RELEASED', 'STEP_UP_AUTH_REQUIRED', 'STEP_UP_AUTH_PASSED');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" BIGSERIAL NOT NULL,
    "type" "AuditEventType" NOT NULL,
    "actorId" UUID,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "audit_events_actorId_occurredAt_idx" ON "audit_events"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_events_type_occurredAt_idx" ON "audit_events"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_events_resourceType_resourceId_occurredAt_idx" ON "audit_events"("resourceType", "resourceId", "occurredAt");

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
