import type {
  ChangeEvent,
} from 'react'

import {
  clanDefinitions,
} from '../data/clan-definitions'

import {
  generationOptions,
  predatorTypeOptions,
} from '../data/identity-options'

import type {
  ClanKey,
} from '../types/clan.types'

import type {
  CharacterGeneration,
} from '../types/character-generation.types'

import type {
  CharacterIdentityDraft,
} from '../types/character-identity-draft.types'

interface IdentityStepProps {
  value: CharacterIdentityDraft

  onChange: (
    value: CharacterIdentityDraft,
  ) => void
}

type TextIdentityFieldName =
  Exclude<
    keyof CharacterIdentityDraft,
    'clan' | 'generation'
  >

export function IdentityStep({
  value,
  onChange,
}: IdentityStepProps) {
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
    event: ChangeEvent<
      HTMLSelectElement
    >,
  ) {
    const rawValue =
      event.target.value

    onChange({
      ...value,

      clan:
        rawValue === ''
          ? null
          : rawValue as ClanKey,
    })
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

        <label className="creation-field">
          <span>Clan</span>

          <select
            name="clan"
            value={
              value.clan ?? ''
            }
            onChange={updateClan}
          >
            <option value="">
              Selecciona clan
            </option>

            {clanDefinitions.map(
              (clan) => (
                <option
                  key={clan.key}
                  value={clan.key}
                >
                  {clan.name}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="creation-field">
          <span>Depredador</span>

          <select
            name="predatorType"
            value={value.predatorType}
            onChange={updateField}
          >
            {predatorTypeOptions.map(
              (option) => (
                <option
                  key={
                    option || 'empty'
                  }
                  value={option}
                >
                  {option ||
                    'Selecciona tipo'}
                </option>
              ),
            )}
          </select>
        </label>

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
