import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const css = readFileSync(new URL('../src/styles/tablet-workspaces.css', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

test('tablet stylesheet is loaded and all rules stay between mobile and desktop', () => {
  assert.match(main, /import '\.\/styles\/tablet-workspaces\.css'/);
  assert.equal((css.match(/@media/g) || []).length, 1);
  assert.match(css, /@media \(min-width: 721px\) and \(max-width: 1180px\)/);
  let depth = 0;
  for (const ch of css.slice(css.indexOf('@media'))) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    assert.ok(depth >= 0);
  }
  assert.equal(depth, 0);
  assert.ok(css.trimEnd().endsWith('}'));
});

test('sessions, events, guide and library no longer force three narrow columns', () => {
  for (const selector of ['chronicle-session-panel__workspace-layout', 'chronicle-event-panel__workspace', 'story-workspace--guide', 'resource-preview']) {
    assert.match(css, new RegExp(selector + '[^{]*\\{[^}]*grid-template-columns: minmax\\(0, 1fr\\)', 's'));
  }
  assert.match(css, /play-hub__card[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /resource-category-rail button span[^}]*overflow-wrap: anywhere/);
});

test('account is in document flow; character portrait is bounded and fields reflow', () => {
  assert.match(css, /authentication-session\s*\{[^}]*position: static !important/);
  assert.match(css, /character-portrait\s*\{[^}]*height: 300px !important/);
  assert.match(css, /identity-grid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /chronicle-backdrop__surface[^}]*min-height: 360px/);
});

test('layout adaptation never changes graph geometry, input gestures or hides content', () => {
  assert.doesNotMatch(css, /(?:transform|touch-action|pointer-events|zoom)\s*:/);
  assert.doesNotMatch(css, /display:\s*none/);
  assert.doesNotMatch(css, /\.(?:chronicle-map-marker|chronicle-map-area|chronicle-map-canvas__content|story-guide-card|board-card)\b/);
});

test('character overrides target the actual header tree and clear legacy five-column placements', () => {
  assert.match(css, /body \.character-sheet\.character-sheet--dashboard\s*\{[^}]*176px minmax\(0, 1fr\)/);
  assert.match(css, /identity-header-main > \.identity-grid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)[^}]*height: auto !important/s);
  assert.match(css, /:nth-child\(n\)[^{]*\{[^}]*grid-area: auto !important/s);
  assert.doesNotMatch(css, /identity-section__portrait-layout/);
});

test('map header puts brand, context and portal actions on three separate rows', () => {
  assert.match(css, /app-header:has\(\.chronicle-map-global-actions\)\s*\{[^}]*display: grid !important[^}]*grid-template-rows: auto auto auto !important/s);
  assert.match(css, /app-header__page-context\s*\{[^}]*grid-area: 2 \/ 1 \/ 3 \/ -1 !important/s);
  assert.match(css, /#app-header-page-actions\s*\{[^}]*grid-area: 3 \/ 1 \/ 4 \/ -1 !important/s);
});

test('clan and character name use separate grid cells rather than absolute overlays', () => {
  assert.match(css, /identity-heading > \.identity-heading__name\s*\{[^}]*grid-column: 2 !important[^}]*padding: 0 !important/s);
  assert.match(css, /identity-heading > \.clan-mark\s*\{[^}]*position: static !important[^}]*grid-area: 1 \/ 1 !important/s);
  assert.match(css, /clan-mark :is\(svg, \.v5-visual-mark, span, strong\)\s*\{[^}]*position: static !important/s);
});

test('state strip wraps into bounded cards in both tablet orientations and editing mode', () => {
  assert.match(css, /compact-state-strip\s*\{[^}]*repeat\(auto-fit, minmax\(190px, 1fr\)\)/s);
  assert.match(css, /compact-state-strip > \.character-trackers[^}]*display: contents !important/s);
  assert.match(css, /:is\(\.damage-tracker, \.state-card\)\s*\{[^}]*grid-area: auto !important[^}]*min-height: 96px !important/s);
});

test('tablet state strip removes the legacy 82px cap and reserves height for additional rows', () => {
  assert.match(css, /compact-state-strip\s*\{[^}]*grid-auto-rows: minmax\(96px, auto\) !important[^}]*height: auto !important[^}]*max-height: none !important/s);
});

test('humanity uses ten shrinkable columns and rotated hunger drops have spacing and padding', () => {
  assert.match(css, /\.humanity-track\s*\{[^}]*repeat\(10, minmax\(0, 1fr\)\)/s);
  assert.match(css, /\.humanity-box\s*\{[^}]*min-width: 0 !important/s);
  assert.match(css, /\.hunger-track\s*\{[^}]*gap: 10px !important[^}]*padding: 7px !important/s);
  // Ten humanity slots: no legacy 20px minimum overflowing a 172px content area.
  for (const width of [172, 215, 246]) assert.ok((width - 9 * 2) / 10 > 12);
  // Bounding width of each rotated 12x15 drop is (12+15)/sqrt(2).
  const extent = 27 / Math.sqrt(2);
  assert.ok(extent < 12 + 10);
  assert.ok((extent - 12) / 2 < 7);
});
