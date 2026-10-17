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
 assert.match(html,/Game version 1.22.2/);
 assert.match(sw,/letterloom-offline-v26/);
 assert.match(sw,/\.\/word-lookup\.js\?v=1\.22\.0/);
});

test('v1.22.1 keeps portrait board width and gives text room in surrounding rows',()=>{
 const css=read('styles.css'),index=read('index.html'),sw=read('sw.js');
 assert.match(css,/v1\.22\.1: Keep the full-width board/);
 assert.match(css,/\.game-area\{width:min\(100%,710px\);display:grid/);
 assert.match(css,/grid-template-areas:"heading heading" "scores scores" "board board" "status last" "racktools racktools" "rack rack" "actions actions"/);
 assert.match(css,/\.last-move-row\{grid-area:last/);
 assert.match(css,/\.board \.letter-tile\{font-size:clamp\(17px,2\.35vw,23px\);font-weight:900\}/);
 assert.match(css,/@media \(max-width:600px\)/);
 assert.match(index,/styles\.css\?v=1\.22\.2/);
 assert.match(sw,/styles\.css\?v=1\.22\.2/);
 assert.doesNotMatch(index,/id="arrange-button"/);
});
