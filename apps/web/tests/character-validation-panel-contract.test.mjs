import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(
  new URL(
    '../src/features/character-sheet/components/PersistedCharacterValidation.tsx',
    import.meta.url,
  ),
  'utf8',
)

const sheet = await readFile(
  new URL(
    '../src/features/character-sheet/components/CharacterSheet.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '029-I integra el informe solo para un personaje persistido',
  () => {
    assert.match(
      sheet,
      /characterId \? \([\s\S]*<PersistedCharacterValidation[\s\S]*characterId=\{characterId\}/,
    )
  },
)

test(
  '029-I consulta exclusivamente el contexto de activacion',
  () => {
    assert.match(
      component,
      /\.validate\(characterId, 'activation'\)/,
    )
    assert.doesNotMatch(
      component,
      /\/lifecycle/,
    )
  },
)

test(
  '029-I presenta la decision y todas las secciones del dominio',
  () => {
    assert.match(component, /report\.canProceed/)
    assert.match(component, /report\.sections\.map/)
    assert.match(component, /section\.issues\.map/)
    assert.match(
      component,
      /El personaje todavia no puede activarse/,
    )
  },
)

test(
  '029-I diferencia sesion ausencia y error de red',
  () => {
    assert.match(component, /error\.status === 401/)
    assert.match(component, /error\.status === 404/)
    assert.match(component, /role="alert"/)
    assert.match(component, /Volver a validar/)
  },
)
