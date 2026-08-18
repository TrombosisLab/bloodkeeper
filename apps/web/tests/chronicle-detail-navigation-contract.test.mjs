import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const detail = await readFile(
  new URL(
    '../src/features/chronicles/components/ChronicleDetail.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  'UX-1 permite consultar una sección de Crónica cada vez',
  () => {
    assert.match(
      detail,
      /useState<ChronicleDetailSection>[\s\S]*'summary'/,
    )
    assert.match(detail, /role="tablist"/)

    for (const section of [
      'summary',
      'participants',
      'sessions',
      'story',
      'resources',
    ]) {
      assert.match(
        detail,
        new RegExp(`chronicle-section-${section}-tab`),
      )
      assert.match(
        detail,
        new RegExp(`chronicle-section-${section}-panel`),
      )
    }

    assert.match(
      detail,
      /hidden=\{activeSection !== 'summary'\}/,
    )
    assert.match(
      detail,
      /hidden=\{activeSection !== 'participants'\}/,
    )
    assert.match(
      detail,
      /hidden=\{activeSection !== 'sessions'\}/,
    )
    assert.match(
      detail,
      /hidden=\{activeSection !== 'story'\}/,
    )
    assert.match(
      detail,
      /hidden=\{activeSection !== 'resources'\}/,
    )
  },
)
