import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,createLegalDictionary,evaluateMove,commitMove,CENTER,EVERYDAY_TWO_LETTER_WORDS} from '../engine.js';
import {findBotMove,findQuickBotMove,computerCandidateWords} from '../bot.js';
const base=new Set(readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8').trim().split(/\s+/));
const everyday=createLegalDictionary(base,'relaxed');
const original=createLegalDictionary(base,'classic');
const tile=(id,letter)=>({id,letter,points:1,blank:false});
test('Relaxed keeps familiar words, but excludes obscure short words',()=>{
 for(const word of ['AB','AD','AT','DO','GO','IN','PO','WE']){assert.ok(EVERYDAY_TWO_LETTER_WORDS.has(word));assert.ok(everyday.has(word),word)}
 assert.ok(everyday.has('QI'),'QI must be available in Relaxed');
 assert.ok(everyday.has('OZ'),'OZ is a Relaxed-only house rule');
 assert.ok(!original.has('OZ'),'OZ must remain excluded from Classic');
 for(const word of ['EL','EF','LI','UT','ZA']){assert.ok(original.has(word),word);assert.ok(!everyday.has(word),word)}
 for(const word of ['CAT','DOG','SUN','ORG','HOAX','TUG'])assert.ok(everyday.has(word),word);
});
test('Classic and disabled preference retain full word list',()=>{
 assert.notEqual(createLegalDictionary(base,'classic'),base);
 assert.equal(createLegalDictionary(base,'classic').has('III'),false);
 const fullRelaxed=createLegalDictionary(base,'relaxed',false);
 assert.notEqual(fullRelaxed,base);
 assert.ok(fullRelaxed.has('QI') && fullRelaxed.has('OZ'));
 assert.ok(!base.has('OZ'),'creating a relaxed dictionary must not change Classic');
 assert.equal(createGame('solo','relaxed').everydayShortWords,true);
 assert.equal(createGame('solo','classic').everydayShortWords,false);
});
test('QI and OZ can be played by both players with Everyday Short Words on or off',()=>{
 for(const preference of [true,false]){
  const dictionary=createLegalDictionary(base,'relaxed',preference);
  for(const word of ['QI','OZ']){
   assert.ok(dictionary.has(word));
   for(const current of [0,1]){
    const game=createGame('solo','relaxed',preference);
    game.current=current;game.board.fill(null);
    game.board[CENTER]=tile('old',word[0]);
    game.players[current].rack=[tile('new',word[1])];
    game.pending=[{index:CENTER+1,tile:game.players[current].rack[0]}];
    assert.equal(evaluateMove(game,game.pending,dictionary).valid,true,word+' player '+current);
    assert.equal(commitMove(game,dictionary).valid,true,word+' player '+current);
   }
   const bot=createGame('solo','relaxed',preference);
   bot.board.fill(null);bot.board[CENTER]=tile('old',word[0]);
   bot.current=1;bot.players[1].rack=[tile('r',word[1])];
   const candidates=computerCandidateWords([],dictionary,true);
   assert.ok(candidates.includes(word),word+' must reach the bot search list');
   const quick=findQuickBotMove(bot,dictionary);
   assert.ok(quick,word+' quick bot move');
   assert.ok(evaluateMove(bot,quick,dictionary).valid);
   const searched=findBotMove(bot,[word],dictionary,1000,{gentle:false});
   assert.ok(searched,word+' deep bot move');
   assert.ok(evaluateMove(bot,searched,dictionary).valid);
  }
 }
});
test('Human and computer reject the same obscure two-letter move',()=>{
 for(const current of [0,1]){
  const g=createGame('solo','relaxed');g.current=current;g.board.fill(null);g.board[CENTER]=tile('old','E');
  g.players[current].rack=[tile('l','L')];g.pending=[{index:CENTER+15,tile:g.players[current].rack[0]}];
  assert.match(evaluateMove(g,g.pending,original).reason,/Everyday Short Words/);
  assert.equal(commitMove(g,everyday).valid,false);
  g.everydayShortWords=false;
  assert.equal(evaluateMove(g,g.pending,original).valid,true);
 }
});
test('Computer picks allowed short word over blocked word',()=>{
 const g=createGame('solo','relaxed');g.board.fill(null);g.current=1;g.players[1].rack=['E','L','A','D'].map((c,i)=>tile('r'+i,c));
 const move=findBotMove(g,['EL','AD'],everyday,1000,{gentle:false});
 assert.ok(move);const result=evaluateMove(g,move,everyday);
 assert.equal(result.valid,true);assert.equal(result.words[0].word,'AD');
});
test('Shared word rules wired into app, hint worker and install cache',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../bot.worker.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(app,/id="short-words-checkbox"/);
 assert.match(app,/dictionary=createLegalDictionary\(words,game.playStyle,game.everydayShortWords\)/);
 assert.match(worker,/createLegalDictionary\(baseDictionary,data.game.playStyle,data.game.everydayShortWords\)/);
 assert.match(sw,/letterloom-offline-v30/);
});
