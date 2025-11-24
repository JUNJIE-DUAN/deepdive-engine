/**
 * Script to resolve failed Prisma migrations
 * This should be run before migrate deploy in production
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

async function forceDeleteFailedMigration(migrationName: string) {
  console.log(`\n🗑️  Force deleting migration record: ${migrationName}`);
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log("✓ Connected to database");

    // Check if migration exists before deletion
    const existing = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "_prisma_migrations"
      WHERE migration_name = ${migrationName};
    `;
    const count = Number(existing[0].count);
    console.log(`✓ Found ${count} record(s) for migration: ${migrationName}`);

    if (count > 0) {
      const result = await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE migration_name = ${migrationName};
      `;
      console.log(
        `✅ Deleted ${result} migration record(s) for ${migrationName}`,
      );
    } else {
      console.log(
        `ℹ️  No records found for ${migrationName}, skipping deletion`,
      );
    }
  } catch (error) {
    console.error(`❌ Failed to delete migration ${migrationName}:`, error);
  } finally {
    await prisma.$disconnect();
    console.log("✓ Disconnected from database\n");
  }
}

async function resolveMigrations() {
  console.log("🔍 Checking for failed migrations...");

  try {
    // Try to deploy migrations
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations deployed successfully");
  } catch (error: any) {
    // Check if it's a failed migration error (P3009)
    if (
      error.message?.includes("P3009") ||
      error.message?.includes("failed migrations")
    ) {
      console.log("⚠️  Found failed migrations, attempting to resolve...");

      try {
        // List of known failed migrations to delete
        const failedMigrations = [
          "20251123_seed_predefined_data_sources",
          "20251123_seed_predefined_data_sources_v2",
        ];

        // Force delete failed migration records from database
        console.log("\n🧹 Force cleaning failed migration records...");
        for (const migrationName of failedMigrations) {
          await forceDeleteFailedMigration(migrationName);
        }

        console.log("\n🔄 Retrying migration deployment...");
        execSync("npx prisma migrate deploy", { stdio: "inherit" });
        console.log("✅ Migrations deployed successfully after resolution");
      } catch (resolveError) {
        console.error("❌ Failed to resolve migrations:", resolveError);
        process.exit(1);
      }
    } else {
      // Some other error
      throw error;
    }
  }
}

resolveMigrations().catch((error) => {
  console.error("❌ Migration resolution failed:", error);
  process.exit(1);
});
