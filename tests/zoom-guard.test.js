import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preventPagePinch} from '../zoom-guard.js';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('pinch guard keeps the existing fitted board and drag gestures', () => {
  const css = read('zoom-guard.css');
  const js = read('zoom-guard.js');
  const layout = read('styles.css');
  const app = read('app.js');
  const index = read('index.html');

  assert.match(css, /@media\s*\(any-pointer:\s*coarse\)/);
  assert.match(css, /touch-action:\s*pan-x pan-y/);
  assert.doesNotMatch(css, /touch-action:\s*none/);
  assert.match(layout, /grid-template-columns:repeat\(15/);
  assert.match(layout, /\.rack-tile\{touch-action:none/);
  assert.match(layout, /\.square\.is-pending\{touch-action:none/);
  assert.match(app, /addEventListener\('pointermove',updateRackDrag/);
  assert.match(app, /addEventListener\('pointermove',updateBoardDrag/);
  assert.doesNotMatch(js, /addEventListener\(['"]touchmove/);
  assert.doesNotMatch(index, /user-scalable=no|maximum-scale=1/);
});

test('iOS fallback prevents cancelable pinch gestures without blocking scrolling', () => {
  const js = read('zoom-guard.js');
  assert.match(js, /addEventListener\('gesturestart',\s*preventPagePinch,\s*\{passive:false\}\)/);
  assert.match(js, /addEventListener\('gesturechange',\s*preventPagePinch,\s*\{passive:false\}\)/);
  let prevented=0;
  preventPagePinch({cancelable:true,preventDefault(){prevented++;}});
  preventPagePinch({cancelable:false,preventDefault(){prevented++;}});
  assert.equal(prevented,1);
});

test('pinch guard is loaded and cached offline without versioning game logic', () => {
  const index = read('index.html'), sw = read('sw.js');
  assert.match(index, /zoom-guard\.css\?v=1\.22\.6/);
  assert.match(index, /zoom-guard\.js\?v=1\.22\.6/);
  assert.match(sw, /zoom-guard\.css\?v=1\.22\.6/);
  assert.match(sw, /zoom-guard\.js\?v=1\.22\.6/);
  assert.match(sw, /letterloom-offline-v30/);
  assert.match(index, /Game version 1\.22\.6/);
  assert.match(index, /app\.js\?v=1\.22\.4/);
  assert.match(read('app.js'), /letterloom-match-v1/);
});
