/*
  Warnings:

  - You are about to drop the column `characters` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `props` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `scenes` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `characterIds` on the `Shot` table. All the data in the column will be lost.
  - You are about to drop the column `propIds` on the `Shot` table. All the data in the column will be lost.
  - You are about to drop the column `sceneId` on the `Shot` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "EpisodeAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EpisodeAsset_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShotAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shotId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShotAsset_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "rawText" TEXT,
    "wordCount" INTEGER,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "duration" TEXT NOT NULL DEFAULT '60s',
    "script" TEXT NOT NULL DEFAULT '',
    "shotType" TEXT NOT NULL DEFAULT 'keyframe',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Episode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("createdAt", "duration", "id", "index", "projectId", "rawText", "script", "shotType", "title", "updatedAt", "wordCount") SELECT "createdAt", "duration", "id", "index", "projectId", "rawText", "script", "shotType", "title", "updatedAt", "wordCount" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
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
    "videoUrl" TEXT,
    "videoStatus" TEXT,
    "videoPrompt" TEXT,
    "videoDuration" REAL,
    "videoTaskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shot_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Shot" ("actionNote", "content", "createdAt", "dialogueText", "duration", "episodeId", "gridLayout", "gridPrompts", "id", "imageType", "imageUrl", "imageUrls", "index", "negativePrompt", "prompt", "promptEnd", "scriptLineIds", "updatedAt", "videoDuration", "videoPrompt", "videoStatus", "videoTaskId", "videoUrl") SELECT "actionNote", "content", "createdAt", "dialogueText", "duration", "episodeId", "gridLayout", "gridPrompts", "id", "imageType", "imageUrl", "imageUrls", "index", "negativePrompt", "prompt", "promptEnd", "scriptLineIds", "updatedAt", "videoDuration", "videoPrompt", "videoStatus", "videoTaskId", "videoUrl" FROM "Shot";
DROP TABLE "Shot";
ALTER TABLE "new_Shot" RENAME TO "Shot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EpisodeAsset_episodeId_idx" ON "EpisodeAsset"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "EpisodeAsset_episodeId_assetType_assetId_key" ON "EpisodeAsset"("episodeId", "assetType", "assetId");

-- CreateIndex
CREATE INDEX "ShotAsset_shotId_idx" ON "ShotAsset"("shotId");

-- CreateIndex
CREATE UNIQUE INDEX "ShotAsset_shotId_assetType_assetId_key" ON "ShotAsset"("shotId", "assetType", "assetId");
