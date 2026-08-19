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

const styles = fs.readFileSync(
  new URL(
    '../src/features/character-list/character-list.css',
    import.meta.url,
  ),
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

test(
  'UX Personajes compacta Guardados sin alterar sus acciones',
  () => {
    assert.match(
      component,
      /character-list-card__identity/,
    )
    assert.match(
      component,
      /character-list-card__concept/,
    )
    assert.match(
      component,
      /character-list-card__updated/,
    )
    assert.match(
      component,
      /character-list__load-more/,
    )
    assert.match(
      component,
      /character\.status === 'active'[\s\S]*Abrir ficha/,
    )
    assert.match(
      component,
      /character\.status ===\s*'draft'[\s\S]*Continuar creación/,
    )
  },
)

test(
  'UX Personajes usa filas compactas con scroll acotado en escritorio',
  () => {
    assert.match(
      styles,
      /\.character-list__cards\s*\{[\s\S]*max-height:[\s\S]*overflow-y:\s*auto/,
    )
    assert.match(
      styles,
      /\.character-list-card\s*\{[\s\S]*grid-template-columns:[\s\S]*auto/,
    )
    assert.match(
      styles,
      /\.character-list-card__body\s*\{[\s\S]*grid-template-columns:/,
    )
    assert.match(
      styles,
      /\.character-list-card__concept\s*\{[\s\S]*text-overflow:\s*ellipsis/,
    )
  },
)

test(
  'UX Personajes conserva adaptación móvil sin scroll interno forzado',
  () => {
    assert.match(
      styles,
      /@media \(max-width:\s*640px\)[\s\S]*\.character-list__cards\s*\{[\s\S]*max-height:\s*none[\s\S]*overflow-y:\s*visible/,
    )
    assert.match(
      styles,
      /@media \(max-width:\s*640px\)[\s\S]*\.character-list-card\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    )
  },
)

test(
  'UX Personajes no adelanta búsqueda filtros ordenación ni nuevas operaciones',
  () => {
    assert.doesNotMatch(
      component,
      /Buscar personajes|searchCharacters|Filtrar|filterCharacters|Ordenar por|sortCharacters/,
    )
    assert.doesNotMatch(
      component,
      /Seleccionar todos|selectionMode|bulkAction/,
    )
  },
)
