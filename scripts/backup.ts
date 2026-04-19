/**
 * On-demand Postgres backup via pg_dump.
 *
 * Usage: npm run db:backup
 *
 * Prerequisites: `pg_dump` must be on your PATH.
 *   - macOS:   brew install postgresql
 *   - Windows: https://www.postgresql.org/download/windows/ (client tools)
 *   - Linux:   apt install postgresql-client
 *
 * Writes a timestamped .sql file to ./backups/ (gitignored).
 * Uses DIRECT_URL (Session Pooler) — direct connection is fine for
 * a single dump and avoids transaction-pooler edge cases.
 */

import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("Error: DIRECT_URL or DATABASE_URL must be set in .env.local");
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").replace("Z", "");
  const outDir = resolve(process.cwd(), "backups");
  await mkdir(outDir, { recursive: true });
  const outFile = resolve(outDir, `reach-${ts}.sql`);

  console.log(`Dumping to ${outFile}...`);

  const proc = spawn(
    "pg_dump",
    ["--clean", "--if-exists", "--no-owner", "-f", outFile, url],
    { stdio: "inherit" },
  );

  proc.on("error", (err) => {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error("Error: pg_dump not found on PATH.");
      console.error("Install Postgres client tools — see docs/backup-restore.md");
      process.exit(127);
    }
    console.error("Error spawning pg_dump:", err);
    process.exit(1);
  });

  proc.on("exit", (code) => {
    if (code === 0) {
      console.log(`\n✓ Backup written: ${outFile}`);
    } else {
      console.error(`\npg_dump exited with code ${code}`);
      process.exit(code ?? 1);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
