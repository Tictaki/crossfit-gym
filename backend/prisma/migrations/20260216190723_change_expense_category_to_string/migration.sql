/*
  Warnings:

  - Changed the type of `category` on the `Expense` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "category" TYPE TEXT USING "category"::text;
DROP TYPE "ExpenseCategory";

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");
