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

test('pending references detected',()=>{

    assert.deepEqual(
        predatorPendingReferences('bagger'),
        ['enemy']
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
  '003-H.PREDATOR.SANDMAN reglas oficiales',
  async () => {

    const {
      getPredatorType,
      resolvePredatorChoices,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const definition=getPredatorType('sandman')

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Sandman',
    )

    const tremere=
      resolvePredatorChoices(
        'sandman',
        { clan:'tremere' },
      )

    assert.equal(
      tremere.some(
        x =>
          x.type==='discipline' &&
          x.disciplineKey==='bloodSorcery'
      ),
      true,
    )

    const ventrue=
      resolvePredatorChoices(
        'sandman',
        { clan:'ventrue' },
      )

    assert.equal(
      ventrue.some(
        x =>
          x.type==='discipline' &&
          x.disciplineKey==='obfuscate'
      ),
      true,
    )

  },
)


