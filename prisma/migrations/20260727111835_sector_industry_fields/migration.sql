-- AlterTable
ALTER TABLE "sector" ADD COLUMN     "application_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "industry_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "industry_relevance" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "industry_sub_domains" TEXT[] DEFAULT ARRAY[]::TEXT[];
