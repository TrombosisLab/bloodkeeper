import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const gateway =
  await readFile(
    new URL(
      '../src/features/chronicles/infrastructure/chronicle.api.ts',
      import.meta.url,
    ),
    'utf8',
  )

const detail =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleDetail.tsx',
      import.meta.url,
    ),
    'utf8',
  )

test(
  'SPEC-053-C2 gateway ofrece page y helpers completos bounded',
  () => {
    assert.match(
      gateway,
      /participantsPage\([\s\S]*ChronicleParticipantApiPage/,
    )
    assert.match(
      gateway,
      /charactersPage\([\s\S]*ChronicleCharacterApiPage/,
    )
    assert.match(
      gateway,
      /\/participants\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /\/characters\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /async participants\(chronicleId\)[\s\S]*while \(nextOffset !== null\)[\s\S]*limit: 50/,
    )
    assert.match(
      gateway,
      /async characters\(chronicleId\)[\s\S]*while \(nextOffset !== null\)[\s\S]*limit: 50/,
    )
  },
)

test(
  'SPEC-053-C2 ChronicleDetail conserva helpers completos',
  () => {
    assert.match(
      detail,
      /gateway\.participants\(\s*chronicleId,\s*\)/,
    )
    assert.match(
      detail,
      /gateway\.characters\(\s*chronicleId,\s*\)/,
    )
    assert.doesNotMatch(
      detail,
      /gateway\.participantsPage/,
    )
    assert.doesNotMatch(
      detail,
      /gateway\.charactersPage/,
    )
  },
)

test(
  'SPEC-053 pagina participant-candidates y conserva helper completo',
  () => {
    assert.match(
      gateway,
      /participantCandidatesPage\([\s\S]*ChronicleParticipantCandidateApiPage/,
    )
    assert.match(
      gateway,
      /\/participant-candidates\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /async participantCandidates\([\s\S]*while \(nextOffset !== null\)[\s\S]*limit: 50/,
    )
    assert.match(
      detail,
      /\.participantCandidates\(\s*chronicleId,?\s*\)/,
    )
    assert.doesNotMatch(
      detail,
      /participantCandidatesPage/,
    )
  },
)
