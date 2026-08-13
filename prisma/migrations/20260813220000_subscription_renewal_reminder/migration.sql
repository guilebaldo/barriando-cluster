-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "renewalReminderPeriodEnd" TIMESTAMP(3);
