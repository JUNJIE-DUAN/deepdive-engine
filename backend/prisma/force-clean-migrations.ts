/**
 * Force clean failed migrations from the database
 * This script directly deletes failed migration records from _prisma_migrations table
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function forceCleanMigrations() {
  console.log("🧹 Force cleaning failed migrations...");

  try {
    // Connect to database
    await prisma.$connect();
    console.log("✅ Connected to database");

    // Check for failed migrations
    const failedMigrations = await prisma.$queryRaw<
      Array<{
        migration_name: string;
        started_at: Date;
        finished_at: Date | null;
        logs: string | null;
      }>
    >`
      SELECT migration_name, started_at, finished_at, logs
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL OR logs LIKE '%fail%' OR logs LIKE '%error%'
      ORDER BY started_at DESC;
    `;

    console.log(
      `\n📋 Found ${failedMigrations.length} failed/incomplete migrations:`,
    );
    failedMigrations.forEach((m) => {
      console.log(`  - ${m.migration_name} (started: ${m.started_at})`);
    });

    if (failedMigrations.length === 0) {
      console.log("✅ No failed migrations found!");
      return;
    }

    // Delete specific failed migration
    const migrationToDelete = "20251123_seed_predefined_data_sources";
    console.log(`\n🗑️  Deleting failed migration: ${migrationToDelete}`);

    const result = await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = ${migrationToDelete};
    `;

    console.log(`✅ Deleted ${result} migration record(s)`);

    // Verify deletion
    const remaining = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "_prisma_migrations"
      WHERE migration_name = ${migrationToDelete};
    `;

    const count = Number(remaining[0].count);
    if (count === 0) {
      console.log("✅ Migration successfully removed from database");
    } else {
      console.log(`⚠️  Warning: ${count} record(s) still remaining`);
    }

    // Show final state
    console.log("\n📊 Current migrations in database:");
    const allMigrations = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY started_at DESC
      LIMIT 15;
    `;

    allMigrations.forEach((m) => {
      const status = m.finished_at ? "✅" : "⏳";
      console.log(`  ${status} ${m.migration_name}`);
    });
  } catch (error) {
    console.error("❌ Error cleaning migrations:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

forceCleanMigrations()
  .then(() => {
    console.log("\n🎉 Migration cleanup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration cleanup failed:", error);
    process.exit(1);
  });
