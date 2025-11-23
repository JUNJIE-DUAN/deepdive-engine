/**
 * Script to resolve failed Prisma migrations
 * This should be run before migrate deploy in production
 */

import { execSync } from "child_process";

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
        // Resolve the specific failed migration
        const migrationName = "20251123_seed_predefined_data_sources";
        console.log(`🔧 Marking ${migrationName} as rolled back...`);
        execSync(
          `npx prisma migrate resolve --rolled-back "${migrationName}"`,
          { stdio: "inherit" },
        );

        console.log("🔄 Retrying migration deployment...");
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
