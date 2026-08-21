import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const read = (relative) =>
  readFile(
    new URL(
      relative,
      import.meta.url,
    ),
    'utf8',
  )

const [
  component,
  gateway,
  types,
  sheet,
  persistedSheet,
  css,
] = await Promise.all([
  read(
    '../src/features/character-sheet/components/PersistedCharacterRouseCheck.tsx',
  ),
  read(
    '../src/features/character-sheet/infrastructure/character-rouse-check.api.ts',
  ),
  read(
    '../src/features/character-sheet/types/character-rouse-check-persistence.types.ts',
  ),
  read(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
  ),
  read(
    '../src/features/character-sheet/components/PersistedCharacterSheet.tsx',
  ),
  read(
    '../src/styles/character-sheet.css',
  ),
])

test(
  '059-C sólo expone el Control manual genérico',
  () => {
    assert.match(
      component,
      /Control de Enardecimiento/,
    )
    assert.match(
      component,
      /reason:\s*'other'/,
    )

    for (const deferred of [
      'bloodSurge',
      'blushOfLife',
      'disciplinePower',
      'ritualOrCeremony',
      "'awakening'",
      "'healing'",
    ]) {
      assert.doesNotMatch(
        component,
        new RegExp(deferred),
      )
    }

    assert.match(
      types,
      /readonly reason:\s*'other'/,
    )
  },
)

test(
  '059-C bloquea Hambre 5 en UI',
  () => {
    assert.match(
      component,
      /hungerMaximum[\s\S]*hunger >= 5/,
    )
    assert.match(
      component,
      /disabled=\{[\s\S]*hungerMaximum/,
    )
    assert.match(
      component,
      /No disponible con Hambre 5/,
    )
    assert.match(
      component,
      /puedes iniciar voluntariamente/i,
    )
  },
)

test(
  '059-C protege doble clic y conserva operationId en retry',
  () => {
    assert.match(
      component,
      /submittingRef[\s\S]*useRef\(false\)/,
    )
    assert.match(
      component,
      /submittingRef\.current/,
    )
    assert.match(
      component,
      /operationIdRef[\s\S]*useRef<string \| null>/,
    )
    assert.match(
      component,
      /operationIdRef\.current \?\?[\s\S]*createCharacterRouseCheckOperationId/,
    )
    assert.match(
      component,
      /nextSubmission !== 'retryable'[\s\S]*operationIdRef\.current = null/,
    )
    assert.match(
      component,
      /Reintentar Control/,
    )
  },
)

test(
  '059-C UUID conserva randomUUID y fallback getRandomValues',
  () => {
    assert.match(
      gateway,
      /cryptoApi\.randomUUID/,
    )
    assert.match(
      gateway,
      /cryptoApi\.getRandomValues/,
    )
    assert.match(
      gateway,
      /bytes\[6\][\s\S]*0x40/,
    )
    assert.match(
      gateway,
      /bytes\[8\][\s\S]*0x80/,
    )
  },
)

test(
  '059-C muestra respuesta backend sin resolver reglas en React',
  () => {
    assert.match(
      component,
      /result\.rolls\.map/,
    )
    assert.match(
      component,
      /result\.success/,
    )
    assert.match(
      component,
      /result\.hungerBefore/,
    )
    assert.match(
      component,
      /result\.hungerAfter/,
    )
    assert.doesNotMatch(
      component,
      /Math\.random|Math\.max|hungerAfter\s*=|selectedResult\s*=/,
    )
  },
)

test(
  '059-C coloca Rouse junto a Alimentación en Sangre',
  () => {
    assert.match(
      sheet,
      /<CharacterBloodExperience[\s\S]*className="blood-quick-actions"[\s\S]*<PersistedCharacterRouseCheck[\s\S]*<PersistedCharacterFeeding/,
    )
    assert.match(
      sheet,
      /model\.blood !== null/,
    )
    assert.match(
      sheet,
      /model\.state\.hunger !== null/,
    )
    assert.match(
      sheet,
      /model\.status !== 'archived'/,
    )
  },
)

test(
  '059-C conserva resultado y recarga snapshot canónico',
  () => {
    assert.match(
      persistedSheet,
      /lastRouseCheckResult/,
    )
    assert.match(
      persistedSheet,
      /setLastRouseCheckResult\([\s\S]*result/,
    )
    assert.match(
      persistedSheet,
      /onRouseCheckApplied=/,
    )
    assert.match(
      persistedSheet,
      /setReloadVersion\([\s\S]*version \+ 1/,
    )
    assert.match(
      persistedSheet,
      /lastRouseCheckResult=\{/,
    )
  },
)

test(
  '059-C ofrece recarga explícita ante conflicto',
  () => {
    assert.match(
      component,
      /submission === 'conflict'/,
    )
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
  '059-C es accesible y responsive',
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
      component,
      /aria-label="Dados del último Control de Enardecimiento"/,
    )
    assert.match(
      css,
      /\.rouse-check__die/,
    )
    assert.match(
      css,
      /\.rouse-check__action:focus-visible/,
    )
    assert.match(
      css,
      /@media \(max-width: 600px\)[\s\S]*\.rouse-check__action/,
    )
  },
)
