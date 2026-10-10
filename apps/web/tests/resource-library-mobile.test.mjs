import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const base='../src/features/resources/components/';
const source=readFileSync(new URL(base+'ResourceLibrary.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL(base+'resource-library.css',import.meta.url),'utf8');
const mobile=css.split('/* BLOODKEEPER_RESOURCE_MOBILE_PICKER_V1 */')[1];
test('accessible picker controls existing nested tree',()=>{
 assert.match(source,/aria-expanded=\{mobilePickerOpen\} aria-controls="resource-library-tree"/);
 assert.match(source,/id="resource-library-tree"/);
 assert.match(source,/roots\.map\(tree\)/);
 assert.match(source,/nested\.map\(tree\)/);
 assert.match(source,/onClick=\{\(\)=>\{setKind\(item\);setMobilePickerOpen\(true\)\}\}/);
});
test('selection closes picker and preserves resource and parent selection',()=>{
 const body=source.match(/function choose\(resource:Resource\)\{([^\n]+)\}/)?.[1];
 assert.ok(body);
 const calls=[];
 const resource={id:'child',metadata:{parentLocationId:'parent'}};
 runInNewContext(body,{resource,window:{matchMedia:()=>({matches:true})},mobilePickerRef:{current:{focus:()=>calls.push('focus')}},setMobilePickerOpen:v=>calls.push(['open',v]),setSelected:v=>calls.push(['selected',v.id]),setParentId:v=>calls.push(['parent',v]),setSheet:v=>calls.push(['sheet',v])});
 assert.deepEqual(calls,[['open',false],'focus',['selected','child'],['parent','parent'],['sheet',null]]);
});
test('mobile grid and controls cannot impose wide intrinsic columns',()=>{
 assert.ok(mobile);
 assert.match(mobile,/grid-template-columns: minmax\(0, 1fr\)/);
 assert.match(mobile,/min-width: 0/);
 assert.match(mobile,/flex-wrap: wrap/);
 assert.match(mobile,/object-fit: contain/);
 assert.match(mobile,/\.resource-tree\.is-mobile-open \{ display: flex; \}/);
 assert.match(mobile,/@media \(max-width: 720px\)/);
});
