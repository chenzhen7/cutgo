-- Remove deprecated shot camera metadata fields
ALTER TABLE "Shot" DROP COLUMN "shotSize";
ALTER TABLE "Shot" DROP COLUMN "cameraMovement";
ALTER TABLE "Shot" DROP COLUMN "cameraAngle";
