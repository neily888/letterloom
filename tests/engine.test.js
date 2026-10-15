import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame, CENTER, DISTRIBUTION, SIZE, evaluateMove, commitMove, takePass, PREMIUM, TWO_LETTER_WORDS, isPlayableWord, drawTiles, isVowel, createLegalDictionary} from '../engine.js';
import {findBotMove,findQuickBotMove} from '../bot.js';
import {expandBritishHunspell,US_ONLY_SPELLINGS,GAME_WORD_EXTRAS,loadBritishWords} from '../uk-dictionary.js';

const tile=(id,letter,points=1)=>({id,letter,points,blank:points===0});
const legal=new Set(readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8').trim().split(/\s+/));
const everyday=new Set(readFileSync(new URL('../everyday-words.txt',import.meta.url),'utf8').trim().split(/\s+/));
const botWords=readFileSync(new URL('../bot-words.txt',import.meta.url),'utf8').trim().split(/\s+/);
function fixture(){
 const g=createGame('solo','relaxed');
 g.board=Array(225).fill(null);
 g.players[0].rack=[tile('c','C',3),tile('a','A'),tile('t','T'),tile('r','R'),tile('e','E'),tile('o','O'),tile('d','D',2)];
 g.players[1].rack=[tile('m','M',3),tile('x','X',8),tile('y','Y',4),tile('f','F',4),tile('i','I'),tile('n','N'),tile('s','S')];
 return g;
}

test('finite bag, seven tiles each and centre bonus',()=>{
 const g=createGame();
 assert.equal(Object.values(DISTRIBUTION).reduce((a,b)=>a+b,0),100);
 assert.equal(g.bag.length,86);
 assert.deepEqual(g.players.map(p=>p.rack.length),[7,7]);
 assert.equal(PREMIUM[CENTER],'DW');
 assert.equal(g.playStyle,'relaxed');
});
test('fair balanced draws for both players',()=>{
 for(let i=0;i<50;i++){
  const g=createGame('solo','relaxed');
  const all=[...g.bag,...g.players[0].rack,...g.players[1].rack];
  assert.equal(all.length,100);
  assert.equal(new Set(all.map(t=>t.id)).size,100);
  for(const p of g.players){const n=p.rack.filter(isVowel).length;assert.ok(n>=2&&n<=4);}
 }
});
test('classic has same dictionary but fully random draws',()=>{
 const g=createGame('solo','classic');
 assert.equal(g.balancedRack,false);
 assert.equal(g.freeSwapUsed[0],false);
 assert.equal(createLegalDictionary(legal,'classic'),legal);
 assert.notEqual(createLegalDictionary(legal,'relaxed'),legal);
 assert.equal(createLegalDictionary(legal,'relaxed',false),legal);
 assert.ok(!createLegalDictionary(legal,'relaxed').has('ZA'));
});
test('CAT opens across centre and scores bonus correctly',()=>{
 const g=fixture();
 g.pending=[{index:112,tile:g.players[0].rack[0]},{index:113,tile:g.players[0].rack[1]},{index:114,tile:g.players[0].rack[2]}];
 const result=evaluateMove(g,g.pending,legal);
 assert.equal(result.valid,true,result.reason);
 assert.equal(result.words[0].word,'CAT');
 assert.equal(result.score,10);
 assert.equal(commitMove(g,legal).valid,true);
 assert.equal(g.players[0].score,10);
 assert.equal(g.current,1);
});
test('cannot place invalid words, leave gaps or miss the centre',()=>{
 const g=fixture();
 g.pending=[{index:0,tile:g.players[0].rack[0]},{index:1,tile:g.players[0].rack[1]}];
 assert.match(evaluateMove(g,g.pending,legal).reason,/centre/);
 g.pending=[{index:CENTER-2,tile:g.players[0].rack[0]},{index:CENTER,tile:g.players[0].rack[1]}];
 assert.equal(evaluateMove(g,g.pending,legal).valid,false);
});
test('invalid parallel FAR over TAT is rejected from cross-words',()=>{
 const g=fixture();
 'TAT'.split('').forEach((letter,j)=>g.board[111+j]=tile(`old${j}`,letter));
 g.current=1;
 const rack=[tile('f','F',4),tile('a','A'),tile('r','R')];
 g.players[1].rack=rack;
 g.pending=rack.map((t,j)=>({index:96+j,tile:t}));
 const contaminated=new Set([...legal,'FT','RT']);
 const score=evaluateMove(g,g.pending,contaminated);
 assert.equal(score.valid,false);
 assert.match(score.reason,/FT/);
 assert.match(score.reason,/RT/);
 assert.equal(commitMove(g,contaminated).valid,false);
});
test('approved two-letter list and no old spellchecker abbreviation leak',()=>{
 const twos=[...legal].filter(w=>w.length===2);
 assert.deepEqual(twos.sort(),[...TWO_LETTER_WORDS].sort());
 assert.equal(twos.length,118);
 for(const word of ['AD','ED','FI','QI','ZA'])assert.ok(isPlayableWord(word,legal),word);
 for(const word of ['FT','RT','MR','CM','ST'])assert.ok(!isPlayableWord(word,new Set([word])),word);
});
test('one dictionary for player and computer in either mode',()=>{
 for(const style of ['relaxed','classic']){
  const dic=createLegalDictionary(legal,style);
  for(const word of ['AD','ORG','DEF','TUG','HOAX','MOAT','DIRT'])assert.ok(isPlayableWord(word,dic),style+' '+word);
  assert.equal(isPlayableWord('FI',dic),style==='classic');
  for(const word of ['COLOR','FAVOR','CENTER','ORGANIZE','TRAVELING'])assert.ok(!dic.has(word),style+' '+word);
 }
});
test('recognises common British spellings, not listed US-only variants',()=>{
 for(const word of ['COLOUR','FAVOUR','NEIGHBOUR','CENTRE','THEATRE','ORGANISE','TRAVELLING','ALUMINIUM','TRAVELLED'])assert.ok(legal.has(word),word);
 for(const word of ['COLOR','FAVOR','NEIGHBOR','CENTER','THEATER','ORGANIZE','TRAVELING','ALUMINUM','TRAVELED'])assert.ok(!legal.has(word),word);
 assert.ok(US_ONLY_SPELLINGS.has('COLOR'));
});
test('TUG below an existing TONE is allowed',()=>{
 const g=fixture();
 'TONE'.split('').forEach((letter,j)=>g.board[8*SIZE+5+j]=tile('old'+j,letter));
 const u=tile('u','U'),gg=tile('g','G',2);g.players[0].rack=[u,gg];
 g.pending=[{index:9*SIZE+5,tile:u},{index:10*SIZE+5,tile:gg}];
 const result=evaluateMove(g,g.pending,legal);
 assert.equal(result.valid,true,result.reason);
 assert.deepEqual(result.words.map(w=>w.word),['TUG']);
 assert.equal(commitMove(g,legal).valid,true);
});
test('AD is accepted for both players as a new two-letter word',()=>{
 for(const current of [0,1]){
  const g=fixture();g.current=current;g.board[CENTER]=tile('a','A');
  const d=tile('d','D',2);g.players[current].rack=[d];g.pending=[{index:CENTER+SIZE,tile:d}];
  assert.equal(evaluateMove(g,g.pending,legal).valid,true);
  assert.equal(commitMove(g,legal).valid,true);
 }
});
test('AD crossing word and HOAX exact historical position are accepted',()=>{
 const g=fixture();
 g.board[CENTER]=tile('old-a','A');g.board[CENTER-SIZE+1]=tile('old-a2','A');
 const b=tile('b','B',3),d=tile('d','D',2);g.players[0].rack=[b,d];
 g.pending=[{index:CENTER-1,tile:b},{index:CENTER+1,tile:d}];
 assert.deepEqual(evaluateMove(g,g.pending,legal).words.map(w=>w.word),['BAD','AD']);
 assert.equal(commitMove(g,legal).valid,true);
 assert.ok(legal.has('HOAX'));
});
test('the computer scores across sampled matches when legal plays exist',()=>{
 for(const style of ['relaxed','classic']){
  const words=[...(style==='relaxed'?everyday:new Set(botWords))].filter(w=>legal.has(w));
  let botScored=0;
  for(let match=0;match<4;match++){
   const g=createGame('solo',style);
   for(let t=0;t<12&&g.status==='playing';t++){
    const move=findBotMove(g,words,legal,600,{gentle:style==='relaxed'})||findQuickBotMove(g,legal);
    if(move){
     const result=evaluateMove(g,move,legal);
     assert.equal(result.valid,true,result.reason);
     g.pending=move;
     assert.equal(commitMove(g,legal).valid,true);
     if(g.history[0].player===1)botScored++;
    }else{
     // A randomly dealt rack can genuinely lack a move. Swapping isn't a bot bug.
     const rack=g.players[g.current].rack.map(tile=>tile.id);
     if(g.bag.length>=7&&rack.length)assert.ok(takePass(g,'swap',rack));
     else assert.ok(takePass(g,'pass'));
    }
   }
  }
  assert.ok(botScored>=2,`${style} bot must score in sampled matches`);
 }
});
test('free relaxed swap does not lose a turn, further swaps do',()=>{
 const g=fixture(),before=g.turn;
 assert.ok(takePass(g,'swap',[g.players[0].rack[0].id]));
 assert.equal(g.current,0);assert.equal(g.turn,before);
 assert.equal(g.freeSwapUsed[0],true);
 assert.ok(takePass(g,'swap',[g.players[0].rack[0].id]));
 assert.equal(g.current,1);assert.equal(g.turn,before+1);
});
test('scoreless game ends after six passes and deducts unused rack points exactly once',()=>{
 const g=fixture();
 g.players[0].score=100;g.players[1].score=90;g.players[0].rack=[tile('x','X',8)];g.players[1].rack=[tile('q','Q',10)];
 for(let i=0;i<6;i++)assert.ok(takePass(g));
 assert.equal(g.status,'finished');assert.equal(g.finalReason,'Six consecutive turns without scoring.');
 assert.deepEqual(g.endAdjustments,[-8,-10]);
 assert.deepEqual(g.players.map(p=>p.score),[92,80]);
 assert.equal(takePass(g),false);
 assert.deepEqual(g.players.map(p=>p.score),[92,80]);
});
test('empty bag alone does not end the game',()=>{
 const g=fixture();g.bag=[];
 assert.equal(g.status,'playing');
 assert.ok(takePass(g));
 assert.equal(g.status,'playing');
});
test('playing the final rack tile adjusts both scores and declares winner',()=>{
 const g=fixture();g.bag=[];
 g.board[CENTER]=tile('old-a','A');
 const d=tile('fin','D',2);g.players[0].rack=[d];g.players[1].rack=[tile('q','Q',10),tile('x','X',8)];
 g.pending=[{index:CENTER+SIZE,tile:d}];
 assert.equal(commitMove(g,legal).valid,true);
 assert.equal(g.status,'finished');
 assert.equal(g.players[0].rack.length,0);
 assert.deepEqual(g.endAdjustments,[18,-18]);
 assert.equal(g.players[1].score,-18);
 assert.equal(g.winner,0);
});
test('British Hunspell affixes generate normal words and filter names and US spellings',()=>{
 const aff=`SET UTF-8\nSFX S Y 1\nSFX S 0 s .\nSFX D Y 1\nSFX D 0 led .\nSFX G Y 1\nSFX G e ing e\nPFX R Y 1\nPFX R 0 re .\n`;
 const dic=`6\ncolour/S\ntravel/D\norganise/G\nhoax/S\nColor/S\ncenter/S\n`;
 const expanded=expandBritishHunspell(dic,aff);
 for(const w of ['COLOUR','COLOURS','TRAVEL','TRAVELLED','ORGANISE','ORGANISING','HOAX','HOAXS','ORG','AD'])assert.ok(expanded.has(w),w);
 for(const w of ['COLOR','COLORS','CENTER','CENTERS'])assert.ok(!expanded.has(w),w);
});
test('offline source and primary UK loader are versioned and installed safely',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../bot.worker.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 for(const source of [app,worker])assert.match(source,/loadBritishWords/);
 assert.match(app,/dictionary=createLegalDictionary\(words,game.playStyle,game.everydayShortWords\)/);
 assert.match(html,/Game version 1.21/);
 assert.match(sw,/letterloom-offline-v22/);
 assert.match(sw,/letterloom-uk-dictionary-v1\.9/,'service worker must preserve cached UK word list');
 for(const url of ['engine.js','uk-dictionary.js'])assert.ok(sw.includes(`./${url}?v=1.21.0`),url);
 assert.ok(sw.includes('./dictionary.txt?v=1.21.0'));
 for(const url of ['everyday-words.txt','bot-words.txt'])assert.ok(sw.includes(`./${url}?v=1.9.0`),url);
 assert.ok(sw.includes('./app.js?v=1.21.0'));
 for(const url of ['bot.js','bot.worker.js'])assert.ok(sw.includes(`./${url}?v=1.21.0`),url);
 assert.ok(sw.includes('./bot-familiarity.js?v=1.19.0'));
 assert.ok(sw.includes('./rack-order.js?v=1.15.0'));
 assert.ok(sw.includes('./word-lookup.js?v=1.19.0'));
 assert.match(app,/endgame-breakdown/);
});
test('offline fallback has no non-letter entries or duplicates',()=>{
 const data=readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8').trim().split(/\s+/);
 assert.equal(new Set(data).size,data.length);
 assert.ok(data.length>100000);
 assert.ok(data.every(w=>/^[A-Z]{2,15}$/.test(w)));
 for(const w of GAME_WORD_EXTRAS)assert.ok(legal.has(w));
});


test('the complete master list is loaded from the app without external services',async()=>{
 const savedFetch=globalThis.fetch;
 const master=readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8');
 const seen=[];
 globalThis.fetch=async url=>{seen.push(String(url));return new Response(master,{status:200});};
 try{
  const result=await loadBritishWords();
  assert.equal(result.words.size,158807);
  assert.equal(result.source,'Letterloom British English v1.21');
  assert.equal(seen.length,1);
  assert.match(seen[0],/dictionary\\.txt\\?v=1\\.21\\.0/);
  assert.ok(!seen[0].startsWith('https://raw.githubusercontent.com/'));
 }finally{globalThis.fetch=savedFetch;}
});

test('bundled dictionary does not silently switch to another list on failed load',async()=>{
 const savedFetch=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error('App bundle missing')};
 try{await assert.rejects(loadBritishWords(),/App bundle missing/)}
 finally{globalThis.fetch=savedFetch}
});
