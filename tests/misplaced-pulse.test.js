import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,SIZE,evaluateMove,CENTER} from '../engine.js';
import {misplacedPendingIndices,returnPendingTile,movePendingTile} from '../board-placement.js';

const tile=(letter,id)=>({letter,id,points:1,blank:false});
const at=(row,col)=>row*SIZE+col;
const place=(index,id)=>({index,tile:tile('A',id)});
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('misplaced tile from recording is highlighted, not the whole word',()=>{
 const f=at(14,3), d=at(7,5),e=at(7,6),t=at(7,8);
 const pending=[place(f,'F'),place(d,'D'),place(e,'E'),place(t,'T')];
 assert.deepEqual(misplacedPendingIndices(pending),[f]);
 // No rules or scores change merely to produce the visual guidance.
 const game=createGame('solo','relaxed');
 game.board.fill(null);
 game.board[CENTER]=tile('U','fixed');
 game.pending=pending;
 const before={score:game.players[0].score,turn:game.turn,rack:game.players[0].rack.map(x=>x.id)};
 assert.equal(evaluateMove(game,game.pending).valid,false);
 assert.match(evaluateMove(game,game.pending).reason,/one row or one column/);
 assert.deepEqual({score:game.players[0].score,turn:game.turn,rack:game.players[0].rack.map(x=>x.id)},before);
 assert.equal(returnPendingTile(game.pending,f).tile.id,'F');
 assert.deepEqual(misplacedPendingIndices(game.pending),[]);
});
test('multiple separate letters on the wrong line are all highlighted',()=>{
 const pending=[place(at(4,1),'A'),place(at(4,2),'B'),place(at(4,3),'C'),place(at(8,5),'D'),place(at(10,6),'E')];
 assert.deepEqual(misplacedPendingIndices(pending),[at(8,5),at(10,6)]);
});
test('column words also identify the outlying letter, then clear when corrected',()=>{
 const x=at(13,13);
 const pending=[place(at(6,4),'D'),place(x,'X'),place(at(7,4),'E'),place(at(8,4),'T')];
 assert.deepEqual(misplacedPendingIndices(pending),[x]);
 const game=createGame('solo','relaxed');
 game.board.fill(null);
 assert.equal(movePendingTile(pending,game.board,x,at(9,4)),true);
 assert.deepEqual(misplacedPendingIndices(pending),[]);
});
test('ambiguous arrangements highlight all tentative tiles, not an arbitrary one',()=>{
 const pending=[place(at(2,2),'A'),place(at(2,3),'B'),place(at(3,2),'C')];
 assert.deepEqual(misplacedPendingIndices(pending),pending.map(p=>p.index));
 const diagonal=[place(at(3,3),'A'),place(at(4,4),'B')];
 assert.deepEqual(misplacedPendingIndices(diagonal),diagonal.map(p=>p.index));
});
test('already aligned, empty and malformed tentative moves are not highlighted',()=>{
 assert.deepEqual(misplacedPendingIndices([]),[]);
 assert.deepEqual(misplacedPendingIndices([place(at(2,4),'A')]),[]);
 assert.deepEqual(misplacedPendingIndices([place(at(2,2),'A'),place(at(2,4),'B')]),[]);
 assert.deepEqual(misplacedPendingIndices([place(at(2,2),'A'),place(at(4,2),'B')]),[]);
 assert.deepEqual(misplacedPendingIndices([{index:-1},{index:4}]),[]);
 assert.deepEqual(misplacedPendingIndices(null),[]);
});
test('pending outlines are stronger red, with finite pulse and accessible static fallback',()=>{
 const css=read('styles.css'),app=read('app.js'),html=read('index.html'),sw=read('sw.js');
 assert.match(css,/\.square\.is-pending \.letter-tile\{[^}]*outline:3px solid #c13c42/);
 assert.match(css,/\.square\.is-misaligned \.letter-tile\{[\s\S]*?animation:misplaced-letter-pulse \.85s ease-in-out 3/);
 assert.match(css,/@keyframes misplaced-letter-pulse/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{[\s\S]*?\.square\.is-misaligned \.letter-tile\{[\s\S]*?animation:none/);
 assert.match(app,/misplacedPendingIndices\(game\.pending,SIZE\)/);
 assert.match(app,/misplaced\.has\(i\)\?'is-misaligned'/);
 assert.match(app,/red-outlined letter/);
 assert.match(app,/Tap to return to the rack, or drag to move/);
 assert.match(app,/letterloom-match-v1/);
 assert.match(html,/Game version 1\.22\.6/);
 assert.match(sw,/letterloom-offline-v30/);
 assert.match(sw,/board-placement\.js\?v=1\.22\.4/);
});
