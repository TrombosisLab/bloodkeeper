import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterValidator,
  InvalidPersistedCharacterStateError,
} from '../dist/characters/domain/character-validator.js'

import {
  CHARACTER_VALIDATION_SECTIONS,
} from '../dist/characters/domain/character-validation.types.js'

const character = {
  characterId:
    '39c1801e-68fe-4c92-8795-723cac284bdf',
}

function completeContributor(sections) {
  return {
    sections,
    validate(_character, _context) {
      return sections.map((section) => ({
        section,
        state: 'complete',
        issues: [],
      }))
    },
  }
}

test(
  '029-B mantiene pendientes las secciones sin validador registrado',
  () => {
    const validator = new CharacterValidator([])

    const draftReport = validator.validate(
      character,
      'draftSave',
    )
    const activationReport = validator.validate(
      character,
      'activation',
    )

    assert.equal(draftReport.canProceed, true)
    assert.equal(activationReport.canProceed, false)
    assert.ok(
      activationReport.sections.every(
        ({ state }) => state === 'pending',
      ),
    )
  },
)

test(
  '029-B completa una validacion global mediante contribuciones unicas',
  () => {
    const validator = new CharacterValidator([
      completeContributor(
        CHARACTER_VALIDATION_SECTIONS,
      ),
    ])

    const report = validator.validate(
      character,
      'activation',
    )

    assert.equal(report.valid, true)
    assert.equal(report.canProceed, true)
    assert.deepEqual(report.issues, [])
  },
)

test(
  '029-B entrega personaje y contexto a cada contribuyente',
  () => {
    const calls = []
    const validator = new CharacterValidator([
      {
        sections: ['identity'],
        validate(input, context) {
          calls.push([input, context])
          return [
            {
              section: 'identity',
              state: 'pending',
              issues: [],
            },
          ]
        },
      },
    ])

    validator.validate(character, 'evolution')

    assert.deepEqual(calls, [
      [character, 'evolution'],
    ])
  },
)

test(
  '029-B impide duplicar la logica propietaria de una seccion',
  () => {
    assert.throws(
      () =>
        new CharacterValidator([
          completeContributor(['identity']),
          completeContributor(['identity']),
        ]),
      /multiple contributors/,
    )
  },
)

test(
  '029-B rechaza resultados omitidos, repetidos o no declarados',
  () => {
    for (const results of [
      [],
      [
        {
          section: 'skills',
          state: 'pending',
          issues: [],
        },
      ],
      [
        {
          section: 'identity',
          state: 'pending',
          issues: [],
        },
        {
          section: 'identity',
          state: 'pending',
          issues: [],
        },
      ],
    ]) {
      const validator = new CharacterValidator([
        {
          sections: ['identity'],
          validate() {
            return results
          },
        },
      ])

      assert.throws(
        () =>
          validator.validate(
            character,
            'activation',
          ),
      )
    }
  },
)

test(
  '029-B expone el informe completo al bloquear una operacion',
  () => {
    const validator = new CharacterValidator([
      {
        sections: ['identity'],
        validate() {
          return [
            {
              section: 'identity',
              state: 'invalid',
              issues: [
                {
                  code: 'CHARACTER_NAME_REQUIRED',
                  severity: 'error',
                  section: 'identity',
                  field: 'name',
                  message:
                    'El nombre es obligatorio.',
                },
              ],
            },
          ]
        },
      },
    ])

    assert.throws(
      () =>
        validator.assertCanProceed(
          character,
          'draftSave',
        ),
      (error) => {
        assert.ok(
          error instanceof
            InvalidPersistedCharacterStateError,
        )
        assert.equal(
          error.report.issues[0].code,
          'CHARACTER_NAME_REQUIRED',
        )
        return true
      },
    )
  },
)
