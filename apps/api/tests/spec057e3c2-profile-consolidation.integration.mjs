import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { DatabaseService } from '../dist/database/database.service.js'
import {
  ResolveInitialVampireStateUseCase,
  deriveInitialVampireProfileConsolidationHistoryEntryId,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'
import {
  characterCoreValidationContributor,
} from '../dist/characters/domain/character-core-validation.contributor.js'
import {
  createCharacterAdvantageValidationContributor,
} from '../dist/characters/domain/character-advantage-validation.contributor.js'
import {
  createCharacterDependencyValidationContributor,
} from '../dist/characters/domain/character-dependency-validation.contributor.js'
import {
  createCharacterDisciplineValidationContributor,
} from '../dist/characters/domain/character-discipline-validation.contributor.js'
import {
  CHARACTER_PROFILE_CONSOLIDATION_HISTORY_TITLE,
} from '../dist/characters/domain/character-initial-vampire-resolution.types.js'
import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'
import { CharacterValidator } from '../dist/characters/domain/character-validator.js'
import { PrismaCharacterDraftRepository } from '../dist/characters/infrastructure/prisma-character-draft.repository.js'
import { CHARACTER_SKILL_KEYS } from '../dist/characters/domain/persisted-character.types.js'

function balancedSkills() {
  const ratings = [
    ...Array(7).fill(1),
    ...Array(5).fill(2),
    ...Array(3).fill(3),
  ]
  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map((key, index) => [key, ratings[index] ?? 0]),
  )
}

function humanCreateData(ownerId) {
  const touchstoneId = randomUUID()
  return {
    ownerId,
    chronicleId: null,
    identity: {
      name: 'E3-C2', concept: 'Consolidación Sangre Débil',
      predatorTypeKey: null, ambition: null, clanKey: null,
      sire: null, desire: null, generation: null, ageCategory: null,
    },
    attributes: {
      strength: 4, dexterity: 3, stamina: 3,
      charisma: 3, manipulation: 2, composure: 2,
      intelligence: 2, wits: 2, resolve: 1,
    },
    blood: null,
    skills: balancedSkills(),
    skillSpecialties: [
      { id: randomUUID(), skillKey: 'drive', name: 'Motocicletas', origin: 'creation' },
      { id: randomUUID(), skillKey: 'craft', name: 'Carpintería', origin: 'creation' },
      { id: randomUUID(), skillKey: 'performance', name: 'Canto', origin: 'creation' },
    ],
    disciplines: [],
    bloodSorceryRituals: { ritualKeys: [] },
    oblivionCeremonies: { ceremonyKeys: [] },
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: {
      selections: [
        {
          selectionId: randomUUID(), definitionKey: 'resources',
          category: 'background', rating: 5, origin: 'creation',
          parentSelectionId: null, details: { kind: 'resources', source: 'Patrimonio' },
        },
        {
          selectionId: randomUUID(), definitionKey: 'contacts',
          category: 'background', rating: 2, origin: 'creation',
          parentSelectionId: null, details: { kind: 'contact', identity: 'Periodista' },
        },
        {
          selectionId: randomUUID(), definitionKey: 'repulsive',
          category: 'flaw', rating: 2, origin: 'creation',
          parentSelectionId: null, details: null,
        },
      ],
    },
    humanity: {
      value: 7,
      stains: 0,
      convictions: [
        {
          convictionId: randomUUID(),
          text: 'Protege a quienes dependen de ti',
          touchstoneId,
        },
      ],
      touchstones: [
        { touchstoneId, name: 'Elena', relationship: 'Hermana mortal' },
      ],
    },
    creation: {
      creationMode: 'sessionZero',
      currentStep: 'review',
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
    },
  }
}

function makeValidator() {
  return new CharacterValidator([
    characterCoreValidationContributor,
    createCharacterDisciplineValidationContributor(characterRulesCatalog),
    createCharacterAdvantageValidationContributor(characterRulesCatalog),
    createCharacterDependencyValidationContributor(characterRulesCatalog),
  ])
}

test('057-E3C2 consolida exactamente una vez con historial atómico y sin XP', async () => {
  const database = new DatabaseService()
  const repository = new PrismaCharacterDraftRepository(database)
  const ownerId = randomUUID()
  const foreignOwnerId = randomUUID()
  let characterId = null
  await database.$connect()
  try {
    await database.user.createMany({
      data: [
        {
          id: ownerId,
          username: `spec057e3c2-${ownerId}`,
          displayName: 'SPEC-057-E3C2 owner',
          passwordHash: 'integration-test-only',
        },
        {
          id: foreignOwnerId,
          username: `spec057e3c2-${foreignOwnerId}`,
          displayName: 'SPEC-057-E3C2 foreign',
          passwordHash: 'integration-test-only',
        },
      ],
    })

    const human = await repository.create(humanCreateData(ownerId))
    characterId = human.characterId
    const embraced = await repository.embrace({
      characterId,
      expectedRevision: human.revision,
      historyEntryId: randomUUID(),
    })

    const useCase = new ResolveInitialVampireStateUseCase(
      repository,
      { async findActiveMembership() { throw new Error('unused') } },
      characterRulesCatalog,
      makeValidator(),
    )

    const clan = await useCase.resolveClan(ownerId, {
      characterId,
      expectedRevision: embraced.revision,
      clanKey: 'thinBlood',
    })
    const generation = await useCase.resolveGeneration(ownerId, {
      characterId,
      expectedRevision: clan.character.revision,
      generation: 14,
    })
    const blood = await useCase.establishBlood(ownerId, {
      characterId,
      expectedRevision: generation.character.revision,
      bloodPotency: 0,
      hunger: 1,
    })
    const resolved = await useCase.resolveThinBloodState(ownerId, {
      characterId,
      expectedRevision: blood.character.revision,
      thinBloodTraits: [
        {
          definitionKey: 'day-drinker',
          clanCurseDetails: null,
          disciplineAffinityDetails: null,
        },
        {
          definitionKey: 'baby-teeth',
          clanCurseDetails: null,
          disciplineAffinityDetails: null,
        },
      ],
      thinBloodAlchemy: { rating: 0, method: null, formulaKeys: [] },
    })

    const strict = makeValidator().validate(resolved.character, 'activation')
    assert.equal(strict.valid, true, JSON.stringify(strict.issues, null, 2))
    assert.equal(resolved.character.identity.sire, null)

    await assert.rejects(
      useCase.consolidateProfile(foreignOwnerId, {
        characterId,
        expectedRevision: resolved.character.revision,
      }),
    )
    assert.equal(
      await database.characterHistoryEntry.count({
        where: { characterId, title: CHARACTER_PROFILE_CONSOLIDATION_HISTORY_TITLE },
      }),
      0,
    )

    const markerId =
      deriveInitialVampireProfileConsolidationHistoryEntryId(
        characterId,
      )

    await database.characterHistoryEntry.create({
      data: {
        id: markerId,
        characterId,
        title: 'Colisión E3-C2',
        description: 'Fuerza rollback.',
      },
    })
    await assert.rejects(
      repository.consolidateInitialVampireProfile({
        characterId,
        expectedRevision: resolved.character.revision,
        historyEntryId: markerId,
      }),
    )
    const afterRollback = await repository.findByCharacterId(characterId)
    assert.ok(afterRollback)
    assert.equal(afterRollback.revision, resolved.character.revision)
    assert.equal(
      await database.characterHistoryEntry.count({
        where: { characterId, title: CHARACTER_PROFILE_CONSOLIDATION_HISTORY_TITLE },
      }),
      0,
    )
    await database.characterHistoryEntry.delete({
      where: {
        id: markerId,
      },
    })

    const narrativeSameTitleId = randomUUID()
    await database.characterHistoryEntry.create({
      data: {
        id: narrativeSameTitleId,
        characterId,
        title:
          CHARACTER_PROFILE_CONSOLIDATION_HISTORY_TITLE,
        description:
          'Entrada narrativa ordinaria con el mismo título.',
      },
    })

    const historyBefore =
      await database.characterHistoryEntry.count({
        where: {
          characterId,
        },
      })

    const consolidated = await useCase.consolidateProfile(ownerId, {
      characterId,
      expectedRevision: resolved.character.revision,
    })
    assert.equal(consolidated.phase, 'ESTABLISHED_VAMPIRE')
    assert.equal(consolidated.character.revision, resolved.character.revision + 1)
    assert.equal(consolidated.character.identity.sire, null)
    assert.equal(consolidated.pendingDecisions.includes('sire'), true)
    assert.equal(
      await database.characterHistoryEntry.count({ where: { characterId } }),
      historyBefore + 1,
    )
    assert.equal(
      await database.characterHistoryEntry.count({
        where: {
          id: markerId,
          characterId,
          title:
            CHARACTER_PROFILE_CONSOLIDATION_HISTORY_TITLE,
        },
      }),
      1,
    )
    assert.equal(
      await database.characterHistoryEntry.count({
        where: {
          characterId,
          title:
            CHARACTER_PROFILE_CONSOLIDATION_HISTORY_TITLE,
        },
      }),
      2,
    )
    assert.equal(
      await database.characterExperienceMovement.count({ where: { characterId } }),
      0,
    )

    const repeatedWithOriginalRevision =
      await useCase.consolidateProfile(
        ownerId,
        {
          characterId,
          expectedRevision:
            resolved.character.revision,
        },
      )

    assert.equal(
      repeatedWithOriginalRevision.phase,
      'ESTABLISHED_VAMPIRE',
    )
    assert.equal(
      repeatedWithOriginalRevision.character.revision,
      consolidated.character.revision,
    )

    const repeatedWithCurrentRevision =
      await useCase.consolidateProfile(
        ownerId,
        {
          characterId,
          expectedRevision:
            consolidated.character.revision,
        },
      )

    assert.equal(
      repeatedWithCurrentRevision.phase,
      'ESTABLISHED_VAMPIRE',
    )
    assert.equal(
      repeatedWithCurrentRevision.character.revision,
      consolidated.character.revision,
    )

    assert.equal(
      await database.characterHistoryEntry.count({
        where: {
          id: markerId,
          characterId,
        },
      }),
      1,
    )
    assert.equal(
      await database.characterHistoryEntry.count({
        where: {
          characterId,
        },
      }),
      historyBefore + 1,
    )
  } finally {
    if (characterId !== null) {
      await database.character.deleteMany({ where: { id: characterId } })
    }
    await database.user.deleteMany({ where: { id: { in: [ownerId, foreignOwnerId] } } })
    await database.$disconnect()
  }
})
