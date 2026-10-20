import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const css=readFileSync(new URL('../src/styles/tablet-character-shell.css',import.meta.url),'utf8');
test('tablet hides only the redundant identity-side state panel, not the primary controls',()=>{
  assert.match(css,/@media \(min-width: 721px\) and \(max-width: 1180px\)/);
  assert.match(css,/> \.character-sheet__identity-stage > \.character-sheet__state-panel\s*\{\s*display: none !important/);
  assert.doesNotMatch(css,/compact-state-strip\s*\{/);
});
test('compact header and navigation are isolated from mobile and desktop',()=>{
  assert.match(css,/@media \(min-width: 721px\) and \(max-width: 900px\)/);
  assert.match(css,/#app-header-page-actions\s*\{[^}]*grid-area: 2 \/ 1 \/ 3 \/ -1 !important/s);
  assert.match(css,/app-navigation-shell\s*\{[^}]*min-height: 0 !important[^}]*padding: 10px 16px !important/s);
  assert.match(css,/app-navigation\[hidden\]\s*\{ display: none !important/);
  assert.doesNotMatch(css,/(?:transform|touch-action|zoom)\s*:/);
});

test('redundant state heading cannot occupy a sixth tablet grid cell',()=>{
  const tablet=css.slice(css.indexOf('@media'),css.indexOf('/* Compact shell'));
  assert.match(tablet,/> \.character-sheet__compact-state-strip > \.state-section > \.section-title\s*\{\s*display: none !important/);
  assert.doesNotMatch(tablet,/\.(?:state-card|damage-tracker|humanity-track|hunger-track)\s*\{/);
});
