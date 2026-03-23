-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "NovelCharacter";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PlotEvent";
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
    "age" TEXT,
    "description" TEXT,
    "appearance" TEXT,
    "personality" TEXT,
    "imageUrl" TEXT,
    "seed" INTEGER,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssetCharacter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssetCharacter" ("age", "appearance", "createdAt", "description", "gender", "id", "imageUrl", "locked", "name", "personality", "projectId", "role", "seed", "updatedAt") SELECT "age", "appearance", "createdAt", "description", "gender", "id", "imageUrl", "locked", "name", "personality", "projectId", "role", "seed", "updatedAt" FROM "AssetCharacter";
DROP TABLE "AssetCharacter";
ALTER TABLE "new_AssetCharacter" RENAME TO "AssetCharacter";
CREATE UNIQUE INDEX "AssetCharacter_projectId_name_key" ON "AssetCharacter"("projectId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
