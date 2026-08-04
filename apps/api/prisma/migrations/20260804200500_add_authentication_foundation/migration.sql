-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM (
    'ACTIVE',
    'DISABLED'
);

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM (
    'ADMIN',
    'NARRATOR',
    'PLAYER'
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserAccountStatus" NOT NULL
        DEFAULT 'ACTIVE',
    "roles" "UserRole"[] NOT NULL
        DEFAULT ARRAY['PLAYER']::"UserRole"[],
    "createdAt" TIMESTAMPTZ(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey"
        PRIMARY KEY ("id"),
    CONSTRAINT "users_username_not_blank"
        CHECK (length(btrim("username")) > 0),
    CONSTRAINT "users_display_name_not_blank"
        CHECK (length(btrim("displayName")) > 0),
    CONSTRAINT "users_password_hash_not_blank"
        CHECK (length(btrim("passwordHash")) > 0),
    CONSTRAINT "users_roles_not_empty"
        CHECK (cardinality("roles") > 0)
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "auth_sessions_pkey"
        PRIMARY KEY ("id"),
    CONSTRAINT "auth_sessions_token_hash_not_blank"
        CHECK (length(btrim("tokenHash")) > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key"
    ON "users"("username");

-- CreateIndex
CREATE INDEX "users_status_idx"
    ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_tokenHash_key"
    ON "auth_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx"
    ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx"
    ON "auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "auth_sessions_revokedAt_idx"
    ON "auth_sessions"("revokedAt");

-- AddForeignKey
ALTER TABLE "auth_sessions"
ADD CONSTRAINT "auth_sessions_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
