-- Replace VNPay transactions with provider-agnostic payment transactions (SePay)

DROP TABLE IF EXISTS "vnpay_transactions";

CREATE TABLE "payment_transactions" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'sepay',
    "invoice_number" TEXT NOT NULL,
    "external_txn_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "raw_response" JSONB,
    "payment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_transactions_order_id_key" ON "payment_transactions"("order_id");
CREATE UNIQUE INDEX "payment_transactions_invoice_number_key" ON "payment_transactions"("invoice_number");

ALTER TABLE "payment_transactions"
  ADD CONSTRAINT "payment_transactions_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
