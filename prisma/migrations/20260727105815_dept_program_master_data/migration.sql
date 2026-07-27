-- AlterTable
ALTER TABLE "department" ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "coordinator_email" TEXT,
ADD COLUMN     "coordinator_name" TEXT,
ADD COLUMN     "coordinator_phone" TEXT;

-- AlterTable
ALTER TABLE "program" ADD COLUMN     "domain" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "industry" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sub_domain" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sub_sectors" TEXT[] DEFAULT ARRAY[]::TEXT[];
