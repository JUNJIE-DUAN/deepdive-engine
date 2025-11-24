/**
 * Railway Database Connection Fix Script
 *
 * This script attempts multiple connection strategies to fix the
 * "Can't reach postgres.railway.internal" issue.
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

interface ConnectionAttempt {
  name: string;
  url: string;
  description: string;
}

async function testConnection(url: string, timeout = 5000): Promise<boolean> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout),
      ),
    ]);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  console.log("🔧 Railway Database Connection Fix Script\n");

  const originalUrl = process.env.DATABASE_URL;
  if (!originalUrl) {
    console.error("❌ DATABASE_URL is not set!");
    process.exit(1);
  }

  console.log("📋 Current DATABASE_URL:");
  const maskedUrl = originalUrl.replace(/:[^:@]+@/, ":****@");
  console.log(`   ${maskedUrl}\n`);

  // Parse the URL
  const url = new URL(originalUrl);
  const host = url.hostname;
  const port = url.port || "5432";
  const database = url.pathname.slice(1);
  const username = url.username;
  const password = url.password;

  console.log("🔍 Detected Configuration:");
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   Username: ${username}\n`);

  // Define connection attempts
  const attempts: ConnectionAttempt[] = [
    {
      name: "Original URL (Private Network)",
      url: originalUrl,
      description: "Using postgres.railway.internal",
    },
  ];

  // If using private network, also try public network alternatives
  if (host === "postgres.railway.internal") {
    console.log(
      "⚠️  Detected private network address (postgres.railway.internal)",
    );
    console.log(
      "   This may not work if Private Networking is not properly configured.\n",
    );

    // Try to get public URL from Railway
    try {
      console.log("🔍 Attempting to fetch Railway public URL...");
      const result = execSync(
        'railway variables --json 2>/dev/null | grep -o "DATABASE_PUBLIC_URL.*" || echo ""',
        { encoding: "utf-8", timeout: 5000 },
      );
      if (result && result.trim()) {
        attempts.push({
          name: "Public Network (from Railway variable)",
          url: result.trim(),
          description: "Using Railway public URL",
        });
      }
    } catch (e) {
      console.log("   ℹ️  Could not fetch public URL from Railway CLI\n");
    }

    // Add manual public URL option
    console.log("💡 Suggested Fix:");
    console.log("   1. Go to Railway Dashboard → Postgres service");
    console.log("   2. Find the 'Connect' tab");
    console.log("   3. Copy the 'Public URL' connection string");
    console.log("   4. Update Backend service variables:");
    console.log("      DATABASE_URL=<paste public URL here>\n");
  }

  // Test connections
  console.log("🧪 Testing connections...\n");

  for (const attempt of attempts) {
    console.log(`📡 ${attempt.name}`);
    console.log(`   ${attempt.description}`);
    const success = await testConnection(attempt.url, 10000);

    if (success) {
      console.log(`   ✅ Connection successful!\n`);
      console.log("🎉 Solution found!");
      console.log(`\nUpdate your Railway Backend service variables with:`);
      const maskedAttemptUrl = attempt.url.replace(/:[^:@]+@/, ":****@");
      console.log(`DATABASE_URL=${maskedAttemptUrl}\n`);
      process.exit(0);
    } else {
      console.log(`   ❌ Connection failed\n`);
    }
  }

  console.log("\n❌ All connection attempts failed.");
  console.log("\n🔧 Next Steps:");
  console.log("1. Check Railway Dashboard → Backend service → Variables");
  console.log("2. Ensure DATABASE_URL uses variable reference:");
  console.log("   DATABASE_URL=${{Postgres.DATABASE_URL}}");
  console.log("3. Or use the Postgres public URL instead of private network");
  console.log(
    "4. Verify both Backend and Postgres services are in the same project",
  );
  console.log("\n📚 See: infra/railway/TROUBLESHOOTING.md for detailed guide");

  process.exit(1);
}

main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
