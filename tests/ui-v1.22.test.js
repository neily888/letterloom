import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('Arrange mode is gone but rack pointer dragging and Shuffle remain',()=>{
 const app=read('app.js'),html=read('index.html'),css=read('styles.css');
 assert.doesNotMatch(html,/arrange-button|rack-order-tip/);
 assert.doesNotMatch(app,/arrangeFirstId|renderArrangeControls|if\(arranging\)/);
 assert.match(app,/moveVisibleRackTile\(/);
 assert.match(app,/addEventListener\('pointermove',updateRackDrag/);
 assert.match(html,/id="shuffle-button" class="shuffle-action"/);
 assert.match(css,/\.shuffle-action\{[^}]*min-height:44px/);
 assert.match(css,/\.shuffle-action\{[^}]*border:2px solid/);
});
test('portrait iPhone, iPad and laptop sizing rules are present',()=>{
 const css=read('styles.css');
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/@media\(min-width:601px\) and \(max-width:980px\)/);
 assert.match(css,/@media\(min-width:981px\)/);
 assert.match(css,/calc\(100dvh - 398px\)/);
 assert.match(css,/calc\(100dvh - 345px\)/);
 assert.match(css,/\.board\{display:grid;grid-template-columns:repeat\(15/);
});
test('v1.22 keeps the original match storage and offline resources',()=>{
 const app=read('app.js'),html=read('index.html'),sw=read('sw.js');
 assert.match(app,/letterloom-match-v1/);
 assert.match(html,/Game version 1.22/);
 assert.match(sw,/letterloom-offline-v24/);
 assert.match(sw,/\.\/word-lookup\.js\?v=1\.22\.0/);
});
