#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(scriptDir, '..');
const defaultDbPath = resolve(frontendRoot, '../shaonianqiutan-backend/shaonianqiutan.db');
const dbPath = process.env.E2E_DB_PATH || process.env.BACKEND_DB_PATH || defaultDbPath;
const sqliteBin = process.env.SQLITE_BIN || 'sqlite3';

const checks = [
  {
    label: 'E2E match residue',
    countSql: "select count(*) from match_summaries where match_name like 'E2E测试-%';",
    sampleSql: "select id || ' | ' || match_name from match_summaries where match_name like 'E2E测试-%' order by id desc limit 5;",
  },
  {
    label: 'E2E notification residue',
    countSql: "select count(*) from notifications where title like '%E2E测试-%' or content like '%E2E测试-%';",
    sampleSql: "select id || ' | user=' || user_id || ' | ' || type || ' | ' || title || ' | ' || replace(coalesce(content, ''), char(10), ' ') from notifications where title like '%E2E测试-%' or content like '%E2E测试-%' order by id desc limit 5;",
  },
];

function runSql(sql) {
  return execFileSync(sqliteBin, [dbPath, sql], { encoding: 'utf8' }).trim();
}

if (!existsSync(dbPath)) {
  console.error(`[e2e-residue] database not found: ${dbPath}`);
  process.exit(2);
}

console.log(`[e2e-residue] database: ${dbPath}`);

let hasResidue = false;
for (const check of checks) {
  const count = Number(runSql(check.countSql) || '0');
  console.log(`[e2e-residue] ${check.label}: ${count}`);

  if (count > 0) {
    hasResidue = true;
    const sample = runSql(check.sampleSql);
    if (sample) {
      console.log(`[e2e-residue] ${check.label} sample:`);
      console.log(sample);
    }
  }
}

if (hasResidue) {
  console.error('[e2e-residue] failed: E2E residue remains.');
  process.exit(1);
}

console.log('[e2e-residue] ok: no E2E match or notification residue.');
