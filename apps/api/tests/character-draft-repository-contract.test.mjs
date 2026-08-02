import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/characters/infrastructure/prisma-character-draft.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '004-C crea identidad y progreso de forma atómica',
  () => {
    assert.match(
      repository,
      /transaction\.character\.create/,
    )
    assert.match(repository, /identity:\s*{\s*create:/)
    assert.match(
      repository,
      /creationState:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /attributes:\s*{\s*create:/,
    )
    assert.match(repository, /blood:\s*{\s*create:/)
    assert.match(
      repository,
      /skills:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /humanity:\s*{\s*create:/,
    )
  },
)

test(
  '004-C carga las relaciones persistentes necesarias',
  () => {
    assert.match(
      repository,
      /identity: true,[\s\S]*creationState: true,[\s\S]*attributes: true,[\s\S]*blood: true,[\s\S]*skills:[\s\S]*humanity: true/,
    )
    assert.match(repository, /character\.findUnique/)
  },
)

test(
  '004-C protege actualizaciones concurrentes y personajes no borrador',
  () => {
    assert.match(repository, /\$transaction/)
    assert.match(
      repository,
      /revision: data\.expectedRevision/,
    )
    assert.match(
      repository,
      /status: PrismaCharacterStatus\.DRAFT/,
    )
    assert.match(
      repository,
      /revision: { increment: 1 }/,
    )
    assert.match(
      repository,
      /characterSkill\.upsert/,
    )
    assert.match(
      repository,
      /characterSkillSpecialty\.deleteMany/,
    )
    assert.match(
      repository,
      /characterConviction[\s\S]*\.deleteMany/,
    )
    assert.match(
      repository,
      /characterTouchstone[\s\S]*\.deleteMany/,
    )
  },
)
