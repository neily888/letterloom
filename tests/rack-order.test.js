import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from '../engine.js';
import {moveRackTile,swapRackTiles,nearestRackSlot,moveVisibleRackTile,rackShiftOffsets} from '../rack-order.js';

const ids=rack=>rack.map(t=>t.id);
test('manual swapping changes positions, never swaps with the bag or affects turns',()=>{
 const game=createGame('solo','relaxed');
 const originalRack=ids(game.players[0].rack),bag=ids(game.bag),turn=game.turn,score=game.players[0].score;
 assert.equal(swapRackTiles(game.players[0].rack,originalRack[0],originalRack[3]),true);
 const swapped=ids(game.players[0].rack);
 assert.equal(swapped[0],originalRack[3]);assert.equal(swapped[3],originalRack[0]);
 assert.deepEqual([...swapped].sort(),[...originalRack].sort());
 assert.deepEqual(ids(game.bag),bag);
 assert.equal(game.turn,turn);assert.equal(game.players[0].score,score);
 assert.equal(game.pending.length,0);
});
test('finger drag moves one letter to a new rack position',()=>{
 const game=createGame();const original=ids(game.players[0].rack);
 assert.equal(moveRackTile(game.players[0].rack,original[0],original[3]),true);
 assert.deepEqual(ids(game.players[0].rack),[original[1],original[2],original[3],original[0],...original.slice(4)]);
});
test('reorder works with duplicate letters because tile ids are unique',()=>{
 const tiles=[{id:'a1',letter:'A'},{id:'a2',letter:'A'},{id:'b1',letter:'B'}];
 assert.equal(swapRackTiles(tiles,'a1','a2'),true);
 assert.deepEqual(ids(tiles),['a2','a1','b1']);
 assert.equal(moveRackTile(tiles,'a1','b1'),true);
 assert.deepEqual(ids(tiles),['a2','b1','a1']);
});
test('invalid or same-item reorders never change the rack',()=>{
 const tiles=[{id:'1'},{id:'2'},{id:'3'}];const before=ids(tiles);
 for(const operation of [()=>swapRackTiles(tiles,'1','1'),()=>swapRackTiles(tiles,'1','missing'),()=>moveRackTile(tiles,'3','3'),()=>moveRackTile(tiles,'missing','1')])assert.equal(operation(),false);
 assert.deepEqual(ids(tiles),before);
});
test('order survives normal JSON match saving without modifying tile objects',()=>{
 const game=createGame('solo','relaxed');const prior=ids(game.players[0].rack);
 moveRackTile(game.players[0].rack,prior[5],prior[0]);
 const restored=JSON.parse(JSON.stringify(game));
 assert.deepEqual(ids(restored.players[0].rack),[prior[5],...prior.slice(0,5),prior[6]]);
 assert.equal(restored.players[0].rack.length,7);
});
test('iPad-friendly rack dragging and cache are present',()=>{
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.doesNotMatch(index,/id="arrange-button"/);
 assert.match(index,/id="shuffle-button"/);
 assert.match(index,/Game version 1.22.4/);
 assert.match(app,/pointerdown/);assert.match(app,/pointermove/);assert.match(app,/pointerup/);
 assert.doesNotMatch(app,/swapRackTiles/);assert.match(app,/moveVisibleRackTile/);assert.match(app,/persist\(\)/);
 assert.match(css,/touch-action:none/);
 assert.match(sw,/rack-order.js\?v=1.15.0/);
});

test('drop positions work in gaps, over ends and with a short rack',()=>{
  const slots=[100,160,220,280,340,400,460];
  assert.equal(nearestRackSlot(slots,-25),0);
  assert.equal(nearestRackSlot(slots,134),1);
  assert.equal(nearestRackSlot(slots,192),2);
  assert.equal(nearestRackSlot(slots,700),6);
  assert.equal(nearestRackSlot(slots,600,3),2);
  assert.equal(nearestRackSlot(slots,600,0),-1);
  assert.equal(nearestRackSlot(slots,NaN),-1);
});
test('dragged neighbours move into the gap in both directions',()=>{
  const slots=[100,160,220,280];
  assert.deepEqual(rackShiftOffsets(slots,0,3),[0,-60,-60,-60]);
  assert.deepEqual(rackShiftOffsets(slots,3,0),[60,60,60,0]);
  assert.deepEqual(rackShiftOffsets(slots,1,-1),[0,0,0,0]);
});
test('dragging one playable tile leaves tiles already on the board alone',()=>{
  const rack=['A','B','C','D','E','F','G'].map(id=>({id}));
  const original=rack.map(t=>t.id);
  assert.equal(moveVisibleRackTile(rack,['B','E'],'A',4),true);
  assert.deepEqual(rack.map(t=>t.id),['C','B','D','F','E','G','A']);
  assert.equal(moveVisibleRackTile(rack,['B','E'],'E',0),false);
  assert.equal(moveVisibleRackTile(rack,['B','E'],'A',40),false);
  assert.deepEqual([...rack.map(t=>t.id)].sort(),original.sort());
});
test('drag handler captures original tile and supports dropping between letters on iOS',()=>{
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const styles=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(app,/tile\.setPointerCapture\(event\.pointerId\)/);
  assert.match(app,/window\.addEventListener\('pointercancel'/);
  assert.match(app,/nearestRackSlot\(dragRack\?\.centres/);
  assert.match(app,/moveVisibleRackTile\(/);
  assert.match(app,/rack-drag-ghost/);
  assert.match(styles,/\.rack\{touch-action:none\}/);
});
