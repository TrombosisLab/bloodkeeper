import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterLifecycleTransitionError,
  assertCharacterLifecycleTransition,
  validateCharacterLifecycleTransition,
} from '../dist/characters/domain/character-lifecycle.rules.js'

import {
  buildCharacterValidationReport,
  sectionValidation,
} from '../dist/characters/domain/character-validation.rules.js'

import {
  CHARACTER_VALIDATION_SECTIONS,
} from '../dist/characters/domain/character-validation.types.js'

function activationReport() {
  return buildCharacterValidationReport(
    'activation',
    CHARACTER_VALIDATION_SECTIONS.map(
      (section) =>
        sectionValidation(section, 'complete'),
    ),
  )
}

function transition(overrides = {}) {
  return {
    from: 'draft',
    to: 'active',
    authorized: true,
    confirmed: false,
    validation: activationReport(),
    ...overrides,
  }
}

test(
  '029-A permite activar un borrador validado explicitamente',
  () => {
    assert.deepEqual(
      validateCharacterLifecycleTransition(
        transition(),
      ),
      { allowed: true, issues: [] },
    )
  },
)

test(
  '029-A exige confirmacion para archivar un personaje activo',
  () => {
    const rejected =
      validateCharacterLifecycleTransition(
        transition({
          from: 'active',
          to: 'archived',
          validation: null,
        }),
      )

    assert.equal(rejected.allowed, false)
    assert.deepEqual(
      rejected.issues.map(({ code }) => code),
      ['CHARACTER_ARCHIVE_CONFIRMATION_REQUIRED'],
    )

    assert.equal(
      validateCharacterLifecycleTransition(
        transition({
          from: 'active',
          to: 'archived',
          confirmed: true,
          validation: null,
        }),
      ).allowed,
      true,
    )
  },
)

test(
  '029-A permite reactivar un archivado solo tras validacion completa',
  () => {
    assert.equal(
      validateCharacterLifecycleTransition(
        transition({
          from: 'archived',
          to: 'active',
        }),
      ).allowed,
      true,
    )

    const rejected =
      validateCharacterLifecycleTransition(
        transition({
          from: 'archived',
          to: 'active',
          validation: null,
        }),
      )

    assert.deepEqual(
      rejected.issues.map(({ code }) => code),
      ['CHARACTER_ACTIVATION_VALIDATION_REQUIRED'],
    )
  },
)

test(
  '029-A rechaza permisos ausentes y transiciones no definidas',
  () => {
    const result =
      validateCharacterLifecycleTransition(
        transition({
          from: 'draft',
          to: 'archived',
          authorized: false,
          validation: null,
        }),
      )

    assert.equal(result.allowed, false)
    assert.deepEqual(
      result.issues.map(({ code }) => code),
      [
        'CHARACTER_LIFECYCLE_PERMISSION_REQUIRED',
        'CHARACTER_LIFECYCLE_TRANSITION_NOT_ALLOWED',
      ],
    )
  },
)

test(
  '029-A no reutiliza validacion de otro contexto para activar',
  () => {
    const editingReport =
      buildCharacterValidationReport(
        'editing',
        CHARACTER_VALIDATION_SECTIONS.map(
          (section) =>
            sectionValidation(
              section,
              'complete',
            ),
        ),
      )
    const result =
      validateCharacterLifecycleTransition(
        transition({ validation: editingReport }),
      )

    assert.deepEqual(
      result.issues.map(({ code }) => code),
      ['CHARACTER_ACTIVATION_VALIDATION_REQUIRED'],
    )
  },
)

test(
  '029-A expone un error de dominio estable para transiciones invalidas',
  () => {
    assert.throws(
      () =>
        assertCharacterLifecycleTransition(
          transition({
            authorized: false,
          }),
        ),
      (error) => {
        assert.ok(
          error instanceof
            InvalidCharacterLifecycleTransitionError,
        )
        assert.equal(error.issues.length, 1)
        assert.equal(
          error.issues[0].section,
          'lifecycle',
        )
        return true
      },
    )
  },
)
