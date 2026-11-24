import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const dialog = await readFile(
  new URL(
    '../src/features/character-creation/components/advantages/AdvantageInstanceDetailsDialog.tsx',
    import.meta.url,
  ),
  'utf8',
)

const step = await readFile(
  new URL(
    '../src/features/character-creation/components/AdvantagesStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/styles/character-creation.css',
    import.meta.url,
  ),
  'utf8',
)

test('los detalles se editan en una ventana modal y se guardan desde un borrador', () => {
  assert.match(dialog, /<dialog[\s\S]*?aria-labelledby=/)
  assert.match(dialog, /useState\(selection\)/)
  assert.match(dialog, /selection=\{draftSelection\}/)
  assert.match(dialog, /onSave\(draftSelection\)/)
})

test('cancelar o cerrar descarta el borrador y conserva la selección sin alterar', () => {
  assert.match(dialog, /onCancel=/)
  assert.match(dialog, /type="button"[\s\S]*?onClick=\{close\}/)
  assert.match(dialog, /onClose=\{handleDialogClose\}/)
  assert.match(dialog, /type="submit"/)
})

test('seleccionar datos configurables abre la ventana y deja compacta la lista', () => {
  assert.match(step, /definition\.requiresInstanceDetails === true\)[\s\S]*?setEditingDetailsSelectionId/)
  assert.match(step, /<AdvantageInstanceDetailsDialog/)
  assert.match(step, /className="advantage-instance-compact-row"/)
  assert.doesNotMatch(step, /<AdvantageInstanceDetailsEditor/)
})

test('la ventana limita su altura y se adapta a pantallas estrechas', () => {
  assert.match(styles, /\.advantage-instance-dialog\s*\{[\s\S]*?max-height: min\(90dvh/)
  assert.match(styles, /@media \(max-width: 760px\)\s*\{[\s\S]*?\.advantage-instance-dialog/)
})
