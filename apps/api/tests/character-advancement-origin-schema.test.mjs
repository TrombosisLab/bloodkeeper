import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
const migration = readFileSync(new URL('../prisma/migrations/20260811090000_add_evolution_acquisition_origins/migration.sql', import.meta.url), 'utf8')

test('056-D registra origen evolution en modelos canonicos', () => {
  const expectedEnums = [
    `enum SkillSpecialtyOrigin {
  CREATION
  PREDATOR_TYPE
  EVOLUTION
}`,
    `enum DisciplineOrigin {
  CREATION
  PREDATOR_TYPE
  THIN_BLOOD
  EVOLUTION
}`,
    `enum AdvantageSelectionOrigin {
  CREATION
  PREDATOR_TYPE
  THIN_BLOOD
  EVOLUTION
}`,
  ]
  for (const enumDeclaration of expectedEnums) {
    assert.ok(schema.includes(enumDeclaration))
  }
  assert.equal((migration.match(/ADD VALUE 'EVOLUTION'/g) ?? []).length, 3)
})
