import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IPAD_PORTRAIT_QUERY,positionHeadingButtons} from '../ipad-ui.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('11-inch portrait iPad board reaches full width while original layouts remain',()=>{
  const css=read('ipad-wide.css'), original=read('styles.css');
  const html=read('index.html');
  assert.match(css, /min-width:\s*760px/);
  assert.match(css, /max-width:\s*900px/);
  assert.match(css, /orientation:\s*portrait/);
  assert.match(css, /any-pointer:\s*coarse/);
  assert.match(css, /\.game-area\s*\{[^}]*width:\s*100%/);
  assert.match(css, /\.board-surround\s*\{[^}]*width:\s*100%/);
  assert.match(css, /\.app\s*\{\s*padding:\s*0;/);
  assert.match(css, /\.board \.letter-tile\s*\{[^}]*font-size:\s*clamp\(26px/);
  assert.match(css, /\.square,\.square \.bonus-label\s*\{[^}]*font-size/);
  assert.match(original, /grid-template-columns:repeat\(15/);
  assert.match(original, /\.game-area\{width:min\(100%,710px\);display:grid/);
  assert.match(html, /ipad-wide\.css\?v=1\.22\.7/);
  assert.doesNotMatch(css, /letterloom-match-v1|localStorage|pointermove/);
});

test('same Help and New game DOM buttons move together and restore in landscape',()=>{
  const events=[];
  const help={name:'help'}, fresh={name:'new'}, install={name:'install'};
  const header={
    nodes:[help,install,fresh],
    insertBefore(node,other){
      this.nodes=this.nodes.filter(n=>n!==node);
      this.nodes.splice(this.nodes.indexOf(other),0,node);
      events.push('restore-help');
    },
    append(node){
      this.nodes=this.nodes.filter(n=>n!==node);
      this.nodes.push(node);events.push('restore-new');
    }
  };
  const heading={
    nodes:[],
    append(...nodes){
      for(const node of nodes){header.nodes=header.nodes.filter(n=>n!==node);this.nodes.push(node);}
      events.push('move');
    }
  };
  positionHeadingButtons(true,header,heading,help,fresh,install);
  assert.deepEqual(heading.nodes,[help,fresh]);
  assert.deepEqual(header.nodes,[install]);
  positionHeadingButtons(false,header,heading,help,fresh,install);
  assert.deepEqual(header.nodes,[help,install,fresh]);
  assert.equal(events.join(','),'move,restore-help,restore-new');
  assert.match(IPAD_PORTRAIT_QUERY, /orientation:\s*portrait/);
  const js=read('ipad-ui.js');
  assert.doesNotMatch(js,/cloneNode|new-button-2|help-button-2|addEventListener\(['"]click/);
  assert.match(read('app.js'), /\$\('new-button'\)\.addEventListener\('click'/);
  assert.match(read('app.js'), /\$\('help-button'\)\.addEventListener\('click'/);
});

test('iPad layout keeps all controls, offline support and original save key',()=>{
  const html=read('index.html'),sw=read('sw.js');
  assert.match(html, /id="board" class="board"/);
  assert.match(html, /id="ipad-heading-actions"/);
  for(const id of ['new-button','help-button','rack','hint-button','undo-button',
                    'shuffle-button','swap-button','pass-button','play-button']){
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,
      'Keep one original control '+id);
  }
  assert.match(html,/Game version 1\.22\.7/);
  assert.match(sw,/letterloom-offline-v31/);
  assert.match(sw,/ipad-ui\.js\?v=1\.22\.7/);
  assert.match(sw,/ipad-wide\.css\?v=1\.22\.7/);
  assert.match(read('app.js'),/letterloom-match-v1/);
  assert.equal(JSON.parse(read('package.json')).version,'1.22.7');
});
