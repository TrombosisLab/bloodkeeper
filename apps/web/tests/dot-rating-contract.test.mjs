import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const dotRating = await readFile(
  new URL(
    '../src/components/ui/DotRating.tsx',
    import.meta.url,
  ),
  'utf8',
)

const attributeEditor = await readFile(
  new URL(
    '../src/features/character-creation/components/AttributeEditorRow.tsx',
    import.meta.url,
  ),
  'utf8',
)

const skillEditor = await readFile(
  new URL(
    '../src/features/character-creation/components/SkillEditorRow.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '005-C define estados visuales y accesibles',
  () => {
    for (const state of [
      'readOnly',
      'editable',
      'locked',
      'error',
    ]) {
      assert.match(dotRating, new RegExp(state))
    }

    assert.match(dotRating, /aria-invalid/)
    assert.match(dotRating, /aria-disabled/)
  },
)

test(
  '005-C reutiliza DotRating en ambos editores',
  () => {
    for (const editor of [
      attributeEditor,
      skillEditor,
    ]) {
      assert.match(
        editor,
        /import \{ DotRating \}/,
      )
      assert.match(editor, /<DotRating/)
      assert.match(editor, /state="editable"/)
    }

    assert.doesNotMatch(
      attributeEditor,
      /attribute-editor-dot/,
    )
    assert.doesNotMatch(
      skillEditor,
      /skill-editor-dot/,
    )
  },
)
