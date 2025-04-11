/*
  Warnings:

  - The `displaySection` column on the `Collection` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "DisplaySection" AS ENUM ('FEATURED', 'COMPLETE', 'NONE');

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "displaySection",
ADD COLUMN     "displaySection" "DisplaySection" NOT NULL DEFAULT 'NONE';
