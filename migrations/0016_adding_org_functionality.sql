-- CreateTable
CREATE TABLE "scan_result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "cost_workers" REAL NOT NULL DEFAULT 0,
    "cost_workers_ai" REAL NOT NULL DEFAULT 0,
    "cost_kv" REAL NOT NULL DEFAULT 0,
    "cost_d1" REAL NOT NULL DEFAULT 0,
    "cost_r2" REAL NOT NULL DEFAULT 0,
    "cost_do" REAL NOT NULL DEFAULT 0,
    "cost_queues" REAL NOT NULL DEFAULT 0,
    "cost_total" REAL NOT NULL DEFAULT 0,
    "cost_projected" REAL NOT NULL DEFAULT 0,
    "workers_requests" INTEGER,
    "workers_ai_neurons" INTEGER,
    "kv_reads" INTEGER,
    "kv_writes" INTEGER,
    "d1_rows_read" INTEGER,
    "d1_rows_written" INTEGER,
    "r2_class_a_ops" INTEGER,
    "r2_class_b_ops" INTEGER,
    "r2_storage_gb" REAL,
    "do_requests" INTEGER,
    "do_duration_ms" INTEGER,
    "queue_operations" INTEGER,
    "scanned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scan_result_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "scan_result_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "alert_key" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "service" TEXT,
    "cost_at_fire" REAL NOT NULL,
    "projected_at_fire" REAL NOT NULL,
    "budget_at_fire" REAL NOT NULL,
    "pct_at_fire" REAL NOT NULL,
    "delivery_email" BOOLEAN NOT NULL DEFAULT false,
    "delivery_webhook" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" DATETIME,
    "snoozed_until" DATETIME,
    "fired_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_history_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alert_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "monthly_budget" REAL NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "service_budget_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "service_budget_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "scan_result_org_id_idx" ON "scan_result"("org_id");

-- CreateIndex
CREATE INDEX "scan_result_user_id_idx" ON "scan_result"("user_id");

-- CreateIndex
CREATE INDEX "scan_result_scanned_at_idx" ON "scan_result"("scanned_at");

-- CreateIndex
CREATE INDEX "alert_history_org_id_idx" ON "alert_history"("org_id");

-- CreateIndex
CREATE INDEX "alert_history_user_id_idx" ON "alert_history"("user_id");

-- CreateIndex
CREATE INDEX "alert_history_fired_at_idx" ON "alert_history"("fired_at");

-- CreateIndex
CREATE INDEX "service_budget_user_id_idx" ON "service_budget"("user_id");

-- CreateIndex
CREATE INDEX "service_budget_org_id_idx" ON "service_budget"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_budget_user_id_org_id_service_key" ON "service_budget"("user_id", "org_id", "service");
