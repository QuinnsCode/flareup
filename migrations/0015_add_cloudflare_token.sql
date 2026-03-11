-- CreateTable
CREATE TABLE "cloudflare_token" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "encryptedDek" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cloudflare_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "cloudflare_token_userId_idx" ON "cloudflare_token"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cloudflare_token_userId_accountId_key" ON "cloudflare_token"("userId", "accountId");