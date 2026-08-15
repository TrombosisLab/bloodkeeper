import {
  useEffect,
  useState,
} from 'react'

import {
  CharacterDraftApiError,
  createCharacterDraftGateway,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import type {
  CharacterDraftApiLifecycleStatus,
  CharacterDraftApiSnapshot,
} from '../../character-creation/types/character-draft-api.types.ts'

import {
  ViewStateStatus,
} from '../../../components/ui/ViewStateStatus'

import '../character-list.css'

const gateway =
  createCharacterDraftGateway()

const statusLabels:
  Record<
    CharacterDraftApiLifecycleStatus,
    string
  > = {
    draft: 'Borrador',
    active: 'Activo',
    archived: 'Archivado',
  }

interface CharacterListProps {
  readonly onOpenCharacter:
    (characterId: string) => void
  readonly onContinueCreation:
    (characterId: string) => void
  readonly onCreateCharacter: () => void
  readonly onOpenDemo: () => void
}

function characterName(
  character: CharacterDraftApiSnapshot,
): string {
  const name =
    character.identity.name.trim()

  return name.length > 0
    ? name
    : 'Personaje sin nombre'
}

function errorMessage(
  error: unknown,
): string {
  if (
    error instanceof CharacterDraftApiError &&
    error.code ===
      'AUTHENTICATION_REQUIRED'
  ) {
    return 'Necesitas una sesión válida para consultar tus personajes.'
  }

  return 'No se pudo cargar la lista de personajes.'
}

export function CharacterList({
  onOpenCharacter,
  onContinueCreation,
  onCreateCharacter,
  onOpenDemo,
}: CharacterListProps) {
  const [
    characters,
    setCharacters,
  ] = useState<
    readonly CharacterDraftApiSnapshot[]
  >([])

  const [
    charactersNextOffset,
    setCharactersNextOffset,
  ] = useState<number | null>(null)

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  async function loadCharacters() {
    setLoading(true)
    setError(null)

    try {
      const page =
        await gateway.listPage({
          limit: 25,
          offset: 0,
        })

      setCharacters(
        page.items,
      )
      setCharactersNextOffset(
        page.nextOffset,
      )
    } catch (loadError: unknown) {
      setError(
        errorMessage(loadError),
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadMoreCharacters() {
    if (
      charactersNextOffset === null ||
      loadingMore
    ) {
      return
    }

    setLoadingMore(true)
    setError(null)

    try {
      const page =
        await gateway.listPage({
          limit: 25,
          offset:
            charactersNextOffset,
        })

      setCharacters(
        (current) => [
          ...current,
          ...page.items,
        ],
      )
      setCharactersNextOffset(
        page.nextOffset,
      )
    } catch (loadError: unknown) {
      setError(
        errorMessage(loadError),
      )
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void loadCharacters()
  }, [])

  return (
    <section className="character-list-workspace">
      <header className="character-list-workspace__header">
        <div>
          <span className="character-list-workspace__eyebrow">
            Personajes
          </span>
          <h1>Tus personajes</h1>
          <p>
            Consulta tus personajes guardados,
            abre su ficha o continúa un borrador.
          </p>
        </div>

        <div className="character-list-workspace__actions">
          <button
            type="button"
            onClick={onOpenDemo}
          >
            Ficha de demostración
          </button>

          <button
            type="button"
            className="character-list-workspace__primary"
            onClick={onCreateCharacter}
          >
            Crear personaje
          </button>
        </div>
      </header>

      <section
        className="character-list"
        aria-labelledby="character-list-title"
      >
        <div className="character-list__heading">
          <h2 id="character-list-title">
            Guardados
          </h2>

          <button
            type="button"
            onClick={() =>
              void loadCharacters()
            }
            disabled={loading}
          >
            Actualizar
          </button>
        </div>

        {loading ? (
          <ViewStateStatus
            state="loading"
            className="character-list__message"
          >
            Cargando personajes…
          </ViewStateStatus>
        ) : error !== null ? (
          <p
            className="character-list__message"
            data-view-state="error"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </p>
        ) : characters.length === 0 ? (
          <ViewStateStatus
            state="empty"
            className="character-list__message"
          >
            Todavía no has guardado ningún personaje.
          </ViewStateStatus>
        ) : (
          <ul className="character-list__cards">
            {characters.map(
              (character) => (
                <li
                  key={character.characterId}
                  className="character-list-card"
                >
                  <div className="character-list-card__body">
                    <div>
                      <span className="character-list-card__status">
                        {
                          statusLabels[
                            character.status
                          ]
                        }
                      </span>
                      <h3>
                        {characterName(
                          character,
                        )}
                      </h3>
                    </div>

                    {character.identity.concept !==
                    null ? (
                      <p>
                        {character.identity.concept}
                      </p>
                    ) : null}

                    <small>
                      Actualizado{' '}
                      {new Date(
                        character.updatedAt,
                      ).toLocaleString(
                        'es-ES',
                      )}
                    </small>
                  </div>

                  <div className="character-list-card__actions">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenCharacter(
                          character.characterId,
                        )
                      }
                    >
                      Abrir ficha
                    </button>

                    {character.status ===
                    'draft' ? (
                      <button
                        type="button"
                        onClick={() =>
                          onContinueCreation(
                            character.characterId,
                          )
                        }
                      >
                        Continuar creación
                      </button>
                    ) : null}
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        {!loading &&
        error === null &&
        characters.length > 0 &&
        charactersNextOffset !== null ? (
          <button
            type="button"
            onClick={() =>
              void loadMoreCharacters()
            }
            disabled={loadingMore}
          >
            {loadingMore
              ? 'Cargando más…'
              : 'Cargar más personajes'}
          </button>
        ) : null}
      </section>
    </section>
  )
}
