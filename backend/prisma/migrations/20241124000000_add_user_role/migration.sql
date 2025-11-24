-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Update admin user
UPDATE "users" SET "role" = 'ADMIN' WHERE "email" = 'hello.junjie.duan@gmail.com';
