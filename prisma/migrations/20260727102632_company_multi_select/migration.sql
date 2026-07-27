/*
  Warnings:

  - You are about to drop the column `sector_id` on the `company` table. All the data in the column will be lost.
  - You are about to drop the column `visibility_scope` on the `company` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "VisibilityScope" ADD VALUE 'COLLEGE';

-- DropForeignKey
ALTER TABLE "company" DROP CONSTRAINT "company_sector_id_fkey";

-- DropIndex
DROP INDEX "company_sector_id_idx";

-- DropIndex
DROP INDEX "company_visibility_scope_department_id_idx";

-- AlterTable
ALTER TABLE "company" DROP COLUMN "sector_id",
DROP COLUMN "visibility_scope",
ADD COLUMN     "visibility_scopes" "VisibilityScope"[] DEFAULT ARRAY['UNIVERSITY_WIDE']::"VisibilityScope"[];

-- AlterTable
ALTER TABLE "event_item" ADD COLUMN     "attachment_url" TEXT;

-- AlterTable
ALTER TABLE "news_item" ADD COLUMN     "attachment_url" TEXT;

-- CreateTable
CREATE TABLE "_DepartmentToEventItem" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DepartmentToEventItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CompanyToSector" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CompanyToSector_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DepartmentToEventItem_B_index" ON "_DepartmentToEventItem"("B");

-- CreateIndex
CREATE INDEX "_CompanyToSector_B_index" ON "_CompanyToSector"("B");

-- CreateIndex
CREATE INDEX "company_department_id_idx" ON "company"("department_id");

-- AddForeignKey
ALTER TABLE "_DepartmentToEventItem" ADD CONSTRAINT "_DepartmentToEventItem_A_fkey" FOREIGN KEY ("A") REFERENCES "department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToEventItem" ADD CONSTRAINT "_DepartmentToEventItem_B_fkey" FOREIGN KEY ("B") REFERENCES "event_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToSector" ADD CONSTRAINT "_CompanyToSector_A_fkey" FOREIGN KEY ("A") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyToSector" ADD CONSTRAINT "_CompanyToSector_B_fkey" FOREIGN KEY ("B") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
