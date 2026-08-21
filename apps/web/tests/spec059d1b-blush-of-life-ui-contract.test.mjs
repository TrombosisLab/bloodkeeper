import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const component =
  fs.readFileSync(
    'src/features/character-sheet/components/PersistedCharacterBlushOfLife.tsx',
    'utf8',
  )

const sheet =
  fs.readFileSync(
    'src/features/character-sheet/components/CharacterSheet.tsx',
    'utf8',
  )

const persisted =
  fs.readFileSync(
    'src/features/character-sheet/components/PersistedCharacterSheet.tsx',
    'utf8',
  )

const api =
  fs.readFileSync(
    'src/features/character-sheet/infrastructure/character-blush-of-life.api.ts',
    'utf8',
  )

const css =
  fs.readFileSync(
    'src/styles/character-sheet.css',
    'utf8',
  )

test(
  '059-D1B usa acción contextual Rubor',
  () => {
    assert.match(
      component,
      /Rubor de la Vida/,
    )
    assert.match(
      api,
      /\/blood\/blush-of-life/,
    )
    assert.doesNotMatch(
      component,
      /reason:\s*'other'/,
    )
  },
)

test(
  '059-D1B Hambre 5 no deshabilita Rubor en React',
  () => {
    const start =
      component.indexOf(
        'className="character-sheet__action-button"',
      )
    const end =
      component.indexOf(
        '</button>',
        start,
      )
    const button =
      component.slice(
        start,
        end,
      )

    assert.ok(start >= 0)
    assert.doesNotMatch(
      button,
      /hunger\s*===\s*5/,
    )
    assert.doesNotMatch(
      button,
      /hunger\s*>=\s*5/,
    )
    assert.match(
      component,
      /Hambre 5:[\s\S]*servidor[\s\S]*Discrasia/,
    )
  },
)

test(
  '059-D1B retry ambiguo conserva operationId y evita doble click',
  () => {
    assert.match(
      component,
      /submittingRef\.current/,
    )
    assert.match(
      component,
      /operationIdRef\.current\s*\?\?/,
    )
    assert.match(
      component,
      /error\.status === 0[\s\S]*error\.status >= 500/,
    )
  },
)

test(
  '059-D1B muestra exención sin dado falso',
  () => {
    assert.match(
      component,
      /Control omitido por Discrasia/,
    )
    assert.match(
      component,
      /rouseExempted/,
    )
  },
)

test(
  '059-D1B Rouse muestra dado ordinario éxito fallo y Hambre',
  () => {
    assert.match(
      component,
      /rouse-check__die/,
    )
    assert.match(
      component,
      /selectedResult/,
    )
    assert.match(
      component,
      /Éxito/,
    )
    assert.match(
      component,
      /Fallo/,
    )
    assert.doesNotMatch(
      component,
      /messy|bestial|critical/i,
    )
  },
)

test(
  '059-D1B Rubor vive junto a acciones de Sangre',
  () => {
    assert.match(
      sheet,
      /blood-quick-actions[\s\S]*PersistedCharacterBlushOfLife[\s\S]*PersistedCharacterRouseCheck[\s\S]*PersistedCharacterFeeding/,
    )
  },
)

test(
  '059-D1B resultado sobrevive al reload canónico',
  () => {
    assert.match(
      persisted,
      /lastBlushOfLifeResult/,
    )
    assert.match(
      persisted,
      /setLastBlushOfLifeResult\(\s*result,\s*\)/,
    )
    assert.match(
      persisted,
      /setReloadVersion\([\s\S]*version\) => version \+ 1/,
    )
    assert.match(
      persisted,
      /lastBlushOfLifeResult=\{\s*lastBlushOfLifeResult\s*\}/,
    )
  },
)

test(
  '059-D1B conflicto ofrece Recargar ficha',
  () => {
    assert.match(
      component,
      /Recargar ficha/,
    )
    assert.match(
      component,
      /onConflictReload/,
    )
  },
)

test(
  '059-D1B mantiene accesibilidad y responsive',
  () => {
    assert.match(
      component,
      /role="status"/,
    )
    assert.match(
      component,
      /aria-live="polite"/,
    )
    assert.match(
      css,
      /\.blush-of-life button:focus-visible/,
    )
    assert.match(
      css,
      /@media \(max-width: 600px\)[\s\S]*\.blush-of-life__heading/,
    )
  },
)

test(
  '059-D1B no adelanta otros contextos 059-D',
  () => {
    for (const forbidden of [
      'bloodSurge',
      'healing',
      'disciplinePower',
      'ritualOrCeremony',
      'awakening',
    ]) {
      assert.doesNotMatch(
        component,
        new RegExp(forbidden),
      )
      assert.doesNotMatch(
        api,
        new RegExp(forbidden),
      )
    }
  },
)
