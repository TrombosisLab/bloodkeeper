import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadApplicationIdentity, refreshApplicationIdentity } from '../src/features/installation/application-identity.ts'

test('protected same-origin manifest explicitly uses the existing authorized session', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const link = html.match(/<link\b[^>]*rel="manifest"[^>]*>/g)
  assert.equal(link?.length, 1)
  assert.match(link[0], /href="\/api\/application\/manifest.webmanifest"/)
  assert.match(link[0], /crossorigin="use-credentials"/)
})

test('identity request sends cookies only to the same origin and does not follow authentication redirects', async () => {
  const original = globalThis.fetch
  try {
    const identity = { revision: 'default', custom: false, icon: '/icons/bloodkeeper-192.png', appleIcon: '/icons/bloodkeeper-180.png' }
    let calls = 0
    globalThis.fetch = async (url, options) => {
      calls++
      assert.equal(url, '/api/application/identity')
      assert.deepEqual(options, { credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
      return new Response(JSON.stringify(identity), { headers: { 'Content-Type': 'application/json' } })
    }
    assert.deepEqual(await loadApplicationIdentity(), identity)
    assert.equal(calls, 1)
  } finally { globalThis.fetch = original }
})

test('expired Access session, denied requests and malformed login responses cannot block application startup', async () => {
  const original = globalThis.fetch
  try {
    for (const fetcher of [
      async () => { throw new TypeError('Redirect rejected') },
      async () => new Response('Forbidden', { status: 403 }),
      async () => new Response('<html>Login required</html>', { headers: { 'Content-Type': 'text/html' } }),
    ]) {
      globalThis.fetch = fetcher
      await assert.rejects(loadApplicationIdentity())
      await assert.doesNotReject(refreshApplicationIdentity())
    }
  } finally { globalThis.fetch = original }
})
