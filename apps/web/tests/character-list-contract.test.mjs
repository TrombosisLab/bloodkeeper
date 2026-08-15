import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const component = fs.readFileSync(
  new URL(
    '../src/features/character-list/components/CharacterList.tsx',
    import.meta.url,
  ),
  'utf8',
)

const main = fs.readFileSync(
  new URL('../src/main.tsx', import.meta.url),
  'utf8',
)

test(
  '019 ofrece un listado real separado de la ficha demo',
  () => {
    assert.match(
      component,
      /await gateway\.listPage\(\{/,
    )
    assert.match(
      component,
      /Tus personajes/,
    )
    assert.match(
      component,
      /Ficha de demostración/,
    )
    assert.match(
      component,
      /Crear personaje/,
    )
    assert.match(
      component,
      /Abrir ficha/,
    )
  },
)

test(
  '019 permite continuar únicamente borradores desde el listado',
  () => {
    assert.match(
      component,
      /character\.status ===\s*'draft'/,
    )
    assert.match(
      component,
      /Continuar creación/,
    )
    assert.match(
      component,
      /onContinueCreation/,
    )
  },
)

test(
  '019 integra listado ficha persistida creador y demo sin entradas ficticias',
  () => {
    assert.match(
      main,
      /<CharacterList/,
    )
    assert.match(
      main,
      /<PersistedCharacterSheet/,
    )
    assert.match(
      main,
      /<CharacterCreationWizard/,
    )
    assert.match(
      main,
      /<CharacterSheet \/>/,
    )
    assert.match(
      main,
      /Volver a personajes/,
    )
  },
)
