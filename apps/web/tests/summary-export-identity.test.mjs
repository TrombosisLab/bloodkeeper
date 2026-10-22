import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../src/features/chronicles/components/ChronicleSummaryWorkspace.tsx',import.meta.url),'utf8');
test('public and narrator export siblings have distinct keys and still remount per chronicle',()=>{
  const context=source.match(/<ChronicleContextExport key=\{`([^`]+)`\}/)?.[1];
  const narrator=source.match(/<ChronicleNarratorExport key=\{`([^`]+)`\}/)?.[1];
  assert.ok(context && narrator);
  assert.notEqual(context,narrator);
  for(const key of [context,narrator]) assert.ok(key.includes('${chronicle.id}'));
  const id='3a0b1837-96a8-478b-bf6e-1d88030a7132';
  assert.equal(new Set([context,narrator].map(k=>k.replace('${chronicle.id}',id))).size,2);
});
test('narrator export stays permission-gated and neither export is hidden to suppress the warning',()=>{
  assert.match(source,/canManage \? <ChronicleNarratorExport/);
  assert.match(source,/<ChronicleContextExport[^>]*chronicle=\{chronicle\} active=\{active\}/);
  assert.match(source,/<ChronicleNarratorExport[^>]*chronicle=\{chronicle\} active=\{active\}/);
  assert.doesNotMatch(source,/console\.(?:error|warn)\s*=/);
});
