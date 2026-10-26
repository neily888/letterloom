import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('Dark Forest is a colour-only layer over the unchanged 15 x 15 board layout', () => {
  const css = read('styles.css');
  const theme = read('theme-dark.css');
  const stripped = theme.replace(/\/\*[\s\S]*?\*\//g, '');
  const permitted = new Set(['color', 'background', 'border-color', 'outline-color', 'box-shadow']);
  let found = 0;
  for (const block of stripped.matchAll(/\{([^{}]*)\}/g)) {
    for (const decl of block[1].split(';').map(part => part.trim()).filter(Boolean)) {
      const colon = decl.indexOf(':');
      assert.ok(colon > 0, 'Expected a CSS property: ' + decl);
      const property = decl.slice(0, colon).trim();
      assert.ok(property.startsWith('--') || permitted.has(property),
        'Non-colour or geometry-changing property in theme: ' + property);
      found++;
    }
  }
  assert.ok(found > 30, 'The visual theme should include the new palette');
  assert.match(css, /grid-template-columns:repeat\(15/);
  assert.match(theme, /\.square\.tw/);
  assert.match(theme, /\.square\.dw/);
  assert.match(theme, /\.square\.tl/);
  assert.match(theme, /\.square\.dl/);
  assert.match(theme, /\.rack-tile/);
  assert.match(theme, /\.square\.is-pending/);
});

test('Dark Forest ships as a versioned offline-only visual asset', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const pkg = JSON.parse(read('package.json'));
  assert.ok(html.indexOf('./styles.css?v=1.22.4') < html.indexOf('./theme-dark.css?v=1.22.5'));
  assert.match(html, /Game version 1\.22\.5/);
  assert.match(html, /<script type="module" src="\.\/app\.js\?v=1\.22\.4"><\/script>/);
  assert.match(sw, /letterloom-offline-v29/);
  assert.match(sw, /\.\/theme-dark\.css\?v=1\.22\.5/);
  assert.equal(manifest.background_color, '#11241d');
  assert.equal(manifest.theme_color, '#11241d');
  assert.equal(pkg.version, '1.22.5');
  assert.match(read('app.js'), /letterloom-match-v1/);
});
