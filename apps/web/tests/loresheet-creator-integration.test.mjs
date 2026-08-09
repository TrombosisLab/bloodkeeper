import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageRegulatoryState,
} from '../src/features/character-creation/domain/character-advantage-regulatory-rules.ts'

function createDraft({
  clan = 'toreador',
  selections = [],
} = {}) {
  return {
    identity: {
      clan,
      generation: 13,
      ageCategory: 'neonate',
      predatorType: '',
    },
    advantages: {
      selections,
    },
    humanity: {
      value: 7,
    },
  }
}

function loresheetSelection({
  selectionId = 'lore-1',
  loresheetKey = 'descendant-of-helena',
  benefitKey = 'helena-skin-deep',
  rating = 1,
} = {}) {
  return {
    selectionId,
    definitionKey: 'loresheet-benefit',
    category: 'merit',
    rating,
    origin: 'creation',
    details: {
      kind: 'loresheet',
      loresheetKey,
      benefitKey,
    },
  }
}

test(
  'SPEC-026.L2 publica una única definición contenedora para beneficios de Loresheet',
  () => {
    const definitions =
      characterAdvantageDefinitions.filter(
        (definition) =>
          definition.instanceDetailsKind ===
          'loresheet',
      )

    assert.equal(
      definitions.length,
      1,
    )

    assert.deepEqual(
      definitions[0],
      {
        key: 'loresheet-benefit',
        name: 'Ficha de Conocimientos',
        category: 'merit',
        allowedRatings: [1, 2, 3, 4, 5],
        source: 'core',
        allowMultiple: true,
        requiresInstanceDetails: true,
        instanceDetailsKind: 'loresheet',
        active: true,
      },
    )
  },
)

test(
  'SPEC-026.L2 la validación regulatoria acepta un beneficio válido y elegible',
  () => {
    const result =
      validateCharacterAdvantageRegulatoryState(
        createDraft({
          clan: 'toreador',
          selections: [
            loresheetSelection(),
          ],
        }),
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'SPEC-026.L2 la validación regulatoria rechaza una Loresheet no elegible por Clan',
  () => {
    const result =
      validateCharacterAdvantageRegulatoryState(
        createDraft({
          clan: 'toreador',
          selections: [
            loresheetSelection({
              loresheetKey:
                'descendant-of-hardestadt',
              benefitKey:
                'hardestadt-voice',
            }),
          ],
        }),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'requiere un clan permitido',
          ),
      ),
    )
  },
)

test(
  'SPEC-026.L2 la validación regulatoria rechaza rating distinto del nivel del beneficio',
  () => {
    const result =
      validateCharacterAdvantageRegulatoryState(
        createDraft({
          selections: [
            loresheetSelection({
              rating: 2,
            }),
          ],
        }),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'debe coincidir con el nivel 1',
          ),
      ),
    )
  },
)

test(
  'SPEC-026.L2 la validación regulatoria rechaza beneficios de dos Loresheets distintas',
  () => {
    const result =
      validateCharacterAdvantageRegulatoryState(
        createDraft({
          clan: 'toreador',
          selections: [
            loresheetSelection(),
            loresheetSelection({
              selectionId: 'lore-2',
              loresheetKey: 'bahari',
              benefitKey:
                'bahari-dangerous-reputation',
            }),
          ],
        }),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'una única Ficha de Conocimientos',
          ),
      ),
    )
  },
)

test(
  'SPEC-026.L2 AdvantagesStep usa el selector específico y oculta el contenedor del catálogo genérico',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/components/AdvantagesStep.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /<LoresheetSelector/,
    )

    assert.match(
      source,
      /definition\.instanceDetailsKind\s*!==\s*[\n\s]*'loresheet'/,
    )
  },
)

test(
  'SPEC-026.L2 el selector crea selecciones tipadas y fija rating al nivel del beneficio',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/components/advantages/LoresheetSelector.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /characterCoreLoresheetDefinitions/,
    )

    assert.match(
      source,
      /validateCharacterLoresheetEligibility/,
    )

    assert.match(
      source,
      /definitionKey:[\s\S]*activeLoresheetDefinition\.key/,
    )

    assert.match(
      source,
      /rating:[\s\S]*benefit\.level/,
    )

    assert.match(
      source,
      /kind:\s*'loresheet'/,
    )

    assert.match(
      source,
      /loresheetKey:[\s\S]*loresheet\.key/,
    )

    assert.match(
      source,
      /benefitKey:[\s\S]*benefit\.key/,
    )
  },
)
