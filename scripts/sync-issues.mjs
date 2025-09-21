#!/usr/bin/env node
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function run(cmd, opts = {}) {
  const options = { stdio: 'pipe', encoding: 'utf8', ...opts };
  return execSync(cmd, options).toString().trim();
}

function ensureGh() {
  try {
    run('gh --version');
  } catch {
    console.error('GitHub CLI (gh) is required. Install: https://cli.github.com/');
    process.exit(1);
  }
}

function getRepoSlug() {
  try {
    const out = run('gh repo view --json nameWithOwner --jq .nameWithOwner');
    return out;
  } catch {
    return null; // directory context should suffice
  }
}

function getExistingLabels() {
  try {
    const json = run('gh label list --json name');
    const arr = JSON.parse(json);
    return new Set(arr.map((x) => x.name));
  } catch (e) {
    console.warn('Warning: could not list labels via gh. Proceeding optimistically.');
    return new Set();
  }
}

function createLabel(name, { color = 'ededed', description = '' } = {}) {
  try {
    run(`gh label create ${shellEscape(name)} --color ${shellEscape(color)} ${description ? `--description ${shellEscape(description)}` : ''}`);
    return true;
  } catch (e) {
    const msg = e?.stderr?.toString?.() || e?.message || '';
    if (msg.includes('already exists')) return false;
    // fall back: try update to set color/description if label exists
    try {
      run(`gh label edit ${shellEscape(name)} --color ${shellEscape(color)} ${description ? `--description ${shellEscape(description)}` : ''}`);
      return false;
    } catch {
      console.warn(`Label '${name}': ${msg || 'unknown error'}`);
      return false;
    }
  }
}

function issueExistsByTitle(title) {
  try {
    const json = run(`gh issue list --state all --search ${shellEscape(`in:title ${title}`)} --limit 1 --json number,title`);
    const arr = JSON.parse(json);
    return Array.isArray(arr) && arr.some((it) => it.title === title);
  } catch {
    return false;
  }
}

function createIssue({ title, body, labels = [] }) {
  const labelFlags = labels.map((l) => `--label ${shellEscape(l)}`).join(' ');
  const cmd = `gh issue create --title ${shellEscape(title)} ${body ? `--body ${shellEscape(body)}` : ''} ${labelFlags}`;
  return run(cmd, { stdio: 'pipe' });
}

function shellEscape(str) {
  if (str === undefined || str === null) return "''";
  // Simple POSIX-safe single-quote escaping
  return `'${String(str).replace(/'/g, "'\\''")}'`;
}

async function main() {
  ensureGh();
  const repo = getRepoSlug();
  if (repo) {
    console.log(`Using repository: ${repo}`);
  }

  const issuesPath = path.join(repoRoot, 'issues.yml');
  const file = readFileSync(issuesPath, 'utf8');
  const docs = yaml.load(file);
  if (!Array.isArray(docs)) {
    console.error('issues.yml must be a YAML array of issue objects');
    process.exit(1);
  }

  const PHASE_LABELS = {
    'phase-0': { color: '915FEE', description: 'Phase 0 – MVP Go Live' },
    'phase-1': { color: '0EA5E9', description: 'Phase 1' },
    'phase-2': { color: '84CC16', description: 'Phase 2' },
    'phase-3': { color: 'F59E0B', description: 'Phase 3' },
    'phase-4': { color: 'EF4444', description: 'Phase 4' },
    'phase-5': { color: '64748B', description: 'Phase 5' }
  };

  const existing = getExistingLabels();

  // Ensure labels exist
  const neededLabels = new Set();
  for (const item of docs) {
    if (Array.isArray(item.labels)) {
      item.labels.forEach((l) => neededLabels.add(l));
    }
  }

  const created = [];
  for (const name of neededLabels) {
    if (!existing.has(name)) {
      const cfg = PHASE_LABELS[name] || { color: 'ededed', description: '' };
      const wasCreated = createLabel(name, cfg);
      if (wasCreated) created.push(name);
    }
  }
  if (created.length) console.log(`Created labels: ${created.join(', ')}`);

  // Create issues if not present
  let createdIssues = 0;
  for (const item of docs) {
    const { title, body, labels = [] } = item;
    if (!title) continue;
    if (issueExistsByTitle(title)) {
      console.log(`Skip existing issue: ${title}`);
      continue;
    }
    const url = createIssue({ title, body, labels });
    createdIssues += 1;
    console.log(`Created: ${title} -> ${url}`);
  }

  console.log(`Done. Created ${createdIssues} new issue(s).`);
}

main().catch((e) => {
  console.error(e?.stderr?.toString?.() || e?.message || e);
  process.exit(1);
});
