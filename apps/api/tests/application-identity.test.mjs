import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const sharp = require('sharp')
const { ApplicationIdentityController, identityAdministrator } = require('../dist/administration/application-identity.controller.js')
const { generateApplicationIcons, MAX_ICON_BYTES } = require('../dist/administration/application-identity.images.js')
const image = () => sharp({ create: { width: 600, height: 300, channels: 3, background: '#00ff00' } }).png().toBuffer()
function database() {
  let row = null
  return { applicationIdentity: {
    findUnique: async () => row,
    create: async ({ data }) => { if (row) throw Object.assign(new Error('Duplicate'), { code: 'P2002' }); row = data; return row },
    updateMany: async ({ where, data }) => { if (row?.revision !== where.revision) return { count: 0 }; row = { ...row, ...data }; return { count: 1 } },
    deleteMany: async ({ where }) => { if (row?.revision !== where.revision) return { count: 0 }; row = null; return { count: 1 } },
  } }
}
function request(bytes, roles = ['admin']) {
  return { user: { id: 'test-admin', roles }, headers: { 'content-type': 'application/octet-stream' }, async *[Symbol.asyncIterator]() { yield bytes } }
}
const status = n => error => error.getStatus?.() === n

test('only authenticated administrators can mutate identity', async () => {
  assert.throws(() => identityAdministrator({}), status(401))
  for (const roles of [[], ['narrator'], ['player'], 'admin']) assert.throws(() => identityAdministrator({ user: { id: 'test', roles } }), status(403))
  const controller = new ApplicationIdentityController(database())
  await assert.rejects(controller.save(request(await image(), ['player']), 'default'), status(403))
  await assert.rejects(controller.reset(request(Buffer.alloc(0), ['narrator']), 'default'), status(403))
})

test('server generates all sizes, strips metadata and preserves the whole rectangular image', async () => {
  const icons = await generateApplicationIcons(await image())
  for (const [name, size] of [['icon180',180],['icon192',192],['icon512',512],['maskable',512]]) {
    const info = await sharp(icons[name]).metadata()
    assert.equal(info.width,size); assert.equal(info.height,size); assert.equal(info.format,'png'); assert.equal(info.exif,undefined)
  }
  const { data, info } = await sharp(icons.icon512).raw().toBuffer({ resolveWithObject: true })
  const pixel = (x,y) => [...data.subarray((y*info.width+x)*info.channels,(y*info.width+x)*info.channels+3)]
  assert.deepEqual(pixel(256,20),[23,16,19])
  assert.deepEqual(pixel(256,256),[0,255,0])
  const mask = await sharp(icons.maskable).raw().toBuffer()
  assert.deepEqual([...mask.subarray(0,3)],[23,16,19])
})

test('invalid, vector and oversized pixel inputs fail without accepting script content', async () => {
  for (const bytes of [Buffer.from('not an image'),Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><script>alert(1)</script></svg>')]) await assert.rejects(generateApplicationIcons(bytes),status(400))
  const oversized = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: 'red' } }).png().toBuffer()
  await assert.rejects(generateApplicationIcons(oversized),status(400))
})

test('default public identity and manifest contain no accounts, chronicles, hostnames or redirects', async () => {
  const controller = new ApplicationIdentityController(database())
  assert.equal((await controller.identity()).custom,false)
  const manifest = await controller.manifest()
  assert.equal(manifest.scope,'/'); assert.equal(manifest.id,'/'); assert.equal(manifest.display,'standalone')
  assert.doesNotMatch(JSON.stringify(manifest),/192\.168|https?:|chronicleId|token|password/i)
  assert.ok(manifest.icons.every(icon=>icon.src.startsWith('/icons/')))
})

test('save publishes only generated PNGs, uses versioned URLs and survives a controller restart', async () => {
  const db = database(), controller = new ApplicationIdentityController(db)
  const result = await controller.save(request(await image()),'default')
  assert.equal(result.custom,true); assert.match(result.icon,/\/api\/application\/icons\//)
  const restarted = new ApplicationIdentityController(db)
  assert.deepEqual(await restarted.identity(),result)
  const manifest = await restarted.manifest()
  assert.ok(manifest.icons.every(icon=>icon.src.includes(result.revision)))
  const png = await restarted.icon(result.revision,'192.png')
  assert.equal(png.getHeaders().type,'image/png')
  await assert.rejects(restarted.icon(result.revision,'__proto__'),status(404))
  await assert.rejects(restarted.icon('invalid','192.png'),status(404))
})

test('stale writes and resets cannot overwrite another administrator', async () => {
  const controller = new ApplicationIdentityController(database()), bytes = await image()
  const first = await controller.save(request(bytes),'default')
  await assert.rejects(controller.save(request(bytes),'default'),status(409))
  const second = await controller.save(request(bytes),first.revision)
  await assert.rejects(controller.reset(request(bytes),first.revision),status(409))
  assert.equal((await controller.identity()).revision,second.revision)
  await controller.reset(request(bytes),second.revision)
  assert.equal((await controller.identity()).custom,false)
  await assert.rejects(controller.icon(second.revision,'192.png'),status(404))
})

test('upload limits and missing revisions leave existing identity intact', async () => {
  const controller = new ApplicationIdentityController(database())
  await assert.rejects(controller.save(request(Buffer.alloc(MAX_ICON_BYTES+1)),'default'),status(413))
  await assert.rejects(controller.save(request(Buffer.alloc(0)),'default'),status(400))
  await assert.rejects(controller.save(request(await image()),undefined),status(400))
  const wrong = request(await image()); wrong.headers['content-type']='application/json'
  await assert.rejects(controller.save(wrong,'default'),status(400))
  assert.equal((await controller.identity()).custom,false)
})

test('HTTP public manifest and icons work without login, while anonymous writes are rejected', async () => {
  const { Module } = require('@nestjs/common')
  const { NestFactory } = require('@nestjs/core')
  const { DatabaseService } = require('../dist/database/database.service.js')
  const db = database()
  class TestModule {}
  Module({ controllers: [ApplicationIdentityController], providers: [{ provide: DatabaseService, useValue: db }] })(TestModule)
  const app = await NestFactory.create(TestModule, { logger: false })
  try {
    await app.listen(0,'127.0.0.1')
    const base = await app.getUrl()
    const response = await fetch(base+'/application/manifest.webmanifest', { redirect: 'manual' })
    assert.equal(response.status,200)
    assert.match(response.headers.get('content-type'),/application\/manifest\+json/)
    assert.equal(response.headers.get('location'),null)
    assert.equal((await response.json()).id,'/')
    assert.equal((await fetch(base+'/application/identity/icon',{method:'PUT',headers:{'Content-Type':'application/octet-stream','If-Match':'default'},body:await image()})).status,401)
    const controller = new ApplicationIdentityController(db)
    const saved = await controller.save(request(await image()),'default')
    const icon = await fetch(base+saved.icon.replace(/^\/api/,''))
    assert.equal(icon.status,200); assert.equal(icon.headers.get('content-type'),'image/png')
    assert.equal((await sharp(Buffer.from(await icon.arrayBuffer())).metadata()).width,192)
    assert.equal((await fetch(base+'/application/identity/icon',{method:'DELETE',headers:{'If-Match':saved.revision}})).status,401)
  } finally { await app.close() }
})
