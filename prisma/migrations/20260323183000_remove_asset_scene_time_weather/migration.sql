-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AssetScene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AssetScene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AssetScene" ("createdAt", "description", "id", "imageUrl", "name", "projectId", "tags", "updatedAt") SELECT "createdAt", "description", "id", "imageUrl", "name", "projectId", "tags", "updatedAt" FROM "AssetScene";
DROP TABLE "AssetScene";
ALTER TABLE "new_AssetScene" RENAME TO "AssetScene";
CREATE UNIQUE INDEX "AssetScene_projectId_name_key" ON "AssetScene"("projectId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
