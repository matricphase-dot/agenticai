-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('HARMFUL_OUTPUT', 'ILLEGAL_CONTENT', 'DECEPTIVE_PRACTICE', 'PRIVACY_VIOLATION', 'MISINFORMATION', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED_NO_ACTION', 'RESOLVED_UNPUBLISHED', 'RESOLVED_WARNING_ISSUED');

-- CreateTable
CREATE TABLE "AgentReport" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentReport_agentId_idx" ON "AgentReport"("agentId");

-- CreateIndex
CREATE INDEX "AgentReport_status_idx" ON "AgentReport"("status");

-- AddForeignKey
ALTER TABLE "AgentReport" ADD CONSTRAINT "AgentReport_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReport" ADD CONSTRAINT "AgentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
