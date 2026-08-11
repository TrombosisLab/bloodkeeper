import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyCharacterAdvancement,
  normalizeCharacterAdvancementMutation,
} from '../dist/characters/domain/character-advancement-apply.rules.js'
import {
  validateCharacterAttributeSkillState,
} from '../dist/characters/domain/character-attribute-skill.rules.js'
import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const base = {
  characterId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ownerId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', chronicleId: null,
  status: 'active', revision: 4, createdAt: new Date(), updatedAt: new Date(),
  identity: { name: 'V', concept: null, predatorTypeKey: null, ambition: null, clanKey: 'tremere', sire: null, desire: null, generation: 13, ageCategory: 'neonate' },
  creation: { schemaVersion: 1, currentStep: 'review', skillDistributionMethod: 'balanced', predatorTypeChoices: {}, updatedAt: new Date() },
  attributes: { strength: 2 }, blood: { bloodPotency: 1, hunger: 1 }, damage: {}, skills: { academics: 2 },
  skillSpecialties: [], disciplines: [], bloodSorceryRituals: { ritualKeys: [] }, oblivionCeremonies: { ceremonyKeys: [] },
  thinBloodAlchemy: { rating: 1, method: null, formulaKeys: [] }, thinBloodTraits: [], advantages: { selections: [] }, humanity: {},
}
const catalog = { advantageCatalog: { definitions: [{ key: 'resources', category: 'background' }] } }

test('056-D proyecta mejoras canonicas con una sola revision', () => {
  assert.equal(applyCharacterAdvancement(base, { kind: 'attribute', key: 'strength' }, 'op').attributes.strength, 3)
  assert.equal(applyCharacterAdvancement(base, { kind: 'skill', key: 'academics' }, 'op').skills.academics, 3)
  const specialty = applyCharacterAdvancement(base, { kind: 'specialty', skillKey: 'academics', name: 'Historia' }, 'op').skillSpecialties[0]
  assert.equal(specialty.origin, 'evolution')
  assert.equal(specialty.id, 'op')
  const discipline = applyCharacterAdvancement(base, { kind: 'discipline', disciplineKey: 'auspex', powerKey: 'sense' }, 'op').disciplines[0]
  assert.equal(discipline.origin, 'evolution')
  assert.equal(discipline.rating, 1)
  const repeated = applyCharacterAdvancement(
    { ...base, disciplines: [discipline] },
    { kind: 'discipline', disciplineKey: 'auspex', powerKey: 'premonition' },
    'op-2',
  )
  assert.equal(repeated.disciplines.length, 1)
  assert.equal(repeated.disciplines[0].rating, 2)
  assert.deepEqual(repeated.disciplines[0].powerKeys, ['sense', 'premonition'])
})

test('056-D normaliza Ventaja nueva y conserva detalles estructurados', () => {
  const mutation = normalizeCharacterAdvancementMutation(base, {
    kind: 'advantage', definitionKey: 'resources', selectionId: null, targetRating: 2,
    details: { kind: 'resources', source: 'Biblioteca' }, parentSelectionId: null,
  }, 'operation-id', catalog)
  assert.equal(mutation.selectionId, 'operation-id')
  const projected = applyCharacterAdvancement(base, mutation, 'operation-id')
  assert.equal(projected.advantages.selections[0].origin, 'evolution')
  assert.deepEqual(projected.advantages.selections[0].details, { kind: 'resources', source: 'Biblioteca' })
})

test('056-D separa maximos de evolucion de presupuestos de creacion', () => {
  const attributes = {
    strength: 5, dexterity: 1, stamina: 1,
    charisma: 1, manipulation: 1, composure: 1,
    intelligence: 1, wits: 1, resolve: 1,
  }
  const skills = Object.fromEntries(CHARACTER_SKILL_KEYS.map((key) => [key, key === 'athletics' ? 5 : 0]))
  const violations = validateCharacterAttributeSkillState(
    attributes,
    skills,
    'balanced',
    'identity',
    [{ id: 'evo', skillKey: 'athletics', name: 'Carrera', origin: 'evolution' }],
    skills,
    5,
  )
  assert.deepEqual(violations, [])
})
