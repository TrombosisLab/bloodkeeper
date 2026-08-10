import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  ArchiveChronicleEventUseCase,
} from '../dist/chronicles/application/archive-chronicle-event.use-case.js'
import {
  ChronicleEventPermissionError,
} from '../dist/chronicles/application/chronicle-event-permission.js'
import {
  ChronicleEventReorderMismatchError,
} from '../dist/chronicles/application/chronicle-event.repository.js'
import {
  CreateChronicleEventUseCase,
} from '../dist/chronicles/application/create-chronicle-event.use-case.js'
import {
  ListChronicleEventsUseCase,
} from '../dist/chronicles/application/list-chronicle-events.use-case.js'
import {
  LoadChronicleEventUseCase,
} from '../dist/chronicles/application/load-chronicle-event.use-case.js'
import {
  ReorderChronicleEventsUseCase,
} from '../dist/chronicles/application/reorder-chronicle-events.use-case.js'
import {
  ChronicleEventNotFoundError,
  UpdateChronicleEventUseCase,
} from '../dist/chronicles/application/update-chronicle-event.use-case.js'

function event({
  id = randomUUID(),
  chronicleId = randomUUID(),
  title = 'Abrazo',
  status = 'active',
  timelineOrder = 0,
} = {}) {
  return {
    id,
    chronicleId,
    title,
    description: null,
    narratorNotes: null,
    narrativeTimeLabel: null,
    realDate: null,
    timelineOrder,
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

  const activeRows = (
    chronicleId,
  ) =>
    records.filter(
      (row) =>
        row.chronicleId ===
          chronicleId &&
        row.status === 'active',
    )

  return {
    async listByChronicleId(
      chronicleId,
    ) {
      return records.filter(
        (row) =>
          row.chronicleId ===
          chronicleId,
      )
    },

    async findById(
      chronicleId,
      eventId,
    ) {
      return records.find(
        (row) =>
          row.chronicleId ===
            chronicleId &&
          row.id === eventId,
      ) ?? null
    },

    async create(data) {
      const active =
        activeRows(
          data.chronicleId,
        )

      const timelineOrder =
        active.length === 0
          ? 0
          : Math.max(
              ...active.map(
                (row) =>
                  row.timelineOrder,
              ),
            ) + 1

      const created = {
        ...event({
          chronicleId:
            data.chronicleId,
          title: data.title,
          timelineOrder,
        }),
        description:
          data.description,
        narratorNotes:
          data.narratorNotes,
        narrativeTimeLabel:
          data.narrativeTimeLabel,
        realDate:
          data.realDate,
      }

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
              data.eventId &&
            row.status ===
              'active',
        )

      if (index === -1) {
        return null
      }

      const {
        eventId,
        chronicleId,
        ...changes
      } = data

      records[index] = {
        ...records[index],
        ...changes,
      }

      return records[index]
    },

    async reorderActive(
      chronicleId,
      eventIds,
    ) {
      const active =
        activeRows(
          chronicleId,
        )
      const current =
        new Set(
          active.map(
            (row) => row.id,
          ),
        )
      const requested =
        new Set(eventIds)

      if (
        requested.size !==
          eventIds.length ||
        requested.size !==
          current.size ||
        eventIds.some(
          (eventId) =>
            !current.has(eventId),
        )
      ) {
        throw new ChronicleEventReorderMismatchError()
      }

      eventIds.forEach(
        (
          eventId,
          timelineOrder,
        ) => {
          const row =
            records.find(
              (candidate) =>
                candidate.id === eventId,
            )
          row.timelineOrder =
            timelineOrder
        },
      )

      return activeRows(
        chronicleId,
      ).sort(
        (left, right) =>
          left.timelineOrder -
          right.timelineOrder,
      )
    },

    async archive(
      chronicleId,
      eventId,
    ) {
      const index =
        records.findIndex(
          (row) =>
            row.chronicleId ===
              chronicleId &&
            row.id ===
              eventId &&
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
  '034-B Narrador contextual lista y consulta Eventos privados',
  async () => {
    const current =
      event()
    const repo =
      repository([current])

    const listed =
      await new ListChronicleEventsUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        current.chronicleId,
      )

    assert.equal(listed.length, 1)

    const loaded =
      await new LoadChronicleEventUseCase(
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
  '034-B Jugador contextual y outsider no acceden',
  async () => {
    const current =
      event()
    const repo =
      repository([current])

    await assert.rejects(
      new ListChronicleEventsUseCase(
        repo,
        participants({
          role: 'player',
        }),
      ).execute(
        randomUUID(),
        current.chronicleId,
      ),
      ChronicleEventPermissionError,
    )

    await assert.rejects(
      new CreateChronicleEventUseCase(
        repo,
        participants({
          active: false,
        }),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            current.chronicleId,
          title: 'Evento',
          description: null,
          narratorNotes: null,
          narrativeTimeLabel: null,
          realDate: null,
        },
      ),
      ChronicleEventPermissionError,
    )
  },
)

test(
  '034-B creación añade Evento al final de ACTIVE',
  async () => {
    const chronicleId =
      randomUUID()
    const repo =
      repository([
        event({
          chronicleId,
          timelineOrder: 2,
        }),
        event({
          chronicleId,
          timelineOrder: 7,
        }),
      ])

    const created =
      await new CreateChronicleEventUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          title: 'Nuevo evento',
          description: null,
          narratorNotes: null,
          narrativeTimeLabel:
            'La noche siguiente',
          realDate: null,
        },
      )

    assert.equal(
      created.timelineOrder,
      8,
    )
  },
)

test(
  '034-B edición permite campos narrativos y rechaza archivado',
  async () => {
    const current =
      event()
    const realDate =
      new Date(
        '2026-08-10T12:00:00.000Z',
      )

    const updated =
      await new UpdateChronicleEventUseCase(
        repository([current]),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            current.chronicleId,
          eventId:
            current.id,
          title:
            'Evento actualizado',
          narrativeTimeLabel:
            'Marzo de 1997',
          realDate,
        },
      )

    assert.equal(
      updated.title,
      'Evento actualizado',
    )
    assert.equal(
      updated.timelineOrder,
      current.timelineOrder,
    )

    const archived =
      event({
        chronicleId:
          current.chronicleId,
        status: 'archived',
      })

    await assert.rejects(
      new UpdateChronicleEventUseCase(
        repository([archived]),
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId:
            archived.chronicleId,
          eventId:
            archived.id,
          title: 'No permitido',
        },
      ),
      ChronicleEventNotFoundError,
    )
  },
)

test(
  '034-B reorder usa conjunto ACTIVE completo y orden 0..N-1',
  async () => {
    const chronicleId =
      randomUUID()
    const first =
      event({
        chronicleId,
        timelineOrder: 0,
      })
    const second =
      event({
        chronicleId,
        timelineOrder: 1,
      })
    const archived =
      event({
        chronicleId,
        timelineOrder: 2,
        status: 'archived',
      })
    const repo =
      repository([
        first,
        second,
        archived,
      ])

    const reordered =
      await new ReorderChronicleEventsUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        {
          chronicleId,
          eventIds: [
            second.id,
            first.id,
          ],
        },
      )

    assert.deepEqual(
      reordered.map(
        (row) => row.id,
      ),
      [
        second.id,
        first.id,
      ],
    )

    assert.deepEqual(
      reordered.map(
        (row) => row.timelineOrder,
      ),
      [0, 1],
    )

    assert.equal(
      archived.timelineOrder,
      2,
    )
  },
)

test(
  '034-B reorder rechaza subconjunto duplicado archivado o foreign',
  async () => {
    const chronicleId =
      randomUUID()
    const first =
      event({
        chronicleId,
      })
    const second =
      event({
        chronicleId,
        timelineOrder: 1,
      })
    const archived =
      event({
        chronicleId,
        status: 'archived',
      })
    const foreign =
      event()
    const repo =
      repository([
        first,
        second,
        archived,
        foreign,
      ])

    for (const eventIds of [
      [first.id],
      [first.id, first.id],
      [first.id, archived.id],
      [first.id, foreign.id],
    ]) {
      await assert.rejects(
        new ReorderChronicleEventsUseCase(
          repo,
          participants(),
        ).execute(
          randomUUID(),
          {
            chronicleId,
            eventIds,
          },
        ),
        ChronicleEventReorderMismatchError,
      )
    }
  },
)

test(
  '034-B archivado es idempotente y conserva timelineOrder',
  async () => {
    const current =
      event({
        timelineOrder: 4,
      })
    const repo =
      repository([current])

    const archived =
      await new ArchiveChronicleEventUseCase(
        repo,
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
    assert.equal(
      archived.timelineOrder,
      4,
    )

    const repeated =
      await new ArchiveChronicleEventUseCase(
        repo,
        participants(),
      ).execute(
        randomUUID(),
        current.chronicleId,
        current.id,
      )

    assert.equal(
      repeated.status,
      'archived',
    )
    assert.equal(
      repeated.timelineOrder,
      4,
    )
  },
)
