import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const identityStep = readFileSync(
  new URL(
    '../src/features/character-creation/components/IdentityStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const style = readFileSync(
  new URL(
    '../src/styles/bloodkeeper-visual-system.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  'el selector de clan conserva el catálogo y usa tarjetas accesibles',
  () => {
    assert.match(
      identityStep,
      /clanDefinitions\.map/,
    )
    assert.match(
      identityStep,
      /aria-pressed=/,
    )
    assert.match(
      identityStep,
      /updateClan\(clan\.key\)/,
    )
    assert.match(
      identityStep,
      /updateClan\(null\)/,
    )
    assert.match(
      identityStep,
      /inClanDisciplines\.map/,
    )
    assert.doesNotMatch(
      identityStep,
      /<select[\s\S]*name="clan"/,
    )
  },
)

test(
  'las tarjetas de clan conservan foco y respuesta móvil',
  () => {
    assert.match(
      style,
      /BLOODKEEPER_CLAN_CARDS_V1_START/,
    )
    assert.match(
      style,
      /\.clan-card-selector__card:focus-visible/,
    )
    assert.match(
      style,
      /@media \(max-width: 760px\)/,
    )
    assert.match(
      style,
      /@media \(max-width: 420px\)/,
    )
  },
)
