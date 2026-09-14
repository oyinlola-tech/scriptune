
-- CreateEnum
CREATE TYPE "LibraryTargetType" AS ENUM ('HYMN', 'VERSE');

-- CreateEnum
CREATE TYPE "HistoryKind" AS ENUM ('IDENTIFY', 'SEARCH', 'VIEW');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "roles" TEXT[] DEFAULT ARRAY['member']::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_oauth_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "absolute_expires_at" TIMESTAMP(3),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_tokens" (
    "token_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revoked_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "oauth_sign_ins" (
    "state" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "code_verifier" TEXT NOT NULL,
    "redirect_to" TEXT,
    "exchange_code" TEXT,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "oauth_sign_ins_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "library_saved_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "target_type" "LibraryTargetType" NOT NULL,
    "target_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_saved_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_collections" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_collection_items" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "target_type" "LibraryTargetType" NOT NULL,
    "target_key" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "target_type" "LibraryTargetType" NOT NULL,
    "target_key" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "HistoryKind" NOT NULL,
    "mode" TEXT,
    "query" TEXT NOT NULL,
    "target_type" "LibraryTargetType",
    "target_key" TEXT,
    "attempt_id" UUID,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_oauth_accounts_user_id_idx" ON "user_oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_oauth_accounts_provider_provider_id_key" ON "user_oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_sign_ins_exchange_code_key" ON "oauth_sign_ins"("exchange_code");

-- CreateIndex
CREATE INDEX "oauth_sign_ins_expires_at_idx" ON "oauth_sign_ins"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "library_saved_items_user_id_target_type_target_key_key" ON "library_saved_items"("user_id", "target_type", "target_key");

-- CreateIndex
CREATE UNIQUE INDEX "library_collections_user_id_slug_key" ON "library_collections"("user_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "library_collection_items_collection_id_target_type_target_k_key" ON "library_collection_items"("collection_id", "target_type", "target_key");

-- CreateIndex
CREATE UNIQUE INDEX "library_notes_user_id_target_type_target_key_key" ON "library_notes"("user_id", "target_type", "target_key");

-- CreateIndex
CREATE INDEX "library_history_user_id_occurred_at_idx" ON "library_history"("user_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_oauth_accounts" ADD CONSTRAINT "user_oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_saved_items" ADD CONSTRAINT "library_saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_collections" ADD CONSTRAINT "library_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_collection_items" ADD CONSTRAINT "library_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "library_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_notes" ADD CONSTRAINT "library_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_history" ADD CONSTRAINT "library_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

