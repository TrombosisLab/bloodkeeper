import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizePredatorTypeSkillGrant } from '../src/features/character-creation/domain/predator-type-skill-grant-rules.ts'

const specialty = {
  id: 'predatorType:consensualist:specialty:medicine:Flebotomía',
  skillKey: 'medicine',
  name: 'Flebotomía',
  origin: 'predatorType',
}

function draftWithFlebotomy() {
  return {
    identity: { predatorType: 'consensualist', clan: 'malkavian' },
    predatorTypeChoices: { 'consensualist-specialty': 0 },
    skills: { medicine: 1 },
    skillSpecialties: [specialty],
  }
}

test('con Medicina base 0 concede el punto gratuito en vez de Flebotomía', () => {
  const result = normalizePredatorTypeSkillGrant(
    draftWithFlebotomy(),
    { medicine: 0 },
  )
  assert.equal(result.skills.medicine, 1)
  assert.deepEqual(result.skillSpecialties, [])
})

test('con Medicina base 1 conserva Flebotomía como especialidad concedida', () => {
  const result = normalizePredatorTypeSkillGrant(
    draftWithFlebotomy(),
    { medicine: 1 },
  )
  assert.equal(result.skills.medicine, 1)
  assert.deepEqual(result.skillSpecialties, [specialty])
})
