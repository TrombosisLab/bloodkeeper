import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const manifest=JSON.parse(read('public/manifest.webmanifest'));
const component=read('src/features/installation/InstallApplication.tsx');
test('manifest is stable, standalone, Spanish, and never launches into private test content',()=>{
  assert.equal(manifest.id,'/');assert.equal(manifest.scope,'/');assert.equal(manifest.display,'standalone');
  assert.equal(manifest.lang,'es');assert.equal(manifest.prefer_related_applications,false);
  const start=new URL(manifest.start_url,'https://example.test');
  assert.equal(start.origin,'https://example.test');assert.equal(start.hash,'#/dashboard');
  assert.equal(start.searchParams.has('chronicleId'),false);
  assert.doesNotMatch(JSON.stringify(manifest),/192\.168|trombosis|token|password/i);
});
test('manifest supplies valid PNG icons in Chromium install sizes and a separate maskable icon',()=>{
  for(const size of [192,512])assert.ok(manifest.icons.some(i=>i.sizes===`${size}x${size}`&&i.type==='image/png'&&i.purpose==='any'));
  assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
  for(const icon of [...manifest.icons,{src:'/icons/bloodkeeper-180.png',sizes:'180x180'}]){
    const bytes=readFileSync(new URL('../public'+icon.src,import.meta.url));
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,icon.sizes);
  }
  const html=read('index.html');assert.match(html,/rel="manifest" href="\/api\/application\/manifest.webmanifest"/);
  assert.match(html,/rel="apple-touch-icon"/);
});
test('installation is user initiated and handles dismissal, failure and installed state',()=>{
  assert.match(component,/onClick=\{\(\) => void install\(\)\}/);
  assert.match(component,/await request\.prompt\(\)/);assert.match(component,/await request\.userChoice/);
  assert.match(component,/setPrompt\(null\)/);assert.match(component,/catch\s*\{/);
  assert.match(component,/addEventListener\('appinstalled'/);
  assert.match(component,/removeEventListener\('beforeinstallprompt'/);
  assert.match(component,/display-mode: standalone/);
});
test('no service worker, offline queue, private cache, automatic authentication or external host is introduced',()=>{
  assert.doesNotMatch(component,/fetch\(|serviceWorker|caches\.|indexedDB|localStorage|sessionStorage|https?:\/\//);
  assert.match(component,/window\.isSecureContext/);assert.match(component,/conexión al servidor/);
  assert.match(component,/sin conexión ni guarda operaciones/);
  assert.match(read('src/features/navigation/components/AppNavigation.tsx'),/<InstallApplication \/>/);
});
