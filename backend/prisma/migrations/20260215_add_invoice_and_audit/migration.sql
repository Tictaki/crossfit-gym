-- CreateEnum for InvoiceStatus
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'CANCELLED', 'REFUNDED');

-- CreateEnum for AuditAction
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'ISSUED', 'CANCELLED', 'REFUNDED');

-- Add columns to Payment table
ALTER TABLE "Payment" ADD COLUMN     "receiptNumber" SERIAL NOT NULL,
ADD COLUMN     "refunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create unique constraint for receiptNumber
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- Create index for receiptNumber
CREATE INDEX "Payment_receiptNumber_idx" ON "Payment"("receiptNumber");

-- CreateTable "Invoice"
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" INTEGER NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedBy" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "pdfStoragePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for invoiceNumber
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- Create indexes for Invoice
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");
CREATE UNIQUE INDEX "Invoice_paymentId_key" ON "Invoice"("paymentId");

-- CreateTable "PaymentAudit"
CREATE TABLE "PaymentAudit" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "details" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAudit_pkey" PRIMARY KEY ("id")
);

-- Create indexes for PaymentAudit
CREATE INDEX "PaymentAudit_paymentId_idx" ON "PaymentAudit"("paymentId");
CREATE INDEX "PaymentAudit_action_idx" ON "PaymentAudit"("action");
CREATE INDEX "PaymentAudit_createdAt_idx" ON "PaymentAudit"("createdAt");

-- AddForeignKey for Invoice
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for Invoice issuer
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey for PaymentAudit
ALTER TABLE "PaymentAudit" ADD CONSTRAINT "PaymentAudit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for PaymentAudit performer
ALTER TABLE "PaymentAudit" ADD CONSTRAINT "PaymentAudit_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
