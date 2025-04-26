/*
  Warnings:

  - You are about to drop the column `mobile` on the `User` table. All the data in the column will be lost.
  - Added the required column `clg` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Clg" AS ENUM ('MRU', 'MRIIRS');

-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('SCHOOL_OF_ENGINEERING', 'SCHOOL_OF_LAW');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "mobile",
ADD COLUMN     "clg" "Clg" NOT NULL,
ADD COLUMN     "phone" TEXT,
DROP COLUMN "branch",
ADD COLUMN     "branch" "Branch" NOT NULL;
