/**
 * Diff-scoped TestGuardian skill router.
 *
 * Classifies changed paths into mm-test-* skills. Playwright is never
 * selected for api4-only diffs (KAN-22 acceptance criterion).
 */

const API4_RE = /(^|\/)api4\//;
const PLAYWRIGHT_RE = /(^|\/)e2e-playwright\/|(^|\/)playwright\//;
const FRONTEND_RE =
  /(^|\/)public\/app\/|(^|\/)packages\/[^/]+\/src\/|(^|\/)webapp\//;
const BACKEND_RE = /\.go$|(^|\/)pkg\/|(^|\/)server\//;

/**
 * @param {string[]} changedFiles
 * @returns {{ skills: string[], runPlaywright: boolean, reason: string }}
 */
export function selectSkills(changedFiles) {
  const files = (changedFiles || [])
    .map((f) => String(f).trim().replace(/\\/g, '/'))
    .filter(Boolean);

  if (files.length === 0) {
    return {
      skills: [],
      runPlaywright: false,
      reason: 'no changed files',
    };
  }

  const allApi4 = files.every((f) => API4_RE.test(f));
  if (allApi4) {
    return {
      skills: ['mm-test-api'],
      runPlaywright: false,
      reason: 'api4-only diff — Playwright skipped',
    };
  }

  const skills = new Set();
  let runPlaywright = false;

  for (const f of files) {
    if (API4_RE.test(f)) {
      skills.add('mm-test-api');
      continue;
    }
    if (PLAYWRIGHT_RE.test(f)) {
      runPlaywright = true;
      continue;
    }
    if (BACKEND_RE.test(f)) {
      skills.add('mm-test-backend');
      continue;
    }
    if (FRONTEND_RE.test(f) || /\.(tsx?|jsx?)$/.test(f)) {
      skills.add('mm-test-frontend');
    }
  }

  return {
    skills: [...skills].sort(),
    runPlaywright,
    reason: runPlaywright
      ? 'diff includes Playwright/e2e paths'
      : 'diff-scoped unit/API/backend skills only',
  };
}

function main(argv) {
  const result = selectSkills(argv);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

const entry = process.argv[1] ? String(process.argv[1]) : '';
if (entry.endsWith('select-skills.mjs')) {
  main(process.argv.slice(2));
}
