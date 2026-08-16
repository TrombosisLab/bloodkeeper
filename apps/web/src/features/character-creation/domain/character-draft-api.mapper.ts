import {
  initialCharacterDraft,
} from '../data/initial-character-draft.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CreationStepId,
} from '../types/creation-step.types.ts'

import type {
  ClanKey,
} from '../types/clan.types.ts'

import type {
  CharacterGeneration,
} from '../types/character-generation.types.ts'

import type {
  CharacterDraftApiCreationMode,
  CharacterDraftApiDamage,
  CharacterDraftApiLifecycleStatus,
  CharacterDraftApiNature,
  CharacterDraftApiSnapshot,
  CreateCharacterDraftApiRequest,
  UpdateCharacterDraftApiRequest,
} from '../types/character-draft-api.types.ts'

export interface CharacterDraftApiEditorState {
  characterId: string
  ownerId: string
  chronicleId: string | null
  status: CharacterDraftApiLifecycleStatus
  nature: CharacterDraftApiNature
  revision: number
  createdAt: string
  updatedAt: string
  creationSchemaVersion: number
  creationMode: CharacterDraftApiCreationMode
  creationUpdatedAt: string
  currentStepId: CreationStepId
  damage: CharacterDraftApiDamage
  humanityStains: number
  draft: CharacterDraft
}

export interface CharacterDraftCreateMappingOptions {
  currentStepId: CreationStepId
  creationMode?: CharacterDraftApiCreationMode
  chronicleId?: string | null
  humanityStains?: number
}

export interface CharacterDraftUpdateMappingOptions {
  expectedRevision: number
  creationMode?: CharacterDraftApiCreationMode
  currentStepId: CreationStepId
  chronicleId: string | null
  humanityStains: number
  damage?: CharacterDraftApiDamage
}

function nullableText(
  value: string,
): string | null {
  return value.trim().length === 0
    ? null
    : value
}

function draftIdentityToApi(
  draft: CharacterDraft,
): CreateCharacterDraftApiRequest['identity'] {
  return {
    name: draft.identity.name,
    concept:
      nullableText(draft.identity.concept),
    predatorTypeKey:
      nullableText(
        draft.identity.predatorType,
      ),
    ambition:
      nullableText(draft.identity.ambition),
    clanKey: draft.identity.clan,
    sire:
      nullableText(draft.identity.sire),
    desire:
      nullableText(draft.identity.desire),
    generation:
      draft.identity.generation,
    ageCategory:
      draft.identity.ageCategory,
  }
}

function draftSpecialtiesToApi(
  draft: CharacterDraft,
): CreateCharacterDraftApiRequest['skillSpecialties'] {
  return draft.skillSpecialties.map(
    (specialty) => ({
      id: specialty.id,
      skillKey: specialty.skillKey,
      name: specialty.name,
      origin: specialty.origin ?? null,
    }),
  )
}

function draftDisciplinesToApi(
  draft: CharacterDraft,
): CreateCharacterDraftApiRequest['disciplines'] {
  return draft.disciplines.map(
    (discipline) => ({
      disciplineKey: discipline.key,
      rating: discipline.value,
      powerKeys: [...discipline.powerKeys],
      origin: discipline.origin ?? null,
    }),
  )
}

function draftThinBloodTraitsToApi(
  draft: CharacterDraft,
): CreateCharacterDraftApiRequest['thinBloodTraits'] {
  return draft.thinBloodTraits.selections.map(
    (selection) => ({
      definitionKey:
        selection.definitionKey,
      clanCurseDetails:
        selection.clanCurseDetails === undefined
          ? null
          : {
              ...selection.clanCurseDetails,
            },
      disciplineAffinityDetails:
        selection.disciplineAffinityDetails ===
        undefined
          ? null
          : {
              ...selection
                .disciplineAffinityDetails,
            },
    }),
  )
}

function draftAdvantagesToApi(
  draft: CharacterDraft,
): CreateCharacterDraftApiRequest['advantages'] {
  return {
    selections:
      draft.advantages.selections.map(
        (selection) => ({
          selectionId:
            selection.selectionId,
          definitionKey:
            selection.definitionKey,
          category: selection.category,
          rating: selection.rating,
          origin: selection.origin,
          parentSelectionId:
            selection.parentSelectionId ??
            null,
          details:
            selection.details === undefined
              ? null
              : structuredClone(
                  selection.details,
                ),
        }),
      ),
  }
}

function draftHumanityToApi(
  draft: CharacterDraft,
  stains: number,
): CreateCharacterDraftApiRequest['humanity'] {
  return {
    value: draft.humanity.value,
    stains,
    convictions:
      draft.humanity.convictions.map(
        (conviction) => ({
          ...conviction,
        }),
      ),
    touchstones:
      draft.humanity.touchstones.map(
        (touchstone) => ({
          ...touchstone,
        }),
      ),
  }
}

export function mapCharacterDraftToCreateRequest(
  draft: CharacterDraft,
  options: CharacterDraftCreateMappingOptions,
): CreateCharacterDraftApiRequest {
  const creationMode =
    options.creationMode ?? 'standard'
  const sessionZero =
    creationMode === 'sessionZero'
  const identity =
    draftIdentityToApi(draft)

  return {
    chronicleId: options.chronicleId ?? null,
    identity:
      sessionZero
        ? {
            ...identity,
            predatorTypeKey: null,
            clanKey: null,
            sire: null,
            generation: null,
            ageCategory: null,
          }
        : identity,
    attributes: {
      ...draft.attributes,
    },
    blood:
      sessionZero
        ? null
        : {
            ...draft.blood,
          },
    skills: {
      ...draft.skills,
    },
    skillSpecialties:
      draftSpecialtiesToApi(draft),
    disciplines:
      sessionZero
        ? []
        : draftDisciplinesToApi(draft),
    bloodSorceryRituals: {
      ritualKeys:
        sessionZero
          ? []
          : [...draft.bloodSorceryRituals.ritualKeys],
    },
    oblivionCeremonies: {
      ceremonyKeys:
        sessionZero
          ? []
          : [...draft.oblivionCeremonies.ceremonyKeys],
    },
    thinBloodAlchemy:
      sessionZero
        ? null
        : {
            rating: draft.thinBloodAlchemy.rating,
            method: draft.thinBloodAlchemy.method,
            formulaKeys: [...draft.thinBloodAlchemy.formulaKeys],
          },
    thinBloodTraits:
      sessionZero
        ? []
        : draftThinBloodTraitsToApi(draft),
    advantages:
      draftAdvantagesToApi(draft),
    humanity:
      draftHumanityToApi(
        draft,
        options.humanityStains ?? 0,
      ),
    creation: {
      creationMode,
      currentStep: options.currentStepId,
      skillDistributionMethod: draft.skillDistributionMethod,
      predatorTypeChoices:
        sessionZero
          ? {}
          : {...(draft.predatorTypeChoices ?? {})},
    },
  }
}

export function mapCharacterDraftToUpdateRequest(
  draft: CharacterDraft,
  options: CharacterDraftUpdateMappingOptions,
): UpdateCharacterDraftApiRequest {
  const creationMode =
    options.creationMode ?? 'standard'
  const sessionZero =
    creationMode === 'sessionZero'

  const createRequest =
    mapCharacterDraftToCreateRequest(
      draft,
      {
        currentStepId: options.currentStepId,
        creationMode,
        chronicleId: options.chronicleId,
        humanityStains: options.humanityStains,
      },
    )

  const vampireFields =
    !sessionZero &&
    createRequest.blood !== null &&
    createRequest.thinBloodAlchemy !== null
      ? {
          blood: createRequest.blood,
          disciplines: createRequest.disciplines,
          bloodSorceryRituals: createRequest.bloodSorceryRituals,
          oblivionCeremonies: createRequest.oblivionCeremonies,
          thinBloodAlchemy: createRequest.thinBloodAlchemy,
          thinBloodTraits: createRequest.thinBloodTraits,
        }
      : {}

  return {
    expectedRevision: options.expectedRevision,
    chronicleId: createRequest.chronicleId,
    identity: createRequest.identity,
    attributes: createRequest.attributes,
    ...vampireFields,
    ...(options.damage === undefined
      ? {}
      : {damage: structuredClone(options.damage)}),
    skills: createRequest.skills,
    skillSpecialties: createRequest.skillSpecialties,
    advantages: createRequest.advantages,
    humanityValue: createRequest.humanity.value,
    humanityStains: createRequest.humanity.stains,
    humanityNarrative: {
      convictions: createRequest.humanity.convictions,
      touchstones: createRequest.humanity.touchstones,
    },
    creation: {
      currentStep: createRequest.creation.currentStep,
      skillDistributionMethod:
        createRequest.creation.skillDistributionMethod,
      predatorTypeChoices:
        createRequest.creation.predatorTypeChoices,
    },
  }
}

function nullableTextToDraft(
  value: string | null,
): string {
  return value ?? ''
}

export function mapCharacterDraftApiSnapshotToEditorState(
  snapshot: CharacterDraftApiSnapshot,
): CharacterDraftApiEditorState {
  const draft: CharacterDraft = {
    identity: {
      name: snapshot.identity.name,
      concept:
        nullableTextToDraft(
          snapshot.identity.concept,
        ),
      predatorType:
        nullableTextToDraft(
          snapshot.identity
            .predatorTypeKey,
        ),
      /*
       * La API conserva la relación por chronicleId.
       * El campo textual legacy no puede reconstruirse
       * sin cargar el catálogo de Crónicas.
       */
      chronicle: '',
      ambition:
        nullableTextToDraft(
          snapshot.identity.ambition,
        ),
      clan:
        snapshot.identity
          .clanKey as ClanKey | null,
      sire:
        nullableTextToDraft(
          snapshot.identity.sire,
        ),
      desire:
        nullableTextToDraft(
          snapshot.identity.desire,
        ),
      generation:
        snapshot.identity
          .generation as
            CharacterGeneration | null,
      ageCategory:
        snapshot.identity.ageCategory,
    },

    predatorTypeChoices: {
      ...snapshot.creation
        .predatorTypeChoices,
    },

    attributes: {
      ...snapshot.attributes,
    },

    blood:
      snapshot.blood === null
        ? structuredClone(initialCharacterDraft.blood)
        : {
            ...snapshot.blood,
          },

    skills: {
      ...snapshot.skills,
    },

    skillSpecialties:
      snapshot.skillSpecialties.map(
        (specialty) => ({
          id: specialty.id,
          skillKey:
            specialty.skillKey,
          name: specialty.name,
          ...(specialty.origin === null
            ? {}
            : {
                origin:
                  specialty.origin,
              }),
        }),
      ),

    disciplines:
      snapshot.disciplines.map(
        (discipline) => ({
          key:
            discipline.disciplineKey,
          value: discipline.rating,
          powerKeys: [
            ...discipline.powerKeys,
          ],
          ...(discipline.origin === null
            ? {}
            : {
                origin:
                  discipline.origin,
              }),
        }),
      ),

    bloodSorceryRituals: {
      ritualKeys: [
        ...snapshot
          .bloodSorceryRituals
          .ritualKeys,
      ],
    },

    oblivionCeremonies: {
      ceremonyKeys: [
        ...snapshot
          .oblivionCeremonies
          .ceremonyKeys,
      ],
    },

    thinBloodAlchemy:
      snapshot.thinBloodAlchemy === null
        ? structuredClone(initialCharacterDraft.thinBloodAlchemy)
        : {
            rating: snapshot.thinBloodAlchemy.rating,
            method: snapshot.thinBloodAlchemy.method,
            formulaKeys: [...snapshot.thinBloodAlchemy.formulaKeys],
          },

    thinBloodTraits: {
      selections:
        snapshot.thinBloodTraits.map(
          (selection) => ({
            definitionKey:
              selection.definitionKey,
            ...(selection
              .clanCurseDetails === null
              ? {}
              : {
                  clanCurseDetails: {
                    clanKey:
                      selection
                        .clanCurseDetails
                        .clanKey as ClanKey,
                  },
                }),
            ...(selection
              .disciplineAffinityDetails ===
            null
              ? {}
              : {
                  disciplineAffinityDetails: {
                    ...selection
                      .disciplineAffinityDetails,
                  },
                }),
          }),
        ),
    },

    advantages: {
      selections:
        snapshot.advantages.selections.map(
          (selection) => ({
            selectionId:
              selection.selectionId,
            definitionKey:
              selection.definitionKey,
            category:
              selection.category,
            rating:
              selection.rating,
            origin:
              selection.origin,
            ...(selection
              .parentSelectionId === null
              ? {}
              : {
                  parentSelectionId:
                    selection
                      .parentSelectionId,
                }),
            ...(selection.details === null
              ? {}
              : {
                  details:
                    structuredClone(
                      selection.details,
                    ),
                }),
          }),
        ),
    },

    humanity: {
      value:
        snapshot.humanity.value,
      convictions:
        snapshot.humanity.convictions.map(
          (conviction) => ({
            ...conviction,
          }),
        ),
      touchstones:
        snapshot.humanity.touchstones.map(
          (touchstone) => ({
            ...touchstone,
          }),
        ),
    },

    skillDistributionMethod:
      snapshot.creation
        .skillDistributionMethod,
  }

  return {
    characterId:
      snapshot.characterId,
    ownerId:
      snapshot.ownerId,
    chronicleId:
      snapshot.chronicleId,
    status:
      snapshot.status,
    nature:
      snapshot.nature,
    revision:
      snapshot.revision,
    createdAt:
      snapshot.createdAt,
    updatedAt:
      snapshot.updatedAt,
    creationSchemaVersion:
      snapshot.creation.schemaVersion,
    creationMode:
      snapshot.creation.creationMode,
    creationUpdatedAt:
      snapshot.creation.updatedAt,
    currentStepId:
      snapshot.creation.currentStep,
    damage:
      structuredClone(snapshot.damage),
    humanityStains:
      snapshot.humanity.stains,
    draft,
  }
}
