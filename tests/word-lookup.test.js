import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wordsAtCell, OFFLINE_MEANINGS, parseDictionaryResponse, parseWiktionaryResponse, plainDefinition, createDefinitionLookup,definitionQuality, selectReadableMeanings} from '../word-lookup.js';
const makeBoard=()=>Array(225).fill(null);
const draw=(b,row,col,word,step=1)=>{for(let i=0;i<word.length;i++)b[row*15+col+step*i]={letter:word[i]};};

test('tap a letter in a word discovers the whole word',()=>{
 const b=makeBoard();draw(b,7,5,'GOAT');
 assert.deepEqual(wordsAtCell(b,7*15+6),[{word:'GOAT',indices:[110,111,112,113],direction:'across'}]);
 assert.deepEqual(wordsAtCell(b,1100),[]);
});
test('a crossing square offers BOTH words, with shorter first (GI and GOAT)',()=>{
 const b=makeBoard();draw(b,7,5,'GOAT');
 b[8*15+5]={letter:'I'};
 const found=wordsAtCell(b,7*15+5);
 assert.deepEqual(found.map(w=>w.word),['GI','GOAT']);
 assert.deepEqual(found.map(w=>w.direction),['down','across']);
});
test('word detection never wraps between board rows',()=>{
 const b=makeBoard();b[7*15+14]={letter:'A'};b[8*15]={letter:'D'};
 assert.deepEqual(wordsAtCell(b,7*15+14),[]);
 assert.deepEqual(wordsAtCell(b,8*15),[]);
});
test('a lone tile and pending tiles do not mutate the board',()=>{
 const b=makeBoard(); b[112]={letter:'T'};
 const before=JSON.stringify(b);
 assert.deepEqual(wordsAtCell(b,112),[]);
 assert.equal(JSON.stringify(b),before);
});
test('GI and GOAT have easy offline definitions',()=>{
 assert.match(OFFLINE_MEANINGS.GI[1],/martial arts/);
 assert.match(OFFLINE_MEANINGS.GOAT[1],/animal/);
 assert.match(OFFLINE_MEANINGS.ORG[1],/organisation/);
});
test('online definition parsing keeps readable meanings and removes duplicates',()=>{
 const data=[{meanings:[{partOfSpeech:'noun',definitions:[{definition:'A clever idea.'},{definition:'A clever idea.'}]},{partOfSpeech:'verb',definitions:[{definition:'To plan an idea.'}]}]}];
 assert.deepEqual(parseDictionaryResponse(data),[{partOfSpeech:'noun',definition:'A clever idea.'},{partOfSpeech:'verb',definition:'To plan an idea.'}]);
 assert.deepEqual(parseDictionaryResponse(null),[]);
});
test('online words get fetched once, cached, and remain readable offline',async()=>{
 const data=new Map(); const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 let calls=0,connected=true;
 const fetcher=async url=>{calls++;assert.match(url,/page\/definition\/dandelion$/);return {ok:true,json:async()=>({en:[{partOfSpeech:'noun',definitions:[{definition:'A plant with yellow flowers.'}]}]})};};
 const first=createDefinitionLookup({fetcher,storage,online:()=>connected});
 const fromNet=await first('DANDELION');assert.equal(fromNet.status,'found');assert.equal(calls,1);
 connected=false;
 const second=createDefinitionLookup({fetcher,storage,online:()=>connected});
 const fromCache=await second('dandelion');assert.equal(fromCache.status,'found');assert.match(fromCache.source,/offline/);assert.equal(calls,1);
});
test('no network returns an honest offline message rather than inventing a definition',async()=>{
 const lookup=createDefinitionLookup({fetcher:async()=>{throw Error('should not fetch');},storage:null,online:()=>false});
 assert.equal((await lookup('QUINTESSENCE')).status,'offline');
 assert.equal((await lookup('GI')).status,'found');
});
test('unknown online words remain allowed in game even when definition service has no entry',async()=>{
 const lookup=createDefinitionLookup({fetcher:async()=>({ok:false,status:404}),storage:null,online:()=>true});
 assert.equal((await lookup('XYZZY')).status,'not-found');
});
test('new version includes UI affordance and caches word lookup code offline',()=>{
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(page,/Tap a word on the board/);
 assert.match(page,/Game version 1.19/);
 assert.match(script,/wordsAtCell\(game.board,index,SIZE\)/);
 assert.match(script,/if\(game.board\[index\]\)\{showWordMeaningAt\(index\);return;\}/);
 assert.match(worker,/word-lookup.js\?v=1.19.0/);
});

test('ILIUM, LI, EL and DUEL now show definitions even without a connection',async()=>{
 const lookup=createDefinitionLookup({fetcher:async()=>{throw Error('must not fetch');},storage:null,online:()=>false});
 for(const word of ['ILIUM','LI','EL','DUEL']){
  const result=await lookup(word);
  assert.equal(result.status,'found',`${word} should work offline`);
  assert.ok(result.entries[0].definition.length>20);
 }
});
test('v1.13 preserves app stylesheet caching and preserves spacing in crossing labels',()=>{
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(page,/styles\.css\?v=1\.19\.0/);
 assert.match(script,/definition-choice-direction/);
 assert.match(script,/· \$\{direction===/);
 assert.match(css,/\.definition-choice \.definition-choice-direction/);
 assert.match(worker,/letterloom-offline-v20/);
 assert.match(worker,/styles\.css\?v=1\.19\.0/);
});


test('SLY definition is always available offline in Relaxed and Classic',async()=>{
 const lookup=createDefinitionLookup({fetcher:async()=>{throw Error('must not contact network');},storage:null,online:()=>false});
 const meaning=await lookup('sly');
 assert.equal(meaning.status,'found');
 assert.match(meaning.entries[0].definition,/secretive|crafty/);
});
test('Wiktionary parser converts simple HTML to safe plain text and ignores other languages',()=>{
 const data={en:[{partOfSpeech:'adjective',definitions:[{definition:'A <b>secretive</b> and &quot;crafty&quot; person.'}]}],fr:[{partOfSpeech:'noun',definitions:[{definition:'Ignore me'}]}]};
 assert.deepEqual(parseWiktionaryResponse(data),[{partOfSpeech:'adjective',definition:'A secretive and "crafty" person.'}]);
 assert.equal(plainDefinition('<script>Hi</script>'), 'Hi'); // caller HTML-escapes the returned plain text
});
test('if Wiktionary is unavailable, Free Dictionary API still supplies the definition',async()=>{
 const called=[];const storage={getItem:()=>null,setItem:()=>{}};
 const fetcher=async url=>{called.push(url);if(url.includes('wiktionary.org'))throw Error('Blocked by network');return {ok:true,json:async()=>[{meanings:[{partOfSpeech:'adjective',definitions:[{definition:'Very strange.'}]}]}]};};
 const lookup=createDefinitionLookup({fetcher,storage,online:()=>true});
 const result=await lookup('peculiar');
 assert.equal(result.status,'found');
 assert.equal(result.entries[0].definition,'Very strange.');
 assert.equal(called.length,2);
});
test('offline definitions do not trigger any fetches for familiar words',async()=>{
 let calls=0;
 const lookup=createDefinitionLookup({fetcher:async()=>{calls++;throw Error('no');},storage:null,online:()=>true});
 for(const word of ['SLY','SMILE','FAMILY','ROSE','BOOK'])assert.equal((await lookup(word)).status,'found');
 assert.equal(calls,0);
});


test('DE has a clear offline English word-game meaning and outranks old cached technical definitions',async()=>{
 const old={DE:[{partOfSpeech:'symbol',definition:'ISO 639-1 language code for German.'}]};
 const storage={getItem:()=>JSON.stringify(old),setItem:()=>{}};
 let calls=0;
 const lookup=createDefinitionLookup({storage,fetcher:async()=>{calls++;throw Error('no network needed');},online:()=>false});
 const meaning=await lookup('DE');
 assert.equal(meaning.status,'found');
 assert.match(meaning.entries[0].definition,/of.*from/i);
 assert.doesNotMatch(meaning.entries[0].definition,/ISO|Cyrillic|operator/);
 assert.equal(calls,0);
});
test('plain-English meanings outrank symbol codes, even when the provider returns codes first',()=>{
 const entries=[
  {partOfSpeech:'symbol',definition:'ISO 639-1 language code for German.'},
  {partOfSpeech:'symbol',definition:'from (operator), this is (operator)'},
  {partOfSpeech:'noun',definition:'A cheerful greeting used when meeting a friend.'},
  {partOfSpeech:'noun',definition:'A greeting when meeting a friend.'}
 ];
 const readable=selectReadableMeanings(entries);
 assert.equal(readable.length,2);
 assert.match(readable[0].definition,/greeting/);
 assert.ok(definitionQuality(entries[0])<0);
 assert.ok(definitionQuality(entries[2])>0);
});
test('fallback dictionary is tried when Wiktionary has only technical senses',async()=>{
 const requested=[];
 const fetcher=async url=>{
  requested.push(url);
  if(url.includes('wiktionary.org'))return {ok:true,json:async()=>({en:[{partOfSpeech:'symbol',definitions:[{definition:'ISO 639-1 language code for German.'}]}]})};
  return {ok:true,json:async()=>[{meanings:[{partOfSpeech:'noun',definitions:[{definition:'A friendly meeting in a public place.'}]}]}]};
 };
 const lookup=createDefinitionLookup({fetcher,storage:null,online:()=>true});
 const result=await lookup('LARGESS');
 assert.equal(result.status,'found');
 assert.equal(result.provider,'free-dictionary');
 assert.equal(requested.length,2);
 assert.match(result.entries[0].definition,/friendly meeting/);
});
test('both sources providing only technical entries returns honest no-clear-meaning status',async()=>{
 const lookup=createDefinitionLookup({storage:null,online:()=>true,fetcher:async url=>url.includes('wiktionary.org')?{ok:true,json:async()=>({en:[{partOfSpeech:'symbol',definitions:[{definition:'ISO 639-1 language code for German.'}]}]})}:{ok:true,json:async()=>[{meanings:[{partOfSpeech:'symbol',definitions:[{definition:'Unicode name for Cyrillic letter.'}]}]}]}});
 assert.equal((await lookup('KEXX')).status,'not-found');
});
test('v1.13 versioned assets and no word-list changes',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.match(html,/Game version 1.19/);
 assert.match(html,/word.*game/);
 assert.match(sw,/letterloom-offline-v20/);
 assert.match(sw,/word-lookup.js\?v=1.19.0/);
 assert.match(app,/word-lookup.js\?v=1.19.0/);
 const words=readFileSync(new URL('../dictionary.txt',import.meta.url),'utf8');
 assert.match(words,/\nDE\n/);
});

test('v1.18: AB always starts with the familiar abdominal-muscle meaning without internet',async()=>{
 let calls=0;
 const lookup=createDefinitionLookup({fetcher:async()=>{calls++;throw Error('unexpected request');},storage:null,online:()=>true});
 const meaning=await lookup('ab');
 assert.equal(meaning.status,'found');
 assert.equal(meaning.entries.length,1);
 assert.match(meaning.entries[0].definition,/abdominal muscle/i);
 assert.match(meaning.entries[0].definition,/plural.*abs/i);
 assert.equal(meaning.canLookUpMore,true);
 assert.equal(calls,0);
});

test('v1.18: other meanings are loaded only on request, kept secondary, and saved offline',async()=>{
 const data=new Map();
 const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 let calls=0,connected=true;
 const fetcher=async()=>{calls++;return {ok:true,json:async()=>({en:[{partOfSpeech:'noun',definitions:[
  {definition:'An abscess caused by injecting an illegal drug, usually heroin.'},
  {definition:'A short name for a muscle in the abdomen.'}
 ]}]})};};
 const lookup=createDefinitionLookup({storage,fetcher,online:()=>connected});
 assert.equal((await lookup('AB')).entries.length,1);
 assert.equal(calls,0);
 const expanded=await lookup('AB',{includeAlternatives:true});
 assert.equal(calls,1);
 assert.match(expanded.entries[0].definition,/abdominal muscle/i);
 assert.match(expanded.entries[1].definition,/abscess/i);
 assert.equal(expanded.otherProvider,'wiktionary');
 connected=false;
 const nextLookup=createDefinitionLookup({storage,fetcher,online:()=>connected});
 const cached=await nextLookup('AB',{includeAlternatives:true});
 assert.equal(calls,1);
 assert.match(cached.entries[0].definition,/abdominal muscle/i);
 assert.ok(cached.entries.length>1);
});

test('v1.18: offline alternate meanings are informative rather than hiding the primary',async()=>{
 const lookup=createDefinitionLookup({storage:null,online:()=>false,fetcher:async()=>{throw Error('offline');}});
 const expanded=await lookup('AB',{includeAlternatives:true});
 assert.equal(expanded.status,'found');
 assert.equal(expanded.entries.length,1);
 assert.equal(expanded.moreStatus,'offline');
});

test('v1.18: online senses show common sense before slang, but retain alternatives',async()=>{
 const lookup=createDefinitionLookup({storage:null,online:()=>true,fetcher:async()=>({ok:true,json:async()=>({en:[
  {partOfSpeech:'noun',definitions:[{definition:'(slang) An obscure usage in a special setting.'},{definition:'A familiar object used around the house every day.'}]}
 ]})})});
 const result=await lookup('SYNTHWORD');
 assert.equal(result.status,'found');
 assert.match(result.entries[0].definition,/familiar object/);
 assert.match(result.entries[1].definition,/slang/);
});

test('v1.18: word discovery contains an accessible expand button, hidden panel, and proper version caching',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(app,/data-action=\\?"other-meanings/);
 assert.match(app,/aria-expanded=\\?"false/);
 assert.match(app,/lookUpDefinition\(word,\{includeAlternatives:true\}\)/);
 assert.match(app,/const main=meaning.entries\[0\]/);
 assert.match(app,/currentDefinitionMeaning=null/);
 assert.match(css,/\.other-meanings-panel\[hidden\]\{display:none\}/);
 assert.match(sw,/word-lookup.js\?v=1.19.0/);
 assert.match(index,/Game version 1.19/);
});

test('v1.18: UT has a simple musical explanation',async()=>{
 const lookup=createDefinitionLookup({storage:null,online:()=>false});
 assert.match((await lookup('UT')).entries[0].definition,/DO.*DO–RE–MI/i);
});
