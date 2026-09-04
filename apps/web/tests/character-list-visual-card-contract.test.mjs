import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const component = fs.readFileSync(new URL("../src/features/character-list/components/CharacterList.tsx", import.meta.url), "utf8")
const portrait = fs.readFileSync(new URL("../src/features/character-list/components/CharacterListPortrait.tsx", import.meta.url), "utf8")
const styles = fs.readFileSync(new URL("../src/features/character-list/character-list.css", import.meta.url), "utf8")

test("Personajes muestra retrato real con fallback visual de clan", () => {
  assert.match(component, /CharacterListPortrait/)
  assert.match(portrait, /api\/characters\/.+\/portrait/)
  assert.match(portrait, /V5VisualMark/)
  assert.match(styles, /character-list-card__portrait/)
})

test("Personajes conserva concepto y acciones en la tarjeta enriquecida", () => {
  assert.match(component, /character-list-card__concept/)
  assert.match(component, /Abrir ficha/)
  assert.match(component, /Continuar creaci/)
})
