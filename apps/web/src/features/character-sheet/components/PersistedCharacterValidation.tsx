import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CharacterValidationApiError,
  createCharacterValidationGateway,
} from '../infrastructure/character-validation.api'

import type {
  CharacterValidationGateway,
} from '../infrastructure/character-validation.api'

import type {
  CharacterValidationReport,
  CharacterValidationSection,
} from '../types/character-validation.types'

interface PersistedCharacterValidationProps {
  characterId: string
  gateway?: CharacterValidationGateway
}

type ValidationLoadState =
  | 'loading'
  | 'ready'
  | 'unauthorized'
  | 'not-found'
  | 'error'

const sectionLabels:
  Record<CharacterValidationSection, string> = {
    identity: 'Identidad',
    attributes: 'Atributos',
    skills: 'Habilidades',
    blood: 'Sangre',
    disciplines: 'Disciplinas y Poderes',
    advantages: 'Ventajas y Defectos',
    humanity: 'Humanidad',
    derived: 'Valores derivados',
    dependencies: 'Dependencias',
  }

function stateForError(
  error: unknown,
): ValidationLoadState {
  if (
    error instanceof CharacterValidationApiError
  ) {
    if (error.status === 401) return 'unauthorized'
    if (error.status === 404) return 'not-found'
  }

  return 'error'
}

function errorMessage(
  state: ValidationLoadState,
): string | null {
  switch (state) {
    case 'unauthorized':
      return 'Necesitas una sesion valida para comprobar el personaje.'
    case 'not-found':
      return 'El personaje no existe o no tienes permiso para verlo.'
    case 'error':
      return 'No se pudo obtener el informe de validacion.'
    case 'loading':
    case 'ready':
      return null
  }
}

export function PersistedCharacterValidation({
  characterId,
  gateway: providedGateway,
}: PersistedCharacterValidationProps) {
  const gateway = useMemo(
    () =>
      providedGateway ??
      createCharacterValidationGateway(),
    [providedGateway],
  )
  const [report, setReport] =
    useState<CharacterValidationReport | null>(null)
  const [state, setState] =
    useState<ValidationLoadState>('loading')
  const [reloadVersion, setReloadVersion] =
    useState(0)

  useEffect(() => {
    let active = true
    setState('loading')

    void gateway
      .validate(characterId, 'activation')
      .then((loaded) => {
        if (!active) return
        setReport(loaded)
        setState('ready')
      })
      .catch((error: unknown) => {
        if (!active) return
        setReport(null)
        setState(stateForError(error))
      })

    return () => {
      active = false
    }
  }, [characterId, gateway, reloadVersion])

  const message = errorMessage(state)

  return (
    <section
      className="sheet-section validation-section"
      aria-busy={state === 'loading'}
    >
      <div className="section-title">
        <h2>Validacion global</h2>
        <span>Activacion</span>
      </div>

      <div className="validation-section__summary">
        {state === 'loading' ? (
          <p role="status">
            Comprobando el personaje...
          </p>
        ) : null}

        {message !== null ? (
          <p role="alert">{message}</p>
        ) : null}

        {report !== null ? (
          <p
            className={
              report.canProceed
                ? 'validation-section__result validation-section__result--ready'
                : 'validation-section__result validation-section__result--blocked'
            }
            role="status"
          >
            {report.canProceed
              ? 'El personaje puede activarse.'
              : 'El personaje todavia no puede activarse.'}
          </p>
        ) : null}

        <button
          type="button"
          disabled={state === 'loading'}
          onClick={() =>
            setReloadVersion(
              (version) => version + 1,
            )
          }
        >
          Volver a validar
        </button>
      </div>

      {report !== null ? (
        <ul className="validation-section__list">
          {report.sections.map((section) => (
            <li
              key={section.section}
              className={`validation-section__item validation-section__item--${section.state}`}
            >
              <div>
                <strong>
                  {sectionLabels[section.section]}
                </strong>
                <span>{section.state}</span>
              </div>

              {section.issues.length > 0 ? (
                <ul>
                  {section.issues.map(
                    (issue, index) => (
                      <li
                        key={`${issue.code}-${issue.field ?? 'section'}-${index}`}
                      >
                        {issue.message}
                      </li>
                    ),
                  )}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
