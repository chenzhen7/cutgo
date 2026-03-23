/*
  Warnings:

  - You are about to drop the column `goldenHook` on the `Episode` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
-- 重建 Episode：增加分集大纲 outline，并移除 goldenHook 列
CREATE TABLE "new_Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "outline" TEXT,
    "keyConflict" TEXT,
    "cliffhanger" TEXT,
    "duration" TEXT NOT NULL DEFAULT '60s',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Episode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Episode_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("chapterId", "cliffhanger", "createdAt", "duration", "id", "index", "keyConflict", "projectId", "synopsis", "title", "updatedAt") SELECT "chapterId", "cliffhanger", "createdAt", "duration", "id", "index", "keyConflict", "projectId", "synopsis", "title", "updatedAt" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
