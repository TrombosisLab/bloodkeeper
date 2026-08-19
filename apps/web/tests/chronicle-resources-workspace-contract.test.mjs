import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const workspace =
  await readFile(
    new URL(
      '../src/features/chronicles/components/ChronicleResourcesWorkspace.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const styles =
  await readFile(
    new URL(
      '../src/features/chronicles/components/chronicle-resources-workspace.css',
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
  'UX Recursos monta un único workspace desde ChronicleDetail',
  () => {
    assert.match(
      detail,
      /<ChronicleResourcesWorkspace/,
    )
    assert.doesNotMatch(
      detail,
      /<ChronicleNpcPanel/,
    )
    assert.doesNotMatch(
      detail,
      /<ChronicleLocationPanel/,
    )
  },
)

test(
  'UX Recursos ofrece pestañas internas PNJ y Localizaciones con contador',
  () => {
    assert.match(
      workspace,
      /role="tablist"/,
    )
    assert.match(
      workspace,
      /chronicle-resource-npcs-tab/,
    )
    assert.match(
      workspace,
      /chronicle-resource-locations-tab/,
    )
    assert.match(
      workspace,
      />PNJ</,
    )
    assert.match(
      workspace,
      />Localizaciones</,
    )
    assert.match(
      workspace,
      /npcCount/,
    )
    assert.match(
      workspace,
      /locationCount/,
    )
  },
)

test(
  'UX Recursos mantiene ambos paneles montados y sólo uno visible',
  () => {
    assert.match(
      workspace,
      /<ChronicleNpcPanel[\s\S]*onCountChange=\{setNpcCount\}/,
    )
    assert.match(
      workspace,
      /<ChronicleLocationPanel[\s\S]*onCountChange=\{[\s\S]*setLocationCount/,
    )
    assert.match(
      workspace,
      /hidden=\{activeSection !== 'npcs'\}/,
    )
    assert.match(
      workspace,
      /hidden=\{[\s\S]*activeSection !== 'locations'/,
    )
  },
)

test(
  'UX Recursos usa tokens y pestañas responsive',
  () => {
    for (const token of [
      'var(--color-border-default)',
      'var(--color-surface-translucent)',
      'var(--radius-xl)',
      '@media (max-width: 760px)',
    ]) {
      assert.match(
        styles,
        new RegExp(
          token.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
          ),
        ),
      )
    }

    assert.doesNotMatch(
      styles,
      /#[0-9a-f]{3,8}\b|rgb\(/i,
    )
  },
)

test(
  'UX Recursos subordina visualmente la pestaña inactiva',
  () => {
    assert.match(
      styles,
      /__tab:not\([\s\S]*__tab--active[\s\S]*opacity:\s*0\.62/,
    )
    assert.match(
      styles,
      /__tab--active[\s\S]*opacity:\s*1/,
    )
  },
)
