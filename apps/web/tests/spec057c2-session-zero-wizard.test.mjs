import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  getCreationSteps,
} from '../src/features/character-creation/data/creation-steps.ts'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  isHumanAdvantageDefinitionAllowed,
  prepareDraftForCreationMode,
} from '../src/features/character-creation/domain/session-zero-creation-rules.ts'

import {
  buildStepValidationMap,
  validateIdentityStep,
} from '../src/features/character-creation/domain/step-validation.ts'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

test(
  '057-C2 deriva exactamente seis pasos humanos sin duplicar el wizard',
  () => {
    assert.deepEqual(
      getCreationSteps('sessionZero').map(
        step => step.id,
      ),
      [
        'identity',
        'attributes',
        'skills',
        'advantages',
        'humanity',
        'review',
      ],
    )

    assert.deepEqual(
      getCreationSteps('sessionZero').map(
        step => step.number,
      ),
      [1, 2, 3, 4, 5, 6],
    )

    assert.equal(
      getCreationSteps('standard').length,
      8,
    )
  },
)

test(
  '057-C2 identidad humana no exige Clan Generación ni Depredador',
  () => {
    const draft = structuredClone(
      initialCharacterDraft,
    )
    draft.identity.name = 'Mortal'
    draft.identity.concept = 'Periodista'

    assert.equal(
      validateIdentityStep(
        draft,
        'sessionZero',
      ).valid,
      true,
    )

    assert.equal(
      validateIdentityStep(
        draft,
        'standard',
      ).valid,
      false,
    )
  },
)

test(
  '057-C2 prepara Sesión 0 sin decisiones vampíricas locales',
  () => {
    const draft = structuredClone(
      initialCharacterDraft,
    )
    draft.identity.clan = 'brujah'
    draft.identity.generation = 13
    draft.identity.predatorType = 'sandman'
    draft.identity.sire = 'Sire'
    draft.disciplines = [
      {
        key: 'potence',
        value: 1,
        powerKeys: [],
        origin: 'creation',
      },
    ]

    const prepared =
      prepareDraftForCreationMode(
        draft,
        'sessionZero',
      )

    assert.equal(prepared.identity.clan, null)
    assert.equal(
      prepared.identity.generation,
      null,
    )
    assert.equal(
      prepared.identity.predatorType,
      '',
    )
    assert.equal(prepared.identity.sire, '')
    assert.deepEqual(prepared.disciplines, [])
    assert.deepEqual(
      prepared.predatorTypeChoices,
      {},
    )
  },
)

test(
  '057-C2 Sangre y Disciplinas no bloquean navegación humana',
  () => {
    const draft = structuredClone(
      initialCharacterDraft,
    )
    const validations =
      buildStepValidationMap(
        draft,
        'sessionZero',
      )

    assert.equal(
      validations.blood.valid,
      true,
    )
    assert.equal(
      validations.disciplines.valid,
      true,
    )
  },
)

test(
  '057-C2 usa la política canónica mortal y conserva Refugio',
  () => {
    const status =
      getCharacterAdvantageDefinition(
        'status',
      )
    const haven =
      getCharacterAdvantageDefinition(
        'haven',
      )

    assert.ok(status)
    assert.ok(haven)
    assert.equal(
      isHumanAdvantageDefinitionAllowed(
        status,
      ),
      false,
    )
    assert.equal(
      isHumanAdvantageDefinitionAllowed(
        haven,
      ),
      true,
    )
  },
)

const wizard = await readFile(
  new URL(
    '../src/features/character-creation/components/CharacterCreationWizard.tsx',
    import.meta.url,
  ),
  'utf8',
)

const selector = await readFile(
  new URL(
    '../src/features/character-creation/components/CharacterCreationModeSelector.tsx',
    import.meta.url,
  ),
  'utf8',
)

const identity = await readFile(
  new URL(
    '../src/features/character-creation/components/IdentityStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const advantages = await readFile(
  new URL(
    '../src/features/character-creation/components/AdvantagesStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const review = await readFile(
  new URL(
    '../src/features/character-creation/components/ReviewStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const characterList = await readFile(
  new URL(
    '../src/features/character-list/components/CharacterList.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/styles/character-creation.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  '057-C2 exige selección explícita antes del wizard',
  () => {
    assert.match(
      wizard,
      /creationMode === null[\s\S]*?<CharacterCreationModeSelector/,
    )
    assert.match(
      selector,
      /Creación vampírica estándar/,
    )
    assert.match(
      selector,
      /Comenzar como humano/,
    )
    assert.match(
      selector,
      /onSelect\('standard'\)/,
    )
    assert.match(
      selector,
      /onSelect\('sessionZero'\)/,
    )
  },
)

test(
  '057-C2 persiste el modo y reutiliza navegación componentes y revisión',
  () => {
    assert.match(
      wizard,
      /getCreationSteps\([\s\S]*?creationMode/,
    )
    assert.match(
      wizard,
      /persistCharacterDraftEditorState\([\s\S]*?creationMode/,
    )
    assert.match(
      wizard,
      /<IdentityStep[\s\S]*?creationMode=\{creationMode\}/,
    )
    assert.match(
      wizard,
      /<AdvantagesStep[\s\S]*?creationMode=\{creationMode\}/,
    )
    assert.match(
      wizard,
      /<ReviewStep[\s\S]*?creationMode=\{creationMode\}/,
    )
  },
)

test(
  '057-C2 oculta campos y catálogos vampíricos al humano',
  () => {
    assert.match(identity, /!sessionZero/)
    assert.match(
      advantages,
      /isHumanAdvantageDefinitionAllowed/,
    )
    assert.match(
      advantages,
      /!sessionZero[\s\S]*?<LoresheetSelector/,
    )
    assert.match(
      review,
      /value="Humano"/,
    )
    assert.match(
      review,
      /!sessionZero[\s\S]*?<span>Disciplinas<\/span>/,
    )
  },
)

test(
  '057-C2 listado distingue Humano transición y establecido',
  () => {
    assert.match(characterList, /return 'Humano'/)
    assert.match(
      characterList,
      /return 'Vampiro en transición'/,
    )
    assert.match(
      characterList,
      /return 'Vampiro establecido'/,
    )
  },
)

test(
  '057-C2 selector mantiene contrato responsive sin overflow horizontal propio',
  () => {
    const marker =
      'SPEC-057-C2 — selector de modo y Sesión 0'
    const start = styles.indexOf(marker)
    assert.notEqual(start, -1)
    const block = styles.slice(start)

    assert.match(
      block,
      /min-width:\s*0/,
    )
    assert.match(
      block,
      /@media \(max-width: 760px\)/,
    )
    assert.match(
      block,
      /grid-template-columns:\s*1fr/,
    )
    assert.doesNotMatch(
      block,
      /#[0-9a-f]{3,8}/i,
    )
  },
)
