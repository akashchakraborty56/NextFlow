#!/usr/bin/env node
/**
 * Push .env.local to Vercel via REST API + curl
 * Usage: node scripts/push-env-curl.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '..', '.env.local');

function getAuthToken() {
  const authPath = path.join(require('os').homedir(), '.vercel', 'auth.json');
  if (!fs.existsSync(authPath)) {
    console.error('❌ No Vercel auth found. Run: vercel login');
    process.exit(1);
  }
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
  return auth.token;
}

function getProjectId() {
  const configPath = path.join(__dirname, '..', '.vercel', 'project.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ No project config. Run: cd nextflow && vercel --yes');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return config.projectId;
}

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

function pushVar(token, projectId, key, value) {
  try {
    const jsonBody = JSON.stringify({
      key,
      value,
      type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
      target: ['production', 'preview', 'development'],
    });

    const cmd = `curl -s -X POST "https://api.vercel.com/v10/projects/${projectId}/env" \\
      -H "Authorization: Bearer ${token}" \\
      -H "Content-Type: application/json" \\
      -d '${jsonBody.replace(/'/g, "'\"'\"'")}'`;

    const result = execSync(cmd, { encoding: 'utf-8', shell: true });
    const parsed = JSON.parse(result);
    return !parsed.error;
  } catch (e) {
    return false;
  }
}

function main() {
  console.log('🚀 Pushing .env.local to Vercel via API...\n');

  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const token = getAuthToken();
  const projectId = getProjectId();
  const vars = parseEnvFile(ENV_FILE);

  console.log(`📦 Found ${vars.length} variables`);
  console.log(`🔧 Project: ${projectId}\n`);

  let success = 0;
  let failed = 0;

  for (const { key, value } of vars) {
    const display = key.startsWith('NEXT_PUBLIC_') ? value : '***';
    process.stdout.write(`  • ${key} = ${display} ... `);

    if (pushVar(token, projectId, key, value)) {
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
  } else {
    console.log('\n⚠️ Some failed. You may need to add them manually at:');
    console.log('   https://vercel.com/mayur-vermas-projects/nextflow/settings/environment-variables\n');
  }
}

main();

