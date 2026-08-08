import {
  attributeDefinitions,
} from '../data/attribute-definitions'

import {
  skillDefinitions,
} from '../data/skill-definitions'

import {
  getClanDefinition,
} from '../data/clan-definitions'

import {
  getPredatorType,
} from '../domain/predator-type-rules'

import {
  deriveCharacterTraits,
} from '../domain/blood-rules'

import {
  disciplineDefinitions,
} from '../data/discipline-definitions'

import {
  disciplinePowerDefinitions,
} from '../data/discipline-power-definitions'

import {
  getCharacterAdvantageDefinition,
} from '../data/character-advantage-definitions'

import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
} from '../data/blood-sorcery-ritual-definitions'

import {
  oblivionCeremonyDefinitions,
} from '../data/oblivion-ceremony-definitions'

import {
  thinBloodAlchemyFormulaCatalog,
} from '../data/thin-blood-alchemy-formulas'

import {
  thinBloodTraitDefinitions,
} from '../data/thin-blood-trait-definitions'

import type {
  CharacterDraft,
} from '../types/character-draft.types'

import type {
  CharacterValidationReport,
  CharacterValidationSection,
} from '../../character-sheet/types/character-validation.types'

interface ReviewStepProps {
  draft: CharacterDraft
  validationReport:
    CharacterValidationReport | null
  lifecycleStatus:
    | 'draft'
    | 'active'
    | 'archived'
    | null
  canFinalize: boolean
  busy: boolean
  message: string | null
  onCheck: () => void
  onFinalize: () => void
}

const ageCategoryLabels = {
  fledgling: 'Retoño',
  neonate: 'Neonato',
  ancilla: 'Ancilla',
  elder: 'Antiguo',
} as const

const skillDistributionLabels = {
  generalist: 'Generalista',
  balanced: 'Equilibrada',
  specialist: 'Especialista',
} as const

const sectionLabels:
  Record<CharacterValidationSection, string> = {
    identity: 'Identidad',
    attributes: 'Atributos',
    skills: 'Habilidades',
    blood: 'Sangre',
    disciplines: 'Disciplinas',
    advantages: 'Ventajas',
    humanity: 'Humanidad',
    derived: 'Valores derivados',
    dependencies: 'Dependencias',
  }

const advantageCategoryLabels = {
  merit: 'Méritos',
  background: 'Trasfondos',
  flaw: 'Defectos',
} as const

const advantageOriginLabels = {
  creation: 'Creación',
  predatorType: 'Tipo de Depredador',
  thinBlood: 'Sangre Débil',
} as const

const disciplineOriginLabels = {
  creation: 'Creación',
  predatorType: 'Tipo de Depredador',
  thinBlood: 'Sangre Débil',
} as const

const alchemyMethodLabels = {
  athanorCorporis: 'Athanor Corporis',
  calcinatio: 'Calcinatio',
  fixatio: 'Fixatio',
} as const

const attributeGroups = [
  {
    label: 'Físicos',
    definitions:
      attributeDefinitions.slice(0, 3),
  },
  {
    label: 'Sociales',
    definitions:
      attributeDefinitions.slice(3, 6),
  },
  {
    label: 'Mentales',
    definitions:
      attributeDefinitions.slice(6, 9),
  },
] as const

const skillGroups = [
  {
    label: 'Físicas',
    definitions:
      skillDefinitions.slice(0, 9),
  },
  {
    label: 'Sociales',
    definitions:
      skillDefinitions.slice(9, 18),
  },
  {
    label: 'Mentales',
    definitions:
      skillDefinitions.slice(18, 27),
  },
] as const

function displayValue(
  value:
    | string
    | number
    | null
    | undefined,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Sin definir'
  }

  return String(value)
}

function RatingDots({
  value,
  max = 5,
  label,
}: {
  value: number
  max?: number
  label: string
}) {
  return (
    <span
      className="discipline-editor-card__dots"
      role="img"
      aria-label={`${label}: ${value} de ${max}`}
    >
      {Array.from(
        { length: max },
        (_, index) => (
          <span
            key={index}
            className={
              index < value
                ? 'discipline-editor-dot discipline-editor-dot--filled'
                : 'discipline-editor-dot'
            }
            aria-hidden="true"
          />
        ),
      )}
    </span>
  )
}

function CompactValue({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="blood-generation-summary">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function ReviewStep({
  draft,
  validationReport,
  lifecycleStatus,
  canFinalize,
  busy,
  message,
  onCheck,
  onFinalize,
}: ReviewStepProps) {
  const derived =
    deriveCharacterTraits(
      draft.attributes,
    )

  const errors =
    validationReport?.issues.filter(
      issue =>
        issue.severity === 'error',
    ) ?? []

  const warnings =
    validationReport?.issues.filter(
      issue =>
        issue.severity === 'warning',
    ) ?? []

  const pendingSections =
    validationReport?.sections.filter(
      section =>
        section.state === 'pending',
    ) ?? []

  const invalidSections =
    validationReport?.sections.filter(
      section =>
        section.state === 'invalid',
    ) ?? []

  const completeSections =
    validationReport?.sections.filter(
      section =>
        section.state === 'complete',
    ) ?? []

  const clan =
    draft.identity.clan === null
      ? 'Sin definir'
      : getClanDefinition(
          draft.identity.clan,
        ).name

  const predator =
    draft.identity.predatorType === ''
      ? 'Sin definir'
      : (
          getPredatorType(
            draft.identity.predatorType,
          )?.name ??
          draft.identity.predatorType
        )

  const ageCategory =
    draft.identity.ageCategory === null
      ? 'Sin determinar'
      : ageCategoryLabels[
          draft.identity.ageCategory
        ]

  const groupedAdvantages =
    ([
      'merit',
      'background',
      'flaw',
    ] as const).map(
      category => ({
        category,
        selections:
          draft.advantages.selections.filter(
            selection =>
              selection.category ===
              category,
          ),
      }),
    )

  return (
    <div className="creation-step-content">
      <div className="creation-step-heading">
        <span>Revisión final</span>
        <h2>
          {displayValue(
            draft.identity.name,
          )}
        </h2>
        <p>
          Revisa de un vistazo el personaje
          completo y valida su estado antes
          de finalizar la creación.
        </p>
      </div>

      <div className="blood-step__grid">
        <section className="blood-panel">
          <div className="blood-panel__heading">
            <span>Identidad</span>
            <h3>Esencia</h3>
          </div>

          <CompactValue
            label="Concepto"
            value={
              displayValue(
                draft.identity.concept,
              )
            }
          />
          <CompactValue
            label="Clan"
            value={clan}
          />
          <CompactValue
            label="Depredador"
            value={predator}
          />
          <CompactValue
            label="Generación"
            value={
              draft.identity.generation ===
              null
                ? 'Sin definir'
                : `${draft.identity.generation}.ª`
            }
          />
          <CompactValue
            label="Categoría etaria"
            value={ageCategory}
          />
        </section>

        <section className="blood-panel">
          <div className="blood-panel__heading">
            <span>Narrativa</span>
            <h3>Crónica</h3>
          </div>

          <CompactValue
            label="Crónica"
            value={
              displayValue(
                draft.identity.chronicle,
              )
            }
          />
          <CompactValue
            label="Ambición"
            value={
              displayValue(
                draft.identity.ambition,
              )
            }
          />
          <CompactValue
            label="Deseo"
            value={
              displayValue(
                draft.identity.desire,
              )
            }
          />
          <CompactValue
            label="Sire"
            value={
              displayValue(
                draft.identity.sire,
              )
            }
          />
        </section>

        <section className="blood-panel">
          <div className="blood-panel__heading">
            <span>Estado</span>
            <h3>Sangre y resistencia</h3>
          </div>

          <CompactValue
            label="Potencia de Sangre"
            value={String(
              draft.blood.bloodPotency,
            )}
          />
          <CompactValue
            label="Hambre"
            value={String(
              draft.blood.hunger,
            )}
          />
          <CompactValue
            label="Salud"
            value={String(
              derived.health,
            )}
          />
          <CompactValue
            label="Fuerza de Voluntad"
            value={String(
              derived.willpower,
            )}
          />
        </section>
      </div>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>Atributos</span>
            <h3>Distribución del personaje</h3>
          </div>
        </header>

        <div className="attributes-editor-grid">
          {attributeGroups.map(
            group => (
              <section
                className="attributes-editor-category"
                key={group.label}
              >
                <h3>{group.label}</h3>

                {group.definitions.map(
                  definition => (
                    <div
                      className="blood-generation-summary"
                      key={definition.key}
                    >
                      <span>
                        {definition.label}
                      </span>

                      <RatingDots
                        label={
                          definition.label
                        }
                        value={
                          draft.attributes[
                            definition.key
                          ]
                        }
                      />
                    </div>
                  ),
                )}
              </section>
            ),
          )}
        </div>
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>Habilidades</span>
            <h3>
              {
                skillDistributionLabels[
                  draft
                    .skillDistributionMethod
                ]
              }
            </h3>
          </div>
        </header>

        <div className="skills-editor-grid">
          {skillGroups.map(
            group => {
              const selected =
                group.definitions.filter(
                  definition =>
                    draft.skills[
                      definition.key
                    ] > 0,
                )

              return (
                <section
                  className="skills-editor-category"
                  key={group.label}
                >
                  <h3>{group.label}</h3>

                  {selected.length === 0 ? (
                    <p>
                      Sin puntuaciones.
                    </p>
                  ) : (
                    selected.map(
                      definition => {
                        const specialties =
                          draft
                            .skillSpecialties
                            .filter(
                              specialty =>
                                specialty
                                  .skillKey ===
                                definition.key,
                            )

                        return (
                          <div
                            key={
                              definition.key
                            }
                          >
                            <div className="blood-generation-summary">
                              <span>
                                {
                                  definition.label
                                }
                              </span>

                              <RatingDots
                                label={
                                  definition.label
                                }
                                value={
                                  draft.skills[
                                    definition.key
                                  ]
                                }
                              />
                            </div>

                            {specialties.length >
                            0 ? (
                              <small>
                                {
                                  specialties
                                    .map(
                                      specialty =>
                                        specialty
                                          .name,
                                    )
                                    .join(' · ')
                                }
                              </small>
                            ) : null}
                          </div>
                        )
                      },
                    )
                  )}
                </section>
              )
            },
          )}
        </div>
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>Disciplinas</span>
            <h3>
              Poderes vampíricos
            </h3>
          </div>
        </header>

        {draft.disciplines.length ===
        0 ? (
          <div className="creation-empty-state">
            Sin Disciplinas seleccionadas.
          </div>
        ) : (
          <div className="discipline-editor-grid">
            {draft.disciplines.map(
              (discipline, index) => {
                const definition =
                  disciplineDefinitions.find(
                    candidate =>
                      candidate.key ===
                      discipline.key,
                  )

                const powers =
                  discipline.powerKeys.map(
                    powerKey =>
                      disciplinePowerDefinitions
                        .find(
                          power =>
                            power.key ===
                            powerKey,
                        )?.name ??
                      powerKey,
                  )

                return (
                  <section
                    className="discipline-editor-card discipline-editor-card--selected"
                    key={
                      `${discipline.key}-${discipline.origin ?? 'creation'}-${index}`
                    }
                  >
                    <div className="discipline-editor-card__heading">
                      <div>
                        <span>
                          {
                            disciplineOriginLabels[
                              discipline.origin ??
                                'creation'
                            ]
                          }
                        </span>
                        <h3>
                          {
                            definition?.name ??
                            discipline.key
                          }
                        </h3>
                      </div>

                      <strong>
                        {discipline.value}
                      </strong>
                    </div>

                    <RatingDots
                      label={
                        definition?.name ??
                        discipline.key
                      }
                      value={
                        discipline.value
                      }
                    />

                    <p className="discipline-editor-card__hint">
                      {powers.length === 0
                        ? 'Sin Poderes seleccionados.'
                        : powers.join(' · ')}
                    </p>
                  </section>
                )
              },
            )}
          </div>
        )}

        {draft.bloodSorceryRituals
          .ritualKeys.length > 0 ? (
          <section className="discipline-special-case">
            <span>Rituales</span>
            <h3>
              Hechicería de Sangre
            </h3>
            <p>
              {
                draft.bloodSorceryRituals
                  .ritualKeys
                  .map(
                    key =>
                      BLOOD_SORCERY_RITUAL_DEFINITIONS
                        .find(
                          ritual =>
                            ritual.key === key,
                        )?.name ??
                      key,
                  )
                  .join(' · ')
              }
            </p>
          </section>
        ) : null}

        {draft.oblivionCeremonies
          .ceremonyKeys.length > 0 ? (
          <section className="discipline-special-case">
            <span>Ceremonias</span>
            <h3>Olvido</h3>
            <p>
              {
                draft.oblivionCeremonies
                  .ceremonyKeys
                  .map(
                    key =>
                      oblivionCeremonyDefinitions
                        .find(
                          ceremony =>
                            ceremony.key === key,
                        )?.name ??
                      key,
                  )
                  .join(' · ')
              }
            </p>
          </section>
        ) : null}

        {draft.thinBloodAlchemy
          .rating > 0 ? (
          <section className="discipline-special-case">
            <span>Sangre Débil</span>
            <h3>
              Alquimia {
                draft.thinBloodAlchemy
                  .rating
              }
            </h3>
            <p>
              Método:{' '}
              {
                draft.thinBloodAlchemy
                  .method === null
                  ? 'Sin definir'
                  : alchemyMethodLabels[
                      draft
                        .thinBloodAlchemy
                        .method
                    ]
              }
            </p>
            <p>
              {
                draft.thinBloodAlchemy
                  .formulaKeys
                  .map(
                    key =>
                      thinBloodAlchemyFormulaCatalog
                        .find(
                          formula =>
                            formula.key ===
                            key,
                        )?.name ??
                      key,
                  )
                  .join(' · ') ||
                'Sin fórmulas'
              }
            </p>
          </section>
        ) : null}

        {draft.thinBloodTraits
          .selections.length > 0 ? (
          <section className="discipline-special-case">
            <span>Sangre Débil</span>
            <h3>Rasgos</h3>
            <p>
              {
                draft.thinBloodTraits
                  .selections
                  .map(
                    selection =>
                      thinBloodTraitDefinitions
                        .find(
                          definition =>
                            definition.key ===
                            selection
                              .definitionKey,
                        )?.name ??
                      selection
                        .definitionKey,
                  )
                  .join(' · ')
              }
            </p>
          </section>
        ) : null}
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>Ventajas</span>
            <h3>
              Méritos, Trasfondos y Defectos
            </h3>
          </div>
        </header>

        {groupedAdvantages.map(
          group => (
            <section
              className="advantages-category"
              key={group.category}
            >
              <header className="advantages-category__heading">
                <div>
                  <span>Selección</span>
                  <h3>
                    {
                      advantageCategoryLabels[
                        group.category
                      ]
                    }
                  </h3>
                </div>
              </header>

              {group.selections.length ===
              0 ? (
                <div className="creation-empty-state">
                  Sin selecciones.
                </div>
              ) : (
                <div
                  className={
                    group.category ===
                    'flaw'
                      ? 'advantages-catalog-grid advantages-catalog-grid--flaw'
                      : 'advantages-catalog-grid advantages-catalog-grid--merit'
                  }
                >
                  {group.selections.map(
                    selection => {
                      const definition =
                        getCharacterAdvantageDefinition(
                          selection
                            .definitionKey,
                        )

                      return (
                        <article
                          className="advantage-sheet-entry advantage-sheet-entry--selected"
                          key={
                            selection
                              .selectionId
                          }
                        >
                          <header>
                            <div>
                              <span>
                                {
                                  advantageOriginLabels[
                                    selection
                                      .origin
                                  ]
                                }
                              </span>
                              <h4>
                                {
                                  definition?.name ??
                                  selection
                                    .definitionKey
                                }
                              </h4>
                            </div>
                            <strong>
                              {
                                selection.rating
                              }
                            </strong>
                          </header>

                          <RatingDots
                            label={
                              definition?.name ??
                              selection
                                .definitionKey
                            }
                            value={
                              selection.rating
                            }
                            max={7}
                          />
                        </article>
                      )
                    },
                  )}
                </div>
              )}
            </section>
          ),
        )}
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>Humanidad</span>
            <h3>
              Humanidad {
                draft.humanity.value
              }
            </h3>
          </div>
        </header>

        <div
          className="humanity-track"
          aria-label={
            `Humanidad ${draft.humanity.value} de 10`
          }
        >
          {Array.from(
            { length: 10 },
            (_, index) => {
              const level =
                index + 1

              return (
                <span
                  key={level}
                  className={
                    level <=
                    draft.humanity.value
                      ? 'humanity-box humanity-box--filled'
                      : 'humanity-box'
                  }
                  aria-hidden="true"
                />
              )
            },
          )}
        </div>

        {draft.humanity.convictions
          .length === 0 ? (
          <div className="creation-empty-state">
            Sin Convicciones definidas.
          </div>
        ) : (
          <div className="advantages-catalog-grid advantages-catalog-grid--merit">
            {draft.humanity.convictions.map(
              (conviction, index) => {
                const touchstone =
                  draft.humanity
                    .touchstones.find(
                      candidate =>
                        candidate
                          .touchstoneId ===
                        conviction
                          .touchstoneId,
                    )

                return (
                  <article
                    className="advantage-sheet-entry advantage-sheet-entry--selected"
                    key={
                      conviction
                        .convictionId
                    }
                  >
                    <header>
                      <div>
                        <span>
                          Convicción {
                            index + 1
                          }
                        </span>
                        <h4>
                          {
                            conviction.text
                          }
                        </h4>
                      </div>
                    </header>

                    <p>
                      <strong>
                        Piedra de Toque:
                      </strong>{' '}
                      {
                        touchstone?.name ??
                        'Sin definir'
                      }
                    </p>

                    {touchstone !==
                    undefined ? (
                      <small>
                        {
                          touchstone
                            .relationship
                        }
                      </small>
                    ) : null}
                  </article>
                )
              },
            )}
          </div>
        )}
      </section>

      <section className="creation-step-section">
        <header className="creation-step-section__header">
          <div>
            <span>
              Validación global
            </span>
            <h3>
              Estado para finalización
            </h3>
          </div>
        </header>

        <div
          className={
            validationReport?.canProceed ===
            true
              ? 'discipline-validation discipline-validation--valid'
              : 'discipline-validation'
          }
        >
          <div className="discipline-validation__summary">
            <div>
              <span>Completas</span>
              <strong>
                {
                  completeSections.length
                }
              </strong>
            </div>

            <div>
              <span>Pendientes</span>
              <strong>
                {
                  pendingSections.length
                }
              </strong>
            </div>

            <div>
              <span>Con errores</span>
              <strong>
                {
                  invalidSections.length
                }
              </strong>
            </div>

            <div>
              <span>Advertencias</span>
              <strong>
                {warnings.length}
              </strong>
            </div>
          </div>

          {message !== null ? (
            <p
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          ) : null}

          {validationReport === null ? (
            <p>
              Ejecuta la comprobación
              final para validar el
              personaje completo.
            </p>
          ) : validationReport
              .canProceed ? (
            <p className="discipline-validation__ok">
              Todas las secciones
              necesarias están completas.
            </p>
          ) : (
            <>
              {invalidSections.length >
              0 ? (
                <div>
                  <strong>
                    Secciones con errores
                  </strong>
                  <p>
                    {
                      invalidSections
                        .map(
                          section =>
                            sectionLabels[
                              section
                                .section
                            ],
                        )
                        .join(' · ')
                    }
                  </p>
                </div>
              ) : null}

              {pendingSections.length >
              0 ? (
                <div>
                  <strong>
                    Decisiones pendientes
                  </strong>
                  <p>
                    {
                      pendingSections
                        .map(
                          section =>
                            sectionLabels[
                              section
                                .section
                            ],
                        )
                        .join(' · ')
                    }
                  </p>
                </div>
              ) : null}

              {errors.length > 0 ? (
                <ul className="discipline-validation__errors">
                  {errors.map(
                    (issue, index) => (
                      <li
                        key={
                          `${issue.code}-${index}`
                        }
                      >
                        {issue.message}
                      </li>
                    ),
                  )}
                </ul>
              ) : null}
            </>
          )}

          {warnings.length > 0 ? (
            <div>
              <strong>
                Advertencias
              </strong>
              <ul>
                {warnings.map(
                  (issue, index) => (
                    <li
                      key={
                        `${issue.code}-${index}`
                      }
                    >
                      {issue.message}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="creation-actions">
          <button
            type="button"
            className="creation-button creation-button--secondary"
            disabled={
              busy ||
              lifecycleStatus ===
                'active' ||
              lifecycleStatus ===
                'archived'
            }
            onClick={onCheck}
          >
            Comprobar personaje
          </button>

          {validationReport?.canProceed ===
            true &&
          lifecycleStatus === 'draft' ? (
            <button
              type="button"
              className="creation-button creation-button--primary"
              disabled={
                busy ||
                !canFinalize
              }
              onClick={onFinalize}
            >
              Finalizar personaje
            </button>
          ) : null}
        </div>

        {validationReport?.canProceed ===
          true &&
        lifecycleStatus === 'draft' &&
        !canFinalize &&
        !busy ? (
          <p>
            Vuelve a comprobar el personaje
            si el borrador cambió desde la
            última validación.
          </p>
        ) : null}

        {lifecycleStatus ===
        'active' ? (
          <div className="discipline-validation discipline-validation--valid">
            <p className="discipline-validation__ok">
              Personaje finalizado.
            </p>
          </div>
        ) : null}

        {lifecycleStatus ===
        'archived' ? (
          <div className="creation-step-errors">
            <strong>
              El personaje está archivado.
            </strong>
          </div>
        ) : null}
      </section>
    </div>
  )
}
