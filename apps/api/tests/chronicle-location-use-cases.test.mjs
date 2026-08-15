import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  ArchiveChronicleLocationUseCase,
} from '../dist/chronicles/application/archive-chronicle-location.use-case.js'

import {
  ChronicleLocationHierarchyCycleError,
  ChronicleLocationParentNotFoundError,
} from '../dist/chronicles/application/chronicle-location-hierarchy.js'

import {
  ChronicleLocationPermissionError,
} from '../dist/chronicles/application/chronicle-location-permission.js'

import {
  CreateChronicleLocationUseCase,
} from '../dist/chronicles/application/create-chronicle-location.use-case.js'

import {
  ListChronicleLocationsUseCase,
} from '../dist/chronicles/application/list-chronicle-locations.use-case.js'

import {
  LoadChronicleLocationUseCase,
} from '../dist/chronicles/application/load-chronicle-location.use-case.js'

import {
  ChronicleLocationNotFoundError,
  UpdateChronicleLocationUseCase,
} from '../dist/chronicles/application/update-chronicle-location.use-case.js'

function location({
  id = randomUUID(),
  chronicleId = randomUUID(),
  parentLocationId = null,
  status = 'active',
  name = 'Elysium',
} = {}) {
  return {
    id,
    chronicleId,
    parentLocationId,
    name,
    category: null,
    description: null,
    narratorNotes: null,
    status,
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

function repository(rows = []) {
  const records =
    [...rows]

  return {
    async listByChronicleId(
      chronicleId,
      query,
    ) {
      const matching =
        records.filter(
          (row) =>
            row.chronicleId ===
            chronicleId,
        )

      const pageItems =
        matching.slice(
          query.offset,
          query.offset + query.limit,
        )

      const nextOffset =
        query.offset +
          query.limit <
        matching.length
          ? query.offset +
            query.limit
          : null

      return {
        items: pageItems,
        nextOffset,
      }
    },

    async findById(
      chronicleId,
      locationId,
    ) {
      return records.find(
        (row) =>
          row.chronicleId ===
            chronicleId &&
          row.id === locationId,
      ) ?? null
    },

    async create(data) {
      const created =
        location({
          chronicleId:
            data.chronicleId,
          parentLocationId:
            data.parentLocationId,
          name: data.name,
        })

      records.push(created)

      return created
    },

    async update(data) {
      const index =
        records.findIndex(
          (row) =>
            row.chronicleId ===
              data.chronicleId &&
            row.id ===
              data.locationId &&
            row.status ===
              'active',
        )

      if (index === -1) {
        return null
      }

      records[index] = {
        ...records[index],
        ...data,
        id: records[index].id,
      }

      return records[index]
    },

    async archive(
      chronicleId,
      locationId,
    ) {
      const index =
        records.findIndex(
          (row) =>
            row.chronicleId ===
              chronicleId &&
            row.id ===
              locationId &&
            row.status ===
              'active',
        )

      if (index === -1) {
        return null
      }

      records[index] = {
        ...records[index],
        status: 'archived',
      }

      return records[index]
    },
  }
}

test(
  '033-B Narrador contextual puede listar y consultar Localizaciones privadas',
  async () => {
    const current = location()
    const repo =
      repository([current])

    const listed =
      await new ListChronicleLocationsUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        current.chronicleId,
        {
          limit: 25,
          offset: 0,
        },
      )

    assert.equal(
      listed.items.length,
      1,
    )

    const loaded =
      await new LoadChronicleLocationUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
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
  '033-B Jugador contextual y outsider no acceden',
  async () => {
    const current = location()
    const repo =
      repository([current])

    await assert.rejects(
      new ListChronicleLocationsUseCase(
        repo,
        participants({
          role: 'player',
        }),
      ).execute(
        randomUUID(),
        current.chronicleId,
        {
          limit: 25,
          offset: 0,
        },
      ),
      ChronicleLocationPermissionError,
    )

    await assert.rejects(
      new CreateChronicleLocationUseCase(
        repo,
        participants({
          active: false,
        }),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            current.chronicleId,
          parentLocationId: null,
          name: 'Refugio',
          category: null,
          description: null,
          narratorNotes: null,
        },
      ),
      ChronicleLocationPermissionError,
    )
  },
)

test(
  '033-B creación acepta raíz o padre válido de la misma Crónica',
  async () => {
    const parent =
      location()
    const repo =
      repository([parent])

    const root =
      await new CreateChronicleLocationUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            parent.chronicleId,
          parentLocationId: null,
          name: 'Ciudad',
          category: null,
          description: null,
          narratorNotes: null,
        },
      )

    assert.equal(
      root.parentLocationId,
      null,
    )

    const child =
      await new CreateChronicleLocationUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            parent.chronicleId,
          parentLocationId:
            parent.id,
          name: 'Distrito',
          category: null,
          description: null,
          narratorNotes: null,
        },
      )

    assert.equal(
      child.parentLocationId,
      parent.id,
    )
  },
)

test(
  '033-B creación rechaza padre inexistente o de otra Crónica',
  async () => {
    const current =
      location()
    const foreign =
      location()

    await assert.rejects(
      new CreateChronicleLocationUseCase(
        repository([foreign]),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            current.chronicleId,
          parentLocationId:
            foreign.id,
          name: 'Distrito',
          category: null,
          description: null,
          narratorNotes: null,
        },
      ),
      ChronicleLocationParentNotFoundError,
    )
  },
)

test(
  '033-B edición permite cambiar padre sin profundidad máxima',
  async () => {
    const chronicleId =
      randomUUID()
    const root =
      location({
        chronicleId,
      })
    const middle =
      location({
        chronicleId,
        parentLocationId:
          root.id,
      })
    const leaf =
      location({
        chronicleId,
        parentLocationId:
          middle.id,
      })

    const repo =
      repository([
        root,
        middle,
        leaf,
      ])

    const updated =
      await new UpdateChronicleLocationUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          locationId:
            leaf.id,
          parentLocationId:
            root.id,
        },
      )

    assert.equal(
      updated.parentLocationId,
      root.id,
    )
  },
)

test(
  '033-B prevención de ciclos rechaza self-parent y descendientes',
  async () => {
    const chronicleId =
      randomUUID()
    const root =
      location({
        chronicleId,
      })
    const child =
      location({
        chronicleId,
        parentLocationId:
          root.id,
      })
    const grandchild =
      location({
        chronicleId,
        parentLocationId:
          child.id,
      })

    const repo =
      repository([
        root,
        child,
        grandchild,
      ])

    await assert.rejects(
      new UpdateChronicleLocationUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          locationId:
            root.id,
          parentLocationId:
            root.id,
        },
      ),
      ChronicleLocationHierarchyCycleError,
    )

    await assert.rejects(
      new UpdateChronicleLocationUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          locationId:
            root.id,
          parentLocationId:
            grandchild.id,
        },
      ),
      ChronicleLocationHierarchyCycleError,
    )
  },
)

test(
  '033-B edición rechaza Localización inexistente o archivada',
  async () => {
    const current =
      location()
    const archived =
      location({
        chronicleId:
          current.chronicleId,
        status: 'archived',
      })

    await assert.rejects(
      new UpdateChronicleLocationUseCase(
        repository([]),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            current.chronicleId,
          locationId:
            current.id,
          name: 'Cambio',
        },
      ),
      ChronicleLocationNotFoundError,
    )

    await assert.rejects(
      new UpdateChronicleLocationUseCase(
        repository([archived]),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            archived.chronicleId,
          locationId:
            archived.id,
          name: 'Cambio',
        },
      ),
      ChronicleLocationNotFoundError,
    )
  },
)

test(
  '033-B archivado preserva jerarquía y es idempotente',
  async () => {
    const parent =
      location()
    const child =
      location({
        chronicleId:
          parent.chronicleId,
        parentLocationId:
          parent.id,
      })

    const archived =
      await new ArchiveChronicleLocationUseCase(
        repository([
          parent,
          child,
        ]),
        participants(),
      ).execute(
        randomUUID(),
        child.chronicleId,
        child.id,
      )

    assert.equal(
      archived.status,
      'archived',
    )
    assert.equal(
      archived.parentLocationId,
      parent.id,
    )

    const alreadyArchived =
      location({
        status: 'archived',
      })

    const repeated =
      await new ArchiveChronicleLocationUseCase(
        repository([
          alreadyArchived,
        ]),
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
