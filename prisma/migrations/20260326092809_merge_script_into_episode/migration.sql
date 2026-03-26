/*
  Warnings:

  - You are about to drop the `Script` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `age` on the `AssetCharacter` table. All the data in the column will be lost.
  - You are about to drop the column `appearance` on the `AssetCharacter` table. All the data in the column will be lost.
  - You are about to drop the column `scriptId` on the `Shot` table. All the data in the column will be lost.
  - Added the required column `episodeId` to the `Shot` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Script_episodeId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Script";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AssetCharacter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'supporting',
    "gender" TEXT,
    "description" TEXT,
    "personality" TEXT,
    "imageUrl" TEXT,
    "seed" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssetCharacter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssetCharacter" ("createdAt", "description", "gender", "id", "imageUrl", "locked", "name", "personality", "projectId", "role", "seed", "updatedAt") SELECT "createdAt", "description", "gender", "id", "imageUrl", "locked", "name", "personality", "projectId", "role", "seed", "updatedAt" FROM "AssetCharacter";
DROP TABLE "AssetCharacter";
ALTER TABLE "new_AssetCharacter" RENAME TO "AssetCharacter";
CREATE UNIQUE INDEX "AssetCharacter_projectId_name_key" ON "AssetCharacter"("projectId", "name");
CREATE TABLE "new_Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterIds" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Episode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("chapterIds", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "title", "updatedAt") SELECT "chapterIds", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "title", "updatedAt" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE TABLE "new_Shot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "shotSize" TEXT NOT NULL,
    "cameraMovement" TEXT NOT NULL DEFAULT 'static',
    "cameraAngle" TEXT NOT NULL DEFAULT 'eye_level',
    "composition" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "duration" TEXT NOT NULL DEFAULT '3s',
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
    "videoDuration" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shot_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Shot" ("actionNote", "cameraAngle", "cameraMovement", "characterIds", "composition", "createdAt", "dialogueText", "duration", "gridLayout", "gridPrompts", "id", "imageType", "imageUrl", "imageUrls", "index", "negativePrompt", "prompt", "promptEnd", "propIds", "sceneId", "scriptLineIds", "shotSize", "updatedAt", "videoDuration", "videoPrompt", "videoStatus", "videoUrl") SELECT "actionNote", "cameraAngle", "cameraMovement", "characterIds", "composition", "createdAt", "dialogueText", "duration", "gridLayout", "gridPrompts", "id", "imageType", "imageUrl", "imageUrls", "index", "negativePrompt", "prompt", "promptEnd", "propIds", "sceneId", "scriptLineIds", "shotSize", "updatedAt", "videoDuration", "videoPrompt", "videoStatus", "videoUrl" FROM "Shot";
DROP TABLE "Shot";
ALTER TABLE "new_Shot" RENAME TO "Shot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
