import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';

// Supabase CLI FindPendingMigrations compares filename order to version order.
function compare(files, remote) {
  let i = 0, j = 0;
  const missing = [], pending = [];
  while (i < remote.length && j < files.length) {
    const local = files[j].split('_')[0];
    if (remote[i] === local) { i++; j++; }
    else if (remote[i] < local) missing.push(remote[i++]);
    else pending.push(files[j++]);
  }
  if (j === files.length) missing.push(...remote.slice(i));
  return { missing, pending: [...pending, ...files.slice(j)] };
}

test('mixed legacy lengths reproduce the Supabase error despite equal version sets', () => {
  const files = ['20261022_member.sql', '20261022044018_queue.sql'].sort();
  const versions = files.map(f => f.split('_')[0]).sort();
  assert.deepEqual(compare(files, versions).missing, ['20261022']);
});

test('canonical migration filenames and remote version ordering agree with zero pending SQL', async () => {
  const files = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) assert.match(file, /^\d{14}_.+\.sql$/);
  const versions = files.map(f => f.split('_')[0]);
  assert.equal(new Set(versions).size, files.length);
  assert.deepEqual(versions, [...versions].sort());
  assert.deepEqual(compare(files, [...versions].sort()), { missing: [], pending: [] });
});
