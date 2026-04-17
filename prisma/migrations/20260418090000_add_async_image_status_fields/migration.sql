ALTER TABLE "AssetCharacter" ADD COLUMN "imageStatus" TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE "AssetCharacter" ADD COLUMN "imageTaskId" TEXT;
ALTER TABLE "AssetCharacter" ADD COLUMN "imageErrorMessage" TEXT;

ALTER TABLE "AssetScene" ADD COLUMN "imageStatus" TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE "AssetScene" ADD COLUMN "imageTaskId" TEXT;
ALTER TABLE "AssetScene" ADD COLUMN "imageErrorMessage" TEXT;

ALTER TABLE "AssetProp" ADD COLUMN "imageStatus" TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE "AssetProp" ADD COLUMN "imageTaskId" TEXT;
ALTER TABLE "AssetProp" ADD COLUMN "imageErrorMessage" TEXT;

ALTER TABLE "Shot" ADD COLUMN "imageStatus" TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE "Shot" ADD COLUMN "imageTaskId" TEXT;
ALTER TABLE "Shot" ADD COLUMN "imageErrorMessage" TEXT;
