import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const editorUrl =
  new URL(
    '../src/features/character-creation/components/advantages/AdvantageInstanceDetailsEditor.tsx',
    import.meta.url,
  )

test(
  '026 Adicto Funcional muestra el campo categoría de reserva',
  async () => {
    const source =
      await readFile(
        editorUrl,
        'utf8',
      )

    assert.match(
      source,
      /selection\.definitionKey ===\s*'functional-addict'/,
    )

    assert.match(
      source,
      /Categoría de reserva/,
    )

    assert.match(
      source,
      /details\.poolCategory \?\? ''/,
    )
  },
)

test(
  '026 conserva ambos datos de substanceUse al editar',
  async () => {
    const source =
      await readFile(
        editorUrl,
        'utf8',
      )

    const substanceBlock =
      source.match(
        /if \(\s*details\.kind === 'substanceUse'[\s\S]*?^\s{2}\}\s*$/m,
      )?.[0]

    assert.ok(substanceBlock)

    assert.match(
      substanceBlock,
      /details:\s*\{\s*\.\.\.details,\s*kind: 'substanceUse',\s*substance:/,
    )

    assert.match(
      substanceBlock,
      /details:\s*\{\s*\.\.\.details,\s*kind: 'substanceUse',\s*poolCategory:/,
    )
  },
)
