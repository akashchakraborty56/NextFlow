#!/usr/bin/env node
/**
 * Push environment variables from .env.local to Vercel
 * Usage: node scripts/push-env-to-vercel.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const VERCEL_CONFIG = path.join(__dirname, '..', '.vercel', 'project.json');

function getVercelToken() {
  try {
    // Try to get token from Vercel CLI auth file
    const authPath = path.join(require('os').homedir(), '.vercel', 'auth.json');
    if (!fs.existsSync(authPath)) {
      console.error('❌ Vercel auth not found. Run: vercel login');
      process.exit(1);
    }
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    return auth.token;
  } catch (e) {
    console.error('❌ Failed to read Vercel auth:', e.message);
    process.exit(1);
  }
}

function getProjectInfo() {
  try {
    if (!fs.existsSync(VERCEL_CONFIG)) {
      console.error('❌ .vercel/project.json not found. Run: vercel --yes');
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(VERCEL_CONFIG, 'utf-8'));
  } catch (e) {
    console.error('❌ Failed to read project config:', e.message);
    process.exit(1);
  }
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
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars.push({ key, value });
  }
  return vars;
}

async function pushEnvVar(token, projectId, teamId, key, value) {
  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/env`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }

  return res.json();
}

async function main() {
  console.log('🚀 Pushing .env.local variables to Vercel...\n');

  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const token = getVercelToken();
  const project = getProjectInfo();
  const vars = parseEnvFile(ENV_FILE);

  console.log(`📦 Found ${vars.length} variables`);
  console.log(`🔧 Project: ${project.projectId}`);
  console.log(`👤 Team: ${project.orgId || 'personal'}\n`);

  let success = 0;
  let failed = 0;

  for (const { key, value } of vars) {
    // Mask secret values in output
    const displayValue = key.startsWith('NEXT_PUBLIC_') ? value : '***';
    process.stdout.write(`  • ${key} = ${displayValue} ... `);

    try {
      await pushEnvVar(token, project.projectId, project.orgId, key, value);
      console.log('✅');
      success++;
    } catch (err) {
      // If it already exists, try to update it
      try {
        const listUrl = project.orgId
          ? `https://api.vercel.com/v10/projects/${project.projectId}/env?teamId=${project.orgId}`
          : `https://api.vercel.com/v10/projects/${project.projectId}/env`;
        const listRes = await fetch(listUrl, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const list = await listRes.json();
        const existing = list.envs?.find(e => e.key === key);
        if (existing) {
          const patchUrl = project.orgId
            ? `https://api.vercel.com/v10/projects/${project.projectId}/env/${existing.id}?teamId=${project.orgId}`
            : `https://api.vercel.com/v10/projects/${project.projectId}/env/${existing.id}`;
          await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value, target: ['production', 'preview', 'development'] }),
          });
          console.log('🔄 updated');
          success++;
          continue;
        }
      } catch (_) {}
      console.log(`❌ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${success} pushed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n✨ All variables pushed! Now redeploy with:');
    console.log('   cd nextflow && vercel --prod\n');
  }
}

main().catch(console.error);
