import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const repository =
  fs.readFileSync(
    'src/characters/infrastructure/prisma-character-rouse-check.repository.ts',
    'utf8',
  )

test(
  '059-B repositorio usa transacción para CAS Hambre historial y ledger',
  () => {
    assert.match(
      repository,
      /database\.\$transaction/,
    )
    assert.match(
      repository,
      /transaction\.character[\s\S]*?\.updateMany/,
    )
    assert.match(
      repository,
      /revision:[\s\S]*increment:\s*1/,
    )
    assert.match(
      repository,
      /characterBloodState[\s\S]*\.update/,
    )
    assert.match(
      repository,
      /diceRollRecord[\s\S]*\.create/,
    )
    assert.match(
      repository,
      /characterRouseCheckOperation[\s\S]*\.create/,
    )
  },
)

test(
  '059-B historial es ACTION distinguible y no usa resolveDiceRoll ordinario',
  () => {
    assert.match(
      repository,
      /PrismaDiceRollSource\.ACTION/,
    )
    assert.match(
      repository,
      /kind:\s*'rouseCheck'/,
    )
    assert.match(
      repository,
      /'SPEC-059-v1\.0'/,
    )
    assert.doesNotMatch(
      repository,
      /resolveDiceRoll/,
    )
  },
)

test(
  '059-B Hambre 5 expira Resonancia y Discrasia mediante campos canónicos',
  () => {
    assert.match(
      repository,
      /data\.hungerAfter === 5/,
    )

    for (const field of [
      'resonanceSourceKind',
      'resonanceKey',
      'resonanceTemperament',
      'resonanceSpecialAffinityKey',
      'dyscrasiaKey',
      'dyscrasiaAcquisitionMode',
      'dyscrasiaSourceOperationId',
    ]) {
      assert.match(
        repository,
        new RegExp(
          `${field}:[\\s\\S]*null`,
        ),
      )
    }
  },
)

test(
  '059-B retry se resuelve dentro de transacción antes de reclamar revisión',
  () => {
    const findIndex =
      repository.indexOf(
        '.characterRouseCheckOperation',
      )
    const claimIndex =
      repository.indexOf(
        '.updateMany',
      )

    assert.ok(findIndex >= 0)
    assert.ok(claimIndex > findIndex)
    assert.match(
      repository,
      /isSameCharacterRouseCheckOperation/,
    )
  },
)
