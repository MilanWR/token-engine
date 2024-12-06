-- First, add the userId column as nullable
ALTER TABLE "Consent" ADD COLUMN "userId" TEXT;

-- Create the foreign key relationship
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update existing consents to link to the first user (or specific user)
UPDATE "Consent" 
SET "userId" = (SELECT id FROM "User" LIMIT 1);

-- Finally, make userId required
ALTER TABLE "Consent" ALTER COLUMN "userId" SET NOT NULL;