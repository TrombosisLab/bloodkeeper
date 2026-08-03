import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildCharacterValidationReport,
  sectionValidation,
} from '../dist/characters/domain/character-validation.rules.js'

import {
  CHARACTER_VALIDATION_SECTIONS,
} from '../dist/characters/domain/character-validation.types.js'

function completeSections() {
  return CHARACTER_VALIDATION_SECTIONS.map(
    (section) =>
      sectionValidation(section, 'complete'),
  )
}

test(
  '029-A permite guardar borradores con secciones pendientes',
  () => {
    const report = buildCharacterValidationReport(
      'draftSave',
      [sectionValidation('identity', 'complete')],
    )

    assert.equal(report.valid, false)
    assert.equal(report.canProceed, true)
    assert.equal(
      report.sections.length,
      CHARACTER_VALIDATION_SECTIONS.length,
    )
    assert.equal(
      report.sections.find(
        ({ section }) => section === 'attributes',
      ).state,
      'pending',
    )
  },
)

test(
  '029-A bloquea activacion mientras exista una seccion pendiente',
  () => {
    const report = buildCharacterValidationReport(
      'activation',
      completeSections().filter(
        ({ section }) => section !== 'humanity',
      ),
    )

    assert.equal(report.valid, false)
    assert.equal(report.canProceed, false)
    assert.equal(
      report.sections.find(
        ({ section }) => section === 'humanity',
      ).state,
      'pending',
    )
  },
)

test(
  '029-A mantiene advertencias informativas sin bloquear',
  () => {
    const sections = completeSections()
    const index = sections.findIndex(
      ({ section }) => section === 'identity',
    )
    sections[index] = sectionValidation(
      'identity',
      'complete',
      [
        {
          code: 'IDENTITY_OPTIONAL_DATA_MISSING',
          severity: 'warning',
          section: 'identity',
          field: 'sire',
          message:
            'Puedes completar el sire más adelante.',
        },
      ],
    )

    const report = buildCharacterValidationReport(
      'activation',
      sections,
    )

    assert.equal(report.valid, true)
    assert.equal(report.canProceed, true)
    assert.equal(report.issues.length, 1)
  },
)

test(
  '029-A bloquea errores en todos los contextos operativos',
  () => {
    const invalidIdentity = sectionValidation(
      'identity',
      'invalid',
      [
        {
          code: 'CHARACTER_NAME_REQUIRED',
          severity: 'error',
          section: 'identity',
          field: 'name',
          message:
            'El nombre del personaje es obligatorio.',
          details: { minimumLength: 1 },
        },
      ],
    )

    for (const context of [
      'draftSave',
      'activation',
      'editing',
      'evolution',
      'play',
    ]) {
      const report =
        buildCharacterValidationReport(
          context,
          [invalidIdentity],
        )

      assert.equal(report.valid, false)
      assert.equal(report.canProceed, false)
      assert.equal(
        report.issues[0].code,
        'CHARACTER_NAME_REQUIRED',
      )
    }
  },
)

test(
  '029-A rechaza resultados duplicados o incoherentes',
  () => {
    assert.throws(
      () =>
        buildCharacterValidationReport(
          'activation',
          [
            sectionValidation(
              'identity',
              'complete',
            ),
            sectionValidation(
              'identity',
              'complete',
            ),
          ],
        ),
      /duplicated/,
    )

    assert.throws(
      () =>
        buildCharacterValidationReport(
          'activation',
          [
            sectionValidation(
              'identity',
              'invalid',
            ),
          ],
        ),
      /requires an error/,
    )
  },
)
