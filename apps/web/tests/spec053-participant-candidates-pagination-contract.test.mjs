import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

async function source(relative) {
  return readFile(
    new URL(
      `../src/features/chronicles/${relative}`,
      import.meta.url,
    ),
    'utf8',
  )
}

test(
  'SPEC-053 gateway participant-candidates expone página física',
  async () => {
    const gateway =
      await source(
        'infrastructure/chronicle.api.ts',
      )

    assert.match(
      gateway,
      /participantCandidatesPage\(/,
    )
    assert.match(
      gateway,
      /\/participant-candidates\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /ChronicleParticipantCandidateApiPage/,
    )
  },
)

test(
  'SPEC-053 participantCandidates reconstruye todos los candidatos por páginas',
  async () => {
    const gateway =
      await source(
        'infrastructure/chronicle.api.ts',
      )

    const start =
      gateway.indexOf(
        '    async participantCandidates(',
      )
    const end =
      gateway.indexOf(
        '    async addParticipant(',
        start,
      )
    const block =
      gateway.slice(
        start,
        end,
      )

    assert.match(
      block,
      /while \(nextOffset !== null\)/,
    )
    assert.match(
      block,
      /this\.participantCandidatesPage/,
    )
    assert.match(
      block,
      /limit:\s*50/,
    )
    assert.match(
      block,
      /offset:\s*nextOffset/,
    )
    assert.match(
      block,
      /\.\.\.page\.items/,
    )
  },
)

test(
  'SPEC-053 ChronicleDetail mantiene selector completo sin paginación UI',
  async () => {
    const detail =
      await source(
        'components/ChronicleDetail.tsx',
      )

    assert.match(
      detail,
      /\.participantCandidates\(\s*chronicleId,?\s*\)/,
    )
    assert.doesNotMatch(
      detail,
      /participantCandidatesPage/,
    )
    assert.match(
      detail,
      /candidates\.map/,
    )
  },
)
