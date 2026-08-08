import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CharacterSkillsDraft,
} from '../types/character-skills-draft.types.ts'

import {
  normalizeCharacterDraftRituals,
} from './blood-sorcery-ritual-draft-rules.ts'

import {
  normalizeBloodForGeneration,
} from './blood-rules.ts'

import {
  normalizeDisciplinesForClan,
} from './discipline-rules.ts'
import {
  normalizeDisciplinePowers,
} from './discipline-power-rules.ts'
import {
  disciplinePowerDefinitions,
} from '../data/discipline-power-definitions.ts'

import {
  normalizePredatorTypeForCharacter,
} from './predator-type-rules.ts'

import {
  normalizeThinBloodAlchemyForCharacter,
} from './thin-blood-alchemy-rules.ts'

import {
  normalizeCharacterDraftPredatorType,
} from './predator-type-draft-rules.ts'

import {
  normalizePredatorTypeSkillGrant,
  resolvePredatorTypeCreationSkills,
} from './predator-type-skill-grant-rules.ts'

import {
  getPredatorTypePointDistributionSelections,
  restorePredatorTypePointDistributionSelections,
} from './predator-type-point-distribution-draft-rules.ts'

import {
  normalizeCharacterDraftOblivionCeremonies,
} from './oblivion-ceremony-draft-rules.ts'

/*
 * Punto único de mantenimiento de invariantes del CharacterDraft.
 *
 * Toda modificación del borrador deberá terminar pasando por
 * esta función.
 *
 * Las normalizaciones se ejecutan en un orden explícito para
 * respetar las dependencias entre subsistemas.
 */
export function normalizeCharacterDraft(
  draft: CharacterDraft,
  creationSkillsOverride?: CharacterSkillsDraft,
): CharacterDraft {

  const creationSkills =
    creationSkillsOverride ??
    resolvePredatorTypeCreationSkills(
      draft,
    )

  let normalized = draft

  /*
   * Futuros bloques:
   *
   * normalized =
   *   normalizeBlood(...)
   *
   * normalized =
   *   normalizeDisciplines(...)
   *
   * normalized =
   *   normalizeThinBloodTraits(...)
   *
   * normalized =
   *   normalizeThinBloodAlchemy(...)
   */

  if (
    normalized.identity.generation !== null
  ) {
    normalized = {
      ...normalized,
      blood: normalizeBloodForGeneration(
        normalized.blood,
        normalized.identity.generation,
      ),
    }
  }

  /*
   * La normalización de clan sólo debe filtrar las
   * Disciplinas sometidas a dicha regla.
   *
   * Las concesiones del Tipo de Depredador deben llegar
   * intactas a normalizeCharacterDraftPredatorType para
   * que ese subsistema pueda retirarlas, reaplicarlas o
   * conservar sus Poderes según la selección vigente.
   */
  const predatorTypeDisciplines =
    normalized.disciplines.filter(
      discipline =>
        discipline.origin ===
        'predatorType',
    )

  const clanNormalizedDisciplines =
    normalized.disciplines.filter(
      discipline =>
        discipline.origin !==
        'predatorType',
    )

  normalized = {
    ...normalized,
    disciplines:
      normalized.identity.clan === null
        ? []
        : [
            ...normalizeDisciplinesForClan(
              clanNormalizedDisciplines,
              normalized.identity.clan,
            ),
            ...predatorTypeDisciplines,
          ],
  }


  const normalizedPredatorType =
    normalizePredatorTypeForCharacter(
      normalized.identity.predatorType,
      normalized.identity.clan,
    )

  normalized = {
    ...normalized,

    identity: {
      ...normalized.identity,

      predatorType:
        normalizedPredatorType,
    },

    predatorTypeChoices:
      normalizedPredatorType === ''
        ? {}
        : normalized.predatorTypeChoices ?? {},
  }


  const predatorTypePointDistributionSelections =
    getPredatorTypePointDistributionSelections(
      normalized.identity.predatorType,
      normalized.advantages,
    )

  normalized =
    normalizeCharacterDraftPredatorType(
      normalized,
    )

  normalized = {
    ...normalized,

    advantages:
      restorePredatorTypePointDistributionSelections(
        normalized.identity.predatorType,
        normalized.predatorTypeChoices ?? {},
        predatorTypePointDistributionSelections,
        normalized.advantages,
      ),
  }

  normalized =
    normalizePredatorTypeSkillGrant(
      normalized,
      creationSkills,
    )

  normalized = {
    ...normalized,
    disciplines:
      normalizeDisciplinePowers(
        disciplinePowerDefinitions,
        normalized.disciplines,
      ),
  }

  /*
   * Los datos exclusivos de Sangre Débil sólo pueden
   * conservarse mientras el personaje siga siendo
   * Sangre Débil.
   *
   * El coordinador establece primero el estado de rasgos
   * y después delega la consistencia de Alquimia en su
   * módulo correspondiente.
   */
  normalized = {
    ...normalized,

    thinBloodTraits:
      normalized.identity.clan ===
      'thinBlood'
        ? normalized.thinBloodTraits
        : {
            selections: [],
          },
  }

  normalized = {
    ...normalized,

    thinBloodAlchemy:
      normalizeThinBloodAlchemyForCharacter(
        normalized.thinBloodAlchemy,
        normalized.identity.clan,
        normalized.thinBloodTraits,
      ),
  }

  normalized =
    normalizeCharacterDraftRituals(
      normalized,
    )

  normalized =
    normalizeCharacterDraftOblivionCeremonies(
      normalized,
    )

  return normalized
}
