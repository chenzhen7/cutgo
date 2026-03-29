-- Create AiTask table for unified AI task center
CREATE TABLE "AiTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "episodeId" TEXT,
  "shotId" TEXT,
  "videoCompositionId" TEXT,
  "taskType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "model" TEXT,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 0,
  "startedAt" DATETIME,
  "finishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AiTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AiTask_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AiTask_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AiTask_videoCompositionId_fkey" FOREIGN KEY ("videoCompositionId") REFERENCES "VideoComposition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AiTask_projectId_createdAt_idx" ON "AiTask"("projectId", "createdAt");
CREATE INDEX "AiTask_status_updatedAt_idx" ON "AiTask"("status", "updatedAt");
CREATE INDEX "AiTask_taskType_status_idx" ON "AiTask"("taskType", "status");
