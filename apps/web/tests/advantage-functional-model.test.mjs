import assert from 'node:assert/strict'
import test from 'node:test'

import {
  collectCharacterAdvantageSelectionTreeIds,
  getCharacterAdvantageChildSelections,
  getCharacterAdvantageFunctionalType,
  getCharacterAdvantageNarrativeState,
  getCharacterAdvantageParentSelection,
  hasExplicitCharacterAdvantageParent,
  removeCharacterAdvantageSelectionTree,
} from '../src/features/character-creation/domain/advantage-functional-model.ts'

test(
  'clasifica trasfondos según su naturaleza funcional',
  () => {
    assert.equal(
      getCharacterAdvantageFunctionalType({
        key: 'resources',
        requiresInstanceDetails: true,
        instanceDetailsKind: 'resources',
      }),
      'scalar',
    )

    assert.equal(
      getCharacterAdvantageFunctionalType({
        key: 'haven',
        requiresInstanceDetails: true,
        instanceDetailsKind: 'haven',
      }),
      'location',
    )

    assert.equal(
      getCharacterAdvantageFunctionalType({
        key: 'contacts',
        requiresInstanceDetails: true,
        instanceDetailsKind: 'contact',
      }),
      'collection',
    )

    assert.equal(
      getCharacterAdvantageFunctionalType({
        key: 'haven-library',
        requiresParentSelection: true,
      }),
      'dependent',
    )

    assert.equal(
      getCharacterAdvantageFunctionalType({
        key: 'beautiful',
      }),
      'fixed',
    )
  },
)

test(
  'la información narrativa pendiente no genera invalidez reglamentaria',
  () => {
    assert.deepEqual(
      getCharacterAdvantageNarrativeState(
        {
          key: 'allies',
          requiresInstanceDetails: true,
          instanceDetailsKind: 'allies',
        },
        undefined,
      ),
      {
        status: 'pending',
        missingFields: [
          'instanceDetails',
        ],
      },
    )

    assert.deepEqual(
      getCharacterAdvantageNarrativeState(
        {
          key: 'allies',
          requiresInstanceDetails: true,
          instanceDetailsKind: 'allies',
        },
        {
          kind: 'allies',
          customName: 'Inspectora Varela',
        },
      ),
      {
        status: 'complete',
        missingFields: [],
      },
    )

    assert.deepEqual(
      getCharacterAdvantageNarrativeState(
        {
          key: 'beautiful',
          requiresInstanceDetails: false,
        },
        undefined,
      ),
      {
        status: 'notApplicable',
        missingFields: [],
      },
    )
  },
)

test(
  'resuelve relaciones padre-hijo mediante selectionId explícito',
  () => {
    const selections = [
      {
        selectionId: 'haven-1',
        definitionKey: 'haven',
      },
      {
        selectionId: 'library-1',
        definitionKey: 'haven-library',
        parentSelectionId: 'haven-1',
      },
      {
        selectionId: 'haunted-1',
        definitionKey: 'haven-haunted',
        parentSelectionId: 'haven-1',
      },
    ]

    assert.deepEqual(
      getCharacterAdvantageChildSelections(
        'haven-1',
        selections,
      ).map(
        (selection) =>
          selection.selectionId,
      ),
      [
        'library-1',
        'haunted-1',
      ],
    )

    assert.equal(
      getCharacterAdvantageParentSelection(
        selections[1],
        selections,
      )?.selectionId,
      'haven-1',
    )

    assert.equal(
      hasExplicitCharacterAdvantageParent(
        selections[1],
        selections,
      ),
      true,
    )
  },
)

test(
  'una dependencia huérfana no se considera vinculada',
  () => {
    const selections = [
      {
        selectionId: 'library-1',
        definitionKey: 'haven-library',
        parentSelectionId: 'missing-haven',
      },
    ]

    assert.equal(
      hasExplicitCharacterAdvantageParent(
        selections[0],
        selections,
      ),
      false,
    )
  },
)

test(
  'retirar un padre elimina también todo su árbol dependiente',
  () => {
    const selections = [
      {
        selectionId: 'haven-1',
        definitionKey: 'haven',
      },
      {
        selectionId: 'library-1',
        definitionKey: 'haven-library',
        parentSelectionId: 'haven-1',
      },
      {
        selectionId: 'library-child-1',
        definitionKey: 'library-specialization',
        parentSelectionId: 'library-1',
      },
      {
        selectionId: 'resources-1',
        definitionKey: 'resources',
      },
    ]

    assert.deepEqual(
      new Set(
        collectCharacterAdvantageSelectionTreeIds(
          'haven-1',
          selections,
        ),
      ),
      new Set([
        'haven-1',
        'library-1',
        'library-child-1',
      ]),
    )

    assert.deepEqual(
      removeCharacterAdvantageSelectionTree(
        'haven-1',
        selections,
      ),
      [
        {
          selectionId: 'resources-1',
          definitionKey: 'resources',
        },
      ],
    )
  },
)
