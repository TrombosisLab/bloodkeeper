import { Injectable } from '@nestjs/common'

import {
  CharacterCreationStep as PrismaCharacterCreationStep,
  CharacterStatus as PrismaCharacterStatus,
  Prisma,
  SkillDistributionMethod as PrismaSkillDistributionMethod,
  SkillSpecialtyOrigin as PrismaSkillSpecialtyOrigin,
} from '@prisma/client'

import {
  CharacterDraftWriteConflictError,
} from '../application/character-draft.repository'

import type {
  CharacterDraftRepository,
} from '../application/character-draft.repository'

import type {
  CharacterCreationStep,
  CharacterLifecycleStatus,
  CharacterSkillKey,
  CreateCharacterDraftData,
  PersistedCharacterDraft,
  PersistedCharacterIdentity,
  PersistedCharacterSkills,
  SkillDistributionMethod,
  SkillSpecialtyOrigin,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

import {
  CHARACTER_SKILL_KEYS,
} from '../domain/persisted-character.types'

import { DatabaseService } from '../../database/database.service'

const stepToPrisma: Record<
  CharacterCreationStep,
  PrismaCharacterCreationStep
> = {
  identity: PrismaCharacterCreationStep.IDENTITY,
  attributes: PrismaCharacterCreationStep.ATTRIBUTES,
  skills: PrismaCharacterCreationStep.SKILLS,
  blood: PrismaCharacterCreationStep.BLOOD,
  disciplines: PrismaCharacterCreationStep.DISCIPLINES,
  advantages: PrismaCharacterCreationStep.ADVANTAGES,
  humanity: PrismaCharacterCreationStep.HUMANITY,
  review: PrismaCharacterCreationStep.REVIEW,
}

const stepFromPrisma: Record<
  PrismaCharacterCreationStep,
  CharacterCreationStep
> = {
  IDENTITY: 'identity',
  ATTRIBUTES: 'attributes',
  SKILLS: 'skills',
  BLOOD: 'blood',
  DISCIPLINES: 'disciplines',
  ADVANTAGES: 'advantages',
  HUMANITY: 'humanity',
  REVIEW: 'review',
}

const methodToPrisma: Record<
  SkillDistributionMethod,
  PrismaSkillDistributionMethod
> = {
  generalist: PrismaSkillDistributionMethod.GENERALIST,
  balanced: PrismaSkillDistributionMethod.BALANCED,
  specialist: PrismaSkillDistributionMethod.SPECIALIST,
}

const methodFromPrisma: Record<
  PrismaSkillDistributionMethod,
  SkillDistributionMethod
> = {
  GENERALIST: 'generalist',
  BALANCED: 'balanced',
  SPECIALIST: 'specialist',
}

const statusFromPrisma: Record<
  PrismaCharacterStatus,
  CharacterLifecycleStatus
> = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
}

const specialtyOriginToPrisma: Record<
  SkillSpecialtyOrigin,
  PrismaSkillSpecialtyOrigin
> = {
  creation: PrismaSkillSpecialtyOrigin.CREATION,
  predatorType:
    PrismaSkillSpecialtyOrigin.PREDATOR_TYPE,
}

const specialtyOriginFromPrisma: Record<
  PrismaSkillSpecialtyOrigin,
  SkillSpecialtyOrigin
> = {
  CREATION: 'creation',
  PREDATOR_TYPE: 'predatorType',
}

const characterRelations = {
  identity: true,
  creationState: true,
  attributes: true,
  blood: true,
  skills: {
    include: {
      specialties: {
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { skillKey: 'asc' },
  },
} satisfies Prisma.CharacterInclude

type CharacterWithRelations =
  Prisma.CharacterGetPayload<{
    include: typeof characterRelations
  }>

function toIdentityCreate(
  identity: Partial<PersistedCharacterIdentity>,
): Prisma.CharacterIdentityUncheckedCreateWithoutCharacterInput {
  return {
    name: identity.name ?? '',
    concept: identity.concept ?? null,
    predatorTypeKey:
      identity.predatorTypeKey ?? null,
    ambition: identity.ambition ?? null,
    clanKey: identity.clanKey ?? null,
    sire: identity.sire ?? null,
    desire: identity.desire ?? null,
    generation: identity.generation ?? null,
  }
}

const characterSkillKeySet = new Set<string>(
  CHARACTER_SKILL_KEYS,
)

function isCharacterSkillKey(
  value: string,
): value is CharacterSkillKey {
  return characterSkillKeySet.has(value)
}

function toPersistedDraft(
  row: CharacterWithRelations,
): PersistedCharacterDraft {
  if (
    row.identity === null ||
    row.creationState === null ||
    row.attributes === null ||
    row.blood === null
  ) {
    throw new Error(
      `Character ${row.id} has incomplete persistence relations`,
    )
  }

  const skills = Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (skillKey) => [skillKey, 0],
    ),
  ) as PersistedCharacterSkills

  for (const skill of row.skills) {
    if (!isCharacterSkillKey(skill.skillKey)) {
      throw new Error(
        `Character ${row.id} has unknown skill ${skill.skillKey}`,
      )
    }

    skills[skill.skillKey] = skill.rating
  }

  return {
    characterId: row.id,
    ownerId: row.ownerId,
    chronicleId: row.chronicleId,
    status: statusFromPrisma[row.status],
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    identity: {
      name: row.identity.name,
      concept: row.identity.concept,
      predatorTypeKey:
        row.identity.predatorTypeKey,
      ambition: row.identity.ambition,
      clanKey: row.identity.clanKey,
      sire: row.identity.sire,
      desire: row.identity.desire,
      generation: row.identity.generation,
    },
    creation: {
      schemaVersion:
        row.creationState.schemaVersion,
      currentStep:
        stepFromPrisma[
          row.creationState.currentStep
        ],
      skillDistributionMethod:
        methodFromPrisma[
          row.creationState
            .skillDistributionMethod
        ],
      updatedAt: row.creationState.updatedAt,
    },
    attributes: {
      strength: row.attributes.strength,
      dexterity: row.attributes.dexterity,
      stamina: row.attributes.stamina,
      charisma: row.attributes.charisma,
      manipulation:
        row.attributes.manipulation,
      composure: row.attributes.composure,
      intelligence:
        row.attributes.intelligence,
      wits: row.attributes.wits,
      resolve: row.attributes.resolve,
    },
    blood: {
      bloodPotency: row.blood.bloodPotency,
      hunger: row.blood.hunger,
    },
    skills,
    skillSpecialties: row.skills.flatMap(
      (skill) => {
        const skillKey = skill.skillKey

        if (!isCharacterSkillKey(skillKey)) {
          return []
        }

        return skill.specialties.map(
          (specialty) => ({
            id: specialty.id,
            skillKey,
            name: specialty.name,
            origin:
              specialty.origin === null
                ? null
                : specialtyOriginFromPrisma[
                    specialty.origin
                  ],
          }),
        )
      },
    ),
  }
}

@Injectable()
export class PrismaCharacterDraftRepository
  implements CharacterDraftRepository {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async create(
    data: CreateCharacterDraftData,
  ): Promise<PersistedCharacterDraft> {
    const row = await this.database.character.create({
      data: {
        ownerId: data.ownerId,
        chronicleId: data.chronicleId,
        status: PrismaCharacterStatus.DRAFT,
        identity: {
          create: toIdentityCreate(data.identity),
        },
        creationState: {
          create: {
            schemaVersion: 1,
            currentStep:
              stepToPrisma[
                data.creation.currentStep
              ],
            skillDistributionMethod:
              methodToPrisma[
                data.creation
                  .skillDistributionMethod
              ],
          },
        },
        attributes: {
          create: data.attributes,
        },
        blood: {
          create: data.blood,
        },
        skills: {
          create: CHARACTER_SKILL_KEYS.map(
            (skillKey) => ({
              skillKey,
              rating: data.skills[skillKey],
              specialties: {
                create: data.skillSpecialties
                  .filter(
                    (specialty) =>
                      specialty.skillKey === skillKey,
                  )
                  .map((specialty) => ({
                    id: specialty.id,
                    name: specialty.name,
                    origin:
                      specialty.origin === null
                        ? null
                        : specialtyOriginToPrisma[
                            specialty.origin
                          ],
                  })),
              },
            }),
          ),
        },
      },
      include: characterRelations,
    })

    return toPersistedDraft(row)
  }

  async findById(
    characterId: string,
  ): Promise<PersistedCharacterDraft | null> {
    const row =
      await this.database.character.findUnique({
        where: { id: characterId },
        include: characterRelations,
      })

    return row === null
      ? null
      : toPersistedDraft(row)
  }

  async update(
    data: UpdateCharacterDraftData,
  ): Promise<PersistedCharacterDraft> {
    return this.database.$transaction(
      async (transaction) => {
        const characterData:
          Prisma.CharacterUpdateManyMutationInput = {
            revision: { increment: 1 },
          }

        if ('chronicleId' in data) {
          characterData.chronicleId =
            data.chronicleId
        }

        const claimed =
          await transaction.character.updateMany({
            where: {
              id: data.characterId,
              revision: data.expectedRevision,
              status: PrismaCharacterStatus.DRAFT,
            },
            data: characterData,
          })

        if (claimed.count !== 1) {
          throw new CharacterDraftWriteConflictError(
            data.characterId,
          )
        }

        if (data.identity !== undefined) {
          await transaction.characterIdentity.upsert({
            where: {
              characterId: data.characterId,
            },
            create: {
              characterId: data.characterId,
              ...toIdentityCreate(data.identity),
            },
            update: data.identity,
          })
        }

        if (data.creation !== undefined) {
          const creationUpdate:
            Prisma.CharacterCreationStateUpdateInput = {}

          if (
            data.creation.currentStep !== undefined
          ) {
            creationUpdate.currentStep =
              stepToPrisma[
                data.creation.currentStep
              ]
          }

          if (
            data.creation
              .skillDistributionMethod !== undefined
          ) {
            creationUpdate.skillDistributionMethod =
              methodToPrisma[
                data.creation
                  .skillDistributionMethod
              ]
          }

          await transaction
            .characterCreationState.update({
              where: {
                characterId: data.characterId,
              },
              data: creationUpdate,
            })
        }

        if (data.attributes !== undefined) {
          await transaction.characterAttributes.update({
            where: {
              characterId: data.characterId,
            },
            data: data.attributes,
          })
        }

        if (data.blood !== undefined) {
          await transaction.characterBloodState.update({
            where: {
              characterId: data.characterId,
            },
            data: data.blood,
          })
        }

        if (data.skills !== undefined) {
          await Promise.all(
            Object.entries(data.skills).map(
              ([skillKey, rating]) =>
                transaction.characterSkill.upsert({
                  where: {
                    characterId_skillKey: {
                      characterId: data.characterId,
                      skillKey,
                    },
                  },
                  create: {
                    characterId: data.characterId,
                    skillKey,
                    rating,
                  },
                  update: { rating },
                }),
            ),
          )
        }

        if (
          data.skillSpecialties !== undefined
        ) {
          await transaction
            .characterSkillSpecialty.deleteMany({
              where: {
                characterId: data.characterId,
              },
            })

          if (data.skillSpecialties.length > 0) {
            await transaction
              .characterSkillSpecialty.createMany({
                data: data.skillSpecialties.map(
                  (specialty) => ({
                    id: specialty.id,
                    characterId: data.characterId,
                    skillKey: specialty.skillKey,
                    name: specialty.name,
                    origin:
                      specialty.origin === null
                        ? null
                        : specialtyOriginToPrisma[
                            specialty.origin
                          ],
                  }),
                ),
              })
          }
        }

        const row =
          await transaction.character.findUniqueOrThrow({
            where: { id: data.characterId },
            include: characterRelations,
          })

        return toPersistedDraft(row)
      },
    )
  }
}
