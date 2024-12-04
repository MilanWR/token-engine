-- CreateTable
CREATE TABLE "TokenIds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentTokenId" TEXT NOT NULL,
    "dataCaptureTokenId" TEXT NOT NULL,
    "incentiveTokenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenIds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenIds_userId_key" ON "TokenIds"("userId");

-- AddForeignKey
ALTER TABLE "TokenIds" ADD CONSTRAINT "TokenIds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
