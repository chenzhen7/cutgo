-- Refactor: remove Storyboard, use Script -> Shot[]
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Shot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scriptId" TEXT NOT NULL,
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
    CONSTRAINT "Shot_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Shot" (
    "id", "scriptId", "index", "shotSize", "cameraMovement", "cameraAngle",
    "composition", "prompt", "negativePrompt", "duration", "imageUrl", "imageType",
    "imageUrls", "promptEnd", "gridLayout", "gridPrompts", "scriptLineIds",
    "dialogueText", "actionNote", "characterIds", "sceneId", "propIds",
    "videoUrl", "videoStatus", "videoPrompt", "videoDuration", "createdAt", "updatedAt"
)
SELECT
    s."id", sb."scriptId", s."index", s."shotSize", s."cameraMovement", s."cameraAngle",
    s."composition", s."prompt", s."negativePrompt", s."duration", s."imageUrl", s."imageType",
    s."imageUrls", s."promptEnd", s."gridLayout", s."gridPrompts", s."scriptLineIds",
    s."dialogueText", s."actionNote", s."characterIds", s."sceneId", s."propIds",
    s."videoUrl", s."videoStatus", s."videoPrompt", s."videoDuration", s."createdAt", s."updatedAt"
FROM "Shot" s
JOIN "Storyboard" sb ON sb."id" = s."storyboardId";

DROP TABLE "Shot";
ALTER TABLE "new_Shot" RENAME TO "Shot";
DROP TABLE "Storyboard";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
