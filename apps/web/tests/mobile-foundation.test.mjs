import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../src/',import.meta.url);
const shell=readFileSync(new URL('styles.css',root),'utf8').split('/* BLOODKEEPER_MOBILE_FOUNDATION_V1 */')[1];
const resources=readFileSync(new URL('features/resources/components/resource-library.css',root),'utf8').split('/* BLOODKEEPER_RESOURCE_MOBILE_POLISH_V1 */')[1];
test('all new shell and resource rules are mobile-only',()=>{
 for(const text of [shell,resources]){
   assert.ok(text);
   // Later patches can append more mobile blocks to the same stylesheet.
   // Reject any rule outside those blocks instead of assuming exactly one.
   let remaining=text.replace(/\/\*[\s\S]*?\*\//g,'').trim(),blocks=0;
   while(remaining){
     const media=/^@media\s*\(max-width:\s*720px\)\s*\{/.exec(remaining);
     assert.ok(media,'Found CSS outside a max-width: 720px media block');
     let depth=1,index=media[0].length;
     for(;index<remaining.length && depth>0;index++){
       if(remaining[index]==='{')depth++;
       if(remaining[index]==='}')depth--;
     }
     assert.equal(depth,0,'Unbalanced mobile media block');
     remaining=remaining.slice(index).trim();
     blocks++;
   }
   assert.ok(blocks>0);
 }
});
test('account no longer overlays content and hidden navigation remains hidden',()=>{
 assert.match(shell,/\.authentication-session\s*\{[^}]*position: static !important/s);
 assert.match(shell,/\.app-navigation\[hidden\] \{ display: none !important/);
 assert.match(shell,/repeat\(2, minmax\(0, 1fr\)\)/);
});
test('gallery paging and cards fit the mobile column',()=>{
 assert.match(resources,/width: 44px !important/);
 assert.match(resources,/grid-template-columns: minmax\(0, 1fr\)/);
 assert.match(resources,/min-width: 0 !important/);
});
test('resource dialog is bounded and form fields include padding within width',()=>{
 assert.match(resources,/max-height: calc\(100dvh - 24px\)/);
 assert.match(resources,/overflow-y: auto/);
 assert.match(resources,/box-sizing: border-box/);
 assert.match(resources,/font-size: 16px/);
});
