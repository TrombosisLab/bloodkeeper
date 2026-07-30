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
