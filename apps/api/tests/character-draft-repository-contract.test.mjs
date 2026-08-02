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
    assert.match(repository, /damage:\s*{\s*create:/)
    assert.match(
      repository,
      /skills:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /humanity:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /disciplines:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /bloodSorceryRituals:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /oblivionCeremonies:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /thinBloodAlchemy:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /thinBloodTraits:\s*{\s*create:/,
    )
    assert.match(
      repository,
      /createAdvantageSelections\(/,
    )
  },
)

test(
  '004-C carga las relaciones persistentes necesarias',
  () => {
    assert.match(
      repository,
      /identity: true,[\s\S]*creationState: true,[\s\S]*attributes: true,[\s\S]*blood: true,[\s\S]*damage: true,[\s\S]*skills:[\s\S]*disciplines:[\s\S]*bloodSorceryRituals:[\s\S]*oblivionCeremonies:[\s\S]*thinBloodAlchemy: true,[\s\S]*thinBloodFormulas:[\s\S]*thinBloodTraits:[\s\S]*advantages:[\s\S]*humanity: true/,
    )
    assert.match(repository, /character\.findFirst/)
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
      /characterDamageState[\s\S]*\.update/,
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
    assert.match(
      repository,
      /characterDiscipline[\s\S]*\.deleteMany/,
    )
    assert.match(
      repository,
      /characterBloodSorceryRitual[\s\S]*\.deleteMany/,
    )
    assert.match(
      repository,
      /characterOblivionCeremony[\s\S]*\.deleteMany/,
    )
    assert.match(
      repository,
      /characterThinBloodAlchemyFormula[\s\S]*\.deleteMany/,
    )
    assert.match(
      repository,
      /characterThinBloodTrait[\s\S]*\.deleteMany/,
    )
    assert.match(
      repository,
      /characterAdvantageSelection[\s\S]*\.deleteMany/,
    )
  },
)

test(
  '004-D.2 limita carga y actualizacion al propietario',
  () => {
    assert.match(
      repository,
      /async findById\(\s*ownerId: string,\s*characterId: string/,
    )
    assert.match(
      repository,
      /character\.findFirst\(\{\s*where: \{\s*id: characterId,\s*ownerId,/,
    )
    assert.match(
      repository,
      /async update\(\s*ownerId: string,\s*data: UpdateCharacterDraftData/,
    )
    assert.match(
      repository,
      /id: data\.characterId,\s*ownerId,\s*revision: data\.expectedRevision/,
    )
  },
)
