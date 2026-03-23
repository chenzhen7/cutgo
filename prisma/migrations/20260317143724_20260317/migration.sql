/*
  Warnings:

  - You are about to drop the `ScriptLine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScriptScene` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectId,name]` on the table `AssetCharacter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,name]` on the table `AssetProp` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,name]` on the table `AssetScene` will be added. If there are existing duplicate values, this will fail.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ScriptLine";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ScriptScene";
PRAGMA foreign_keys=on;

-- CreateTable
-- Storyboard：分镜板（关联剧本，状态草稿/生成/已编辑）
CREATE TABLE "Storyboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Storyboard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Storyboard_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
-- VideoComposition：分集视频合成任务与输出元数据
CREATE TABLE "VideoComposition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "outputPath" TEXT,
    "fileSize" INTEGER,
    "videoDuration" REAL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "errorMessage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VideoComposition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VideoComposition_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyboardId" TEXT NOT NULL,
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
    CONSTRAINT "Shot_storyboardId_fkey" FOREIGN KEY ("storyboardId") REFERENCES "Storyboard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
-- AIModelConfig：AI 模型连接配置（LLM/图/视频/TTS）
CREATE TABLE "AIModelConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL DEFAULT '',
    "baseUrl" TEXT NOT NULL DEFAULT '',
    "config" TEXT NOT NULL DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "activeLLMConfigId" TEXT,
    "activeImageConfigId" TEXT,
    "activeVideoConfigId" TEXT,
    "activeTTSConfigId" TEXT,
    "textProvider" TEXT NOT NULL DEFAULT 'deepseek',
    "textModel" TEXT NOT NULL DEFAULT 'deepseek-v3',
    "textApiKey" TEXT NOT NULL DEFAULT '',
    "textBaseUrl" TEXT NOT NULL DEFAULT '',
    "imageProvider" TEXT NOT NULL DEFAULT 'placeholder',
    "imageModel" TEXT NOT NULL DEFAULT 'dall-e-3',
    "imageApiKey" TEXT NOT NULL DEFAULT '',
    "imageBaseUrl" TEXT NOT NULL DEFAULT '',
    "comfyuiUrl" TEXT NOT NULL DEFAULT 'http://127.0.0.1:8188',
    "videoProvider" TEXT NOT NULL DEFAULT 'placeholder',
    "videoModel" TEXT NOT NULL DEFAULT '',
    "videoApiKey" TEXT NOT NULL DEFAULT '',
    "videoBaseUrl" TEXT NOT NULL DEFAULT '',
    "ttsProvider" TEXT NOT NULL DEFAULT 'edge-tts',
    "ttsModel" TEXT NOT NULL DEFAULT '',
    "ttsApiKey" TEXT NOT NULL DEFAULT '',
    "ttsBaseUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
-- 重建 Script：增加正文 content 及角色/道具/场景引用字段（JSON/名称）
CREATE TABLE "new_Script" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "characters" TEXT,
    "props" TEXT,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Script_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Script_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Script" ("createdAt", "episodeId", "id", "projectId", "status", "title", "updatedAt") SELECT "createdAt", "episodeId", "id", "projectId", "status", "title", "updatedAt" FROM "Script";
DROP TABLE "Script";
ALTER TABLE "new_Script" RENAME TO "Script";
CREATE UNIQUE INDEX "Script_episodeId_key" ON "Script"("episodeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AIModelConfig_type_idx" ON "AIModelConfig"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCharacter_projectId_name_key" ON "AssetCharacter"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AssetProp_projectId_name_key" ON "AssetProp"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AssetScene_projectId_name_key" ON "AssetScene"("projectId", "name");
