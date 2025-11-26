/**
 * Script to resolve failed Prisma migrations
 * This should be run before migrate deploy in production
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

async function forceDeleteFailedMigration(migrationName: string) {
  console.log(`\n🗑️  Force deleting migration record: ${migrationName}`);

  // DEBUG: Print connection info
  console.log(`🔗 Attempting to connect to database...`);

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

/**
 * Ensure all enum values exist in the database
 * This handles cases where schema has enum values that weren't in original migration
 */
async function ensureEnumValues(prisma: PrismaClient) {
  console.log("🔍 Checking enum values...");

  try {
    // Check if ALL_AI exists in MentionType enum
    const enumValues = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'MentionType')
    `;

    const existingValues = enumValues.map((e) => e.enumlabel);
    console.log(`   Current MentionType values: ${existingValues.join(", ")}`);

    if (!existingValues.includes("ALL_AI")) {
      console.log("   Adding ALL_AI to MentionType enum...");
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "MentionType" ADD VALUE IF NOT EXISTS 'ALL_AI'`,
      );
      console.log("   ✅ ALL_AI added to MentionType enum");
    } else {
      console.log("   ✅ ALL_AI already exists in MentionType enum");
    }
  } catch (error) {
    console.error("   ⚠️  Error checking/adding enum values:", error);
    // Don't fail deployment for this - the enum might already exist
  }
}

async function resolveMigrations() {
  console.log("🔍 Proactively checking for failed migrations in database...");

  // DEBUG: Print DATABASE_URL for troubleshooting
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    // Mask password for security
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
    console.log(`📊 DATABASE_URL: ${maskedUrl}`);
  } else {
    console.error("❌ DATABASE_URL is not set!");
  }

  const prisma = new PrismaClient();

  try {
    // Connect to database first
    await prisma.$connect();
    console.log("✅ Connected to database");

    // Ensure all enum values exist before running migrations
    await ensureEnumValues(prisma);

    // Check for ANY failed or incomplete migrations
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

    if (failedMigrations.length > 0) {
      console.log(
        `\n⚠️  Found ${failedMigrations.length} failed/incomplete migration(s):`,
      );
      failedMigrations.forEach((m) => {
        console.log(`   - ${m.migration_name} (started: ${m.started_at})`);
      });

      console.log("\n🧹 DELETING ALL failed migration records...");

      // Delete ALL failed migrations
      for (const migration of failedMigrations) {
        await forceDeleteFailedMigration(migration.migration_name);
      }

      console.log("✅ All failed migrations cleaned up");
    } else {
      console.log("✅ No failed migrations found in database");
    }

    await prisma.$disconnect();
    console.log("✓ Disconnected from database\n");

    // Now deploy migrations
    console.log("🚀 Deploying migrations...");
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("✅ Migrations deployed successfully");
  } catch (error) {
    console.error("❌ Migration resolution failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

resolveMigrations().catch((error) => {
  console.error("❌ Migration resolution failed:", error);
  process.exit(1);
});
