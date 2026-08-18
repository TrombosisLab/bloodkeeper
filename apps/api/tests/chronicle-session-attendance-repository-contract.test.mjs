import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-session-attendance.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'Attendance lista sólo presentes con página física y orden estable',
  () => {
    assert.match(
      repository,
      /chronicleSessionAttendance[\s\S]*findMany/,
    )
    assert.match(
      repository,
      /removedAt:\s*null/,
    )
    assert.match(
      repository,
      /createdAt:\s*'asc'[\s\S]*id:\s*'asc'/,
    )
    assert.match(
      repository,
      /skip:\s*query\.offset/,
    )
    assert.match(
      repository,
      /take:\s*query\.limit \+ 1/,
    )
    assert.match(
      repository,
      /offsetPageFromRows/,
    )
  },
)

test(
  'Attendance valida ACTIVE + misma Crónica sin filtrar naturaleza',
  () => {
    const block =
      repository.match(
        /async isEligibleCharacter\([\s\S]*?\n  }\n\n  async add\(/,
      )?.[0] ?? ''

    assert.ok(block.length > 0)
    assert.match(
      block,
      /chronicleId/,
    )
    assert.match(
      block,
      /PrismaCharacterStatus\.ACTIVE/,
    )
    assert.doesNotMatch(
      block,
      /nature/,
    )
  },
)

test(
  'Alta es concurrente/idempotente por upsert de clave compuesta',
  () => {
    assert.match(
      repository,
      /async add\([\s\S]*chronicleSessionAttendance[\s\S]*upsert/,
    )
    assert.match(
      repository,
      /sessionId_characterId/,
    )
    assert.match(
      repository,
      /update:[\s\S]*removedAt:\s*null/,
    )
  },
)

test(
  'Retirada es soft e idempotente sin delete físico',
  () => {
    const block =
      repository.match(
        /async remove\([\s\S]*?\n  }\n}/,
      )?.[0] ?? ''

    assert.ok(block.length > 0)
    assert.match(
      block,
      /updateMany/,
    )
    assert.match(
      block,
      /removedAt:\s*null/,
    )
    assert.match(
      block,
      /removedAt:\s*new Date\(\)/,
    )
    assert.doesNotMatch(
      block,
      /\.delete(?:Many)?\(/,
    )
  },
)
