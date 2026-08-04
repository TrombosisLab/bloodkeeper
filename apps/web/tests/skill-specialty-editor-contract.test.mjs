import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const component = fs.readFileSync(
  new URL(
    '../src/features/character-creation/components/SkillSpecialtiesEditor.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '003-L la interfaz muestra cupo, obligatorias y procedencia',
  () => {
    assert.match(
      component,
      /getSpecialtyCreationBudget/,
    )
    assert.match(
      component,
      /Especialidades de creación/,
    )
    assert.match(
      component,
      /Pendientes obligatorias/,
    )
    assert.match(
      component,
      /Tipo de Depredador/,
    )
  },
)

test(
  '003-L la interfaz no permite borrar concesiones del Tipo de Depredador',
  () => {
    assert.match(
      component,
      /const creation =[\s\S]*isCreationSpecialty/,
    )
    assert.match(
      component,
      /\{creation && \([\s\S]*removeSpecialty/,
    )
  },
)
