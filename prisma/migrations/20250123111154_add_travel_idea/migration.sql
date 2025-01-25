-- CreateTable
CREATE TABLE "TravelIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "foyerId" TEXT NOT NULL,
    "creatorId" TEXT,

    CONSTRAINT "TravelIdea_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TravelIdea" ADD CONSTRAINT "TravelIdea_foyerId_fkey" FOREIGN KEY ("foyerId") REFERENCES "Foyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelIdea" ADD CONSTRAINT "TravelIdea_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
