import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const useCaseUrl = new URL(
  '../src/characters/application/purchase-character-advancement.use-case.ts',
  import.meta.url,
)

test('058-E2 purchase calcula la ayuda antes del preview y conserva E1 después', async () => {
  const source =
    await readFile(
      useCaseUrl,
      'utf8',
    )

  const assess =
    source.indexOf(
      'assessCharacterBloodDyscrasiaExperience(',
    )
  const preview =
    source.indexOf(
      'previewCharacterAdvancement(',
      assess,
    )
  const discount =
    source.indexOf(
      'applyCharacterBloodDyscrasiaExperiencePreview(',
      preview,
    )
  const resonance =
    source.indexOf(
      'applyCharacterDisciplineResonanceEvidence(',
      discount,
    )
  const purchase =
    source.indexOf(
      'this.experience.purchase({',
      resonance,
    )

  assert.ok(assess >= 0)
  assert.ok(preview > assess)
  assert.ok(discount > preview)
  assert.ok(resonance > discount)
  assert.ok(purchase > resonance)

  assert.match(
    source,
    /previewAvailable[\s\S]*ledger\.available \+[\s\S]*benefit\.amount/,
  )

  assert.match(
    source,
    /cost:\s*preview\.cost[\s\S]*dyscrasiaExperienceBenefit:/,
  )
})

test('058-E2 purchase sólo pasa descriptor derivado por backend', async () => {
  const source =
    await readFile(
      useCaseUrl,
      'utf8',
    )

  assert.match(
    source,
    /assessCharacterBloodDyscrasiaExperience\([\s\S]*character\.blood\?\.dyscrasia/,
  )

  assert.match(
    source,
    /dyscrasiaExperienceBenefit:[\s\S]*dyscrasiaExperience\.status ===[\s\S]*'available'/,
  )

  assert.doesNotMatch(
    source,
    /command\.(dyscrasiaKey|dyscrasiaSourceOperationId|discount|cost)/,
  )
})
