import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createEmptySkills,
  randomizeSkills,
  updateSkill,
  validateSkillDistribution,
} from '../src/features/character-creation/domain/skill-rules.ts'

const methods = [
  'generalist',
  'balanced',
  'specialist',
]

test(
  'un borrador nuevo tiene 27 habilidades a cero',
  () => {
    const skills =
      createEmptySkills()

    assert.equal(
      Object.keys(skills).length,
      27,
    )

    assert.ok(
      Object.values(skills).every(
        (value) => value === 0,
      ),
    )
  },
)

test(
  'los repartos aleatorios son válidos para los tres métodos',
  () => {
    for (
      const method of methods
    ) {
      for (
        let iteration = 0;
        iteration < 300;
        iteration += 1
      ) {
        const skills =
          randomizeSkills(method)

        const result =
          validateSkillDistribution(
            skills,
            method,
          )

        assert.equal(
          result.valid,
          true,
        )
      }
    }
  },
)

test(
  'una distribución vacía es inválida',
  () => {
    const result =
      validateSkillDistribution(
        createEmptySkills(),
        'balanced',
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'actualizar habilidad respeta límites 0 y 4',
  () => {
    const skills =
      createEmptySkills()

    const below =
      updateSkill(
        skills,
        'athletics',
        -8,
      )

    const above =
      updateSkill(
        skills,
        'athletics',
        20,
      )

    assert.equal(
      below.athletics,
      0,
    )

    assert.equal(
      above.athletics,
      4,
    )
  },
)
