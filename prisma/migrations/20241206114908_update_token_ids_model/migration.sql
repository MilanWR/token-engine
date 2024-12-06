-- DropIndex
DROP INDEX "TokenIds_userId_key";

-- CreateIndex
CREATE INDEX "TokenIds_userId_idx" ON "TokenIds"("userId");
