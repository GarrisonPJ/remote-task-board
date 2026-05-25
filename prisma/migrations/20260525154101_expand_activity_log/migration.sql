-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "action" TEXT NOT NULL DEFAULT 'STATUS_CHANGED',
ADD COLUMN     "details" TEXT,
ALTER COLUMN "toStatus" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ActivityLog_actorId_createdAt_idx" ON "ActivityLog"("actorId", "createdAt");
