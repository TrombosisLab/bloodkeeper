import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL(
    '../src/characters/presentation/character-draft.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = await readFile(
  new URL(
    '../src/characters/presentation/character-draft.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

const updateUseCase = await readFile(
  new URL(
    '../src/characters/application/update-character-draft.use-case.ts',
    import.meta.url,
  ),
  'utf8',
)

const moduleSource = await readFile(
  new URL(
    '../src/characters/characters.module.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '031-C publica una operación dedicada de asociación de Crónica',
  () => {
    assert.match(
      controller,
      /@Patch\(':characterId\/chronicle'\)/,
    )
    assert.match(
      controller,
      /updateChronicleAssociation[\s\S]*\.execute/,
    )
  },
)

test(
  '031-C exige revision y acepta target nullable con confirmación explícita',
  () => {
    assert.match(
      dto,
      /'expectedRevision'[\s\S]*'chronicleId'[\s\S]*'confirmChange'/,
    )
    assert.match(
      dto,
      /confirmChange:[\s\S]*value\.confirmChange === true/,
    )
  },
)

test(
  '031-C creación no permite saltarse la operación dedicada',
  () => {
    assert.match(
      dto,
      /'body\.chronicleId'/,
    )
    assert.match(
      dto,
      /'must be null; use the dedicated chronicle association operation'/,
    )
  },
)

test(
  '031-C update genérico no puede cambiar realmente chronicleId',
  () => {
    assert.match(
      updateUseCase,
      /CharacterChronicleAssociationRequiredError/,
    )
    assert.match(
      updateUseCase,
      /data\.chronicleId !==[\s\S]*current\.chronicleId/,
    )
  },
)

test(
  '031-C usa el port público de participación contextual',
  () => {
    assert.match(
      moduleSource,
      /imports:[\s\S]*ChroniclesModule/,
    )
    assert.match(
      moduleSource,
      /CHRONICLE_PARTICIPANT_REPOSITORY/,
    )
  },
)

test(
  '031-C expone códigos estructurados de permiso confirmación y conflicto',
  () => {
    for (const code of [
      'CHARACTER_CHRONICLE_ASSOCIATION_REQUIRED',
      'CHARACTER_CHRONICLE_MEMBERSHIP_REQUIRED',
      'CHARACTER_CHRONICLE_CONFIRMATION_REQUIRED',
      'CHARACTER_DRAFT_WRITE_CONFLICT',
    ]) {
      assert.match(
        controller,
        new RegExp(code),
      )
    }
  },
)
