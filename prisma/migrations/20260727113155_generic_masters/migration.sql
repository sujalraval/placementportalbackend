-- CreateTable
CREATE TABLE "college" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_area" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_domain" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industry_domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_sub_domain" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industry_sub_domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_type" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "college_name_key" ON "college"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industry_name_key" ON "industry"("name");

-- CreateIndex
CREATE UNIQUE INDEX "application_area_name_key" ON "application_area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industry_domain_name_key" ON "industry_domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industry_sub_domain_name_key" ON "industry_sub_domain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "partner_type_name_key" ON "partner_type"("name");
