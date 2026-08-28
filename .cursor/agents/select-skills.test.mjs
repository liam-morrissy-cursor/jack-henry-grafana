import assert from 'node:assert/strict';
import { selectSkills } from './select-skills.mjs';

function test(name, fn) {
  try {
    fn();
    console.log(`ok — ${name}`);
  } catch (err) {
    console.error(`FAIL — ${name}`);
    throw err;
  }
}

test('api4-only does not trigger Playwright', () => {
  const r = selectSkills([
    'api4/user.go',
    'api4/user_test.go',
    'server/channels/api4/team.go',
  ]);
  assert.deepEqual(r.skills, ['mm-test-api']);
  assert.equal(r.runPlaywright, false);
  assert.match(r.reason, /api4-only/i);
});

test('frontend Jest skill without Playwright', () => {
  const r = selectSkills([
    'public/app/features/foo/Bar.tsx',
    'public/app/features/foo/Bar.test.tsx',
  ]);
  assert.deepEqual(r.skills, ['mm-test-frontend']);
  assert.equal(r.runPlaywright, false);
});

test('backend skill for Go pkg paths', () => {
  const r = selectSkills(['pkg/services/store/service.go']);
  assert.deepEqual(r.skills, ['mm-test-backend']);
  assert.equal(r.runPlaywright, false);
});

test('mixed api4 + frontend selects both, still no Playwright', () => {
  const r = selectSkills(['api4/user.go', 'public/app/core/utils/foo.ts']);
  assert.deepEqual(r.skills, ['mm-test-api', 'mm-test-frontend']);
  assert.equal(r.runPlaywright, false);
});

test('Playwright only when e2e paths change', () => {
  const r = selectSkills(['e2e-playwright/dashboard/foo.spec.ts']);
  assert.equal(r.runPlaywright, true);
  assert.deepEqual(r.skills, []);
});

test('empty diff', () => {
  const r = selectSkills([]);
  assert.deepEqual(r.skills, []);
  assert.equal(r.runPlaywright, false);
});

console.log('all select-skills tests passed');
