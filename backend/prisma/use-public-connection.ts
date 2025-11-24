/**
 * Emergency fix: Use public database connection
 * This bypasses the private network issue by using Railway's public URL
 *
 * Usage: Set RAILWAY_PUBLIC_URL environment variable or this will try to detect it
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

async function getPublicDatabaseUrl(): Promise<string> {
  const currentUrl = process.env.DATABASE_URL;

  if (!currentUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  // If DATABASE_URL is already using a public address, return it
  if (!currentUrl.includes("railway.internal")) {
    console.log("✅ DATABASE_URL is already using public address");
    return currentUrl;
  }

  console.log(
    "🔍 Detected private network address, attempting to find public URL...",
  );

  // Parse the current URL
  const url = new URL(currentUrl);
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;

  // Try to get public host from Railway environment
  const publicHost =
    process.env.RAILWAY_PUBLIC_HOST || process.env.RAILWAY_TCP_PROXY_DOMAIN;
  const publicPort =
    process.env.RAILWAY_PUBLIC_PORT || process.env.RAILWAY_TCP_PROXY_PORT;

  if (publicHost && publicPort) {
    const publicUrl = `postgresql://${username}:${password}@${publicHost}:${publicPort}/${database}`;
    console.log(`✅ Found public URL from environment`);
    return publicUrl;
  }

  // Fallback: construct public URL pattern
  // Railway typically uses: monorail.proxy.rlwy.net:XXXXX
  console.log("⚠️  Could not find public URL from environment");
  console.log(
    "   You need to manually set DATABASE_URL to the public connection string",
  );
  console.log(
    "   Get it from: Railway Dashboard → Postgres → Connect → Public URL",
  );

  throw new Error("Cannot determine public database URL");
}

async function testConnection() {
  try {
    const publicUrl = await getPublicDatabaseUrl();

    console.log("\n🧪 Testing connection with public URL...");

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: publicUrl,
        },
      },
    });

    await prisma.$connect();
    console.log("✅ Connection successful!");

    // Test a query
    const result = await prisma.$queryRaw<
      Array<{ version: string }>
    >`SELECT version()`;
    console.log(`✅ Database version: ${result[0]?.version}`);

    await prisma.$disconnect();

    console.log("\n🎉 Public connection works!");
    console.log("\nNext steps:");
    console.log("1. Update Railway Backend service variables:");
    console.log(`   DATABASE_URL=${publicUrl.replace(/:[^:@]+@/, ":****@")}`);
    console.log(
      "2. Or set DATABASE_URL=\${{Postgres.DATABASE_PUBLIC_URL}} if available",
    );

    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error.message);

    console.log("\n📋 Manual fix required:");
    console.log("1. Go to Railway Dashboard → Postgres service → Connect");
    console.log(
      "2. Copy the 'Public URL' (looks like: monorail.proxy.rlwy.net:XXXXX)",
    );
    console.log("3. Go to Backend service → Variables");
    console.log("4. Update DATABASE_URL with the public URL");
    console.log("5. Redeploy backend service");

    return false;
  }
}

testConnection().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
