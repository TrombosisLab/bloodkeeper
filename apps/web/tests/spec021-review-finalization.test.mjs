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

const review = await readFile(
  new URL(
    '../src/features/character-creation/components/ReviewStep.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'SPEC-021 Review reutiliza validación global y lifecycle existentes',
  () => {
    assert.match(
      wizard,
      /createCharacterValidationGateway/,
    )
    assert.match(
      wizard,
      /createCharacterLifecycleGateway/,
    )
    assert.match(
      wizard,
      /const persisted =[\s\S]*await persistDraft\(\)[\s\S]*validationGateway\.validate\([\s\S]*persisted\.characterId,[\s\S]*'activation'/,
    )
    assert.match(
      wizard,
      /lifecycleGateway\.transition\([\s\S]*editorState\.characterId,[\s\S]*editorState\.revision,[\s\S]*'active',[\s\S]*false/,
    )
  },
)

test(
  'SPEC-021 no permite finalizar con una validación obsoleta o bloqueada',
  () => {
    assert.match(
      wizard,
      /reviewReport\?\.canProceed === true/,
    )
    assert.match(
      wizard,
      /reviewRevision === editorState\.revision/,
    )
    assert.match(
      wizard,
      /!hasUnsavedChanges/,
    )
    assert.match(
      wizard,
      /setReviewReport\(null\)/,
    )
    assert.match(
      wizard,
      /invalidateReview\(\)[\s\S]*setHasUnsavedChanges\(true\)/,
    )
  },
)

test(
  'SPEC-021 Review resume todas las fases de creación',
  () => {
    for (
      const label of [
        'Identidad',
        'Atributos',
        'Habilidades',
        'Sangre',
        'Disciplinas',
        'Ventajas',
        'Humanidad',
      ]
    ) {
      assert.match(
        review,
        new RegExp(label),
      )
    }

    assert.match(
      review,
      /Categoría etaria/,
    )
    assert.match(
      review,
      /Tipo de Depredador|Depredador/,
    )
    assert.match(
      review,
      /Salud/,
    )
    assert.match(
      review,
      /Fuerza de Voluntad/,
    )
  },
)

test(
  'SPEC-021 Review distingue secciones errores pendientes y advertencias',
  () => {
    assert.match(
      review,
      /validationReport\?\.sections\.filter/,
    )
    assert.match(
      review,
      /issue\.severity === 'error'/,
    )
    assert.match(
      review,
      /issue\.severity === 'warning'/,
    )
    assert.match(
      review,
      /section\.state === 'pending'/,
    )
    assert.match(
      review,
      /section\.state === 'invalid'/,
    )

    for (
      const label of [
        'Con errores',
        'Decisiones pendientes',
        'Advertencias',
      ]
    ) {
      assert.match(
        review,
        new RegExp(label),
      )
    }
  },
)

test(
  'SPEC-021 Review exige comprobar antes de ofrecer finalización',
  () => {
    assert.match(
      review,
      /Comprobar personaje/,
    )
    assert.match(
      review,
      /validationReport\?\.canProceed\s*===\s*true[\s\S]*lifecycleStatus\s*===\s*'draft'/,
    )
    assert.match(
      review,
      /Finalizar personaje/,
    )
    assert.match(
      review,
      /disabled=\{[\s\S]*busy[\s\S]*!canFinalize/,
    )
  },
)
