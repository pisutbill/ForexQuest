-- CreateTable
CREATE TABLE "HistoricalRate" (
    "countryId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HistoricalRate_pkey" PRIMARY KEY ("countryId","year")
);

-- AddForeignKey
ALTER TABLE "HistoricalRate" ADD CONSTRAINT "HistoricalRate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
