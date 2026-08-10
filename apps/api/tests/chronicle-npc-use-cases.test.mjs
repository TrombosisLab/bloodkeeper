import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  ArchiveChronicleNpcUseCase,
} from '../dist/chronicles/application/archive-chronicle-npc.use-case.js'

import {
  CreateChronicleNpcUseCase,
} from '../dist/chronicles/application/create-chronicle-npc.use-case.js'

import {
  ListChronicleNpcsUseCase,
} from '../dist/chronicles/application/list-chronicle-npcs.use-case.js'

import {
  LoadChronicleNpcUseCase,
} from '../dist/chronicles/application/load-chronicle-npc.use-case.js'

import {
  ChronicleNpcPermissionError,
} from '../dist/chronicles/application/chronicle-npc-permission.js'

import {
  ChronicleNpcNotFoundError,
  UpdateChronicleNpcUseCase,
} from '../dist/chronicles/application/update-chronicle-npc.use-case.js'

function npc({
  id = randomUUID(),
  chronicleId = randomUUID(),
  status = 'active',
  name = 'Guardia',
} = {}) {
  return {
    id,
    chronicleId,
    name,
    category: null,
    description: null,
    narrativeRole: null,
    notes: null,
    status,
    detailLevel: 'simple',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function participants({
  role = 'narrator',
  active = true,
} = {}) {
  return {
    async findActiveMembership(
      chronicleId,
      userId,
    ) {
      if (!active) {
        return null
      }

      return {
        id: randomUUID(),
        chronicleId,
        userId,
        username: 'actor',
        displayName: 'Actor',
        role,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    },
  }
}

function repository(current = null) {
  const rows =
    current === null
      ? []
      : [current]

  return {
    async listByChronicleId() {
      return rows
    },

    async findById() {
      return current
    },

    async create(data) {
      return npc({
        chronicleId:
          data.chronicleId,
        name: data.name,
      })
    },

    async update(data) {
      if (
        current === null ||
        current.status === 'archived'
      ) {
        return null
      }

      return {
        ...current,
        ...data,
      }
    },

    async archive() {
      if (
        current === null ||
        current.status === 'archived'
      ) {
        return null
      }

      return {
        ...current,
        status: 'archived',
      }
    },
  }
}

test(
  '032-B Narrador contextual activo puede listar y consultar PNJ privados',
  async () => {
    const actorId = randomUUID()
    const current = npc()
    const participantRepo =
      participants()

    const listed =
      await new ListChronicleNpcsUseCase(
        repository(current),
        participantRepo,
      ).execute(
        actorId,
        current.chronicleId,
      )

    assert.equal(listed.length, 1)

    const loaded =
      await new LoadChronicleNpcUseCase(
        repository(current),
        participantRepo,
      ).execute(
        actorId,
        current.chronicleId,
        current.id,
      )

    assert.equal(
      loaded?.id,
      current.id,
    )
  },
)

test(
  '032-B Jugador contextual no puede leer PNJ',
  async () => {
    const current = npc()

    await assert.rejects(
      new ListChronicleNpcsUseCase(
        repository(current),
        participants({
          role: 'player',
        }),
      ).execute(
        randomUUID(),
        current.chronicleId,
      ),
      ChronicleNpcPermissionError,
    )
  },
)

test(
  '032-B outsider no puede crear PNJ',
  async () => {
    const chronicleId =
      randomUUID()

    await assert.rejects(
      new CreateChronicleNpcUseCase(
        repository(),
        participants({
          active: false,
        }),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          name: 'Guardia',
          category: null,
          description: null,
          narrativeRole: null,
          notes: null,
        },
      ),
      ChronicleNpcPermissionError,
    )
  },
)

test(
  '032-B Narrador crea PNJ simple activo',
  async () => {
    const chronicleId =
      randomUUID()

    const created =
      await new CreateChronicleNpcUseCase(
        repository(),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          name: 'Guardia',
          category: null,
          description: null,
          narrativeRole: null,
          notes: null,
        },
      )

    assert.equal(
      created.chronicleId,
      chronicleId,
    )
    assert.equal(
      created.status,
      'active',
    )
    assert.equal(
      created.detailLevel,
      'simple',
    )
  },
)

test(
  '032-B Narrador edita PNJ activo',
  async () => {
    const current = npc()

    const updated =
      await new UpdateChronicleNpcUseCase(
        repository(current),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            current.chronicleId,
          npcId: current.id,
          name: 'Guardia veterano',
        },
      )

    assert.equal(
      updated.name,
      'Guardia veterano',
    )
  },
)

test(
  '032-B edición rechaza PNJ inexistente o archivado',
  async () => {
    const missingId =
      randomUUID()
    const chronicleId =
      randomUUID()

    await assert.rejects(
      new UpdateChronicleNpcUseCase(
        repository(),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          npcId: missingId,
          name: 'Nadie',
        },
      ),
      ChronicleNpcNotFoundError,
    )

    const archived =
      npc({
        status: 'archived',
      })

    await assert.rejects(
      new UpdateChronicleNpcUseCase(
        repository(archived),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            archived.chronicleId,
          npcId: archived.id,
          name: 'Cambio',
        },
      ),
      ChronicleNpcNotFoundError,
    )
  },
)

test(
  '032-B archivado preserva PNJ y es idempotente',
  async () => {
    const current = npc()

    const archived =
      await new ArchiveChronicleNpcUseCase(
        repository(current),
        participants(),
      ).execute(
        randomUUID(),
        current.chronicleId,
        current.id,
      )

    assert.equal(
      archived.status,
      'archived',
    )

    const alreadyArchived =
      npc({
        status: 'archived',
      })

    const repeated =
      await new ArchiveChronicleNpcUseCase(
        repository(alreadyArchived),
        participants(),
      ).execute(
        randomUUID(),
        alreadyArchived.chronicleId,
        alreadyArchived.id,
      )

    assert.equal(
      repeated,
      alreadyArchived,
    )
  },
)
