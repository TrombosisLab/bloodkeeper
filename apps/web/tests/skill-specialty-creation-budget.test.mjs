import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addSpecialty,
  getSpecialtyCreationBudget,
  validateSpecialties,
} from '../src/features/character-creation/domain/skill-specialty-rules.ts'

import {
  createEmptySkills,
} from '../src/features/character-creation/domain/skill-rules.ts'

function specialty(
  id,
  skillKey,
  name,
  origin = 'creation',
) {
  return {
    id,
    skillKey,
    name,
    origin,
  }
}

test(
  '003-L permite una sola Especialidad libre sin Habilidades automáticas',
  () => {
    const skills = createEmptySkills()
    skills.drive = 2

    const first = addSpecialty(
      [],
      skills,
      'drive',
      'Motocicletas',
      'free',
    )

    const second = addSpecialty(
      first,
      skills,
      'drive',
      'Camiones',
      'excess',
    )

    assert.equal(first.length, 1)
    assert.equal(first[0].origin, 'creation')
    assert.equal(second.length, 1)
    assert.deepEqual(
      getSpecialtyCreationBudget(first, skills),
      {
        required: 1,
        selected: 1,
        remaining: 0,
        exceeded: 0,
        mandatorySkillKeys: [],
        missingMandatorySkillKeys: [],
        complete: true,
      },
    )
  },
)

test(
  '003-L exige una Especialidad adicional por cada Habilidad automática con puntos',
  () => {
    const skills = createEmptySkills()
    skills.drive = 1
    skills.academics = 1
    skills.science = 2

    const specialties = [
      specialty('free', 'drive', 'Motocicletas'),
      specialty('academics', 'academics', 'Historia'),
      specialty('science', 'science', 'Química'),
    ]

    const budget =
      getSpecialtyCreationBudget(
        specialties,
        skills,
      )

    assert.equal(budget.required, 3)
    assert.equal(budget.selected, 3)
    assert.equal(budget.complete, true)
    assert.equal(
      validateSpecialties(
        specialties,
        skills,
        true,
      ).valid,
      true,
    )
  },
)

test(
  '003-L detecta una Habilidad automática sin su Especialidad aunque el total coincida',
  () => {
    const skills = createEmptySkills()
    skills.drive = 2
    skills.academics = 1

    const result =
      validateSpecialties(
        [
          specialty(
            'free-one',
            'drive',
            'Motocicletas',
          ),
          specialty(
            'free-two',
            'drive',
            'Camiones',
          ),
        ],
        skills,
        true,
      )

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes('Academicismo'),
      ),
    )
  },
)

test(
  '003-L excluye las Especialidades del Tipo de Depredador del cupo de creación',
  () => {
    const skills = createEmptySkills()
    skills.drive = 1
    skills.streetwise = 1

    const specialties = [
      specialty(
        'free',
        'drive',
        'Motocicletas',
      ),
      specialty(
        'predator',
        'streetwise',
        'Mercado Negro',
        'predatorType',
      ),
    ]

    const budget =
      getSpecialtyCreationBudget(
        specialties,
        skills,
      )

    assert.equal(budget.required, 1)
    assert.equal(budget.selected, 1)
    assert.equal(budget.complete, true)
    assert.equal(
      validateSpecialties(
        specialties,
        skills,
        true,
      ).valid,
      true,
    )
  },
)

test(
  '003-L mantiene incompleto el paso mientras falten Especialidades de creación',
  () => {
    const skills = createEmptySkills()
    skills.drive = 1
    skills.craft = 1

    const result =
      validateSpecialties(
        [
          specialty(
            'free',
            'drive',
            'Motocicletas',
          ),
        ],
        skills,
        true,
      )

    assert.equal(result.valid, false)
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'Debes seleccionar 2',
          ),
      ),
    )
    assert.ok(
      result.errors.some(
        (error) =>
          error.includes('Artesanía'),
      ),
    )
  },
)
