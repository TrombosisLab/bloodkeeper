import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const style = readFileSync(
  new URL(
    '../src/styles/bloodkeeper-visual-system.css',
    import.meta.url,
  ),
  'utf8',
)

const modeSelector = readFileSync(
  new URL(
    '../src/features/character-creation/components/CharacterCreationModeSelector.tsx',
    import.meta.url,
  ),
  'utf8',
)

const disciplineCard = readFileSync(
  new URL(
    '../src/features/character-creation/components/DisciplineEditorCard.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'tarjetas de creación usan el sistema visual sin cambiar los componentes',
  () => {
    assert.match(
      style,
      /BLOODKEEPER_CREATION_CARDS_V1_START/,
    )
    assert.match(
      style,
      /\.creation-mode-selector__option/,
    )
    assert.match(
      style,
      /\.discipline-editor-card--selected/,
    )
    assert.match(
      style,
      /\.discipline-power-option--selected/,
    )
    assert.match(
      style,
      /@media \(max-width: 760px\)/,
    )

    assert.match(
      modeSelector,
      /onSelect\('standard'\)/,
    )
    assert.match(
      modeSelector,
      /onSelect\('sessionZero'\)/,
    )
    assert.match(
      disciplineCard,
      /onChange\(\s*disciplineKey,\s*value \+ 1,/,
    )
  },
)
