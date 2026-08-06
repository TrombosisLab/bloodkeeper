import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const designSystem = await readFile(
  new URL('../src/styles/design-system.css', import.meta.url),
  'utf8',
)
const sheetStyles = await readFile(
  new URL('../src/styles/character-sheet.css', import.meta.url),
  'utf8',
)

const secondaryMarker = [
  '/* ==================================================',
  '   002-J — ESPECIALIDADES Y SECCIONES SECUNDARIAS',
].join('\n')

const secondaryStart = sheetStyles.indexOf(
  secondaryMarker,
)

assert.notEqual(secondaryStart, -1)

const beforeSecondary = sheetStyles.slice(
  0,
  secondaryStart,
)
const secondaryBlock = sheetStyles.slice(
  secondaryStart,
)

test('SPEC-010 limita la adopción de ficha al bloque 002-J Especialidades y Secciones Secundarias', () => {
  const prefixHash = createHash('sha256')
    .update(beforeSecondary)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(secondaryBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    'c69fcf049fbee67a87ea3fb7f8797f7077027de95e190b05fbc088deacba0b7d',
  )
  assert.equal(
    blockHash,
    'f486827812ad1ef9fa906890ffe68293b82550d004e7f44d6bfec081eeb376d2',
  )
  assert.equal(
    sheetStyles.endsWith(secondaryBlock),
    true,
  )
})

test('SPEC-010 elimina colores y tipografía literal de ficha 002-J', () => {
  assert.doesNotMatch(
    secondaryBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    secondaryBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    secondaryBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-J', () => {
  for (const token of [
    "var(--color-accent-muted)",
    "var(--color-action-danger-muted)",
    "var(--color-control-border-hover)",
    "var(--color-control-border-muted-muted)",
    "var(--color-control-border-subtle)",
    "var(--color-group-border)",
    "var(--color-group-tint-faint-soft)",
    "var(--color-input-border)",
    "var(--color-input-surface)",
    "var(--color-marker-border-soft)",
    "var(--color-notice-border)",
    "var(--color-notice-surface)",
    "var(--color-panel-border-subtle)",
    "var(--color-panel-surface-subtle)",
    "var(--color-row-divider)",
    "var(--color-section-border)",
    "var(--color-section-tint-faint-soft)",
    "var(--color-status-error-muted)",
    "var(--color-status-ready)",
    "var(--color-status-success-muted)",
    "var(--color-surface)",
    "var(--color-surface-option)",
    "var(--color-surface-raised)",
    "var(--color-text-action-muted)",
    "var(--color-text-content-soft-soft)",
    "var(--color-text-control-hover)",
    "var(--color-text-control-muted-soft)",
    "var(--color-text-description-muted)",
    "var(--color-text-detail-muted-muted)",
    "var(--color-text-field-label)",
    "var(--color-text-heading-muted-soft)",
    "var(--color-text-label-muted-soft)",
    "var(--color-text-metadata-muted)",
    "var(--color-text-note-muted)",
    "var(--color-text-notice-muted)",
    "var(--color-text-relation-muted)",
    "var(--color-text-secondary)",
    "var(--color-text-support-muted)",
    "var(--color-text-title-soft)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      secondaryBlock.includes(token),
      true,
      `Falta ${token} en 002-J`,
    )
  }

  assert.equal(
    secondaryBlock.match(
      /font-family:\s*var\(--font-family-[^)]+\)/g,
    )?.length,
    3,
    '002-J debe usar tres declaraciones tipográficas oficiales',
  )
})

test('SPEC-010 conserva especialidades secundarios ciclo de vida validación y responsive de ficha 002-J', () => {
  const normalizedBlock =
    secondaryBlock.replace(/\s+/g, ' ')

  for (const selector of [
    ".history-entry",
    ".history-entry p",
    ".history-entry strong",
    ".history-entry:last-child",
    ".history-list",
    ".inventory-item",
    ".inventory-item span",
    ".inventory-item strong",
    ".inventory-item:last-child",
    ".inventory-list",
    ".lifecycle-section__actions",
    ".lifecycle-section__actions button",
    ".lifecycle-section__confirmation",
    ".lifecycle-section__confirmation span",
    ".lifecycle-section__content",
    ".lifecycle-section__content p",
    ".lifecycle-section__revision",
    ".notes-list",
    ".notes-list .secondary-item-actions",
    ".notes-list li",
    ".notes-list li::before",
    ".notes-list li:last-child",
    ".secondary-edit-notice",
    ".secondary-edit-notice button",
    ".secondary-editor",
    ".secondary-editor button",
    ".secondary-editor button:focus-visible",
    ".secondary-editor button:hover",
    ".secondary-editor input",
    ".secondary-editor input:focus-visible",
    ".secondary-editor label",
    ".secondary-editor textarea",
    ".secondary-editor textarea:focus-visible",
    ".secondary-editor--single",
    ".secondary-editor__actions",
    ".secondary-editor__actions button",
    ".secondary-editor__wide",
    ".secondary-empty",
    ".secondary-grid",
    ".secondary-item-actions",
    ".secondary-item-actions button",
    ".secondary-item-actions button:focus-visible",
    ".secondary-item-actions button:hover",
    ".secondary-panel",
    ".secondary-panel > .secondary-empty",
    ".secondary-panel > header",
    ".secondary-panel > header h3",
    ".secondary-panel > header span",
    ".secondary-section",
    ".secondary-section[aria-busy='true']",
    ".secondary-section__actions",
    ".secondary-section__actions button",
    ".secondary-section__actions button:focus-visible",
    ".secondary-section__actions button:hover",
    ".skill-row__identity",
    ".skill-row__specialties",
    ".validation-section",
    ".validation-section__item",
    ".validation-section__item > div",
    ".validation-section__item span",
    ".validation-section__item strong",
    ".validation-section__item ul",
    ".validation-section__item--complete span",
    ".validation-section__item--invalid span",
    ".validation-section__item--pending span",
    ".validation-section__list",
    ".validation-section__result--blocked",
    ".validation-section__result--ready",
    ".validation-section__summary",
    ".validation-section__summary button",
    ".validation-section__summary p"
]) {
    assert.equal(
      normalizedBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    secondaryBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.equal(
    secondaryBlock.match(/linear-gradient\(/g)?.length,
    1,
    'Debe conservarse el gradiente de la sección secundaria',
  )
  for (const minHeight of ['82px', '34px', '38px', '66px', '55px']) {
    assert.equal(
      secondaryBlock.includes(`min-height: ${minHeight}`),
      true,
      `Falta min-height ${minHeight}`,
    )
  }
  assert.match(
    secondaryBlock,
    /border-radius:\s*999px/,
  )
  assert.match(
    secondaryBlock,
    /border:\s*1px solid currentColor/,
  )
  assert.match(
    secondaryBlock,
    /background:\s*transparent/,
  )
  assert.equal(
    secondaryBlock.match(/!important/g)?.length,
    4,
    'Deben conservarse los cuatro usos de !important auditados',
  )
})

test('SPEC-010 añade a ficha 002-J solo tokens reutilizables', () => {
  const newTokens = [
    "--color-accent-muted",
    "--color-action-danger-muted",
    "--color-control-border-hover",
    "--color-control-border-muted-muted",
    "--color-control-border-subtle",
    "--color-group-tint-faint-soft",
    "--color-input-border",
    "--color-input-surface",
    "--color-marker-border-soft",
    "--color-notice-border",
    "--color-notice-surface",
    "--color-panel-border-subtle",
    "--color-panel-surface-subtle",
    "--color-section-tint-faint-soft",
    "--color-status-error-muted",
    "--color-status-ready",
    "--color-status-success-muted",
    "--color-text-action-muted",
    "--color-text-content-soft-soft",
    "--color-text-control-hover",
    "--color-text-control-muted-soft",
    "--color-text-detail-muted-muted",
    "--color-text-field-label",
    "--color-text-notice-muted"
]

  for (const token of newTokens) {
    assert.equal(
      designSystem.includes(`${token}:`),
      true,
      `Falta ${token}`,
    )
    assert.doesNotMatch(
      token,
      /(?:specialt|secondary|inventory|note|history|lifecycle|validation)/i,
    )
  }
})
