import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,createLegalDictionary,evaluateMove,commitMove,CENTER,EVERYDAY_TWO_LETTER_WORDS} from '../engine.js';
import {findBotMove} from '../bot.js';
const base=new Set(readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8').trim().split(/\s+/));
const everyday=createLegalDictionary(base,'relaxed');
const original=createLegalDictionary(base,'classic');
const tile=(id,letter)=>({id,letter,points:1,blank:false});
test('Relaxed keeps familiar words, but excludes obscure short words',()=>{
 for(const word of ['AB','AD','AT','DO','GO','IN','PO','WE']){assert.ok(EVERYDAY_TWO_LETTER_WORDS.has(word));assert.ok(everyday.has(word),word)}
 for(const word of ['EL','EF','LI','UT','QI','ZA']){assert.ok(original.has(word),word);assert.ok(!everyday.has(word),word)}
 for(const word of ['CAT','DOG','SUN','ORG','HOAX','TUG'])assert.ok(everyday.has(word),word);
});
test('Classic and disabled preference retain full word list',()=>{
 assert.equal(createLegalDictionary(base,'classic'),base);
 assert.equal(createLegalDictionary(base,'relaxed',false),base);
 assert.equal(createGame('solo','relaxed').everydayShortWords,true);
 assert.equal(createGame('solo','classic').everydayShortWords,false);
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
 assert.match(sw,/letterloom-offline-v21/);
});
