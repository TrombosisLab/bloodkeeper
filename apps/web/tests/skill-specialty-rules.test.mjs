import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addSpecialty,
  removeInvalidSpecialties,
  removeSpecialty,
  validateSpecialties,
} from '../src/features/character-creation/domain/skill-specialty-rules.ts'

import {
  createEmptySkills,
} from '../src/features/character-creation/domain/skill-rules.ts'

test(
  'permite especialidad si la habilidad tiene puntos',
  () => {
    const skills =
      createEmptySkills()

    skills.drive = 2

    const result =
      addSpecialty(
        [],
        skills,
        'drive',
        '  Motocicletas  ',
        'specialty-1',
      )

    assert.equal(result.length, 1)
    assert.equal(
      result[0].name,
      'Motocicletas',
    )
  },
)

test(
  'impide especialidad en habilidad a cero',
  () => {
    const skills =
      createEmptySkills()

    const result =
      addSpecialty(
        [],
        skills,
        'drive',
        'Motocicletas',
        'specialty-1',
      )

    assert.equal(result.length, 0)
  },
)

test(
  'evita duplicados en la misma habilidad',
  () => {
    const skills =
      createEmptySkills()

    skills.drive = 2

    const first =
      addSpecialty(
        [],
        skills,
        'drive',
        'Motocicletas',
        'specialty-1',
      )

    const second =
      addSpecialty(
        first,
        skills,
        'drive',
        'motocicletas',
        'specialty-2',
      )

    assert.equal(second.length, 1)
  },
)

test(
  'elimina especialidades explícitamente',
  () => {
    const result =
      removeSpecialty(
        [
          {
            id: 'one',
            skillKey: 'drive',
            name: 'Motocicletas',
          },
        ],
        'one',
      )

    assert.equal(result.length, 0)
  },
)

test(
  'limpia especialidades si la habilidad baja a cero',
  () => {
    const skills =
      createEmptySkills()

    const result =
      removeInvalidSpecialties(
        [
          {
            id: 'one',
            skillKey: 'drive',
            name: 'Motocicletas',
          },
        ],
        skills,
      )

    assert.equal(result.length, 0)
  },
)

test(
  'valida correctamente especialidades compatibles',
  () => {
    const skills =
      createEmptySkills()

    skills.drive = 1

    const result =
      validateSpecialties(
        [
          {
            id: 'one',
            skillKey: 'drive',
            name: 'Motocicletas',
          },
        ],
        skills,
      )

    assert.equal(result.valid, true)
  },
)
