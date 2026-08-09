import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageCatalog,
} from '@v5r/character-rules'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  buildCharacterAdvantageReadModel,
} from '../src/features/character-sheet/domain/character-advantage-read-model.ts'

function buildLoresheetTrait({
  loresheetKey,
  benefitKey,
  rating,
}) {
  const model =
    buildCharacterAdvantageReadModel(
      [
        {
          selectionId:
            'sheet-loresheet-test',
          definitionKey:
            'loresheet-benefit',
          category: 'merit',
          rating,
          origin: 'creation',
          details: {
            kind: 'loresheet',
            loresheetKey,
            benefitKey,
          },
        },
      ],
      characterAdvantageDefinitions,
    )

  assert.equal(
    model.advantages.length,
    1,
  )

  return model.advantages[0]
}

test(
  'SPEC-026.L4 la ficha muestra nombres legibles de Ficha y beneficio',
  () => {
    const loresheet =
      characterAdvantageCatalog.loresheets.find(
        (definition) =>
          definition.key ===
          'descendant-of-helena',
      )

    assert.ok(loresheet)

    const benefit =
      loresheet.benefits[0]

    assert.ok(benefit)

    const trait =
      buildLoresheetTrait({
        loresheetKey:
          loresheet.key,
        benefitKey:
          benefit.key,
        rating:
          benefit.level,
      })

    assert.equal(
      trait.name,
      'Ficha de Conocimientos',
    )

    assert.equal(
      trait.detail,
      `${loresheet.name} · ${benefit.name}`,
    )

    assert.equal(
      trait.detail.includes(
        loresheet.key,
      ),
      false,
    )

    assert.equal(
      trait.detail.includes(
        benefit.key,
      ),
      false,
    )
  },
)

test(
  'SPEC-026.L4 la ficha conserva las claves como fallback histórico si falta catálogo',
  () => {
    const trait =
      buildLoresheetTrait({
        loresheetKey:
          'historical-missing-loresheet',
        benefitKey:
          'historical-missing-benefit',
        rating: 1,
      })

    assert.equal(
      trait.detail,
      'historical-missing-loresheet · historical-missing-benefit',
    )
  },
)

test(
  'SPEC-026.L4 cada beneficio de las 15 Fichas puede resolverse a texto legible',
  () => {
    for (
      const loresheet of
      characterAdvantageCatalog.loresheets
    ) {
      for (
        const benefit of
        loresheet.benefits
      ) {
        const trait =
          buildLoresheetTrait({
            loresheetKey:
              loresheet.key,
            benefitKey:
              benefit.key,
            rating:
              benefit.level,
          })

        assert.equal(
          trait.detail,
          `${loresheet.name} · ${benefit.name}`,
        )
      }
    }
  },
)
