import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CharacterDisciplineDraft,
  CharacterDisciplinesDraft,
} from '../types/discipline.types.ts'

import {
  getThinBloodDisciplineAffinityEffect,
} from './thin-blood-trait-rules.ts'

function cloneDiscipline(
  discipline: CharacterDisciplineDraft,
): CharacterDisciplineDraft {
  return {
    key: discipline.key,
    value: discipline.value,
    powerKeys: [
      ...discipline.powerKeys,
    ],
  }
}

/*
 * Resuelve únicamente el conocimiento PERMANENTE de Disciplinas
 * representado durante la creación del personaje.
 *
 * Incluye:
 * - draft.disciplines: conocimiento permanente ordinario.
 * - Disciplina Afín: conocimiento permanente derivado del Mérito.
 *
 * No incluye ni debe incluir futuros accesos temporales
 * concedidos por Resonancias u otros efectos transitorios.
 *
 * Este resolver tampoco concede por sí mismo acceso a Rituales,
 * Ceremonias ni otros subsistemas secundarios. Esos sistemas
 * conservan sus contratos específicos hasta que una regla
 * normativa explícita justifique integrarlos.
 */
export function resolvePermanentDisciplines(
  draft: CharacterDraft,
): CharacterDisciplinesDraft {
  const disciplines =
    draft.disciplines.map(
      cloneDiscipline,
    )

  const affinity =
    getThinBloodDisciplineAffinityEffect(
      draft.thinBloodTraits,
    )

  if (!affinity) {
    return disciplines
  }

  const existing =
    disciplines.find(
      (discipline) =>
        discipline.key === affinity.key,
    )

  if (!existing) {
    return [
      ...disciplines,
      cloneDiscipline(affinity),
    ]
  }

  /*
   * Si dos fuentes permanentes representan la misma Disciplina,
   * el resolver produce una única vista efectiva:
   *
   * - conserva el rating permanente más alto;
   * - une los poderes sin duplicarlos.
   *
   * No suma ratings entre fuentes.
   */
  existing.value =
    Math.max(
      existing.value,
      affinity.value,
    )

  existing.powerKeys = [
    ...new Set([
      ...existing.powerKeys,
      ...affinity.powerKeys,
    ]),
  ]

  return disciplines
}
