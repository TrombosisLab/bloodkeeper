import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  advancementKindVisibleForProfile,
} from '../src/features/character-sheet/components/PersistedCharacterExperience.tsx'

const readSource = (path) =>
  readFile(
    new URL(path, import.meta.url),
    'utf8',
  )

const sheet = await readSource(
  '../src/features/character-sheet/components/CharacterSheet.tsx',
)

const identity = await readSource(
  '../src/features/character-sheet/components/CharacterIdentity.tsx',
)

const state = await readSource(
  '../src/features/character-sheet/components/CharacterState.tsx',
)

const experience = await readSource(
  '../src/features/character-sheet/components/PersistedCharacterExperience.tsx',
)

const headerCss = await readSource(
  '../src/styles/base-and-sheet-header.css',
)

const sheetCss = await readSource(
  '../src/styles/character-sheet.css',
)

test(
  '057-F2A2B2B humano oculta identidad vampírica',
  () => {
    assert.match(
      identity,
      /const human =[\s\S]*profilePhase === 'HUMAN'/,
    )

    assert.match(
      identity,
      /!human \? \([\s\S]*label="Depredador"/,
    )

    assert.match(
      identity,
      /!human \? \([\s\S]*label="Clan"[\s\S]*label="Generación"[\s\S]*label="Sire"/,
    )
  },
)

test(
  '057-F2A2B2B no sustituye Hambre humana por demo',
  () => {
    assert.match(
      sheet,
      /model === undefined[\s\S]*demoState\.hunger[\s\S]*model\.state\.hunger/,
    )

    assert.match(
      state,
      /!human && hunger !== null/,
    )
  },
)

test(
  '057-F2A2B2B transición expone pendientes sin ceros ficticios',
  () => {
    assert.match(
      sheet,
      /Vampiro en transición/,
    )

    assert.match(
      state,
      /pendingBloodState/,
    )

    assert.match(
      state,
      /Hambre pendiente/,
    )

    assert.match(
      state,
      /Potencia de Sangre[\s\S]*pendiente/,
    )

    assert.doesNotMatch(
      state,
      /hunger \?\? 0|bloodPotency \?\? 0/,
    )
  },
)

test(
  '057-F2A2B2B humano oculta Disciplinas',
  () => {
    assert.match(
      sheet,
      /showDisciplines/,
    )

    assert.match(
      sheet,
      /model\.profilePhase ===[\s\S]*'ESTABLISHED_VAMPIRE'/,
    )

    assert.match(
      sheet,
      /model\.profilePhase ===[\s\S]*'TRANSITIONAL_VAMPIRE'[\s\S]*model\.disciplines\.length > 0/,
    )
  },
)

test(
  '057-F2A2B2B experiencia humana oculta sólo familias vampíricas',
  () => {
    for (
      const kind of [
        'discipline',
        'ritual',
        'formula',
        'ceremony',
        'bloodPotency',
      ]
    ) {
      assert.equal(
        advancementKindVisibleForProfile(
          'HUMAN',
          kind,
        ),
        false,
      )
    }

    for (
      const kind of [
        'attribute',
        'skill',
        'specialty',
        'advantage',
      ]
    ) {
      assert.equal(
        advancementKindVisibleForProfile(
          'HUMAN',
          kind,
        ),
        true,
      )
    }

    assert.equal(
      advancementKindVisibleForProfile(
        'TRANSITIONAL_VAMPIRE',
        'discipline',
      ),
      true,
    )

    assert.equal(
      advancementKindVisibleForProfile(
        'ESTABLISHED_VAMPIRE',
        'bloodPotency',
      ),
      true,
    )
  },
)

test(
  '057-F2A2B2B conserva opciones completas para vampiro establecido',
  () => {
    assert.match(
      experience,
      /visibleKindEntries/,
    )

    assert.match(
      experience,
      /profilePhase === 'HUMAN'/,
    )

    assert.match(
      sheet,
      /profilePhase=\{[\s\S]*model\.profilePhase/,
    )
  },
)

test(
  '057-F2A2B2B mantiene adaptación móvil y foco existente',
  () => {
    assert.match(
      headerCss,
      /identity-section\[data-profile-phase="HUMAN"\]/,
    )

    assert.match(
      headerCss,
      /@media \(max-width: 600px\)/,
    )

    assert.match(
      sheetCss,
      /state-grid--human/,
    )

    assert.match(
      sheetCss,
      /@media \(max-width: 900px\)[\s\S]*\.state-grid/,
    )

    assert.match(
      headerCss,
      /sheet-header__state-edit:focus-visible/,
    )
  },
)
