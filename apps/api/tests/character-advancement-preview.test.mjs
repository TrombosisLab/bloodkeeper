import assert from 'node:assert/strict'
import test from 'node:test'
import {
  previewCharacterAdvancement,
} from '../dist/characters/domain/character-advancement-cost.rules.js'

const character = {
  characterId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  ownerId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  chronicleId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  status: 'active', revision: 7,
  identity: { clanKey: 'tremere', generation: 13 },
  attributes: { strength: 2 },
  skills: { academics: 2 },
  skillSpecialties: [],
  disciplines: [{ disciplineKey: 'bloodSorcery', rating: 2, powerKeys: ['power-one', 'power-two'] }],
  bloodSorceryRituals: { ritualKeys: [] },
  oblivionCeremonies: { ceremonyKeys: [] },
  thinBloodAlchemy: { rating: 0, formulaKeys: [] },
  advantages: { selections: [] },
  blood: { bloodPotency: 1 },
}
const catalog = {
  disciplineCatalog: {
    disciplines: [{ key: 'bloodSorcery', active: true }],
    powers: [{ key: 'power-three', disciplineKey: 'bloodSorcery', level: 3, active: true }],
    clanAffinities: [{ clanKey: 'tremere', kind: 'clan', disciplineKeys: ['bloodSorcery'] }],
    bloodSorceryRituals: [{ key: 'ritual-2', level: 2 }],
    thinBloodAlchemyFormulas: [], oblivionCeremonies: [],
  },
  advantageCatalog: { definitions: [] },
}

test('056-C usa estado real y solo permite el nivel siguiente', () => {
  const preview = previewCharacterAdvancement(character, 20, { kind: 'attribute', key: 'strength' }, catalog)
  assert.equal(preview.currentRating, 2)
  assert.equal(preview.newRating, 3)
  assert.equal(preview.cost, 15)
  assert.equal(preview.eligible, true)
})

test('056-C resuelve Disciplina de Clan desde catalogo backend', () => {
  const preview = previewCharacterAdvancement(character, 20, {
    kind: 'discipline', disciplineKey: 'bloodSorcery', powerKey: 'power-three',
  }, catalog)
  assert.equal(preview.cost, 15)
  assert.ok(preview.consequences.includes('discipline_cost_class:clan'))
})

test('056-C informa Experiencia insuficiente sin escribir', () => {
  const preview = previewCharacterAdvancement(character, 2, { kind: 'skill', key: 'academics' }, catalog)
  assert.equal(preview.eligible, false)
  assert.ok(preview.issues.some(({ code }) => code === 'EXPERIENCE_INSUFFICIENT'))
})
