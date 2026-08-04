import {
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto'

import type {
  PasswordHasher,
} from '../application/password-hasher'

const ALGORITHM = 'scrypt'
const COST = 32768
const BLOCK_SIZE = 8
const PARALLELIZATION = 1
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const MAX_MEMORY = 64 * 1024 * 1024

function deriveKey(
  password: string,
  salt: Buffer,
  cost: number,
  blockSize: number,
  parallelization: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: MAX_MEMORY,
      },
      (error, key) => {
        if (error !== null) {
          reject(error)
          return
        }

        resolve(key)
      },
    )
  })
}

function parsePositiveInteger(
  value: string,
): number | null {
  const parsed = Number(value)

  return (
    Number.isSafeInteger(parsed) &&
    parsed > 0
  )
    ? parsed
    : null
}

export class ScryptPasswordHasher
  implements PasswordHasher {
  async hash(
    password: string,
  ): Promise<string> {
    const salt =
      randomBytes(SALT_LENGTH)
    const key =
      await deriveKey(
        password,
        salt,
        COST,
        BLOCK_SIZE,
        PARALLELIZATION,
      )

    return [
      ALGORITHM,
      COST,
      BLOCK_SIZE,
      PARALLELIZATION,
      salt.toString('base64url'),
      key.toString('base64url'),
    ].join('$')
  }

  async verify(
    password: string,
    encodedHash: string,
  ): Promise<boolean> {
    const parts =
      encodedHash.split('$')

    if (
      parts.length !== 6 ||
      parts[0] !== ALGORITHM
    ) {
      return false
    }

    const cost =
      parsePositiveInteger(parts[1] ?? '')
    const blockSize =
      parsePositiveInteger(parts[2] ?? '')
    const parallelization =
      parsePositiveInteger(parts[3] ?? '')

    if (
      cost === null ||
      blockSize === null ||
      parallelization === null
    ) {
      return false
    }

    let salt: Buffer
    let expected: Buffer

    try {
      salt = Buffer.from(
        parts[4] ?? '',
        'base64url',
      )
      expected = Buffer.from(
        parts[5] ?? '',
        'base64url',
      )
    } catch {
      return false
    }

    if (
      salt.length !== SALT_LENGTH ||
      expected.length !== KEY_LENGTH
    ) {
      return false
    }

    let actual: Buffer

    try {
      actual = await deriveKey(
        password,
        salt,
        cost,
        blockSize,
        parallelization,
      )
    } catch {
      return false
    }

    return (
      actual.length === expected.length &&
      timingSafeEqual(actual, expected)
    )
  }
}
