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
      /humanityStains[\s\S]*characterHumanityState[\s\S]*stains:/,
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

test(
  '029-E persiste transiciones de ciclo de vida de forma atomica',
  () => {
    assert.match(
      repository,
      /async transitionLifecycle\(\s*ownerId: string,\s*data: TransitionCharacterLifecycleData/,
    )
    assert.match(
      repository,
      /id: data\.characterId,\s*ownerId,\s*revision: data\.expectedRevision,\s*status:\s*statusToPrisma\[\s*data\.expectedStatus/,
    )
    assert.match(
      repository,
      /status:\s*statusToPrisma\[data\.nextStatus\],\s*revision: \{ increment: 1 \}/,
    )
    assert.match(
      repository,
      /CharacterLifecycleWriteConflictError/,
    )
  },
)

test(
  '057-SANDMAN evita colisiones globales al persistir la misma concesión en personajes distintos',
  () => {
    assert.match(
      repository,
      /function createCharacterScopedSkillSpecialtyId\([\s\S]*specialtyId\.startsWith\(prefix\)/,
    )
    assert.match(
      repository,
      /id:\s*createCharacterScopedSkillSpecialtyId\(\s*data\.characterId,\s*specialty\.id,\s*\),/,
    )
  },
)

test(
  '004-C reintenta la transacción completa ante colisión del ID',
  () => {
    const start = repository.indexOf(
      '  async create(\n    data: CreateCharacterDraftData,',
    )
    const end = repository.indexOf('\n  listByOwner(', start)
    assert.ok(start >= 0 && end > start, 'No se encontró el método create')
    const createDraft = repository.slice(start, end)

    assert.match(
      repository,
      /meta\.modelName !== 'Character'/,
    )
    assert.match(repository, /target\.includes\('id'\)/)
    assert.match(
      createDraft,
      /for \(let attempt = 1; attempt <= 3; attempt \+= 1\)/,
    )
    assert.match(
      createDraft,
      /return await this\.database\.\$transaction/,
    )

    const transactionStart = createDraft.indexOf(
      'async (transaction) => {',
    )
    const newId = createDraft.indexOf(
      'const characterId = randomUUID()',
    )
    assert.ok(
      transactionStart >= 0 && newId > transactionStart,
      'Cada transacción debe generar su propio UUID',
    )
    assert.match(
      createDraft,
      /!isCharacterIdUniqueConstraintError\(error\)[\s\S]*attempt === 3[\s\S]*throw error/,
    )
  },
)
