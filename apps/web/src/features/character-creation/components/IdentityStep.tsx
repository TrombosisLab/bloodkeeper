import { V5VisualMark } from '../../v5-visuals/V5VisualMark'
import type {
  ChangeEvent,
} from 'react'

import {
  clanDefinitions,
} from '../data/clan-definitions'

import {
  disciplineDefinitions,
} from '../data/discipline-definitions'

import {
  generationOptions,
} from '../data/identity-options'

import {
  getPredatorTypeOptions,
} from '../domain/predator-type-rules'

import {
  PredatorTypeConfiguration,
} from './PredatorTypeConfiguration'

import type {
  ClanKey,
} from '../types/clan.types'

import type {
  CharacterGeneration,
} from '../types/character-generation.types'

import type {
  CharacterAdvantageAgeCategory,
} from '../types/character-advantage-definition.types'

import type {
  CharacterIdentityDraft,
} from '../types/character-identity-draft.types'

import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

import type {
  CharacterDraftApiCreationMode,
} from '../types/character-draft-api.types'

interface IdentityStepProps {
  creationMode: CharacterDraftApiCreationMode

  value: CharacterIdentityDraft

  choiceSelections: Record<string, number>

  advantages: CharacterAdvantagesDraft

  onChange: (
    value: CharacterIdentityDraft,
  ) => void

  onChoiceSelectionsChange: (
    value: Record<string, number>,
  ) => void

  onAdvantagesChange: (
    value: CharacterAdvantagesDraft,
  ) => void
}

type TextIdentityFieldName =
  Exclude<
    keyof CharacterIdentityDraft,
    'clan' | 'generation' | 'ageCategory'
  >

export function IdentityStep({
  creationMode,
  value,
  choiceSelections,
  advantages,
  onChange,
  onChoiceSelectionsChange,
  onAdvantagesChange,
}: IdentityStepProps) {
  const sessionZero =
    creationMode === 'sessionZero'

  const predatorTypeOptions =
    getPredatorTypeOptions()

  const predatorTypeForbidden =
    value.clan === 'thinBlood'

  function updateField(
    event: ChangeEvent<
      HTMLInputElement |
      HTMLSelectElement |
      HTMLTextAreaElement
    >,
  ) {
    const field =
      event.target
        .name as TextIdentityFieldName

    onChange({
      ...value,
      [field]: event.target.value,
    })
  }

  function updateClan(
    clan: ClanKey | null,
  ) {
    onChange({
      ...value,
      clan,
    })
  }

  function getDisciplineName(
    key: string,
  ): string {
    return (
      disciplineDefinitions.find(
        discipline =>
          discipline.key === key,
      )?.name ?? key
    )
  }

  function updateGeneration(
    event: ChangeEvent<
      HTMLSelectElement
    >,
  ) {
    const rawValue =
      event.target.value

    onChange({
      ...value,

      generation:
        rawValue === ''
          ? null
          : Number(
              rawValue,
            ) as CharacterGeneration,
    })
  }

  function updateAgeCategory(
    event: ChangeEvent<
      HTMLSelectElement
    >,
  ) {
    const rawValue =
      event.target.value

    onChange({
      ...value,

      ageCategory:
        rawValue === ''
          ? null
          : rawValue as CharacterAdvantageAgeCategory,
    })
  }

  return (
    <div className="identity-step">
      <div className="creation-step-heading">
        <span>Fase 1</span>

        <h2>Identidad</h2>

        <p>
          Define quién es el personaje antes de
          comenzar con sus capacidades.
        </p>
      </div>

      <div className="creation-form-grid">
        <label className="creation-field creation-field--wide">
          <span>Nombre del personaje</span>

          <input
            type="text"
            name="name"
            value={value.name}
            onChange={updateField}
            placeholder="Ej. Adrián Varela"
          />
        </label>

        <label className="creation-field creation-field--wide">
          <span>Concepto</span>

          <input
            type="text"
            name="concept"
            value={value.concept}
            onChange={updateField}
            placeholder="Describe el personaje en una frase"
          />
        </label>

        {!sessionZero ? (
          <>
        <fieldset className="creation-field creation-field--wide clan-card-selector">
          <legend>Clan</legend>

          <p className="clan-card-selector__help">
            Elige el linaje del personaje. Las Disciplinas mostradas
            proceden del catálogo canónico de cada opción.
          </p>

          <div className="clan-card-selector__grid">
            {clanDefinitions.map(
              (clan) => (
                <button
                  key={clan.key}
                  type="button"
                  className={
                    value.clan === clan.key
                      ? 'clan-card-selector__card clan-card-selector__card--selected'
                      : 'clan-card-selector__card'
                  }
                  aria-pressed={
                    value.clan === clan.key
                  }
                  onClick={() =>
                    updateClan(clan.key)
                  }
                >
                  <V5VisualMark kind="clan-symbol" value={clan.key} className="clan-card-selector__visual" decorative />

                  <span className="clan-card-selector__kind">
                    {clan.kind === 'thinBlood'
                      ? 'Sangre débil'
                      : clan.kind === 'caitiff'
                        ? 'Caitiff'
                        : 'Clan'}
                  </span>

                  <strong>
                    {clan.name}
                  </strong>

                  <span className="clan-card-selector__disciplines-label">
                    Disciplinas
                  </span>

                  <span className="clan-card-selector__disciplines">
                    {clan.inClanDisciplines.map(
                      discipline => (
                        <span key={discipline}>
                          {getDisciplineName(
                            discipline,
                          )}
                        </span>
                      ),
                    )}
                  </span>
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            className="clan-card-selector__clear"
            onClick={() =>
              updateClan(null)
            }
            disabled={value.clan === null}
          >
            Dejar el clan sin seleccionar
          </button>
        </fieldset>

        <label className="creation-field">
          <span>Depredador</span>

          <select
            name="predatorType"
            value={value.predatorType}
            onChange={updateField}
            disabled={predatorTypeForbidden}
          >
            <option value="">
              {predatorTypeForbidden
                ? 'No disponible para Sangre Débil'
                : 'Selecciona tipo'}
            </option>

            {predatorTypeOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          {predatorTypeForbidden ? (
            <small>
              Los Sangre Débil no tienen Tipo de Depredador.
            </small>
          ) : null}
        </label>

        <PredatorTypeConfiguration
          predatorTypeKey={
            value.predatorType
          }
          clanKey={value.clan}
          choiceSelections={
            choiceSelections
          }
          advantages={
            advantages
          }
          onChoiceSelectionsChange={
            onChoiceSelectionsChange
          }
          onAdvantagesChange={
            onAdvantagesChange
          }
        />

        <label className="creation-field">
          <span>Generación</span>

          <select
            name="generation"
            value={
              value.generation ?? ''
            }
            onChange={
              updateGeneration
            }
          >
            <option value="">
              Selecciona generación
            </option>

            {generationOptions.map(
              (generation) => (
                <option
                  key={generation}
                  value={generation}
                >
                  {generation}ª
                </option>
              ),
            )}
          </select>
        </label>

        <label className="creation-field">
          <span>Categoría etaria</span>

          <select
            name="ageCategory"
            value={
              value.ageCategory ?? ''
            }
            onChange={
              updateAgeCategory
            }
          >
            <option value="">
              Sin determinar
            </option>

            <option value="fledgling">
              Retoño (recién creado)
            </option>

            <option value="neonate">
              Neonato
            </option>

            <option value="ancilla">
              Ancilla
            </option>

            <option value="elder">
              Antiguo
            </option>
          </select>

          <small>
            Es independiente de la Generación.
          </small>
        </label>

          </>
        ) : null}

        <label className="creation-field">
          <span>Crónica</span>

          <input
            type="text"
            name="chronicle"
            value={value.chronicle}
            onChange={updateField}
            placeholder="Nombre de la crónica"
          />
        </label>

        <label className="creation-field creation-field--wide">
          <span>Ambición</span>

          <textarea
            name="ambition"
            value={value.ambition}
            onChange={updateField}
            rows={3}
            placeholder="Objetivo a largo plazo"
          />
        </label>

        {!sessionZero ? (
        <label className="creation-field">
          <span>Sire</span>

          <input
            type="text"
            name="sire"
            value={value.sire}
            onChange={updateField}
            placeholder="Nombre del sire"
          />
        </label>

        ) : null}

        <label className="creation-field creation-field--wide">
          <span>Deseo</span>

          <textarea
            name="desire"
            value={value.desire}
            onChange={updateField}
            rows={3}
            placeholder="Objetivo inmediato"
          />
        </label>
      </div>
    </div>
  )
}
