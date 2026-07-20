-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LINKEDIN', 'MICROSOFT');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "auth_identity" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "email" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "linked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMPTZ(6),

    CONSTRAINT "auth_identity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_identity_user_id_idx" ON "auth_identity"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identity_provider_provider_account_id_key" ON "auth_identity"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identity_user_id_provider_key" ON "auth_identity"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_session_token_hash_key" ON "refresh_session"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_session_user_id_revoked_at_idx" ON "refresh_session"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "refresh_session_expires_at_idx" ON "refresh_session"("expires_at");

-- AddForeignKey
ALTER TABLE "auth_identity" ADD CONSTRAINT "auth_identity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_session" ADD CONSTRAINT "refresh_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
