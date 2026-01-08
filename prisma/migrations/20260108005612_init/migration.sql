/*
  Warnings:

  - You are about to drop the column `date` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `buyDate` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyPrice` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "date",
DROP COLUMN "price",
ADD COLUMN     "buyDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "buyPrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "sellDate" TIMESTAMP(3),
ADD COLUMN     "sellPrice" DECIMAL(65,30),
ADD COLUMN     "type" "TransactionType" NOT NULL;
