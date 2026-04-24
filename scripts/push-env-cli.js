#!/usr/bin/env node
/**
 * Push .env.local to Vercel using CLI commands
 * Usage: node scripts/push-env-cli.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const vars = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars.push({ key, value });
  }
  return vars;
}

function addEnvVar(key, value) {
  try {
    // Use echo to pipe value into vercel env add
    // This avoids interactive prompts
    const cmd = `echo ${value.replace(/"/g, '\\"')} | npx vercel env add ${key}`;
    execSync(cmd, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      shell: true,
    });
    return true;
  } catch (e) {
    // If already exists, try to update by removing and re-adding
    try {
      execSync(`npx vercel env rm ${key} -y`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        shell: true,
      });
      const cmd = `echo ${value.replace(/"/g, '\\"')} | npx vercel env add ${key}`;
      execSync(cmd, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe',
        shell: true,
      });
      return true;
    } catch (_) {
      return false;
    }
  }
}

function main() {
  console.log('🚀 Pushing .env.local to Vercel via CLI...\n');

  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const vars = parseEnvFile(ENV_FILE);
  console.log(`📦 Found ${vars.length} variables\n`);

  let success = 0;
  let failed = 0;

  for (const { key, value } of vars) {
    const display = key.startsWith('NEXT_PUBLIC_') ? value : '***';
    process.stdout.write(`  • ${key} = ${display} ... `);

    if (addEnvVar(key, value)) {
      console.log('✅');
      success++;
    } else {
      console.log('❌');
      failed++;
    }
  }

  console.log(`\n📊 Results: ${success} pushed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n✨ All env vars pushed! Now deploy with:');
    console.log('   cd nextflow && vercel --prod\n');
  }
}

main();

