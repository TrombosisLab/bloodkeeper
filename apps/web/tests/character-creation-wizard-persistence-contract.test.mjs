import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const wizard = await readFile(
  new URL(
    '../src/features/character-creation/components/CharacterCreationWizard.tsx',
    import.meta.url,
  ),
  'utf8',
)

const main = await readFile(
  new URL('../src/main.tsx', import.meta.url),
  'utf8',
)

test(
  '004-E.2B conecta el wizard mediante guardado explícito',
  () => {
    assert.match(
      wizard,
      /loadCharacterDraftEditorState/,
    )
    assert.match(
      wizard,
      /persistCharacterDraftEditorState/,
    )
    assert.match(wizard, /Crear borrador/)
    assert.match(wizard, /Guardar cambios/)
    assert.match(wizard, /Recargar borrador/)
    assert.doesNotMatch(
      wizard,
      /setInterval|setTimeout/,
    )
  },
)

test(
  '004-E.2B conserva el id al alternar con la ficha demo',
  () => {
    assert.match(main, /creationCharacterId/)
    assert.match(
      main,
      /characterId=\{creationCharacterId\}/,
    )
    assert.match(
      main,
      /onCharacterPersisted=\{setCreationCharacterId\}/,
    )
    assert.match(main, /Continuar creación/)
    assert.doesNotMatch(
      main,
      /<CharacterSheet[\s\S]{0,120}characterId=/,
    )
  },
)
