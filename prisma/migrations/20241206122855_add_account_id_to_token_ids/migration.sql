/*
  Warnings:

  - Added the required column `accountId` to the `TokenIds` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TokenIds" ADD COLUMN     "accountId" TEXT NOT NULL;
