-- DropIndex
DROP INDEX "Order_shipstationId_idx";

-- DropIndex
DROP INDEX "Order_orderNumber_idx";

-- DropIndex
DROP INDEX "Order_shipstationId_key";

-- DropIndex
DROP INDEX "Order_orderNumber_key";

-- DropIndex
DROP INDEX "ShipstationWebhookResponse_processed_idx";

-- DropIndex
DROP INDEX "ShipstationWebhookResponse_resourceType_idx";

-- DropIndex
DROP INDEX "friend_requests_sender_id_receiver_id_key";

-- DropIndex
DROP INDEX "friend_requests_sender_id_status_idx";

-- DropIndex
DROP INDEX "friend_requests_receiver_id_status_idx";

-- DropIndex
DROP INDEX "friendships_user_id_friend_id_key";

-- DropIndex
DROP INDEX "friendships_friend_id_idx";

-- DropIndex
DROP INDEX "friendships_user_id_idx";

-- DropIndex
DROP INDEX "game_invites_expires_at_idx";

-- DropIndex
DROP INDEX "game_invites_from_user_id_idx";

-- DropIndex
DROP INDEX "game_invites_to_user_id_status_idx";

-- DropIndex
DROP INDEX "notes_created_at_idx";

-- DropIndex
DROP INDEX "notes_user_id_idx";

-- DropIndex
DROP INDEX "notes_entity_type_entity_id_idx";

-- DropIndex
DROP INDEX "notes_organization_id_idx";

-- DropIndex
DROP INDEX "shipstation_orders_order_status_idx";

-- DropIndex
DROP INDEX "shipstation_orders_order_number_idx";

-- DropIndex
DROP INDEX "shipstation_orders_order_id_idx";

-- DropIndex
DROP INDEX "shipstation_orders_organization_id_idx";

-- DropIndex
DROP INDEX "shipstation_webhooks_processed_idx";

-- DropIndex
DROP INDEX "shipstation_webhooks_resource_type_idx";

-- DropIndex
DROP INDEX "shipstation_webhooks_organization_id_idx";

-- DropIndex
DROP INDEX "third_party_api_keys_service_idx";

-- DropIndex
DROP INDEX "third_party_api_keys_organization_id_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Order";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OrderNote";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ShipstationWebhookResponse";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "friend_requests";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "friendships";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "game_invites";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "notes";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "shipstation_orders";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "shipstation_webhooks";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "third_party_api_keys";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "email_signup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialId" TEXT NOT NULL,
    "publicKey" BLOB NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Credential" ("counter", "createdAt", "credentialId", "id", "publicKey", "userId") SELECT "counter", "createdAt", "credentialId", "id", "publicKey", "userId" FROM "Credential";
DROP TABLE "Credential";
ALTER TABLE "new_Credential" RENAME TO "Credential";
CREATE UNIQUE INDEX "Credential_userId_key" ON "Credential"("userId");
CREATE UNIQUE INDEX "Credential_credentialId_key" ON "Credential"("credentialId");
CREATE INDEX "Credential_credentialId_idx" ON "Credential"("credentialId");
CREATE INDEX "Credential_userId_idx" ON "Credential"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "email_signup_email_key" ON "email_signup"("email");

-- CreateIndex
CREATE INDEX "email_signup_email_idx" ON "email_signup"("email");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "invitation_organizationId_idx" ON "invitation"("organizationId");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "invitation_status_idx" ON "invitation"("status");

-- CreateIndex
CREATE INDEX "member_organizationId_idx" ON "member"("organizationId");

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "team_organizationId_idx" ON "team"("organizationId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "verification_identifier_value_key" ON "verification"("identifier", "value");
