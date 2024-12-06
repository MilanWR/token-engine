-- CreateTable
CREATE TABLE "TokenCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentTokenId" TEXT NOT NULL,
    "dataCaptureTokenId" TEXT NOT NULL,
    "incentiveTokenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TokenCollection_userId_idx" ON "TokenCollection"("userId");

-- AddForeignKey
ALTER TABLE "TokenCollection" ADD CONSTRAINT "TokenCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
