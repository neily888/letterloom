export const SIZE = 15;
export const RACK_SIZE = 7;
// House rule: favour playable racks, without adding tiles or changing the total bag.
export const MIN_RACK_VOWELS = 2;
export const MAX_RACK_VOWELS = 4;
export const isVowel = tile => /^[AEIOU]$/.test(tile.letter);
export const BINGO_BONUS = 35;
export const LETTER_POINTS = Object.freeze({A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,'?':0});
export const DISTRIBUTION = Object.freeze({A:9,B:2,C:2,D:4,E:12,F:2,G:3,H:2,I:9,J:1,K:1,L:4,M:2,N:6,O:8,P:2,Q:1,R:6,S:4,T:6,U:4,V:2,W:2,X:1,Y:2,Z:1,'?':2});
export const CENTER = 7 * SIZE + 7;
// Hunspell spell-checking dictionaries can contain abbreviations such as FT and RT.
// These are the two-letter entries accepted by Letterloom's word-game lexicon.
// Keep this list aligned with the dictionary builder (tested in tests/engine.test.js).
export const TWO_LETTER_WORDS = new Set(`AA AB AD AE AG AH AI AL AM AN AR AS AT AW AX AY
BA BE BI BO BY
DA DE DO
ED EE EF EH EL EM EN EO ER ES ET EW EX
FA FE FI FU
GI GO
HA HE HI HM HO
ID IF IN IO IS IT
JA JE JO
KA KI
LA LI LO
MA ME MI MM MO MU MY
NA NE NO NU
OD OE OF OH OI OK OM ON OO OP OR OS OU OW OX OY
PA PE PI PO
QI
RE
SH SI SO
TA TE TI TO
UH UM UN UP US UT
VU
WE WO
XI XU
YA YE YI YO
ZA`.trim().split(/\s+/));
// Classic retains the full playable list. Relaxed defaults to a carefully
// chosen everyday short-word list, shared by human and computer. Users can
// disable this preference when starting a new Relaxed match.
export const EVERYDAY_TWO_LETTER_WORDS = new Set(`AB AD AH AI AM AN AS AT AW AY
BE BI BY DO ED EH EX GO HA HE HI HM HO ID IF IN IS IT
LA LO MA ME MI MO MY NO OF OH OI OK ON OR OW OX
PA PI PO QI RE SH SO TA TO UH UM UN UP US WE YA YE YO`.split(/\s+/));
// Only unambiguous rare three-letter game forms: avoid removing common
// words which happen to share a spelling with a letter's name (BEE, PEE).
export const EXCLUDED_THREE_LETTER_WORDS = new Set(`CEE DEE EFF ELL EMM ESS QIS XIS ZAS`.split(/\s+/));
// The bundled British-English list includes Roman numerals such as III, VIII
// and XXXIX. Do not treat numbers as words. Some spellings ALSO have independent
// English meanings and must remain playable (XI = Greek letter, MI = note,
// LI = distance unit, MM = interjection, MIX = verb, DIV = British slang).
// Only canonical numeral spellings of 2-15 letters are excluded.
export const ROMAN_NUMERAL_WORD_EXCEPTIONS = new Set(['XI','LI','MI','MM','MIX','DIV']);
const ROMAN_NUMERAL_PATTERN = /^(?=.{2,15}$)M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/;
export const isExcludedRomanNumeral = word =>
  !ROMAN_NUMERAL_WORD_EXCEPTIONS.has(word) && ROMAN_NUMERAL_PATTERN.test(word);
export function isEverydayShortWord(word){
  if(isExcludedRomanNumeral(word))return false;
  if(word.length===2)return EVERYDAY_TWO_LETTER_WORDS.has(word) || word==='OZ';
  if(word.length===3)return !EXCLUDED_THREE_LETTER_WORDS.has(word);
  return true;
}
export function createLegalDictionary(words, playStyle='classic', everydayShortWords=playStyle==='relaxed') {
  const base=words instanceof Set?words:new Set(words);
  const selected=new Set([...base].filter(word=>!isExcludedRomanNumeral(word) && (playStyle!=='relaxed'||!everydayShortWords||isEverydayShortWord(word))));
  if(playStyle!=='relaxed')return selected;
  // QI is a playable word and OZ (ounce) is a Relaxed-only house rule.
  selected.add('QI');
  selected.add('OZ');
  return selected;
}
export const isPlayableWord = (word, dictionary) =>
  !!dictionary && dictionary.has(word) && !isExcludedRomanNumeral(word) && (word.length !== 2 || TWO_LETTER_WORDS.has(word) || word==='OZ');
const pos = (r,c) => r * SIZE + c;
const premium = Array(SIZE * SIZE).fill('');
function assign(type, coords) {for(const [r,c] of coords) premium[pos(r,c)] = type;}
assign('TW',[[0,0],[0,7],[0,14],[7,0],[7,14],[14,0],[14,7],[14,14]]);
assign('DW',[[1,1],[2,2],[3,3],[4,4],[1,13],[2,12],[3,11],[4,10],[10,4],[11,3],[12,2],[13,1],[10,10],[11,11],[12,12],[13,13],[7,7]]);
assign('TL',[[1,5],[1,9],[5,1],[5,5],[5,9],[5,13],[9,1],[9,5],[9,9],[9,13],[13,5],[13,9]]);
assign('DL',[[0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],[6,2],[6,6],[6,8],[6,12],[7,3],[7,11],[8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],[12,6],[12,8],[14,3],[14,11]]);
export const PREMIUM = Object.freeze(premium);
export const inside = (r,c) => r>=0 && r<SIZE && c>=0 && c<SIZE;
export const tileAt = (game, pendingByIndex, r, c) => inside(r,c) ? (pendingByIndex.get(pos(r,c))?.tile ?? game.board[pos(r,c)]) : null;

export function createGame(mode='solo', playStyle='relaxed', everydayShortWords=playStyle==='relaxed') {
  const bag = [];
  let seq = 0;
  for (const [letter,count] of Object.entries(DISTRIBUTION)) {
    for (let i=0;i<count;i++) bag.push({id:`t${seq++}`, letter, points:LETTER_POINTS[letter], blank:letter==='?'});
  }
  shuffle(bag);
  const game = {
    version:1, mode, playStyle, everydayShortWords:playStyle==='relaxed'&&!!everydayShortWords, balancedRack:playStyle==='relaxed', freeSwapUsed:[false,false], board:Array(SIZE*SIZE).fill(null), bag, players:[
      {name:mode==='solo'?'You':'Player 1',score:0,rack:[]},
      {name:mode==='solo'?'Computer':'Player 2',score:0,rack:[]}
    ], current:0, pending:[], history:[], scorelessTurns:0, status:'playing', winner:null,
    turn:1, finalReason:'', endAdjustments:[0,0], createdAt:Date.now()
  };
  drawTiles(game,0);
  drawTiles(game,1);
  return game;
}
export function shuffle(items) {
  for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
  return items;
}
// The bag remains random, but incoming tiles are steered towards 2–4 vowels
// in a full rack when the actual bag permits. This applies to both players.
// Existing letters stay untouched; late-game bags can still run out of vowels.
export function drawTiles(game,playerIndex,maxDraw=RACK_SIZE){
  const rack=game.players[playerIndex].rack;
  const count=Math.min(maxDraw,RACK_SIZE-rack.length,game.bag.length);
  for(let drawn=0;drawn<count;drawn++){
    const remaining=count-drawn;
    const vowels=rack.filter(isVowel).length;
    let preferred=null;
    // Force a vowel only when needed to reach 2 with the remaining draws.
    if(vowels<MIN_RACK_VOWELS && remaining<=MIN_RACK_VOWELS-vowels) preferred='vowel';
    // Prevent excessive vowels in freshly dealt hands, where possible.
    else if(vowels>=MAX_RACK_VOWELS) preferred='other';
    let index=game.bag.length-1;
    if(game.balancedRack!==false && preferred){
      const eligible=game.bag.findLastIndex(t=>preferred==='vowel'?isVowel(t):!isVowel(t));
      if(eligible!==-1)index=eligible;
    }
    rack.push(game.bag.splice(index,1)[0]);
  }
}

const fail = (reason) => ({valid:false,score:0,words:[],reason});
function buildWord(game, overlay, index, dr, dc){
  let r=Math.floor(index/SIZE),c=index%SIZE;
  while(inside(r-dr,c-dc) && tileAt(game,overlay,r-dr,c-dc)){r-=dr;c-=dc;}
  const cells=[];
  while(inside(r,c) && tileAt(game,overlay,r,c)){
    const i=pos(r,c);
    cells.push({index:i,tile:tileAt(game,overlay,r,c),fresh:overlay.has(i)});
    r+=dr;c+=dc;
  }
  return {word:cells.map(x=>x.tile.letter).join(''),cells};
}
function scoreWord(word){
  let sum=0, multiplier=1;
  for(const cell of word.cells){
    const premium=cell.fresh?PREMIUM[cell.index]:'';
    sum+=cell.tile.points*(premium==='DL'?2:premium==='TL'?3:1);
    if(premium==='DW') multiplier*=2;
    if(premium==='TW') multiplier*=3;
  }
  return sum*multiplier;
}
export function evaluateMove(game,pending=game.pending,dictionary=null){
  if(!pending.length) return fail('Place at least one tile on the board.');
  const overlay=new Map();
  for(const placement of pending){
    const {index,tile}=placement;
    if(!Number.isInteger(index) || index<0 || index>=SIZE*SIZE || !tile || !/^[A-Z]$/.test(tile.letter)) return fail('A tile placement is invalid.');
    if(game.board[index] || overlay.has(index)) return fail('One of those spaces is already occupied.');
    overlay.set(index,placement);
  }
  const rows=pending.map(x=>Math.floor(x.index/SIZE));
  const cols=pending.map(x=>x.index%SIZE);
  const sameRow=rows.every(x=>x===rows[0]);
  const sameCol=cols.every(x=>x===cols[0]);
  if(!sameRow && !sameCol) return fail('Tiles must form one row or one column.');
  const index=pending[0].index;
  const horizontal=buildWord(game,overlay,index,0,1);
  const vertical=buildWord(game,overlay,index,1,0);
  const useHorizontal=pending.length>1?sameRow:horizontal.cells.length>=2;
  const main=useHorizontal?horizontal:vertical;
  if(main.cells.length<2) return fail('Make a word with at least two letters.');
  if(pending.some(x=>!main.cells.some(cell=>cell.index===x.index))) return fail('Fill the gaps between your letters.');
  const words=[main];
  for(const placement of pending){
    const cross=buildWord(game,overlay,placement.index,useHorizontal?1:0,useHorizontal?0:1);
    if(cross.cells.length>=2) words.push(cross);
  }
  const hasOldTiles=game.board.some(Boolean);
  if(!hasOldTiles && !overlay.has(CENTER)) return fail('Your opening word must cover the centre star.');
  if(hasOldTiles && !words.some(w=>w.cells.some(cell=>!cell.fresh))) return fail('Connect your word to a letter already on the board.');
  const numerals=words.filter(w=>isExcludedRomanNumeral(w.word));
  if(numerals.length)return fail(`${numerals.map(w=>w.word).join(', ')} ${numerals.length===1?'is a Roman numeral':'are Roman numerals'}, not playable words.`);
  if(game.playStyle==='relaxed' && game.everydayShortWords){
    const excluded=words.filter(w=>!isEverydayShortWord(w.word));
    if(excluded.length)return fail(`${excluded.map(w=>w.word).join(', ')} ${excluded.length===1?'is':'are'} excluded by Everyday Short Words. You can switch this off for a new match.`);
  }
  if(dictionary){
    const invalid=words.filter(w=>!isPlayableWord(w.word,dictionary));
    if(invalid.length) return fail(`${invalid.map(w=>w.word).join(', ')} ${invalid.length===1?'is not':'are not'} in the offline word list.`);
  }
  const scoredWords=words.map(w=>({word:w.word,score:scoreWord(w)}));
  const bingo=pending.length===RACK_SIZE?BINGO_BONUS:0;
  return {valid:true,score:scoredWords.reduce((a,w)=>a+w.score,0)+bingo,words:scoredWords,bingo,reason:''};
}
export function commitMove(game,dictionary){
  const result=evaluateMove(game,game.pending,dictionary);
  if(!result.valid) return result;
  const player=game.players[game.current];
  const placedIds=new Set(game.pending.map(p=>p.tile.id));
  if(game.pending.some(p=>!player.rack.some(t=>t.id===p.tile.id))) return fail('One or more tiles are missing from your rack.');
  for(const placement of game.pending){
    game.board[placement.index]={...placement.tile,owner:game.current,turn:game.turn};
  }
  player.rack=player.rack.filter(t=>!placedIds.has(t.id));
  player.score+=result.score;
  game.history.unshift({type:'play',player:game.current,words:result.words,score:result.score,turn:game.turn});
  game.pending=[];
  game.scorelessTurns=0;
  drawTiles(game,game.current);
  if(!game.bag.length && !player.rack.length){
    const opponent=game.players[1-game.current];
    const leftover=opponent.rack.reduce((s,t)=>s+t.points,0);
    opponent.score-=leftover;
    player.score+=leftover;
    game.endAdjustments ??= [0,0];
    game.endAdjustments[game.current]+=leftover;
    game.endAdjustments[1-game.current]-=leftover;
    finishGame(game,'A player used their last tile.');
  } else advanceTurn(game);
  return result;
}
export function advanceTurn(game){game.current=1-game.current;game.turn++;}
export function takePass(game,action='pass',tiles=[]){
  if(game.status!=='playing') return false;
  const player=game.players[game.current];
  if(action==='swap'){
    const ids=new Set(tiles);
    if(ids.size===0 || game.bag.length<7 || ids.size>game.bag.length) return false;
    const swapped=player.rack.filter(t=>ids.has(t.id));
    if(swapped.length!==ids.size) return false;
    player.rack=player.rack.filter(t=>!ids.has(t.id));
    // Swapped tiles are returned only after replacement, so they cannot
    // immediately be drawn again. Apply the same balancing as regular draws.
    drawTiles(game,game.current,swapped.length);
    game.bag.push(...swapped.map(t=>({...t,letter:t.blank?'?':t.letter,points:t.blank?0:t.points})));
    shuffle(game.bag);
  }
  game.pending=[];
  game.history.unshift({type:action,player:game.current,words:[],score:0,turn:game.turn});
  if(action==='swap' && game.playStyle==='relaxed' && !game.freeSwapUsed?.[game.current]){
    game.freeSwapUsed ??= [false,false];
    game.freeSwapUsed[game.current]=true;
    // A single free swap per player in Relaxed mode; no turn lost.
    return true;
  }
  game.scorelessTurns++;
  if(game.scorelessTurns>=6){
    game.endAdjustments ??= [0,0];
    for(let i=0;i<2;i++){
      const penalty=game.players[i].rack.reduce((s,t)=>s+t.points,0);
      game.players[i].score-=penalty;
      game.endAdjustments[i]-=penalty;
    }
    finishGame(game,'Six consecutive turns without scoring.');
  } else advanceTurn(game);
  return true;
}
export function finishGame(game,reason){
  game.status='finished';game.finalReason=reason;
  game.winner=game.players[0].score===game.players[1].score?-1:game.players[0].score>game.players[1].score?0:1;
}
