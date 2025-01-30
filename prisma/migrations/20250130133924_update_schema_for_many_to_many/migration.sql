/*
  Warnings:

  - You are about to drop the column `foyerId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_foyerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "foyerId";

-- CreateTable
CREATE TABLE "UserFoyer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foyerId" TEXT NOT NULL,

    CONSTRAINT "UserFoyer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFoyer_userId_foyerId_key" ON "UserFoyer"("userId", "foyerId");

-- AddForeignKey
ALTER TABLE "UserFoyer" ADD CONSTRAINT "UserFoyer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFoyer" ADD CONSTRAINT "UserFoyer_foyerId_fkey" FOREIGN KEY ("foyerId") REFERENCES "Foyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
