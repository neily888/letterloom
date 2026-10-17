import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../engine.js';
import {getLastComputerMove} from '../last-move.js';

function savedMatch(){
  const game=createGame('solo','relaxed');
  game.board[110]={id:'a',letter:'C',points:4,owner:0,turn:1};
  game.board[111]={id:'b',letter:'A',points:1,owner:1,turn:2};
  game.board[112]={id:'c',letter:'T',points:1,owner:1,turn:2};
  game.board[113]={id:'d',letter:'S',points:1,owner:0,turn:3};
  game.history=[
    {type:'pass',player:1,turn:5,score:0,words:[]},
    {type:'play',player:0,turn:3,score:3,words:[{word:'CATS',score:3}]},
    {type:'play',player:1,turn:2,score:8,words:[{word:'CAT',score:8}]},
    {type:'play',player:0,turn:1,score:4,words:[{word:'C',score:4}]}
  ];
  return game;
}
test('last computer move highlights only its newly committed letters, not shared letters',()=>{
  const move=getLastComputerMove(savedMatch());
  assert.deepEqual(move,{turn:2,indices:[111,112],words:['CAT'],score:8});
  assert.ok(!move.indices.includes(110));
  assert.ok(!move.indices.includes(113));
});
test('last computer move remains discoverable after a player plays, a pass and a save reload',()=>{
  const match=savedMatch();
  const restored=JSON.parse(JSON.stringify(match));
  assert.deepEqual(getLastComputerMove(restored),getLastComputerMove(match));
});
test('a new game, pass-only game or pass-and-play game has no computer replay',()=>{
  const noMove=createGame('solo','relaxed');
  noMove.history.unshift({type:'pass',player:1,turn:2});
  assert.equal(getLastComputerMove(noMove),null);
  const local=savedMatch();local.mode='local';
  assert.equal(getLastComputerMove(local),null);
});
test('corrupt or old move records fail safely and do not highlight older unrelated tiles',()=>{
  const old=savedMatch();old.board[111].owner=0;old.board[112].turn=99;
  assert.equal(getLastComputerMove(old),null);
  assert.equal(getLastComputerMove(null),null);
  assert.equal(getLastComputerMove({mode:'solo',history:[],board:[]}),null);
});
test('UI exposes the control and retains last-move replay until the board is tapped',()=>{
  const root=new URL('../',import.meta.url);
  const page=readFileSync(new URL('index.html',root),'utf8');
  const app=readFileSync(new URL('app.js',root),'utf8');
  const css=readFileSync(new URL('styles.css',root),'utf8');
  const worker=readFileSync(new URL('sw.js',root),'utf8');
  assert.match(page,/id="show-last-move"[^>]+aria-pressed="false"/);
  assert.match(page,/Game version 1\.22\.4/);
  assert.match(app,/function toggleLastComputerMove\(/);
  assert.match(app,/computerHighlight==='replay'\)stopComputerHighlight\(\)/);
  assert.match(app,/showAutomaticComputerMove\(\)/);
  assert.match(app,/3500/);
  assert.match(app,/getLastComputerMove\(game\)/);
  assert.match(css,/\.square\.is-computer-highlight \.letter-tile/);
  assert.match(css,/\.last-move-button\[hidden\]\{display:none\}/);
  assert.match(worker,/last-move\.js\?v=1\.17\.0/);
  assert.match(worker,/styles\.css\?v=1\.22\.4/);
});
