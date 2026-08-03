import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterValidationRequestError,
  parseCharacterValidationContext,
  toCharacterValidationResponse,
} from '../dist/characters/presentation/character-validation.dto.js'

test(
  '029-D admite exclusivamente los contextos de validacion aprobados',
  () => {
    for (const context of [
      'draftSave',
      'activation',
      'editing',
      'evolution',
      'play',
    ]) {
      assert.equal(
        parseCharacterValidationContext(context),
        context,
      )
    }
  },
)

test(
  '029-D rechaza contextos ausentes o desconocidos',
  () => {
    for (const context of [
      undefined,
      null,
      '',
      'creation',
      ['activation'],
    ]) {
      assert.throws(
        () =>
          parseCharacterValidationContext(context),
        InvalidCharacterValidationRequestError,
      )
    }
  },
)

test(
  '029-D serializa una copia independiente del informe',
  () => {
    const issue = {
      code: 'CHARACTER_NAME_REQUIRED',
      severity: 'error',
      section: 'identity',
      field: 'name',
      message: 'Falta el nombre.',
      details: { minimumLength: 1 },
    }
    const report = {
      context: 'activation',
      valid: false,
      canProceed: false,
      sections: [
        {
          section: 'identity',
          state: 'invalid',
          issues: [issue],
        },
      ],
      issues: [issue],
    }
    const response =
      toCharacterValidationResponse(report)

    assert.deepEqual(response, report)
    assert.notEqual(response.sections, report.sections)
    assert.notEqual(
      response.sections[0].issues[0],
      issue,
    )
    assert.notEqual(
      response.issues[0].details,
      issue.details,
    )
  },
)
