#!/usr/bin/env node
/**
 * Parses NFL player info from scraped HTML filenames and bulk-loads into Postgres.
 *
 * Usage:
 *   Pipe filenames (one per line):
 *     cat filenames.txt | node db/load-from-filenames.js
 *
 *   Or pass a JSON array file:
 *     node db/load-from-filenames.js filenames.json
 *
 * Filename format: scrapedFiles/POSITION-First_Last-STARTYEAR-ENDYEAR.html
 */

import pg from "pg";
import fs from "fs";
import path from "path";
import readline from "readline";

// Load .env if present (Node 20.6+)
try { process.loadEnvFile(); } catch { /* no .env, rely on env vars */ }

const LEAGUE = "NFL";

function parseFilename(filename) {
  const base = path.basename(filename, ".html");
  const parts = base.split("-");
  const endYear = parts.at(-1);
  const startYear = parts.at(-2);
  const position = parts[0];
  const namePart = parts.slice(1, -2).join("-");
  const name = namePart.replace(/_/g, " ");
  if (!name || !/^\d{4}$/.test(startYear) || !/^\d{4}$/.test(endYear)) return null;
  return { name, league: LEAGUE, position, years_active: `${startYear}-${endYear}`, external_id: base };
}

async function loadFilenames(filenames) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  const players = filenames
    .map((f) => f.trim())
    .filter(Boolean)
    .map(parseFilename)
    .filter(Boolean);

  if (players.length === 0) {
    console.error("No valid filenames parsed.");
    await pool.end();
    process.exit(1);
  }

  console.log(`Inserting ${players.length} players...`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Build a multi-row INSERT with ON CONFLICT to make re-runs idempotent
    const values = [];
    const placeholders = players.map((p, i) => {
      const base = i * 5;
      values.push(p.name, p.league, p.position, p.years_active, p.external_id);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    });

    await client.query(
      `INSERT INTO players (name, league, position, years_active, external_id)
       VALUES ${placeholders.join(", ")}
       ON CONFLICT (external_id) WHERE external_id IS NOT NULL DO NOTHING`,
      values
    );

    await client.query("COMMIT");
    console.log("Done.");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  let filenames;

  if (process.argv[2]) {
    // JSON file argument
    filenames = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  } else {
    // Stdin, one filename per line
    const rl = readline.createInterface({ input: process.stdin });
    filenames = [];
    for await (const line of rl) filenames.push(line);
  }

  await loadFilenames(filenames);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
