import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  CENTER,createGame,createLegalDictionary,evaluateMove,commitMove,
  isExcludedRomanNumeral,excludedRomanNumeralValue,isPlayableWord
} from '../engine.js';
import {computerCandidateWords,findBotMove} from '../bot.js';

const base=new Set(readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8').trim().split(/\s+/));
const tile=(id,letter)=>({id,letter,points:1,blank:false});
const numeralParts=[['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];
function roman(n){
  let word='';
  for(const [letters,value] of numeralParts){
    while(n>=value){word+=letters;n-=value;}
  }
  return word;
}
test('all canonical Roman numeral spellings are excluded except independent English words',()=>{
  const exceptions=new Set(['XI','LI','MI','MM','MIX','DIV']);
  for(let n=1;n<=3999;n++){
    const word=roman(n);
    if(word.length<2||word.length>15)continue;
    assert.equal(isExcludedRomanNumeral(word),!exceptions.has(word),word+' / '+n);
    if(!exceptions.has(word))assert.equal(excludedRomanNumeralValue(word),n,word);
  }
  for(const word of ['XI','LI','MI','MM','MIX','DIV']){
    assert.ok(base.has(word),word+' exists as a separate dictionary word');
    assert.equal(isExcludedRomanNumeral(word),false,word);
    assert.equal(isPlayableWord(word,base),true,word+' must not be lost');
  }
  for(const word of ['III','VII','VIII','XII','XIII','XIV','XVIII','XXI','XXXIX','LXXXVIII','CML']){
    assert.ok(base.has(word),word+' must reproduce the dictionary bug');
    assert.equal(isExcludedRomanNumeral(word),true,word);
    assert.equal(isPlayableWord(word,base),false,word);
    assert.equal(isPlayableWord(word,new Set([word])),false,word+' must stay rejected even with a raw lexicon');
  }
  assert.equal(isExcludedRomanNumeral('VIIII'),false,'nonstandard numeral form does not match');
  assert.equal(isExcludedRomanNumeral('MIXED'),false,'ordinary English word is not a numeral');
});
test('Classic and both Relaxed preferences filter every numeral but preserve other word rules',()=>{
  const excluded=[...base].filter(isExcludedRomanNumeral);
  assert.ok(excluded.length>=90,'numeral list should cover more than III and VIII');
  for(const [style,everyday] of [['classic',false],['relaxed',false],['relaxed',true]]){
    const dictionary=createLegalDictionary(base,style,everyday);
    for(const word of excluded)assert.equal(dictionary.has(word),false,style+' '+word);
    assert.ok(dictionary.has('QI'),'QI stays playable');
    assert.equal(dictionary.has('OZ'),style==='relaxed','Relaxed-only OZ stays available');
    if(style==='classic'||!everyday)for(const word of ['XI','MIX','DIV','LI','MM'])assert.ok(dictionary.has(word),style+' '+word);
    assert.ok(dictionary.has('CAT'),style+' CAT stays playable');
  }
  assert.ok(base.has('VIII'),'master dictionary remains untouched');
});
test('people and computer cannot add VIII, even when it crosses existing words',()=>{
  for(const [style,everyday] of [['classic',false],['relaxed',false],['relaxed',true]]){
    const dictionary=createLegalDictionary(base,style,everyday);
    for(const current of [0,1]){
      const game=createGame('solo',style,everyday);
      game.board.fill(null);game.board[CENTER]=tile('prior','V');
      game.current=current;
      const rack=['I','I','I'].map((letter,i)=>tile('new'+i,letter));
      game.players[current].rack=rack;
      game.pending=rack.map((t,i)=>({index:CENTER+1+i,tile:t}));
      const oldScores=game.players.map(p=>p.score);
      const oldHistory=game.history.length;
      const result=evaluateMove(game,game.pending,dictionary);
      assert.equal(result.valid,false,style+' player '+current);
      assert.match(result.reason,/VIII.*Roman numeral/,style+' player '+current);
      assert.equal(evaluateMove(game,game.pending,null).valid,false,'raw validation must enforce the ban');
      assert.equal(commitMove(game,dictionary).valid,false);
      assert.deepEqual(game.players.map(p=>p.score),oldScores,'invalid move cannot change scores');
      assert.equal(game.history.length,oldHistory);
    }
    const computer=createGame('solo',style,everyday);
    computer.current=1;computer.board.fill(null);computer.board[CENTER]=tile('prior','V');
    computer.players[1].rack=['I','I','I'].map((v,i)=>tile('b'+i,v));
    assert.equal(computerCandidateWords(['VIII'],dictionary,style==='relaxed').includes('VIII'),false);
    assert.equal(findBotMove(computer,['VIII'],dictionary,800,{gentle:false}),null);
  }
});
test('historical numeral moves remain visible and their scores remain unchanged',()=>{
  const game=createGame('solo','relaxed');
  game.board.fill(null);
  'VIII'.split('').forEach((letter,i)=>game.board[CENTER+i]=tile('historic'+i,letter));
  game.players[1].score=11;
  game.history=[{type:'play',player:1,score:11,words:[{word:'VIII',score:11}],placements:[]}];
  const restored=JSON.parse(JSON.stringify(game));
  assert.deepEqual(restored.board.slice(CENTER,CENTER+4).map(t=>t?.letter),['V','I','I','I']);
  assert.equal(restored.players[1].score,11);
  assert.equal(restored.history[0].words[0].word,'VIII');
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  assert.match(app,/excludedRomanNumeralValue\(word\)/);
  assert.match(app,/Roman numerals are no longer allowed in new Letterloom moves/);
  assert.match(app,/Previous plays and their scores are preserved/);
});
