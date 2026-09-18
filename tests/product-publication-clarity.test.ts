import assert from 'node:assert/strict';
import test from 'node:test';
import { productPublicationSummary } from '../lib/store/product-publication-summary.ts';
import { productPublicationIssues } from '../lib/store/release-workflow.ts';
import type { AdminStoreProductRow } from '../lib/store/types.ts';
const original: AdminStoreProductRow = { id:'sample', slug:'open-play', category_slug:'developer-tools', status:'released', visibility:'published', name_zh:'OpenPlay', name_en:'OpenPlay', tagline_zh:'公开简介', tagline_en:'Public introduction', description_zh:'原介绍', description_en:'Original description', icon_url:'/icon.png', hero_image_url:'/cover.png', gallery_urls:[], videos:[], supported_platforms:['macOS'], featured:false };
const video = {id:'intro',title:'操作演示',poster_url:'',sources:[{id:'one',label:'',url:'https://youtu.be/M7lc1UVf-VE'}]};

test('review shows new text and shared video separately from unchanged English',()=>{
 const draft={...original,description_zh:'新介绍',videos:[video]};
 const before=JSON.stringify(original);const summary=productPublicationSummary(draft,original);
 assert.deepEqual(summary.changedFields.map(x=>x.field),['description_zh','videos']);
 assert.equal(summary.liveVideoCount,0);assert.equal(summary.nextVideoCount,1);assert.equal(summary.independentEnglishUnchanged,true);
 assert.equal(JSON.stringify(original),before);assert.deepEqual(summary.publicLinks,{zh:'/zh/products/open-play',en:'/en/products/open-play'});
});
test('shared video updates are changes even when video count stays the same',()=>{
 const changed={...video,title:'更新后演示'};const summary=productPublicationSummary({...original,videos:[changed]},{...original,videos:[video]});
 assert.deepEqual(summary.changedFields.map(x=>x.field),['videos']);assert.equal(summary.liveVideoCount,1);assert.equal(summary.nextVideoCount,1);
});
test('new products and missing legacy video arrays have honest review counts',()=>{
 assert.equal(productPublicationSummary(original,null).liveVideoCount,0);
 assert.deepEqual(productPublicationSummary({...original,videos:undefined,gallery_urls:undefined},original).changedFields,[]);
 assert.equal(productPublicationSummary({...original,description_zh:'新介绍',description_en:''},original).independentEnglishUnchanged,false);
});
test('publish prerequisites do not require software releases for complete introduction and video',()=>{
 assert.deepEqual(productPublicationIssues({...original,videos:[video]}),[]);
});
test('an optional title does not block publication but an unused source has a precise repair target',()=>{
 const incomplete={...video,title:'',sources:[...video.sources,{id:'two',label:'',url:''}]};
 const issues=productPublicationIssues({...original,videos:[incomplete]});
 assert.deepEqual(issues.map(x=>x.field),['video:0:source:1']);
 assert.match(issues[0].label,/来源2.*移除/);
 assert.deepEqual(productPublicationIssues({...original,videos:[{...video,title:''}]}),[]);
});
test('invalid video and duplicate source remain blocked rather than hidden or removed',()=>{
 assert.equal(productPublicationIssues({...original,videos:[{...video,sources:[{...video.sources[0],url:'javascript:alert(1)'}]}]})[0].field,'video:0');
 assert.match(productPublicationIssues({...original,videos:[{...video,sources:[...video.sources,{...video.sources[0],id:'two'}]}]})[0].label,/重复/);
});
