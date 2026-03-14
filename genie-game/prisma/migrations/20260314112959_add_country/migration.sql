-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "countryCode" VARCHAR(256) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);
