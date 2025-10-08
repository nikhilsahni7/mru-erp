/*
  Warnings:

  - You are about to drop the column `sectionCourseId` on the `AttendanceSession` table. All the data in the column will be lost.
  - You are about to drop the column `sectionCourseId` on the `ClassSchedule` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[componentId,date,startTime]` on the table `AttendanceSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[componentId,dayOfWeek,startTime]` on the table `ClassSchedule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `componentId` to the `AttendanceSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `componentId` to the `ClassSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('LECTURE', 'TUTORIAL', 'LABORATORY', 'PRACTICAL', 'SEMINAR', 'PROJECT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Branch" ADD VALUE 'SCHOOL_OF_BUSINESS';
ALTER TYPE "Branch" ADD VALUE 'SCHOOL_OF_ARTS';

-- DropForeignKey
ALTER TABLE "AttendanceSession" DROP CONSTRAINT "AttendanceSession_sectionCourseId_fkey";

-- DropForeignKey
ALTER TABLE "ClassSchedule" DROP CONSTRAINT "ClassSchedule_sectionCourseId_fkey";

-- DropIndex
DROP INDEX "AttendanceSession_sectionCourseId_date_startTime_key";

-- DropIndex
DROP INDEX "ClassSchedule_sectionCourseId_dayOfWeek_startTime_key";

-- AlterTable
ALTER TABLE "AttendanceSession" DROP COLUMN "sectionCourseId",
ADD COLUMN     "componentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ClassSchedule" DROP COLUMN "sectionCourseId",
ADD COLUMN     "componentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseComponent" (
    "id" TEXT NOT NULL,
    "sectionCourseId" TEXT NOT NULL,
    "componentType" "CourseType" NOT NULL,
    "teacherId" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_sectionId_key" ON "Group"("name", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseComponent_sectionCourseId_componentType_groupId_key" ON "CourseComponent"("sectionCourseId", "componentType", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_componentId_date_startTime_key" ON "AttendanceSession"("componentId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_componentId_dayOfWeek_startTime_key" ON "ClassSchedule"("componentId", "dayOfWeek", "startTime");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseComponent" ADD CONSTRAINT "CourseComponent_sectionCourseId_fkey" FOREIGN KEY ("sectionCourseId") REFERENCES "SectionCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseComponent" ADD CONSTRAINT "CourseComponent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseComponent" ADD CONSTRAINT "CourseComponent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSchedule" ADD CONSTRAINT "ClassSchedule_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "CourseComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "CourseComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
