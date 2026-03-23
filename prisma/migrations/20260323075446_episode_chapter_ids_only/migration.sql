/*
  Warnings:

  - You are about to drop the column `chapterId` on the `Episode` table. All the data in the column will be lost.
  - Made the column `chapterIds` on table `Episode` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
-- 重建 Episode：用 chapterIds（多章 JSON）替代单 chapterId 外键
CREATE TABLE "new_Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterIds" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "outline" TEXT,
    "goldenHook" TEXT,
    "keyConflict" TEXT,
    "cliffhanger" TEXT,
    "duration" TEXT NOT NULL DEFAULT '60s',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Episode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("chapterIds", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "title", "updatedAt") SELECT "chapterIds", "cliffhanger", "createdAt", "duration", "goldenHook", "id", "index", "keyConflict", "outline", "projectId", "title", "updatedAt" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
