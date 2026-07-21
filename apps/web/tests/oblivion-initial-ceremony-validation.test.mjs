import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getOblivionCeremony,
  oblivionCeremonyDefinitions,
} from '../src/features/character-creation/data/oblivion-ceremony-definitions.ts'

import {
  getLearnableInitialOblivionCeremonies,
  MAX_INITIAL_OBLIVION_CEREMONIES,
  validateInitialOblivionCeremonySelection,
} from '../src/features/character-creation/domain/oblivion-ceremony-rules.ts'

const GIFT =
  'oblivion-ceremony-gift-of-false-life'

const SUMMON =
  'oblivion-ceremony-summon-spirit'

const COMPEL =
  'oblivion-ceremony-compel-spirit'

test(
  'durante creación inicial solo puede seleccionarse una Ceremonia',
  () => {
    assert.equal(
      MAX_INITIAL_OBLIVION_CEREMONIES,
      1,
    )
  },
)

test(
  'sin Olvido no hay Ceremonias iniciales aprendibles',
  () => {
    assert.deepEqual(
      getLearnableInitialOblivionCeremonies(
        oblivionCeremonyDefinitions,
        0,
        [
          'oblivion-ashes-to-ashes',
          'oblivion-binding-fetter',
        ],
      ),
      [],
    )
  },
)

test(
  'Olvido 1 sin Poder habilitante no ofrece Ceremonias iniciales',
  () => {
    assert.deepEqual(
      getLearnableInitialOblivionCeremonies(
        oblivionCeremonyDefinitions,
        1,
        [],
      ),
      [],
    )
  },
)

test(
  'Cenizas a las Cenizas habilita Don de Falsa Vida',
  () => {
    assert.deepEqual(
      getLearnableInitialOblivionCeremonies(
        oblivionCeremonyDefinitions,
        1,
        [
          'oblivion-ashes-to-ashes',
        ],
      ).map(
        (ceremony) =>
          ceremony.key,
      ),
      [
        GIFT,
      ],
    )
  },
)

test(
  'El Grillete Vinculante habilita Invocar Espíritu',
  () => {
    assert.deepEqual(
      getLearnableInitialOblivionCeremonies(
        oblivionCeremonyDefinitions,
        1,
        [
          'oblivion-binding-fetter',
        ],
      ).map(
        (ceremony) =>
          ceremony.key,
      ),
      [
        SUMMON,
      ],
    )
  },
)

test(
  'con ambos Poderes habilitantes aparecen las dos opciones de nivel 1',
  () => {
    assert.deepEqual(
      getLearnableInitialOblivionCeremonies(
        oblivionCeremonyDefinitions,
        2,
        [
          'oblivion-ashes-to-ashes',
          'oblivion-binding-fetter',
        ],
      ).map(
        (ceremony) =>
          ceremony.key,
      ),
      [
        GIFT,
        SUMMON,
      ],
    )
  },
)

test(
  'aunque haya dos opciones elegibles solo puede seleccionarse una',
  () => {
    const result =
      validateInitialOblivionCeremonySelection(
        oblivionCeremonyDefinitions,
        [
          GIFT,
          SUMMON,
        ],
        2,
        [
          'oblivion-ashes-to-ashes',
          'oblivion-binding-fetter',
        ],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'Don de Falsa Vida es una selección inicial válida con su Poder',
  () => {
    const result =
      validateInitialOblivionCeremonySelection(
        oblivionCeremonyDefinitions,
        [
          GIFT,
        ],
        1,
        [
          'oblivion-ashes-to-ashes',
        ],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'Invocar Espíritu es una selección inicial válida con su Poder',
  () => {
    const result =
      validateInitialOblivionCeremonySelection(
        oblivionCeremonyDefinitions,
        [
          SUMMON,
        ],
        1,
        [
          'oblivion-binding-fetter',
        ],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'una Ceremonia inicial es inválida sin su Poder requerido',
  () => {
    const result =
      validateInitialOblivionCeremonySelection(
        oblivionCeremonyDefinitions,
        [
          GIFT,
        ],
        1,
        [],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'una Ceremonia de nivel 2 nunca es válida durante creación inicial',
  () => {
    const ceremony =
      getOblivionCeremony(
        COMPEL,
      )

    assert.ok(ceremony)
    assert.equal(
      ceremony.level,
      2,
    )

    const result =
      validateInitialOblivionCeremonySelection(
        oblivionCeremonyDefinitions,
        [
          COMPEL,
        ],
        2,
        [
          'oblivion-where-the-shroud-thins',
        ],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'una selección vacía es estructuralmente válida cuando no hay Ceremonia elegible',
  () => {
    const result =
      validateInitialOblivionCeremonySelection(
        oblivionCeremonyDefinitions,
        [],
        1,
        [],
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'una clave de Ceremonia inexistente es inválida',
  () => {
    const result =
      validateInitialOblivionCeremonySelection(
        oblivionCeremonyDefinitions,
        [
          'oblivion-ceremony-inexistente',
        ],
        1,
        [
          'oblivion-ashes-to-ashes',
        ],
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)
