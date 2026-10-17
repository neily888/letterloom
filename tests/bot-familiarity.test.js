import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,evaluateMove,commitMove,createLegalDictionary} from '../engine.js';
import {findBotMove,findQuickBotMove} from '../bot.js';
import {assessMoveFamiliarity,UNFAMILIAR_BOT_WORDS,FAMILIAR_SHORT_WORDS} from '../bot-familiarity.js';
import {createDefinitionLookup} from '../word-lookup.js';

const dict=new Set(readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8').trim().split(/\s+/));
const common=new Set(readFileSync(new URL('../everyday-words.txt',import.meta.url),'utf8').trim().split(/\s+/));
const tile=(id,letter)=>({id,letter,points:{Z:10,C:3,T:1,A:1}[letter]||1,blank:false});

test('every word formed matters, not just the long main word',()=>{
 assert.equal(assessMoveFamiliarity([{word:'RIP'},{word:'IF'},{word:'PO'}],common),0);
 assert.equal(assessMoveFamiliarity([{word:'RIP'},{word:'IF'},{word:'IN'}],common),2);
 assert.equal(assessMoveFamiliarity([{word:'RIP'},{word:'ZA'}],common),0);
 assert.equal(assessMoveFamiliarity([{word:'HUNG'},{word:'GI'}],common),0);
 assert.equal(assessMoveFamiliarity([{word:'GOAT'},{word:'QI'}],common),0);
 for(const word of ['PO','ZA','AB','GI','ORG','ILIUM'])assert.ok(UNFAMILIAR_BOT_WORDS.has(word),word);
 for(const word of ['AD','IF','IN','OR','OF','WE','TA'])assert.ok(FAMILIAR_SHORT_WORDS.has(word),word);
});

test('relaxed computer prefers a familiar word over a higher scoring odd one',()=>{
 const g=createGame('solo','relaxed');
 g.board.fill(null);g.current=1;g.players[1].rack=['Z','A','C','A','T'].map((ch,i)=>tile('t'+i,ch));
 const words=['ZA','CAT'];
 const legal=createLegalDictionary(dict,'relaxed');
 const full=findBotMove(g,words,legal,1000,{gentle:false,preferFamiliar:true,familiarWords:new Set(['CAT'])});
 assert.ok(full);
 assert.equal(evaluateMove(g,full,legal).words[0].word,'CAT');
 g.playStyle='classic';g.everydayShortWords=false;
 const classic=findBotMove(g,words,dict,1000,{gentle:false});
 assert.equal(evaluateMove(g,classic,dict).words[0].word,'ZA');
 g.playStyle='relaxed';g.everydayShortWords=true;
 assert.ok(commitMove({...g,pending:full},legal).valid);
});

test('rare words are still permitted when nothing familiar is possible',()=>{
 const g=createGame('solo','classic');g.board.fill(null);g.current=1;
 g.players[1].rack=['Z','A'].map((ch,i)=>tile('t'+i,ch));
 const move=findBotMove(g,['ZA'],dict,500,{gentle:false,preferFamiliar:true,familiarWords:new Set()});
 assert.equal(evaluateMove(g,move,dict).words[0].word,'ZA');
 assert.ok(dict.has('ZA'));
 assert.ok(!createLegalDictionary(dict,'relaxed').has('ZA'));
 assert.ok(createLegalDictionary(dict,'classic').has('ZA'));
});

test('word discovery identifies regional slang and British historical meaning offline',async()=>{
 const lookup=createDefinitionLookup({fetcher:async()=>{throw Error('Unexpected lookup')},storage:null,online:()=>false});
 const za=await lookup('ZA'),po=await lookup('PO');
 assert.equal(za.status,'found');assert.match(za.entries[0].partOfSpeech,/American slang/i);
 assert.match(za.entries[0].definition,/pizza/i);
 assert.equal(po.status,'found');assert.match(po.entries[0].partOfSpeech,/British/i);
 assert.match(po.entries[0].definition,/chamber pot/i);
});

test('installed PWA pre-caches the new preference code and versioned player files',()=>{
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(sw,/bot-familiarity.js\?v=1\.19\.0/);
 assert.match(sw,/letterloom-offline-v24/);
 assert.match(app,/preferFamiliar/);
 assert.match(app,/familiarWords/);
});
