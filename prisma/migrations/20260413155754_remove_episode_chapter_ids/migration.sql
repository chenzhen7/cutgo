/*
  Warnings:

  - You are about to drop the column `chapterIds` on the `Episode` table. All the data in the column will be lost.

*/
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
INSERT INTO "new_Episode" ("characters", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "props", "rawText", "scenes", "script", "shotType", "title", "updatedAt", "wordCount") SELECT "characters", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "props", "rawText", "scenes", "script", "shotType", "title", "updatedAt", "wordCount" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
