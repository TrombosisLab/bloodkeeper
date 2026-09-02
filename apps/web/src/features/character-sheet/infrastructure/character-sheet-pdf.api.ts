export type CharacterSheetPdfFormat =
  | 'editable'
  | 'print'

type FetchImplementation =
  typeof globalThis.fetch

export class CharacterSheetPdfApiError
  extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code)
    this.name = 'CharacterSheetPdfApiError'
  }
}

function fileNameFromDisposition(
  disposition: string | null,
): string {
  const match = disposition?.match(
    /filename="?([^";]+)"?/i,
  )

  return match?.[1] ?? 'ficha-v5.pdf'
}

export interface CharacterSheetPdfGateway {
  download(
    characterId: string,
    format: CharacterSheetPdfFormat,
  ): Promise<{
    readonly blob: Blob
    readonly fileName: string
  }>
}

export function createCharacterSheetPdfGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterSheetPdfGateway {
  return {
    async download(characterId, format) {
      const response = await fetchImplementation(
        `/api/characters/${encodeURIComponent(characterId)}` +
          `/sheet.pdf?format=${format}`,
        {
          credentials: 'include',
          headers: {
            Accept: 'application/pdf',
          },
        },
      )

      if (!response.ok) {
        let code =
          'CHARACTER_SHEET_PDF_REQUEST_FAILED'

        try {
          const body: unknown =
            await response.json()

          if (
            typeof body === 'object' &&
            body !== null &&
            'code' in body &&
            typeof body.code === 'string'
          ) {
            code = body.code
          }
        } catch {
          // HTTP status remains authoritative.
        }

        throw new CharacterSheetPdfApiError(
          response.status,
          code,
        )
      }

      return {
        blob: await response.blob(),
        fileName: fileNameFromDisposition(
          response.headers.get(
            'Content-Disposition',
          ),
        ),
      }
    },
  }
}
