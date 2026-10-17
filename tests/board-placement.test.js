import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../engine.js';
import {movePendingTile, returnPendingTile} from '../board-placement.js';

function setup(){
  const game=createGame('solo','relaxed');
  const [a,b]=game.players[0].rack;
  const start=[{index:112,tile:{...a}},{index:113,tile:{...b}}];
  game.pending=start;
  return {game,a,b};
}
test('moving a tentative tile changes only its square, no turn or score',()=>{
  const {game,a,b}=setup();
  const before={score:game.players[0].score,turn:game.turn,bag:game.bag.length,rack:game.players[0].rack.map(t=>t.id)};
  assert.equal(movePendingTile(game.pending,game.board,112,127),true);
  assert.deepEqual(game.pending.map(p=>[p.index,p.tile.id]),[[127,a.id],[113,b.id]]);
  assert.deepEqual({score:game.players[0].score,turn:game.turn,bag:game.bag.length,rack:game.players[0].rack.map(t=>t.id)},before);
});
test('dropping on another unplayed letter swaps, not overwrites',()=>{
  const {game,a,b}=setup();
  assert.equal(movePendingTile(game.pending,game.board,112,113),true);
  assert.deepEqual(game.pending.map(p=>[p.index,p.tile.id]),[[113,a.id],[112,b.id]]);
  assert.equal(game.pending.length,2);
  const restored=JSON.parse(JSON.stringify(game));
  assert.deepEqual(restored.pending,game.pending);
});
test('existing committed letters cannot be moved or covered',()=>{
  const {game,a}=setup();
  game.board[125]={letter:'Z',points:10,turn:1,id:'committed'};
  const prev=JSON.stringify(game.pending);
  assert.equal(movePendingTile(game.pending,game.board,112,125),false);
  assert.equal(movePendingTile(game.pending,game.board,125,127),false);
  assert.equal(JSON.stringify(game.pending),prev);
  assert.equal(game.board[125].letter,'Z');
  assert.equal(game.pending.find(p=>p.tile.id===a.id).index,112);
});
test('invalid drops and cancellation leave all tiles in place',()=>{
  const {game}=setup();
  const prev=JSON.stringify(game.pending);
  for(const [from,to] of [[112,112],[112,-1],[112,225],[-1,112],[24,80],[112,12.5]])assert.equal(movePendingTile(game.pending,game.board,from,to),false);
  assert.equal(JSON.stringify(game.pending),prev);
});
test('dragging back to rack returns the original tile including blanks',()=>{
  const {game,a,b}=setup();
  game.pending[0].tile={...a,blank:true,letter:'E',points:0};
  assert.equal(returnPendingTile(game.pending,112).tile.letter,'E');
  assert.deepEqual(game.pending.map(p=>p.tile.id),[b.id]);
  assert.ok(game.players[0].rack.some(t=>t.id===a.id));
  assert.equal(returnPendingTile(game.pending,112),null);
});
test('board drag is wired for pointer and touch, with versioned offline files',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const styles=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(app,/pointerdown.*event=>\{/);
 assert.match(app,/cell\.setPointerCapture\(event\.pointerId\)/);
 assert.match(app,/movePendingTile\(game\.pending,game\.board/);
 assert.match(app,/returnPendingTile\(game\.pending/);
 assert.match(app,/boardIndexAtPoint/);
 assert.match(app,/ignoreBoardClickUntil/);
 assert.match(styles,/\.square\.is-pending\{touch-action:none/);
 assert.match(sw,/board-placement\.js\?v=1\.16\.0/);
 assert.match(index,/Game version 1\.22/);
});
