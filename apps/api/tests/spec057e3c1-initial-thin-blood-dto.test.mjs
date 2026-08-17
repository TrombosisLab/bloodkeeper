import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidInitialVampireResolutionRequestError,
  parseResolveInitialThinBloodStateRequest,
} from '../dist/characters/presentation/character-initial-vampire.dto.js'

const characterId =
  '11111111-1111-4111-8111-111111111111'

test(
  '057-E3C1 parser acepta exclusivamente traits + alchemy + revision',
  () => {
    const parsed =
      parseResolveInitialThinBloodStateRequest(
        characterId,
        {
          expectedRevision: 5,
          thinBloodTraits: [
            {
              definitionKey:
                'day-drinker',
              clanCurseDetails: null,
              disciplineAffinityDetails:
                null,
            },
            {
              definitionKey:
                'baby-teeth',
              clanCurseDetails: null,
              disciplineAffinityDetails:
                null,
            },
          ],
          thinBloodAlchemy: {
            rating: 0,
            method: null,
            formulaKeys: [],
          },
        },
      )

    assert.equal(
      parsed.expectedRevision,
      5,
    )
    assert.equal(
      parsed.thinBloodTraits.length,
      2,
    )
  },
)

test(
  '057-E3C1 parser rechaza campos extra',
  () => {
    assert.throws(
      () =>
        parseResolveInitialThinBloodStateRequest(
          characterId,
          {
            expectedRevision: 5,
            thinBloodTraits: [],
            thinBloodAlchemy: {
              rating: 0,
              method: null,
              formulaKeys: [],
            },
            predatorTypeKey:
              'bagger',
          },
        ),
      InvalidInitialVampireResolutionRequestError,
    )
  },
)
