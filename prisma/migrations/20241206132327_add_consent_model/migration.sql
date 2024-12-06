-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "uid" TEXT,
    "consentHash" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "tokenId" TEXT NOT NULL,
    "mintTransactionId" TEXT NOT NULL,
    "transferTransactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);
