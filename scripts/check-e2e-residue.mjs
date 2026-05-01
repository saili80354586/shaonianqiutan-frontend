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
  {
    label: 'E2E analyst order residue',
    countSql: "select count(*) from orders where order_no like 'E2E-ANALYST-%' or player_name like 'E2E分析师闭环%';",
    sampleSql: "select id || ' | ' || order_no || ' | ' || status || ' | ' || player_name from orders where order_no like 'E2E-ANALYST-%' or player_name like 'E2E分析师闭环%' order by id desc limit 5;",
  },
  {
    label: 'E2E analyst report residue',
    countSql: "select count(*) from reports where player_name like 'E2E分析师闭环%' or content like '%E2E_ANALYST_FLOW%' or summary like '%E2E_ANALYST_FLOW%';",
    sampleSql: "select id || ' | order=' || order_id || ' | ' || status || ' | ' || player_name from reports where player_name like 'E2E分析师闭环%' or content like '%E2E_ANALYST_FLOW%' or summary like '%E2E_ANALYST_FLOW%' order by id desc limit 5;",
  },
  {
    label: 'E2E analyst analysis residue',
    countSql: "select count(*) from video_analyses where player_name like 'E2E分析师闭环%' or ai_report like '%E2E_ANALYST_FLOW%' or summary like '%E2E_ANALYST_FLOW%';",
    sampleSql: "select id || ' | order=' || order_id || ' | ' || status || ' | ' || player_name from video_analyses where player_name like 'E2E分析师闭环%' or ai_report like '%E2E_ANALYST_FLOW%' or summary like '%E2E_ANALYST_FLOW%' order by id desc limit 5;",
  },
  {
    label: 'E2E analyst notification residue',
    countSql: "select count(*) from notifications where title like '%E2E_ANALYST_FLOW%' or content like '%E2E_ANALYST_FLOW%' or data like '%E2E_ANALYST_FLOW%' or title like '%E2E分析师闭环%' or content like '%E2E分析师闭环%' or data like '%E2E分析师闭环%';",
    sampleSql: "select id || ' | user=' || user_id || ' | ' || type || ' | ' || title || ' | ' || replace(coalesce(content, ''), char(10), ' ') from notifications where title like '%E2E_ANALYST_FLOW%' or content like '%E2E_ANALYST_FLOW%' or data like '%E2E_ANALYST_FLOW%' or title like '%E2E分析师闭环%' or content like '%E2E分析师闭环%' or data like '%E2E分析师闭环%' order by id desc limit 5;",
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

console.log('[e2e-residue] ok: no tracked E2E residue.');
