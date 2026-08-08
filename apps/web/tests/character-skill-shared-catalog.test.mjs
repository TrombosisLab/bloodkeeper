import assert from 'node:assert/strict'
import test from 'node:test'

import { readFile } from 'node:fs/promises'

import {
  characterSkillCatalog,
} from '@v5r/character-rules'

import {
  skillDefinitions,
  skillKeys,
} from '../src/features/character-creation/data/skill-definitions.ts'

test(
  'SPEC-023 la interfaz deriva Habilidades del catálogo compartido',
  () => {
    assert.equal(
      skillDefinitions.length,
      27,
    )
    assert.equal(
      skillKeys.length,
      27,
    )

    assert.deepEqual(
      skillDefinitions.map(
        ({ key, label, category, active }) => ({
          key,
          name: label,
          category,
          active,
        }),
      ),
      characterSkillCatalog.definitions,
    )
  },
)

test(
  'SPEC-023 las 27 Habilidades actuales están activas',
  () => {
    assert.equal(
      characterSkillCatalog.definitions.every(
        (definition) => definition.active,
      ),
      true,
    )
  },
)

test(
  'SPEC-023 parser y demo no mantienen otro catálogo textual',
  async () => {
    const apiSource = await readFile(
      new URL(
        '../src/features/character-creation/infrastructure/character-draft.api.ts',
        import.meta.url,
      ),
      'utf8',
    )

    const demoSource = await readFile(
      new URL(
        '../src/features/character-sheet/data/demo-skills.ts',
        import.meta.url,
      ),
      'utf8',
    )

    const specialtySource = await readFile(
      new URL(
        '../src/features/character-creation/domain/skill-specialty-rules.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.doesNotMatch(
      apiSource,
      /const skillKeys = \[/,
    )
    assert.match(
      apiSource,
      /from '\.\.\/data\/skill-definitions\.ts'/,
    )

    assert.doesNotMatch(
      demoSource,
      /label:\s*'Atletismo'/,
    )
    assert.doesNotMatch(
      demoSource,
      /label:\s*'Academicismo'/,
    )

    assert.doesNotMatch(
      specialtySource,
      /academics:\s*'Academicismo'/,
    )
    assert.match(
      specialtySource,
      /skillDefinitions\.find/,
    )
  },
)
