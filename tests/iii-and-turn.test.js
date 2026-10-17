import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CENTER,createGame,createLegalDictionary,commitMove,evaluateMove,isPlayableWord,isEverydayShortWord} from '../engine.js';
import {computerCandidateWords,findBotMove} from '../bot.js';
import {currentTurnText} from '../turn-status.js';

const base=new Set(readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8').trim().split(/\s+/));
const tile=(id,letter)=>({id,letter,points:1,blank:false});
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('III is present in the bundled source but never legal in Classic or Relaxed',()=>{
 assert.ok(base.has('III'),'regression test must reflect the bundled source');
 assert.equal(isEverydayShortWord('III'),false);
 assert.equal(isPlayableWord('III',base),false,'raw dictionary cannot bypass the shared validator');
 assert.equal(isPlayableWord('III',new Set(['III'])),false,'injected lexicons cannot bypass the shared validator');
 for(const [style,shortWords] of [['classic',false],['relaxed',false],['relaxed',true]]){
  const dictionary=createLegalDictionary(base,style,shortWords);
  assert.equal(dictionary.has('III'),false,style);
  assert.equal(isPlayableWord('III',dictionary),false,style);
  assert.ok(dictionary.has('QI'),'existing QI rule must survive');
  if(style==='relaxed')assert.ok(dictionary.has('OZ'),'Relaxed OZ house rule must survive');
  else assert.equal(dictionary.has('OZ'),false,'Classic must still exclude OZ');
  for(const current of [0,1]){
   const game=createGame('solo',style,shortWords);
   game.board.fill(null);
   game.board[CENTER]=tile('fixed','I');
   game.current=current;
   game.players[current].rack=[tile('first','I'),tile('second','I')];
   game.pending=[{index:CENTER+1,tile:game.players[current].rack[0]},{index:CENTER+2,tile:game.players[current].rack[1]}];
   assert.match(evaluateMove(game,game.pending,dictionary).reason,/Roman numeral/);
   assert.equal(commitMove(game,dictionary).valid,false);
   assert.equal(evaluateMove(game,game.pending,null).valid,false,'cannot bypass exclusion without loaded dictionary');
  }
  assert.deepEqual(computerCandidateWords(['III'],dictionary,style==='relaxed').includes('III'),false);
  const bot=createGame('solo',style,shortWords);
  bot.board.fill(null);
  bot.board[CENTER]=tile('fixed','I');
  bot.current=1;
  bot.players[1].rack=[tile('one','I'),tile('two','I')];
  assert.equal(findBotMove(bot,['III'],dictionary,500,{gentle:false}),null,style+' computer must not play III');
 }
});
test('turn labels are grammatical and unambiguous for each player',()=>{
 const solo=createGame('solo','relaxed');
 assert.equal(currentTurnText(solo),'Your turn');
 solo.current=1;
 assert.equal(currentTurnText(solo),"Computer's turn");
 const local=createGame('local','classic');
 assert.equal(currentTurnText(local),"Player 1's turn");
 local.current=1;
 assert.equal(currentTurnText(local),"Player 2's turn");
 local.status='finished';
 assert.equal(currentTurnText(local),'Game finished');
});
test('turn indicator has high-contrast text and announces changes without shrinking board',()=>{
 const html=read('index.html'),css=read('styles.css'),app=read('app.js'),sw=read('sw.js');
 assert.match(html,/class="turn-indicator" role="status" aria-live="polite"/);
 assert.match(html,/id="current-player-label">Your turn/);
 assert.match(css,/\.turn-indicator\{[\s\S]*?font-size:20px;font-weight:900/);
 assert.match(css,/\.turn-indicator\.is-waiting/);
 assert.match(app,/currentTurnText\(game\)/);
 assert.doesNotMatch(app,/\`\$\{game\.players\[game\.current\]\.name\}'s turn\`/);
 assert.match(app,/letterloom-match-v1/);
 assert.match(sw,/turn-status\.js\?v=1\.22\.2/);
 assert.match(sw,/letterloom-offline-v26/);
});
