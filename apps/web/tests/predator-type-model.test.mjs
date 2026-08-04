import test from 'node:test';
import assert from 'node:assert/strict';

import {
    predatorTypeExists,
    clanAllowed,
    resolvePredatorChoices,
    predatorPendingReferences
}
from '../src/features/character-creation/domain/predator-type-rules.ts';

test('bagger exists',()=>{

    assert.equal(
        predatorTypeExists('bagger'),
        true
    );

});

test('bagger excludes ventrue',()=>{

    assert.equal(
        clanAllowed('bagger','ventrue'),
        false
    );

    assert.equal(
        clanAllowed('bagger','brujah'),
        true
    );

});

test('bagger tremere receives blood sorcery',()=>{

    const result =
        resolvePredatorChoices(
            'bagger',
            { clan:'tremere' }
        );

    assert.equal(
        result[1].disciplineKey,
        'bloodSorcery'
    );

});

test('bagger non tremere receives obfuscate',()=>{

    const result =
        resolvePredatorChoices(
            'bagger',
            { clan:'brujah' }
        );

    assert.equal(
        result[1].disciplineKey,
        'obfuscate'
    );

});

test('029-T resuelve las referencias pendientes de Bolsero',()=>{

    assert.deepEqual(
        predatorPendingReferences('bagger'),
        []
    );

});

import {
  test as predatorNormalizationTest,
} from 'node:test'

import {
  strict as predatorNormalizationAssert,
} from 'node:assert'

import {
  normalizePredatorTypeForCharacter,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

predatorNormalizationTest(
  '003-J.3A normaliza Predator Type dentro de CharacterDraft',
  () => {
    predatorNormalizationAssert.equal(
      normalizePredatorTypeForCharacter(
        'bagger',
        'tremere',
      ),
      'bagger',
    )

    predatorNormalizationAssert.equal(
      normalizePredatorTypeForCharacter(
        'bagger',
        'ventrue',
      ),
      '',
    )

    predatorNormalizationAssert.equal(
      normalizePredatorTypeForCharacter(
        'unknown-predator-type',
        'tremere',
      ),
      '',
    )

    predatorNormalizationAssert.equal(
      normalizePredatorTypeForCharacter(
        'bagger',
        null,
      ),
      '',
    )

    predatorNormalizationAssert.equal(
      normalizePredatorTypeForCharacter(
        '',
        'tremere',
      ),
      '',
    )
  },
)

test(
  '003-J.4A elimina únicamente efectos con origen predatorType',
  async () => {
    const {
      removePredatorTypeEffects,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result = removePredatorTypeEffects({
      advantages: {
        selections: [
          {
            selectionId: 'creation-merit',
            definitionKey: 'creation-merit',
            category: 'merit',
            rating: 1,
            origin: 'creation',
          },
          {
            selectionId: 'predator-merit',
            definitionKey: 'iron-stomach',
            category: 'merit',
            rating: 3,
            origin: 'predatorType',
          },
          {
            selectionId: 'thin-blood-merit',
            definitionKey: 'thin-blood-merit',
            category: 'merit',
            rating: 1,
            origin: 'thinBlood',
          },
        ],
      },

      disciplines: [
        {
          key: 'auspex',
          value: 2,
          powerKeys: [],
          origin: 'creation',
        },
        {
          key: 'bloodSorcery',
          value: 1,
          powerKeys: [],
          origin: 'predatorType',
        },
      ],

      skillSpecialties: [
        {
          id: 'creation-specialty',
          skillKey: 'occult',
          name: 'Vampiros',
          origin: 'creation',
        },
        {
          id: 'predator-specialty',
          skillKey: 'larceny',
          name: 'Forzar Cerraduras',
          origin: 'predatorType',
        },
      ],
    })

    assert.deepEqual(
      result.advantages.selections.map(
        selection => selection.selectionId,
      ),
      [
        'creation-merit',
        'thin-blood-merit',
      ],
    )

    assert.deepEqual(
      result.disciplines.map(
        discipline => discipline.key,
      ),
      [
        'auspex',
      ],
    )

    assert.deepEqual(
      result.skillSpecialties.map(
        specialty => specialty.id,
      ),
      [
        'creation-specialty',
      ],
    )
  },
)

test(
  '003-J.4B aplica los efectos resueltos del Predator Type',
  async () => {
    const {
      applyPredatorTypeEffects,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      applyPredatorTypeEffects({
        predatorTypeKey:
          'bagger',

        clanKey:
          'tremere',

        choiceSelections: {
          'bagger-specialty': 1,
          'bagger-discipline': 0,
        },

        advantages: {
          selections: [
            {
              selectionId:
                'creation-advantage',

              definitionKey:
                'creation-advantage',

              category:
                'merit',

              rating:
                1,

              origin:
                'creation',
            },

            {
              selectionId:
                'old-predator-advantage',

              definitionKey:
                'old-predator-advantage',

              category:
                'merit',

              rating:
                1,

              origin:
                'predatorType',
            },
          ],
        },

        disciplines: [
          {
            key:
              'auspex',

            value:
              2,

            powerKeys:
              [],

            origin:
              'creation',
          },

          {
            key:
              'obfuscate',

            value:
              1,

            powerKeys:
              [],

            origin:
              'predatorType',
          },
        ],

        skillSpecialties: [
          {
            id:
              'creation-specialty',

            skillKey:
              'occult',

            name:
              'Vampiros',

            origin:
              'creation',
          },

          {
            id:
              'old-predator-specialty',

            skillKey:
              'larceny',

            name:
              'Antigua',

            origin:
              'predatorType',
          },
        ],
      })

    assert.deepEqual(
      result.advantages.selections.map(
        selection => [
          selection.definitionKey,
          selection.origin,
          selection.rating,
        ],
      ),
      [
        [
          'creation-advantage',
          'creation',
          1,
        ],
        [
          'iron-stomach',
          'predatorType',
          3,
        ],
        [
          'enemy',
          'predatorType',
          2,
        ],
      ],
    )

    assert.deepEqual(
      result.disciplines.map(
        discipline => [
          discipline.key,
          discipline.origin,
          discipline.value,
        ],
      ),
      [
        [
          'auspex',
          'creation',
          2,
        ],
        [
          'bloodSorcery',
          'predatorType',
          1,
        ],
      ],
    )

    assert.deepEqual(
      result.skillSpecialties.map(
        specialty => [
          specialty.skillKey,
          specialty.name,
          specialty.origin,
        ],
      ),
      [
        [
          'occult',
          'Vampiros',
          'creation',
        ],
        [
          'streetwise',
          'Mercado Negro',
          'predatorType',
        ],
      ],
    )
  },
)

test(
  '003-J.4B limpia los efectos al invalidarse el Predator Type',
  async () => {
    const {
      applyPredatorTypeEffects,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      applyPredatorTypeEffects({
        predatorTypeKey:
          'bagger',

        clanKey:
          'ventrue',

        advantages: {
          selections: [
            {
              selectionId:
                'predator-advantage',

              definitionKey:
                'iron-stomach',

              category:
                'merit',

              rating:
                3,

              origin:
                'predatorType',
            },
          ],
        },

        disciplines: [
          {
            key:
              'obfuscate',

            value:
              1,

            powerKeys:
              [],

            origin:
              'predatorType',
          },
        ],

        skillSpecialties: [
          {
            id:
              'predator-specialty',

            skillKey:
              'larceny',

            name:
              'Forzar Cerraduras',

            origin:
              'predatorType',
          },
        ],
      })

    assert.equal(
      result.advantages.selections.length,
      0,
    )

    assert.equal(
      result.disciplines.length,
      0,
    )

    assert.equal(
      result.skillSpecialties.length,
      0,
    )
  },
)

test(
  '003-J.5 integra Predator Type en el pipeline de CharacterDraft',
  async () => {
    const {
      normalizeCharacterDraftPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-draft-rules.ts'
    )

    const {
      initialCharacterDraft,
    } = await import(
      '../src/features/character-creation/data/initial-character-draft.ts'
    )

    const draft =
      structuredClone(
        initialCharacterDraft,
      )

    draft.identity.clan =
      'tremere'

    draft.identity.predatorType =
      'bagger'


    draft.predatorTypeChoices = {
      'bagger-specialty': 0,
      'bagger-discipline': 0,
    }
    draft.advantages = {
      selections: [
        {
          selectionId:
            'creation-advantage',

          definitionKey:
            'creation-advantage',

          category:
            'merit',

          rating:
            1,

          origin:
            'creation',
        },
      ],
    }

    draft.disciplines = [
      {
        key:
          'auspex',

        value:
          2,

        powerKeys:
          [],

        origin:
          'creation',
      },
    ]

    draft.skillSpecialties = [
      {
        id:
          'creation-specialty',

        skillKey:
          'occult',

        name:
          'Vampiros',

        origin:
          'creation',
      },
    ]

    const result =
      normalizeCharacterDraftPredatorType(
        draft,
      )

    assert.equal(
      result.identity.predatorType,
      'bagger',
    )

    assert.ok(
      result.advantages.selections.some(
        selection =>
          selection.origin ===
            'creation' &&
          selection.definitionKey ===
            'creation-advantage',
      ),
    )

    assert.ok(
      result.advantages.selections.some(
        selection =>
          selection.origin ===
            'predatorType',
      ),
    )

    assert.ok(
      result.disciplines.some(
        discipline =>
          discipline.key ===
            'auspex' &&
          discipline.origin ===
            'creation',
      ),
    )

    assert.ok(
      result.disciplines.some(
        discipline =>
          discipline.key ===
            'bloodSorcery' &&
          discipline.origin ===
            'predatorType',
      ),
    )

    assert.ok(
      result.skillSpecialties.some(
        specialty =>
          specialty.id ===
            'creation-specialty' &&
          specialty.origin ===
            'creation',
      ),
    )
  },
)

test(
  '003-J.5 elimina efectos Predator Type al retirar la selección',
  async () => {
    const {
      normalizeCharacterDraftPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-draft-rules.ts'
    )

    const {
      initialCharacterDraft,
    } = await import(
      '../src/features/character-creation/data/initial-character-draft.ts'
    )

    const draft =
      structuredClone(
        initialCharacterDraft,
      )

    draft.identity.clan =
      'tremere'

    draft.identity.predatorType =
      ''

    draft.advantages = {
      selections: [
        {
          selectionId:
            'creation-advantage',

          definitionKey:
            'creation-advantage',

          category:
            'merit',

          rating:
            1,

          origin:
            'creation',
        },

        {
          selectionId:
            'predator-advantage',

          definitionKey:
            'iron-stomach',

          category:
            'merit',

          rating:
            3,

          origin:
            'predatorType',
        },
      ],
    }

    draft.disciplines = [
      {
        key:
          'auspex',

        value:
          2,

        powerKeys:
          [],

        origin:
          'creation',
      },

      {
        key:
          'bloodSorcery',

        value:
          1,

        powerKeys:
          [],

        origin:
          'predatorType',
      },
    ]

    draft.skillSpecialties = [
      {
        id:
          'creation-specialty',

        skillKey:
          'occult',

        name:
          'Vampiros',

        origin:
          'creation',
      },

      {
        id:
          'predator-specialty',

        skillKey:
          'streetwise',

        name:
          'Mercado Negro',

        origin:
          'predatorType',
      },
    ]

    const result =
      normalizeCharacterDraftPredatorType(
        draft,
      )

    assert.equal(
      result.advantages.selections.filter(
        selection =>
          selection.origin ===
          'predatorType',
      ).length,
      0,
    )

    assert.equal(
      result.disciplines.filter(
        discipline =>
          discipline.origin ===
          'predatorType',
      ).length,
      0,
    )

    assert.equal(
      result.skillSpecialties.filter(
        specialty =>
          specialty.origin ===
          'predatorType',
      ).length,
      0,
    )

    assert.equal(
      result.advantages.selections.filter(
        selection =>
          selection.origin ===
          'creation',
      ).length,
      1,
    )

    assert.equal(
      result.disciplines.filter(
        discipline =>
          discipline.origin ===
          'creation',
      ).length,
      1,
    )

    assert.equal(
      result.skillSpecialties.filter(
        specialty =>
          specialty.origin ===
          'creation',
      ).length,
      1,
    )
  },
)



test(
  '003-K.1B resuelve restricciones de Humanidad',
  async () => {
    const {
      humanityAllowed,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.equal(
      humanityAllowed('bagger', 7),
      true,
    )

    assert.equal(
      humanityAllowed(
        'unknown-predator-type',
        7,
      ),
      false,
    )
  },
)

test(
  '003-K.1B Bolsero no modifica Humanidad',
  async () => {
    const {
      resolvePredatorTypeHumanityModifier,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.equal(
      resolvePredatorTypeHumanityModifier(
        'bagger',
        {
          clan: 'brujah',
        },
      ),
      0,
    )
  },
)

test(
  '003-K.2 Bolsero no modifica Potencia de Sangre',
  async () => {

    const {
      resolvePredatorTypeBloodPotencyModifier,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.equal(
      resolvePredatorTypeBloodPotencyModifier(
        'bagger',
        {
          clan: 'brujah',
        },
      ),
      0,
    )

  },
)

test(
  '003-K.1B Bolsero no declara distribuciones de puntos',
  async () => {
    const {
      resolvePredatorTypePointDistributions,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.deepEqual(
      resolvePredatorTypePointDistributions(
        'bagger',
        {
          clan: 'brujah',
        },
      ),
      [],
    )
  },
)

test(
  '003-K.1B conserva los efectos actuales de Bolsero',
  async () => {
    const {
      applyPredatorTypeEffects,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      applyPredatorTypeEffects({
        predatorTypeKey: 'bagger',
        clanKey: 'brujah',

        choiceSelections: {
          'bagger-specialty': 0,
        },

        advantages: {
          selections: [],
        },

        disciplines: [],

        skillSpecialties: [],
      })

    assert.deepEqual(
      result.advantages.selections.map(
        selection => [
          selection.definitionKey,
          selection.rating,
        ],
      ),
      [
        [
          'iron-stomach',
          3,
        ],
        [
          'enemy',
          2,
        ],
      ],
    )

    assert.equal(
      result.disciplines[0].key,
      'obfuscate',
    )

    assert.equal(
      result.skillSpecialties[0].name,
      'Forzar Cerraduras',
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE resuelve opciones de reparto por definición y familia',
  async () => {
    const {
      resolvePredatorTypePointDistributionOptionDefinitions,
      resolvePredatorTypePointDistributionDefinitions,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const explicitDefinitions =
      resolvePredatorTypePointDistributionOptionDefinitions({
        definitionKey: 'enemy',
        category: 'flaw',
      })

    assert.deepEqual(
      explicitDefinitions.map(
        definition => definition.key,
      ),
      [
        'enemy',
      ],
    )

    const familyDefinitions =
      resolvePredatorTypePointDistributionOptionDefinitions({
        family: 'mythic-flaw',
        category: 'flaw',
      })

    const familyKeys =
      familyDefinitions
        .map(definition => definition.key)
        .sort()

    assert.deepEqual(
      familyKeys,
      [
        'folkloric-bane',
        'folkloric-block',
        'stake-bait',
        'stigmata',
      ].sort(),
    )

    const resolvedDistribution =
      resolvePredatorTypePointDistributionDefinitions({
        type: 'pointDistribution',
        points: 2,
        options: [
          {
            definitionKey: 'enemy',
            category: 'flaw',
          },
          {
            family: 'mythic-flaw',
            category: 'flaw',
          },
        ],
      })

    assert.deepEqual(
      resolvedDistribution
        .map(definition => definition.key)
        .sort(),
      [
        'enemy',
        'folkloric-bane',
        'folkloric-block',
        'stake-bait',
        'stigmata',
      ].sort(),
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE ignora definiciones cuya categoría no coincide',
  async () => {
    const {
      resolvePredatorTypePointDistributionOptionDefinitions,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.deepEqual(
      resolvePredatorTypePointDistributionOptionDefinitions({
        definitionKey: 'enemy',
        category: 'merit',
      }),
      [],
    )

    assert.deepEqual(
      resolvePredatorTypePointDistributionOptionDefinitions({
        family: 'mythic-flaw',
        category: 'merit',
      }),
      [],
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE valida la configuración estructural de los repartos',
  async () => {
    const {
      validatePredatorTypePointDistributionGrant,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.deepEqual(
      validatePredatorTypePointDistributionGrant({
        type: 'pointDistribution',
        points: 3,
        options: [
          {
            definitionKey: 'fame',
            category: 'background',
          },
          {
            definitionKey: 'herd',
            category: 'background',
          },
        ],
      }),
      {
        valid: true,
        errors: [],
      },
    )

    assert.deepEqual(
      validatePredatorTypePointDistributionGrant({
        type: 'pointDistribution',
        points: 2,
        options: [
          {
            definitionKey: 'enemy',
            category: 'flaw',
          },
          {
            family: 'mythic-flaw',
            category: 'flaw',
          },
        ],
      }),
      {
        valid: true,
        errors: [],
      },
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE rechaza repartos sin puntos u opciones válidas',
  async () => {
    const {
      validatePredatorTypePointDistributionGrant,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const invalidPoints =
      validatePredatorTypePointDistributionGrant({
        type: 'pointDistribution',
        points: 0,
        options: [],
      })

    assert.equal(
      invalidPoints.valid,
      false,
    )

    assert.equal(
      invalidPoints.errors.length,
      2,
    )

    const unknownDefinition =
      validatePredatorTypePointDistributionGrant({
        type: 'pointDistribution',
        points: 2,
        options: [
          {
            definitionKey:
              'unknown-advantage',
            category:
              'flaw',
          },
        ],
      })

    assert.equal(
      unknownDefinition.valid,
      false,
    )

    assert.match(
      unknownDefinition.errors[0],
      /unknown-advantage/,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE valida maximumRating en opciones explícitas y familias',
  async () => {
    const {
      validatePredatorTypePointDistributionGrant,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const invalidMaximum =
      validatePredatorTypePointDistributionGrant({
        type: 'pointDistribution',
        points: 2,
        options: [
          {
            definitionKey: 'enemy',
            category: 'flaw',
            maximumRating: 0,
          },
        ],
      })

    assert.equal(
      invalidMaximum.valid,
      false,
    )

    assert.match(
      invalidMaximum.errors[0],
      /maximumRating/,
    )

    const validFamilyMaximum =
      validatePredatorTypePointDistributionGrant({
        type: 'pointDistribution',
        points: 2,
        options: [
          {
            family: 'mythic-flaw',
            category: 'flaw',
            maximumRating: 2,
          },
        ],
      })

    assert.equal(
      validFamilyMaximum.valid,
      true,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE valida las distribuciones resueltas de un depredador',
  async () => {
    const {
      validatePredatorTypePointDistributions,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.deepEqual(
      validatePredatorTypePointDistributions(
        'bagger',
        {
          clan: 'tremere',
        },
      ),
      {
        valid: true,
        errors: [],
      },
    )

    const unknown =
      validatePredatorTypePointDistributions(
        'unknown-predator-type',
      )

    assert.equal(
      unknown.valid,
      false,
    )

    assert.match(
      unknown.errors[0],
      /unknown-predator-type/,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE valida las asignaciones de una bolsa de reparto',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const distribution = {
      type: 'pointDistribution',
      points: 3,
      options: [
        {
          definitionKey: 'fame',
          category: 'background',
        },
        {
          definitionKey: 'herd',
          category: 'background',
        },
      ],
    }

    assert.deepEqual(
      validatePredatorTypePointDistributionAllocation(
        distribution,
        [
          {
            definitionKey: 'fame',
            rating: 1,
          },
          {
            definitionKey: 'herd',
            rating: 2,
          },
        ],
      ),
      {
        valid: true,
        errors: [],
      },
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE acepta repartos entre enemigo y defectos míticos',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const distribution = {
      type: 'pointDistribution',
      points: 2,
      options: [
        {
          definitionKey: 'enemy',
          category: 'flaw',
        },
        {
          family: 'mythic-flaw',
          category: 'flaw',
        },
      ],
    }

    assert.equal(
      validatePredatorTypePointDistributionAllocation(
        distribution,
        [
          {
            definitionKey: 'enemy',
            rating: 1,
          },
          {
            definitionKey: 'stigmata',
            rating: 1,
          },
        ],
      ).valid,
      true,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE exige gastar exactamente todos los puntos',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      validatePredatorTypePointDistributionAllocation(
        {
          type: 'pointDistribution',
          points: 3,
          options: [
            {
              definitionKey: 'fame',
              category: 'background',
            },
            {
              definitionKey: 'herd',
              category: 'background',
            },
          ],
        },
        [
          {
            definitionKey: 'fame',
            rating: 1,
          },
        ],
      )

    assert.equal(result.valid, false)

    assert.equal(
      result.errors.some(
        error =>
          error.includes(
            'exactamente 3 puntos',
          ),
      ),
      true,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE rechaza definiciones ajenas, duplicadas y puntuaciones ilegales',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const distribution = {
      type: 'pointDistribution',
      points: 3,
      options: [
        {
          definitionKey: 'fame',
          category: 'background',
          maximumRating: 2,
        },
        {
          definitionKey: 'herd',
          category: 'background',
        },
      ],
    }

    const foreign =
      validatePredatorTypePointDistributionAllocation(
        distribution,
        [
          {
            definitionKey: 'contacts',
            rating: 3,
          },
        ],
      )

    assert.equal(foreign.valid, false)

    assert.equal(
      foreign.errors.some(
        error =>
          error.includes(
            'no pertenece',
          ),
      ),
      true,
    )

    const duplicated =
      validatePredatorTypePointDistributionAllocation(
        distribution,
        [
          {
            definitionKey: 'fame',
            rating: 1,
          },
          {
            definitionKey: 'fame',
            rating: 2,
          },
        ],
      )

    assert.equal(duplicated.valid, false)

    assert.equal(
      duplicated.errors.some(
        error =>
          error.includes(
            'más de una vez',
          ),
      ),
      true,
    )

    const aboveMaximum =
      validatePredatorTypePointDistributionAllocation(
        distribution,
        [
          {
            definitionKey: 'fame',
            rating: 3,
          },
        ],
      )

    assert.equal(aboveMaximum.valid, false)

    assert.equal(
      aboveMaximum.errors.some(
        error =>
          error.includes(
            'maximumRating',
          ),
      ),
      true,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE valida una asignación completa de puntos',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      validatePredatorTypePointDistributionAllocation(
        {
          type: 'pointDistribution',
          points: 3,
          options: [
            {
              definitionKey: 'fame',
              category: 'background',
            },
            {
              definitionKey: 'herd',
              category: 'background',
            },
          ],
        },
        [
          {
            definitionKey: 'fame',
            rating: 1,
          },
          {
            definitionKey: 'herd',
            rating: 2,
          },
        ],
      )

    assert.deepEqual(
      result,
      {
        valid: true,
        errors: [],
      },
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE valida asignaciones mediante familia funcional',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      validatePredatorTypePointDistributionAllocation(
        {
          type: 'pointDistribution',
          points: 2,
          options: [
            {
              definitionKey: 'enemy',
              category: 'flaw',
            },
            {
              family: 'mythic-flaw',
              category: 'flaw',
            },
          ],
        },
        [
          {
            definitionKey: 'enemy',
            rating: 1,
          },
          {
            definitionKey: 'stigmata',
            rating: 1,
          },
        ],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE rechaza puntos incompletos',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      validatePredatorTypePointDistributionAllocation(
        {
          type: 'pointDistribution',
          points: 3,
          options: [
            {
              definitionKey: 'fame',
              category: 'background',
            },
            {
              definitionKey: 'herd',
              category: 'background',
            },
          ],
        },
        [
          {
            definitionKey: 'fame',
            rating: 1,
          },
        ],
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        error =>
          error.includes(
            'Deben gastarse exactamente 3 puntos',
          ),
      ),
      true,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE rechaza definiciones ajenas y duplicadas',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const distribution = {
      type: 'pointDistribution',
      points: 2,
      options: [
        {
          definitionKey: 'enemy',
          category: 'flaw',
        },
        {
          family: 'mythic-flaw',
          category: 'flaw',
        },
      ],
    }

    const foreign =
      validatePredatorTypePointDistributionAllocation(
        distribution,
        [
          {
            definitionKey: 'contacts',
            rating: 2,
          },
        ],
      )

    assert.equal(
      foreign.valid,
      false,
    )

    assert.equal(
      foreign.errors.some(
        error =>
          error.includes(
            'no pertenece',
          ),
      ),
      true,
    )

    const duplicate =
      validatePredatorTypePointDistributionAllocation(
        distribution,
        [
          {
            definitionKey: 'enemy',
            rating: 1,
          },
          {
            definitionKey: 'enemy',
            rating: 1,
          },
        ],
      )

    assert.equal(
      duplicate.valid,
      false,
    )

    assert.equal(
      duplicate.errors.some(
        error =>
          error.includes(
            'aparece más de una vez',
          ),
      ),
      true,
    )
  },
)

test(
  '003-H.PREDATOR.ENGINE rechaza puntuaciones no admitidas',
  async () => {
    const {
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      validatePredatorTypePointDistributionAllocation(
        {
          type: 'pointDistribution',
          points: 9,
          options: [
            {
              definitionKey: 'enemy',
              category: 'flaw',
            },
          ],
        },
        [
          {
            definitionKey: 'enemy',
            rating: 9,
          },
        ],
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        error =>
          error.includes(
            'no admite puntuación 9',
          ),
      ),
      true,
    )
  },
)

test(
  '003-H.PREDATOR.OSIRIS define todos sus efectos oficiales',
  async () => {
    const {
      getPredatorType,
      resolvePredatorChoices,
      resolvePredatorTypePointDistributions,
      validatePredatorTypePointDistributions,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition = getPredatorType('osiris')

    assert.ok(definition)
    assert.equal(definition.name, 'Osiris')

    const tremere =
      resolvePredatorChoices(
        'osiris',
        { clan: 'tremere' },
      )

    assert.equal(
      tremere.some(
        grant =>
          grant.type === 'discipline' &&
          grant.disciplineKey === 'bloodSorcery',
      ),
      true,
    )

    const brujah =
      resolvePredatorChoices(
        'osiris',
        { clan: 'brujah' },
      )

    assert.equal(
      brujah.some(
        grant =>
          grant.type === 'discipline' &&
          grant.disciplineKey === 'presence',
      ),
      true,
    )

    const distributions =
      resolvePredatorTypePointDistributions(
        'osiris',
      )

    assert.equal(distributions.length, 2)
    assert.equal(distributions[0].points, 3)
    assert.equal(distributions[1].points, 2)

    assert.deepEqual(
      validatePredatorTypePointDistributions(
        'osiris',
      ),
      {
        valid: true,
        errors: [],
      },
    )
  },
)

test(
  '003-H.PREDATOR.OSIRIS permite repartir Fama y Rebaño',
  async () => {
    const {
      resolvePredatorTypePointDistributions,
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const [socialDistribution] =
      resolvePredatorTypePointDistributions(
        'osiris',
      )

    assert.equal(
      validatePredatorTypePointDistributionAllocation(
        socialDistribution,
        [
          {
            definitionKey: 'fame',
            rating: 1,
          },
          {
            definitionKey: 'herd',
            rating: 2,
          },
        ],
      ).valid,
      true,
    )
  },
)

test(
  '003-H.PREDATOR.OSIRIS permite repartir Enemigo y Defectos Míticos',
  async () => {
    const {
      resolvePredatorTypePointDistributions,
      validatePredatorTypePointDistributionAllocation,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const [, flawDistribution] =
      resolvePredatorTypePointDistributions(
        'osiris',
      )

    assert.equal(
      validatePredatorTypePointDistributionAllocation(
        flawDistribution,
        [
          {
            definitionKey: 'enemy',
            rating: 1,
          },
          {
            definitionKey: 'stigmata',
            rating: 1,
          },
        ],
      ).valid,
      true,
    )
  },
)

test(
  '003-H.PREDATOR.SANDMAN permite Auspex u Ofuscación',
  async () => {
    const {
      getPredatorType,
      resolveSelectedPredatorChoices,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('sandman')

    assert.ok(definition)

    const auspex =
      resolveSelectedPredatorChoices(
        'sandman',
        {
          clan: 'malkavian',
        },
        {
          'sandman-specialty': 0,
          'sandman-discipline': 0,
        },
      )

    const obfuscate =
      resolveSelectedPredatorChoices(
        'sandman',
        {
          clan: 'malkavian',
        },
        {
          'sandman-specialty': 0,
          'sandman-discipline': 1,
        },
      )

    assert.equal(
      auspex.some(
        grant =>
          grant.type === 'discipline' &&
          grant.disciplineKey === 'auspex',
      ),
      true,
    )

    assert.equal(
      obfuscate.some(
        grant =>
          grant.type === 'discipline' &&
          grant.disciplineKey === 'obfuscate',
      ),
      true,
    )
  },
)




test(
  '003-H.PREDATOR.SCENE-QUEEN define todos sus efectos',
  async () => {
    const {
      getPredatorType,
      resolveSelectedPredatorChoices,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('scene-queen')

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Reina del Ambiente',
    )

    assert.deepEqual(
      definition.fixedGrants.advantages.map(
        grant => [
          grant.definitionKey,
          grant.category,
          grant.rating,
        ],
      ),
      [
        [
          'fame',
          'background',
          1,
        ],
        [
          'contacts',
          'background',
          1,
        ],
      ],
    )

    const grants =
      resolveSelectedPredatorChoices(
        'scene-queen',
        {
          clan: 'brujah',
        },
        {
          'scene-queen-specialty': 1,
          'scene-queen-discipline': 1,
          'scene-queen-flaw': 0,
        },
      )

    assert.equal(
      grants.some(
        grant =>
          grant.type === 'specialty' &&
          grant.skillKey === 'leadership',
      ),
      true,
    )

    assert.equal(
      grants.some(
        grant =>
          grant.type === 'discipline' &&
          grant.disciplineKey === 'potence',
      ),
      true,
    )

    assert.equal(
      grants.some(
        grant =>
          grant.type === 'advantage' &&
          grant.definitionKey === 'despised' &&
          grant.category === 'flaw' &&
          grant.rating === 1,
      ),
      true,
    )
  },
)

test(
  '003-H.PREDATOR.SCENE-QUEEN aplica la elección Despreciado',
  async () => {
    const {
      applyPredatorTypeEffects,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      applyPredatorTypeEffects({
        predatorTypeKey:
          'scene-queen',

        clanKey:
          'brujah',

        choiceSelections: {
          'scene-queen-specialty': 0,
          'scene-queen-discipline': 0,
          'scene-queen-flaw': 0,
        },

        advantages: {
          selections: [],
        },

        disciplines: [],

        skillSpecialties: [],
      })

    assert.deepEqual(
      result.advantages.selections.map(
        selection => [
          selection.definitionKey,
          selection.category,
          selection.rating,
          selection.origin,
        ],
      ),
      [
        [
          'fame',
          'background',
          1,
          'predatorType',
        ],
        [
          'contacts',
          'background',
          1,
          'predatorType',
        ],
        [
          'despised',
          'flaw',
          1,
          'predatorType',
        ],
      ],
    )

    assert.deepEqual(
      result.disciplines.map(
        discipline => [
          discipline.key,
          discipline.value,
          discipline.origin,
        ],
      ),
      [
        [
          'dominate',
          1,
          'predatorType',
        ],
      ],
    )

    assert.deepEqual(
      result.skillSpecialties.map(
        specialty => [
          specialty.skillKey,
          specialty.name,
          specialty.origin,
        ],
      ),
      [
        [
          'etiquette',
          'Ambiente específico',
          'predatorType',
        ],
      ],
    )
  },
)

test(
  '003-H.PREDATOR.SCENE-QUEEN aplica la elección Exclusión de Presa',
  async () => {
    const {
      applyPredatorTypeAdvantages,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      applyPredatorTypeAdvantages(
        'scene-queen',
        'brujah',
        {
          selections: [],
        },
        {
          'scene-queen-flaw': 1,
        },
      )

    assert.equal(
      result.selections.some(
        selection =>
          selection.definitionKey ===
            'prey-exclusion' &&
          selection.category ===
            'flaw' &&
          selection.rating ===
            1 &&
          selection.origin ===
            'predatorType',
      ),
      true,
    )

    assert.equal(
      result.selections.some(
        selection =>
          selection.definitionKey ===
          'despised',
      ),
      false,
    )
  },
)


test(
  '003-H.PREDATOR.SIREN define todos sus efectos',
  async () => {
    const {
      getPredatorType,
      resolveSelectedPredatorChoices,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('siren')

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Sirena',
    )

    assert.deepEqual(
      definition.fixedGrants.advantages.map(
        grant => [
          grant.definitionKey,
          grant.category,
          grant.rating,
        ],
      ),
      [
        [
          'beautiful',
          'merit',
          2,
        ],
        [
          'enemy',
          'flaw',
          1,
        ],
      ],
    )

    const grants =
      resolveSelectedPredatorChoices(
        'siren',
        {
          clan: 'toreador',
        },
        {
          'siren-specialty': 1,
          'siren-discipline': 1,
        },
      )

    assert.equal(
      grants.some(
        grant =>
          grant.type === 'specialty' &&
          grant.skillKey === 'subterfuge' &&
          grant.name === 'Seducción',
      ),
      true,
    )

    assert.equal(
      grants.some(
        grant =>
          grant.type === 'discipline' &&
          grant.disciplineKey === 'presence' &&
          grant.dots === 1,
      ),
      true,
    )
  },
)

test(
  '003-H.PREDATOR.SIREN aplica Bello, Enemigo, Fortaleza y Persuasión',
  async () => {
    const {
      applyPredatorTypeEffects,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      applyPredatorTypeEffects({
        predatorTypeKey:
          'siren',

        clanKey:
          'toreador',

        choiceSelections: {
          'siren-specialty': 0,
          'siren-discipline': 0,
        },

        advantages: {
          selections: [],
        },

        disciplines: [],

        skillSpecialties: [],
      })

    assert.deepEqual(
      result.advantages.selections.map(
        selection => [
          selection.definitionKey,
          selection.category,
          selection.rating,
          selection.origin,
        ],
      ),
      [
        [
          'beautiful',
          'merit',
          2,
          'predatorType',
        ],
        [
          'enemy',
          'flaw',
          1,
          'predatorType',
        ],
      ],
    )

    assert.deepEqual(
      result.disciplines.map(
        discipline => [
          discipline.key,
          discipline.value,
          discipline.origin,
        ],
      ),
      [
        [
          'fortitude',
          1,
          'predatorType',
        ],
      ],
    )

    assert.deepEqual(
      result.skillSpecialties.map(
        specialty => [
          specialty.skillKey,
          specialty.name,
          specialty.origin,
        ],
      ),
      [
        [
          'persuasion',
          'Seducción',
          'predatorType',
        ],
      ],
    )
  },
)

test(
  '003-H.PREDATOR.SIREN permite Presencia y Subterfugio',
  async () => {
    const {
      applyPredatorTypeEffects,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const result =
      applyPredatorTypeEffects({
        predatorTypeKey:
          'siren',

        clanKey:
          'toreador',

        choiceSelections: {
          'siren-specialty': 1,
          'siren-discipline': 1,
        },

        advantages: {
          selections: [],
        },

        disciplines: [],

        skillSpecialties: [],
      })

    assert.equal(
      result.disciplines.some(
        discipline =>
          discipline.key === 'presence' &&
          discipline.value === 1 &&
          discipline.origin === 'predatorType',
      ),
      true,
    )

    assert.equal(
      result.skillSpecialties.some(
        specialty =>
          specialty.skillKey === 'subterfuge' &&
          specialty.name === 'Seducción' &&
          specialty.origin === 'predatorType',
      ),
      true,
    )
  },
)


test(
  '003-K.3 Blood Leech declara sus modificadores',
  async () => {
    const {
      resolvePredatorTypeHumanityModifier,
      resolvePredatorTypeBloodPotencyModifier,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.equal(
      resolvePredatorTypeHumanityModifier(
        'blood-leech',
      ),
      -1,
    )

    assert.equal(
      resolvePredatorTypeBloodPotencyModifier(
        'blood-leech',
      ),
      1,
    )
  },
)

test(
  '003-K.3 Blood Leech concede Exclusión de Presa a dos puntos',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('blood-leech')

    assert.ok(definition)

    assert.deepEqual(
      definition.fixedGrants
        ?.advantages,
      [
        {
          definitionKey:
            'prey-exclusion',
          category: 'flaw',
          rating: 2,
        },
      ],
    )
  },
)

test(
  '003-K.3 Blood Leech permite Pelea o Sigilo como especialidad',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('blood-leech')

    const choice =
      definition?.choices?.find(
        item =>
          item.id ===
          'blood-leech-specialty',
      )

    assert.ok(choice)

    assert.equal(
      choice.minimumSelections,
      1,
    )

    assert.equal(
      choice.maximumSelections,
      1,
    )

    assert.deepEqual(
      choice.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'specialty',
          skillKey: 'brawl',
          name: 'Vástagos',
        },
        {
          type: 'specialty',
          skillKey: 'stealth',
          name: 'Contra Vástagos',
        },
      ],
    )
  },
)

test(
  '003-K.3 Blood Leech permite Celeridad o Protean',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('blood-leech')

    const choice =
      definition?.choices?.find(
        item =>
          item.id ===
          'blood-leech-discipline',
      )

    assert.ok(choice)

    assert.deepEqual(
      choice.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'discipline',
          disciplineKey: 'celerity',
          dots: 1,
        },
        {
          type: 'discipline',
          disciplineKey: 'protean',
          dots: 1,
        },
      ],
    )
  },
)

test(
  '003-K.3 Blood Leech permite Secreto Oscuro o Rechazado',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('blood-leech')

    const choice =
      definition?.choices?.find(
        item =>
          item.id ===
          'blood-leech-social-flaw',
      )

    assert.ok(choice)

    assert.equal(
      choice.minimumSelections,
      1,
    )

    assert.equal(
      choice.maximumSelections,
      1,
    )

    assert.deepEqual(
      choice.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'advantage',
          definitionKey: 'dark-secret',
          category: 'background',
          rating: 2,
        },
        {
          type: 'advantage',
          definitionKey: 'shunned',
          category: 'flaw',
          rating: 2,
        },
      ],
    )
  },
)

test(
  '029-T resuelve las referencias narrativas de Blood Leech',
  async () => {
    const {
      predatorPendingReferences,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.deepEqual(
      predatorPendingReferences(
        'blood-leech',
      ),
      [],
    )
  },
)


test(
  '003-K restringe Tipos de Depredador por Potencia de Sangre',
  async () => {
    const {
      bloodPotencyAllowed,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.equal(
      bloodPotencyAllowed(
        'bagger',
        1,
      ),
      true,
    )

    assert.equal(
      bloodPotencyAllowed(
        'bagger',
        5,
      ),
      true,
    )

    assert.equal(
      bloodPotencyAllowed(
        'unknown-predator-type',
        1,
      ),
      false,
    )
  },
)


test(
  '003-K.4 el catálogo Core contiene los diez Tipos de Depredador',
  async () => {
    const {
      predatorTypeDefinitions,
    } = await import(
      '../src/features/character-creation/data/predator-type-definitions.ts'
    )

    const expectedKeys = [
      'bagger',
      'cleaver',
      'consensualist',
      'alleycat',
      'farmer',
      'osiris',
      'scene-queen',
      'sandman',
      'blood-leech',
      'siren',
    ]

    for (const key of expectedKeys) {
      assert.equal(
        predatorTypeDefinitions.some(
          definition =>
            definition.key === key,
        ),
        true,
        `Falta el Tipo de Depredador ${key}`,
      )
    }

    assert.equal(
      new Set(
        predatorTypeDefinitions.map(
          definition => definition.key,
        ),
      ).size,
      predatorTypeDefinitions.length,
    )
  },
)

test(
  '003-K.4 Cleaver concede Secreto Oscuro y Rebaño',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('cleaver')

    assert.ok(definition)

    assert.deepEqual(
      definition.fixedGrants?.advantages,
      [
        {
          definitionKey: 'dark-secret',
          category: 'background',
          rating: 2,
        },
        {
          definitionKey: 'herd',
          category: 'background',
          rating: 1,
        },
      ],
    )
  },
)

test(
  '003-K.4 Cleaver permite sus especialidades y disciplinas oficiales',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('cleaver')

    const specialty =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'cleaver-specialty',
      )

    const discipline =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'cleaver-discipline',
      )

    assert.deepEqual(
      specialty?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'specialty',
          skillKey: 'persuasion',
          name: 'Luz de Gas',
        },
        {
          type: 'specialty',
          skillKey: 'subterfuge',
          name: 'Encubrimiento',
        },
      ],
    )

    assert.deepEqual(
      discipline?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'discipline',
          disciplineKey: 'dominate',
          dots: 1,
        },
        {
          type: 'discipline',
          disciplineKey: 'animalism',
          dots: 1,
        },
      ],
    )
  },
)

test(
  '003-K.4 Consensualista concede Humanidad y sus defectos',
  async () => {
    const {
      getPredatorType,
      resolvePredatorTypeHumanityModifier,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('consensualist')

    assert.ok(definition)

    assert.equal(
      resolvePredatorTypeHumanityModifier(
        'consensualist',
      ),
      1,
    )

    assert.deepEqual(
      definition.fixedGrants?.advantages,
      [
        {
          definitionKey: 'dark-secret',
          category: 'background',
          rating: 1,
        },
        {
          definitionKey: 'prey-exclusion',
          category: 'flaw',
          rating: 1,
        },
      ],
    )
  },
)

test(
  '003-K.4 Consensualista permite sus especialidades y disciplinas oficiales',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('consensualist')

    const specialty =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'consensualist-specialty',
      )

    const discipline =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'consensualist-discipline',
      )

    assert.deepEqual(
      specialty?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'specialty',
          skillKey: 'medicine',
          name: 'Flebotomía',
        },
        {
          type: 'specialty',
          skillKey: 'persuasion',
          name: 'Víctimas',
        },
      ],
    )

    assert.deepEqual(
      discipline?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'discipline',
          disciplineKey: 'auspex',
          dots: 1,
        },
        {
          type: 'discipline',
          disciplineKey: 'fortitude',
          dots: 1,
        },
      ],
    )
  },
)

test(
  '003-K.4 Gato Callejero pierde Humanidad y gana Contactos',
  async () => {
    const {
      getPredatorType,
      resolvePredatorTypeHumanityModifier,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('alleycat')

    assert.ok(definition)

    assert.equal(
      resolvePredatorTypeHumanityModifier(
        'alleycat',
      ),
      -1,
    )

    assert.deepEqual(
      definition.fixedGrants?.advantages,
      [
        {
          definitionKey: 'contacts',
          category: 'background',
          rating: 3,
        },
      ],
    )
  },
)

test(
  '003-K.4 Gato Callejero permite sus especialidades y disciplinas oficiales',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('alleycat')

    const specialty =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'alleycat-specialty',
      )

    const discipline =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'alleycat-discipline',
      )

    assert.deepEqual(
      specialty?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'specialty',
          skillKey: 'intimidation',
          name: 'Atracos',
        },
        {
          type: 'specialty',
          skillKey: 'brawl',
          name: 'Realizar Presas',
        },
      ],
    )

    assert.deepEqual(
      discipline?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'discipline',
          disciplineKey: 'celerity',
          dots: 1,
        },
        {
          type: 'discipline',
          disciplineKey: 'potence',
          dots: 1,
        },
      ],
    )
  },
)

test(
  '003-K.4 Granjero aplica sus restricciones oficiales',
  async () => {
    const {
      bloodPotencyAllowed,
      clanAllowed,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.equal(
      clanAllowed(
        'farmer',
        'ventrue',
      ),
      false,
    )

    assert.equal(
      clanAllowed(
        'farmer',
        'brujah',
      ),
      true,
    )

    assert.equal(
      bloodPotencyAllowed(
        'farmer',
        2,
      ),
      true,
    )

    assert.equal(
      bloodPotencyAllowed(
        'farmer',
        3,
      ),
      false,
    )
  },
)

test(
  '003-K.4 Granjero concede Humanidad y Vegano',
  async () => {
    const {
      getPredatorType,
      resolvePredatorTypeHumanityModifier,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('farmer')

    assert.ok(definition)

    assert.equal(
      resolvePredatorTypeHumanityModifier(
        'farmer',
      ),
      1,
    )

    assert.deepEqual(
      definition.fixedGrants?.advantages,
      [
        {
          definitionKey: 'vegan',
          category: 'flaw',
          rating: 2,
        },
      ],
    )
  },
)

test(
  '003-K.4 Granjero permite sus especialidades y disciplinas oficiales',
  async () => {
    const {
      getPredatorType,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition =
      getPredatorType('farmer')

    const specialty =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'farmer-specialty',
      )

    const discipline =
      definition?.choices?.find(
        choice =>
          choice.id ===
          'farmer-discipline',
      )

    assert.deepEqual(
      specialty?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'specialty',
          skillKey: 'animalKen',
          name: 'Animal específico',
        },
        {
          type: 'specialty',
          skillKey: 'survival',
          name: 'Caza',
        },
      ],
    )

    assert.deepEqual(
      discipline?.options.map(
        option => option.grant,
      ),
      [
        {
          type: 'discipline',
          disciplineKey: 'animalism',
          dots: 1,
        },
        {
          type: 'discipline',
          disciplineKey: 'protean',
          dots: 1,
        },
      ],
    )
  },
)
