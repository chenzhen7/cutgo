-- Add lastContent column for first_last tail-frame description
ALTER TABLE "Shot" ADD COLUMN "lastContent" TEXT;

-- Drop deprecated prompt fields (legacy two-pass shot prompt design removed)
ALTER TABLE "Shot" DROP COLUMN "prompt";
ALTER TABLE "Shot" DROP COLUMN "promptEnd";
ALTER TABLE "Shot" DROP COLUMN "gridPrompts";
