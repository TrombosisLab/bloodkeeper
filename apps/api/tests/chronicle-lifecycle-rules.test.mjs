import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidChronicleLifecycleTransitionError,
  assertChronicleLifecycleTransition,
  validateChronicleLifecycleTransition,
} from '../dist/chronicles/domain/chronicle-lifecycle.rules.js'

function transition(overrides = {}) {
  return {
    from: 'preparation',
    to: 'active',
    authorized: true,
    ...overrides,
  }
}

test(
  '030-A permite pasar de preparación a activa',
  () => {
    assert.deepEqual(
      validateChronicleLifecycleTransition(
        transition(),
      ),
      {
        allowed: true,
        issues: [],
      },
    )
  },
)

test(
  '030-A permite archivar una crónica activa',
  () => {
    assert.equal(
      validateChronicleLifecycleTransition(
        transition({
          from: 'active',
          to: 'archived',
        }),
      ).allowed,
      true,
    )
  },
)

test(
  '030-A permite reactivar una crónica archivada',
  () => {
    assert.equal(
      validateChronicleLifecycleTransition(
        transition({
          from: 'archived',
          to: 'active',
        }),
      ).allowed,
      true,
    )
  },
)

test(
  '030-A rechaza transiciones no declaradas',
  () => {
    const result =
      validateChronicleLifecycleTransition(
        transition({
          from: 'preparation',
          to: 'archived',
        }),
      )

    assert.equal(result.allowed, false)
    assert.equal(
      result.issues[0]?.code,
      'CHRONICLE_LIFECYCLE_TRANSITION_NOT_ALLOWED',
    )
  },
)

test(
  '030-A exige autorización de backend',
  () => {
    const result =
      validateChronicleLifecycleTransition(
        transition({
          authorized: false,
        }),
      )

    assert.equal(result.allowed, false)
    assert.equal(
      result.issues[0]?.code,
      'CHRONICLE_LIFECYCLE_PERMISSION_REQUIRED',
    )
  },
)

test(
  '030-A expone una aserción de transición',
  () => {
    assert.throws(
      () =>
        assertChronicleLifecycleTransition(
          transition({
            authorized: false,
          }),
        ),
      (error) =>
        error instanceof
          InvalidChronicleLifecycleTransitionError &&
        error.issues.length === 1,
    )
  },
)
