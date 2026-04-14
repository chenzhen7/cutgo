/*
  Warnings:

  - You are about to drop the column `description` on the `AssetCharacter` table. All the data in the column will be lost.
  - You are about to drop the column `personality` on the `AssetCharacter` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `AssetProp` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `AssetProp` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `AssetScene` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `Project` table. All the data in the column will be lost.
  - You are about to alter the column `duration` on the `Shot` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.
  - You are about to alter the column `videoDuration` on the `Shot` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "episodeId" TEXT,
    "shotId" TEXT,
    "videoCompositionId" TEXT,
    "targetInfo" TEXT NOT NULL DEFAULT '',
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AiTask" ("createdAt", "episodeId", "errorCode", "errorMessage", "finishedAt", "id", "maxRetries", "model", "projectId", "retryCount", "shotId", "startedAt", "status", "taskType", "updatedAt", "videoCompositionId") SELECT "createdAt", "episodeId", "errorCode", "errorMessage", "finishedAt", "id", "maxRetries", "model", "projectId", "retryCount", "shotId", "startedAt", "status", "taskType", "updatedAt", "videoCompositionId" FROM "AiTask";
DROP TABLE "AiTask";
ALTER TABLE "new_AiTask" RENAME TO "AiTask";
CREATE INDEX "AiTask_projectId_createdAt_idx" ON "AiTask"("projectId", "createdAt");
CREATE INDEX "AiTask_status_updatedAt_idx" ON "AiTask"("status", "updatedAt");
CREATE INDEX "AiTask_taskType_status_idx" ON "AiTask"("taskType", "status");
CREATE TABLE "new_AssetCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'supporting',
    "gender" TEXT,
    "prompt" TEXT,
    "imageUrl" TEXT,
    "seed" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssetCharacter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssetCharacter" ("createdAt", "gender", "id", "imageUrl", "locked", "name", "projectId", "role", "seed", "updatedAt") SELECT "createdAt", "gender", "id", "imageUrl", "locked", "name", "projectId", "role", "seed", "updatedAt" FROM "AssetCharacter";
DROP TABLE "AssetCharacter";
ALTER TABLE "new_AssetCharacter" RENAME TO "AssetCharacter";
CREATE UNIQUE INDEX "AssetCharacter_projectId_name_key" ON "AssetCharacter"("projectId", "name");
CREATE TABLE "new_AssetProp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssetProp_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssetProp" ("createdAt", "id", "imageUrl", "name", "projectId", "updatedAt") SELECT "createdAt", "id", "imageUrl", "name", "projectId", "updatedAt" FROM "AssetProp";
DROP TABLE "AssetProp";
ALTER TABLE "new_AssetProp" RENAME TO "AssetProp";
CREATE UNIQUE INDEX "AssetProp_projectId_name_key" ON "AssetProp"("projectId", "name");
CREATE TABLE "new_AssetScene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prompt" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssetScene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssetScene" ("createdAt", "id", "imageUrl", "name", "projectId", "tags", "updatedAt") SELECT "createdAt", "id", "imageUrl", "name", "projectId", "tags", "updatedAt" FROM "AssetScene";
DROP TABLE "AssetScene";
ALTER TABLE "new_AssetScene" RENAME TO "AssetScene";
CREATE UNIQUE INDEX "AssetScene_projectId_name_key" ON "AssetScene"("projectId", "name");
CREATE TABLE "new_Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterIds" TEXT,
    "rawText" TEXT,
    "wordCount" INTEGER,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "outline" TEXT,
    "goldenHook" TEXT,
    "keyConflict" TEXT,
    "cliffhanger" TEXT,
    "duration" TEXT NOT NULL DEFAULT '60s',
    "characters" TEXT,
    "scenes" TEXT,
    "props" TEXT,
    "script" TEXT NOT NULL DEFAULT '',
    "shotType" TEXT NOT NULL DEFAULT 'keyframe',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Episode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("chapterIds", "characters", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "props", "scenes", "script", "title", "updatedAt") SELECT "chapterIds", "characters", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "props", "scenes", "script", "title", "updatedAt" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "coverUrl" TEXT,
    "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "resolution" TEXT NOT NULL DEFAULT '1080x1920',
    "stylePreset" TEXT,
    "globalNegPrompt" TEXT,
    "styleRefUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("aspectRatio", "coverUrl", "createdAt", "description", "globalNegPrompt", "id", "name", "resolution", "status", "stylePreset", "styleRefUrl", "tags", "updatedAt") SELECT "aspectRatio", "coverUrl", "createdAt", "description", "globalNegPrompt", "id", "name", "resolution", "status", "stylePreset", "styleRefUrl", "tags", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_Shot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "content" TEXT,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "duration" REAL NOT NULL DEFAULT 3,
    "imageUrl" TEXT,
    "imageType" TEXT NOT NULL DEFAULT 'keyframe',
    "imageUrls" TEXT,
    "promptEnd" TEXT,
    "gridLayout" TEXT,
    "gridPrompts" TEXT,
    "scriptLineIds" TEXT,
    "dialogueText" TEXT,
    "actionNote" TEXT,
    "characterIds" TEXT,
    "sceneId" TEXT,
    "propIds" TEXT,
    "videoUrl" TEXT,
    "videoStatus" TEXT,
    "videoPrompt" TEXT,
    "videoDuration" REAL,
    "videoTaskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shot_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Shot" ("actionNote", "characterIds", "createdAt", "dialogueText", "duration", "episodeId", "gridLayout", "gridPrompts", "id", "imageType", "imageUrl", "imageUrls", "index", "negativePrompt", "prompt", "promptEnd", "propIds", "sceneId", "scriptLineIds", "updatedAt", "videoDuration", "videoPrompt", "videoStatus", "videoUrl") SELECT "actionNote", "characterIds", "createdAt", "dialogueText", "duration", "episodeId", "gridLayout", "gridPrompts", "id", "imageType", "imageUrl", "imageUrls", "index", "negativePrompt", "prompt", "promptEnd", "propIds", "sceneId", "scriptLineIds", "updatedAt", "videoDuration", "videoPrompt", "videoStatus", "videoUrl" FROM "Shot";
DROP TABLE "Shot";
ALTER TABLE "new_Shot" RENAME TO "Shot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
