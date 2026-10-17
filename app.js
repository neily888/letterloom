import {SIZE, PREMIUM, CENTER, createGame, evaluateMove, commitMove, takePass, shuffle, LETTER_POINTS, createLegalDictionary, excludedRomanNumeralValue} from './engine.js?v=1.22.3';
import {findBotMove, findQuickBotMove, computerCandidateWords} from './bot.js?v=1.22.3';
import {loadBritishWords} from './uk-dictionary.js?v=1.22.3';
import {wordsAtCell, createDefinitionLookup} from './word-lookup.js?v=1.22.0';
import {moveVisibleRackTile, nearestRackSlot, rackShiftOffsets} from './rack-order.js?v=1.15.0';
import {movePendingTile, returnPendingTile} from './board-placement.js?v=1.16.0';
import {getLastComputerMove} from './last-move.js?v=1.17.0';
import {currentTurnText} from './turn-status.js?v=1.22.2';

const $ = id => document.getElementById(id);
// Keep the original key and save schema so existing games remain playable.
const STORAGE_KEY = 'letterloom-match-v1';
const GAME_URL = new URL('.', import.meta.url);
let dictionary = null;
let dictionaryInfo = 'Letterloom British English v1.21';
let game = restore() || createGame('solo', 'relaxed');
let selectedId = null;
let dragRack = null;
let dragBoard = null;
let ignoreBoardClickUntil = 0;
let ignoreRackClickUntil = 0;
let computerHighlight = 'none'; // none, flash (brief automatic), replay (until dismissed)
let computerHighlightTimer = null;

function clearRackDrag(){
  if(!dragRack)return;
  dragRack.ghost?.remove();
  const source=dragRack.source;
  if(source?.hasPointerCapture?.(dragRack.pointerId)){
    try{source.releasePointerCapture(dragRack.pointerId);}catch{}
  }
  const rack=$('rack');
  rack.classList.remove('rack-dragging');
  rack.querySelectorAll('.rack-tile').forEach(tile=>{
    tile.classList.remove('rack-drag-source','drop-target');
    tile.style.removeProperty('--rack-shift');
  });
  dragRack=null;
}

function rackDragSlotAt(pointX){
  // Use the unshifted slot centres recorded at pointerdown so the preview
  // never oscillates as neighbouring tiles slide out of the way.
  return nearestRackSlot(dragRack?.centres || [],pointX);
}

function showRackDragPreview(drag,slot){
  if(drag.preview===slot)return;
  drag.preview=slot;
  const tiles=Array.from($('rack').querySelectorAll('.rack-tile'));
  const centres=drag.centres;
  const offsets=rackShiftOffsets(centres,drag.from,slot);
  tiles.forEach((el,i)=>{
    el.style.setProperty('--rack-shift',`${offsets[i]}px`);
    el.classList.toggle('drop-target',slot>=0 && slot!==drag.from && i===slot);
  });
}

function updateRackDrag(event){
  const drag=dragRack;
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(!drag.moved){
    if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<9)return;
    drag.moved=true;
    drag.source.classList.add('rack-drag-source');
    $('rack').classList.add('rack-dragging');
    const ghost=document.createElement('div');
    ghost.className='rack-tile rack-drag-ghost';
    ghost.setAttribute('aria-hidden','true');
    ghost.innerHTML=drag.source.innerHTML;
    ghost.style.width=`${drag.width}px`;
    ghost.style.height=`${drag.height}px`;
    document.body.appendChild(ghost);
    drag.ghost=ghost;
  }
  if(event.cancelable)event.preventDefault();
  drag.ghost.style.left=`${event.clientX-drag.offsetX}px`;
  drag.ghost.style.top=`${event.clientY-drag.offsetY}px`;
  const rect=$('rack').getBoundingClientRect();
  const margin=Math.min(drag.height,65);
  const nearRack=event.clientY>=rect.top-margin && event.clientY<=rect.bottom+margin;
  showRackDragPreview(drag,nearRack?rackDragSlotAt(event.clientX):-1);
}

function finishRackDrag(event,cancel=false){
  const drag=dragRack;
  if(!drag||event.pointerId!==drag.pointerId)return;
  const moved=drag.moved;
  const boardIndex=!cancel?boardIndexAtPoint(event.clientX,event.clientY):-1;
  const rect=$('rack').getBoundingClientRect();
  const margin=Math.min(drag.height,65);
  const nearRack=!cancel&&event.clientY>=rect.top-margin&&event.clientY<=rect.bottom+margin;
  const slot=nearRack?rackDragSlotAt(event.clientX):-1;
  clearRackDrag();
  if(!moved)return; // Short taps still select letters normally.
  ignoreRackClickUntil=Date.now()+350;
  if(cancel){renderRack();return;}
  if(boardIndex>=0){
    const index=boardIndex;
    if(game.pending.some(p=>p.index===index)){notify('Move that placed tile first, or choose an empty square.');renderRack();return;}
    placeTile(index,drag.id);
    return;
  }
  if(slot>=0 && moveVisibleRackTile(game.players[game.current].rack,game.pending.map(p=>p.tile.id),drag.id,slot)){
    selectedId=null;persist();
  }
  renderRack();
}


// The board is a grid; use the actual centres so dropping in a narrow gap
// between squares lands on the nearest cell rather than failing at random.
function boardIndexAtPoint(x,y){
  const board=$('board'),rect=board.getBoundingClientRect();
  if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return -1;
  const first=board.querySelector('[data-index="0"]');
  const second=board.querySelector('[data-index="1"]');
  const below=board.querySelector('[data-index="15"]');
  if(!first||!second||!below)return -1;
  const a=first.getBoundingClientRect(),b=second.getBoundingClientRect(),c=below.getBoundingClientRect();
  const stepX=b.left-a.left,stepY=c.top-a.top;
  if(stepX<=0||stepY<=0)return -1;
  const col=Math.max(0,Math.min(14,Math.round((x-(a.left+a.width/2))/stepX)));
  const row=Math.max(0,Math.min(14,Math.round((y-(a.top+a.height/2))/stepY)));
  return row*15+col;
}

function clearBoardDrag(){
  if(!dragBoard)return;
  dragBoard.ghost?.remove();
  if(dragBoard.source?.hasPointerCapture?.(dragBoard.pointerId)){
    try{dragBoard.source.releasePointerCapture(dragBoard.pointerId);}catch{}
  }
  dragBoard.source?.classList.remove('board-drag-source');
  $('board').querySelectorAll('.board-drop-valid,.board-drop-invalid').forEach(el=>el.classList.remove('board-drop-valid','board-drop-invalid'));
  dragBoard=null;
}

function updateBoardDrag(event){
  const drag=dragBoard;
  if(!drag||event.pointerId!==drag.pointerId)return;
  if(!drag.moved){
    if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<9)return;
    drag.moved=true;
    drag.source.classList.add('board-drag-source');
    const ghost=document.createElement('div');
    ghost.className='board-drag-ghost';
    ghost.setAttribute('aria-hidden','true');
    ghost.innerHTML=drag.source.querySelector('.letter-tile')?.outerHTML||'';
    ghost.style.width=`${drag.width}px`;
    ghost.style.height=`${drag.height}px`;
    document.body.appendChild(ghost);
    drag.ghost=ghost;
  }
  if(event.cancelable)event.preventDefault();
  drag.ghost.style.left=`${event.clientX-drag.offsetX}px`;
  drag.ghost.style.top=`${event.clientY-drag.offsetY}px`;
  const index=boardIndexAtPoint(event.clientX,event.clientY);
  if(drag.preview!==index){
    $('board').querySelectorAll('.board-drop-valid,.board-drop-invalid').forEach(el=>el.classList.remove('board-drop-valid','board-drop-invalid'));
    drag.preview=index;
    if(index>=0&&index!==drag.index){
      const cell=$('board').querySelector(`[data-index="${index}"]`);
      cell?.classList.add(game.board[index]?'board-drop-invalid':'board-drop-valid');
    }
  }
}

function finishBoardDrag(event,cancel=false){
  const drag=dragBoard;
  if(!drag||event.pointerId!==drag.pointerId)return;
  const moved=drag.moved;
  const target=cancel?-1:boardIndexAtPoint(event.clientX,event.clientY);
  const rackRect=$('rack').getBoundingClientRect();
  const toRack=!cancel&&event.clientX>=rackRect.left-12&&event.clientX<=rackRect.right+12&&event.clientY>=rackRect.top-30&&event.clientY<=rackRect.bottom+30;
  clearBoardDrag();
  if(!moved)return; // Ordinary tap: existing tap-to-return behaviour remains.
  ignoreBoardClickUntil=Date.now()+350;
  if(cancel)return;
  if(toRack){
    if(returnPendingTile(game.pending,drag.index)){
      selectedId=null;clearHint();persist();render();notify('Letter returned to your rack.');
    }
    return;
  }
  if(target===drag.index)return;
  if(target>=0&&movePendingTile(game.pending,game.board,drag.index,target)){
    selectedId=null;clearHint();persist();render();
  }else if(target>=0&&game.board[target]){
    notify('That square is already occupied. Your letter has stayed in place.');
  }
}

let swapIds = new Set();
let modalType = null;
let pendingBlankPosition = null;
let newMode = game.mode;
let newStyle = 'relaxed';
let newShortWords = true;
let hintWorking = false;
let hintMessage = '';
let hintIndices = [];
let hintWorker = null;
let privacy = game.mode === 'local' && !!localStorage.getItem(STORAGE_KEY) && game.status === 'playing';
let thinking = false;
let botTimeout = null;
let classicBotWords = null;
let relaxedBotWords = null;
let toastTimer = null;
let installPrompt = null;
const lookUpDefinition=createDefinitionLookup();
let definitionWords=[];
let activeDefinitionWord='';
let currentDefinitionMeaning=null;
let definitionRequestId=0;

function restore(){
  try{
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!data || data.version!==1 || !['local','solo'].includes(data.mode) || data.board?.length!==225 || data.players?.length!==2 || !Array.isArray(data.bag) || !Array.isArray(data.pending))return null;
    if(!data.playStyle){data.playStyle='classic';data.balancedRack=true;} // Continue older matches without changing their racks.
    // Older saved games keep their original word rules.
    if(typeof data.everydayShortWords!=='boolean')data.everydayShortWords=false;
    data.freeSwapUsed ??= [false,false];
    return data;
  }catch{return null;}
}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(game));}catch{notify('Unable to save this game on this device.');}}
function escapeText(value){return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function rackAvailable(){
  const placed = new Set(game.pending.map(p=>p.tile.id));
  return game.players[game.current].rack.filter(t=>!placed.has(t.id));
}
function humanTurn(){return game.status==='playing' && !thinking && !privacy && !(game.mode==='solo' && game.current===1);}
function announce(text){$('feedback-text').textContent=text;}
function notify(text){
  const toast=$('toast');toast.textContent=text;toast.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2800);
}
function renderComputerMoveButton(){
  const button=$('show-last-move');
  const move=getLastComputerMove(game);
  button.hidden=!move;
  if(!move)return;
  const active=computerHighlight==='replay';
  button.textContent=active?'✓ Hide last move':'◉ Show last move';
  button.setAttribute('aria-pressed',String(active));
  button.setAttribute('aria-label',`${active?'Hide':'Show'} the computer’s last move: ${move.words.join(' and ') || 'played tiles'}, ${move.score} points`);
}
function refreshComputerMoveHighlight(){
  const move=computerHighlight==='none'?null:getLastComputerMove(game);
  const indices=new Set(move?.indices || []);
  $('board').querySelectorAll('.square[data-index]').forEach(cell=>{
    cell.classList.toggle('is-computer-highlight',indices.has(Number(cell.dataset.index)));
  });
  renderComputerMoveButton();
}
function stopComputerHighlight(){
  clearTimeout(computerHighlightTimer);
  computerHighlightTimer=null;
  computerHighlight='none';
  refreshComputerMoveHighlight();
}
function showAutomaticComputerMove(){
  clearTimeout(computerHighlightTimer);
  if(!getLastComputerMove(game))return;
  computerHighlight='flash';
  // A calm, static highlight; no blinking or motion. Refresh classes only so
  // an active touch/drag never loses pointer capture because of a re-render.
  refreshComputerMoveHighlight();
  computerHighlightTimer=setTimeout(()=>{
    if(computerHighlight==='flash')stopComputerHighlight();
  },3500);
}
function toggleLastComputerMove(){
  if(!getLastComputerMove(game))return;
  if(computerHighlight==='replay'){
    stopComputerHighlight();
  }else{
    clearTimeout(computerHighlightTimer);
    computerHighlightTimer=null;
    computerHighlight='replay';
    refreshComputerMoveHighlight();
  }
}
function tileHTML(tile){
  const letter=escapeText(tile.letter);
  return `<span class="letter-tile"><span>${letter}</span><span class="value">${tile.points || ''}</span></span>`;
}
function renderBoard(){
  const pending = new Map(game.pending.map(p=>[p.index,p.tile]));
  const highlighted=new Set(computerHighlight==='none'?[]:(getLastComputerMove(game)?.indices || []));
  const label={TW:'Triple word',DW:'Double word',TL:'Triple letter',DL:'Double letter'};
  let html='';
  for(let i=0;i<225;i++){
    const fixed=game.board[i], fresh=pending.get(i), tile=fresh || fixed;
    const premium=PREMIUM[i], isCenter=i===CENTER;
    const row=Math.floor(i/SIZE)+1,col=i%SIZE+1;
    const cls=['square',premium.toLowerCase(),isCenter?'center':'',tile?'has-tile':'',fixed?'is-definition-tile':'',fresh?'is-pending':'',highlighted.has(i)?'is-computer-highlight':'',hintIndices.includes(i)&&!tile?'is-hint':''].filter(Boolean).join(' ');
    const description=tile?`${tile.letter}, ${tile.points} points${fresh?', not yet played: drag to move or tap to return to rack':', tap to see word meaning'}`:hintIndices.includes(i)?'hint: place a letter here':label[premium]||'empty';
    html+=`<button type="button" class="${cls}" data-index="${i}" role="gridcell" aria-label="Row ${row}, column ${col}: ${description}" title="${description}">${tile?tileHTML(tile):`<span class="bonus-label">${premium || ''}</span>`}</button>`;
  }
  $('board').innerHTML=html;
}
function renderRack(){
  if(dragRack)clearRackDrag();
  const rack=$('rack');
  if(privacy){rack.innerHTML='<div class="rack-hidden" style="grid-column:1/-1">Letters hidden until the next player is ready.</div>';return;}
  if(thinking || game.status==='finished'){
    rack.innerHTML=`<div class="rack-hidden" style="grid-column:1/-1">${thinking?'The computer is thinking…':'Match complete'}</div>`;return;
  }
  const available=rackAvailable();
  rack.innerHTML=Array.from({length:7},(_,i)=>{
    const t=available[i];
    if(!t)return '<span class="rack-empty" aria-hidden="true"></span>';
    const active=selectedId===t.id?'selected':'';
    return `<button type="button" class="rack-tile ${active}" data-tile="${escapeText(t.id)}" draggable="false" aria-label="${t.blank?'Blank tile':t.letter+', '+t.points+' points'}" aria-pressed="${active?'true':'false'}"><span>${t.letter}</span><span class="value">${t.points||''}</span></button>`;
  }).join('');
}
function renderScores(){
  $('scoreboard').innerHTML=game.players.map((p,i)=>`<div class="player-card ${game.current===i&&game.status==='playing'?'active':''}"><div class="player-avatar avatar-${i}">${i===0?'A':'B'}</div><div class="player-meta"><strong>${escapeText(p.name)}</strong><span>${game.current===i&&game.status==='playing'?'● Playing now':i===0?'First player':'Second player'}</span></div><span class="player-points">${p.score}</span></div>`).join('');
  $('mobile-scores').innerHTML=game.players.map((p,i)=>`<div class="mobile-score ${game.current===i&&game.status==='playing'?'active':''}"><span>${game.current===i&&game.status==='playing'?'● ':''}${escapeText(p.name)}</span><strong>${p.score}</strong></div>`).join('');
  $('turn-label').textContent=game.status==='finished'?'GAME OVER':`TURN ${String(game.turn).padStart(2,'0')}`;
  $('style-indicator').textContent=game.playStyle==='relaxed'?(game.everydayShortWords?'Relaxed · Everyday words':'Relaxed play'):'Classic play';
  document.body.classList.toggle('relaxed-layout',game.playStyle==='relaxed');
  const turnText=currentTurnText(game);
  if($('current-player-label').textContent!==turnText)$('current-player-label').textContent=turnText;
  document.querySelector('.turn-indicator').classList.toggle('is-waiting',!humanTurn());
  $('tile-count').textContent=`${game.bag.length} tiles left`;
  $('dictionary-count').textContent=dictionary?`${dictionary.size.toLocaleString('en-GB')} UK words`:'UK English';
  const latest=game.history[0];
  $('last-move-note').textContent=latest?.type==='play'?`${game.players[latest.player].name} played ${latest.words.map(w=>w.word).join(' + ')} · ${latest.score} points`:latest?`${game.players[latest.player].name} ${latest.type==='swap'?'swapped letters':'passed'}`:'';
  renderComputerMoveButton();
}
function renderHistory(){
  const list=game.history.slice(0,5);
  $('history').innerHTML=list.length?list.map(h=>`<div class="history-item"><div class="history-identity"><span class="history-dot"></span><div><div class="history-word">${h.type==='play'?escapeText(h.words.map(w=>w.word).join(' + ')):h.type==='swap'?'Swapped tiles':'Passed turn'}</div><div class="history-by">${escapeText(game.players[h.player].name)}</div></div></div><div class="history-points">${h.score?`+${h.score}`:'—'}</div></div>`).join(''):'<p class="empty-history">The board is fresh. Your first word starts the story.</p>';
}
function renderPreview(){
  const analysis=dictionary?evaluateMove(game,game.pending,dictionary):null;
  const preview=$('word-preview'),potential=$('potential-score'),play=$('play-button');
  if(game.status==='finished'){
    potential.innerHTML='✳<small>DONE</small>';
    preview.textContent=game.finalReason;
    announce(`${game.winner===-1?'It’s a draw!':game.players[game.winner].name+' wins!'} Start another match to play again.`);
  }else if(thinking){potential.innerHTML='…<small>WAIT</small>';preview.textContent='Thinking of a clever word…';announce('Computer is finding a move.');}
  else if(!dictionary){potential.innerHTML='—<small>POINTS</small>';preview.textContent='Loading the offline dictionary…';announce('Preparing your dictionary…');}
  else if(!game.pending.length){
    potential.innerHTML='—<small>POINTS</small>';preview.textContent='Your words and points will appear here.';
    announce(privacy?'Pass the device to the next player.':hintMessage||'Choose a letter to begin your word.');
  }else if(analysis.valid){
    potential.innerHTML=`${analysis.score}<small>POINTS</small>`;
    preview.innerHTML=analysis.words.map(w=>`<div class="preview-chip"><span>${escapeText(w.word)}</span><b>+${w.score}</b></div>`).join('')+(analysis.bingo?`<div class="preview-chip"><span>All-seven bonus</span><b>+${analysis.bingo}</b></div>`:'');
    announce(`Nice play! ${analysis.words.map(w=>w.word).join(' + ')} for ${analysis.score} points.`);
  }else{
    potential.innerHTML='—<small>POINTS</small>';preview.textContent=analysis.reason;
    announce(analysis.reason);
  }
  $('move-feedback').classList.toggle('invalid',!!(analysis&&!analysis.valid&&game.pending.length));
  play.disabled=!humanTurn()||!analysis?.valid;
  $('play-score').textContent=analysis?.valid?`+${analysis.score}`:'';
  ['swap-button','pass-button','shuffle-button','undo-button'].forEach(id=>$(id).disabled=!humanTurn());
  $('hint-button').hidden=game.playStyle!=='relaxed';
  $('hint-button').disabled=!humanTurn()||!dictionary||!!game.pending.length||hintWorking;
  $('hint-button').textContent=hintWorking?'Looking…':'✦ Hint';
  $('swap-button').disabled=!humanTurn()||game.bag.length<7;
  $('undo-button').disabled=!humanTurn()||!game.pending.length;
}
function render(){
  if(selectedId&&!rackAvailable().some(t=>t.id===selectedId))selectedId=null;
  if(dragBoard)clearBoardDrag();
  renderBoard();renderRack();renderScores();renderHistory();renderPreview();
}
function clearHint(){hintIndices=[];hintMessage='';}
function selectTile(id){
  if(!humanTurn())return;
  const tile=rackAvailable().find(t=>t.id===id);
  if(!tile)return;
  selectedId=selectedId===id?null:id;
  renderRack();
  if(selectedId)notify(tile.blank?'Blank tile selected. Choose a square, then a letter.':`${tile.letter} selected — tap a square.`);
}
function placeTile(index,id=selectedId){
  if(!humanTurn())return;
  const existingIndex=game.pending.findIndex(p=>p.index===index);
  if(existingIndex>=0){
    const [removed]=game.pending.splice(existingIndex,1);
    selectedId=removed.tile.id;persist();render();return;
  }
  if(game.board[index]){notify('That square is already occupied.');return;}
  const tile=rackAvailable().find(t=>t.id===id);
  if(!tile){notify('Select a letter from your rack first.');return;}
  if(tile.blank){pendingBlankPosition={index,id};openModal('blank');return;}
  clearHint();game.pending.push({index,tile:{...tile}});selectedId=null;
  persist();render();
}
function afterTurn(){
  hintWorker?.terminate();hintWorker=null;hintWorking=false;clearHint();selectedId=null;persist();render();
  if(game.status==='finished'){openModal('finished');return;}
  if(game.mode==='local'){
    privacy=true;render();openModal('handoff');
  }else if(game.current===1){runBot();}
}
function playMove(){
  if(!humanTurn()||!dictionary)return;
  const result=commitMove(game,dictionary);
  if(!result.valid){notify(result.reason);return;}
  notify(`${result.words.map(w=>w.word).join(' + ')}! +${result.score} points`);
  afterTurn();
}
function undo(){if(!humanTurn()||!game.pending.length)return;selectedId=game.pending.pop().tile.id;persist();render();}
function playComputerTiles(placements){
  if(!placements?.length)return false;
  game.pending=placements;
  const result=commitMove(game,dictionary);
  if(!result.valid){game.pending=[];return false;}
  notify(`Computer played ${result.words.map(w=>w.word).join(' + ')} for ${result.score} points.`);
  showAutomaticComputerMove();
  return true;
}
function computerNeedsRetry(message='The computer could not finish finding a word.'){
  clearTimeout(botTimeout);botTimeout=null;
  thinking=false;game.pending=[];
  persist();render();
  openModal('bot-retry');
  notify(`${message} No turn was lost.`);
}
// Both players are validated against the same relaxed rules. The computer
// searches a smaller, familiar-word set loaded alongside the dictionary so
// it doesn't choose obscure words while people can still play TUG or HOAX.
async function getComputerWords(){
  if(game.playStyle==='relaxed') {
    if(!relaxedBotWords)throw Error('Friendly word list unavailable.');
    return computerCandidateWords(relaxedBotWords,dictionary,true);
  }
  if(classicBotWords) return computerCandidateWords(classicBotWords,dictionary);
  const response=await fetch(new URL('./bot-words.txt?v=1.9.0',GAME_URL));
  if(!response.ok)throw Error('Computer word list unavailable.');
  classicBotWords=(await response.text()).trim().split(/\s+/);
  return computerCandidateWords(classicBotWords,dictionary);
}
function runBot(){
  if(game.mode!=='solo'||game.current!==1||game.status!=='playing'||thinking||!dictionary)return;
  thinking=true;render();
  const expectedGame=game, expectedTurn=game.turn;
  clearTimeout(botTimeout);
  botTimeout=setTimeout(async()=>{
    botTimeout=null;
    try{
      const words=await getComputerWords();
      if(game!==expectedGame||game.turn!==expectedTurn||!thinking)return;
      // Try a quick, fully validated extension first, then the full move
      // finder. Re-check the result against this very same dictionary before
      // committing. No worker messages or timing races are involved.
      const preferFamiliar=game.playStyle==='relaxed';
      const familiarWords=preferFamiliar?new Set(words):null;
      const choices={gentle:preferFamiliar,preferFamiliar,familiarWords};
      const backup=findQuickBotMove(game,dictionary,choices);
      const full=findBotMove(game,words,dictionary,preferFamiliar?2500:1800,choices);
      if(game!==expectedGame||game.turn!==expectedTurn||!thinking)return;
      thinking=false;
      if(playComputerTiles(full) || playComputerTiles(backup)){
        afterTurn();return;
      }
      // Before deciding there is no move, perform a second deterministic
      // search. The relaxed player is never silently given a 'pass' because
      // one search phase returned no candidate.
      const verified=findBotMove(game,words,dictionary,1600,{gentle:false});
      if(playComputerTiles(verified)){
        afterTurn();return;
      }
      // When no word can be found, exchange letters instead of repeatedly
      // passing with the same rack. Relaxed mode's first swap is still free.
      if(game.bag.length>=7 && game.players[1].rack.length){
        const swapped=takePass(game,'swap',game.players[1].rack.map(t=>t.id));
        if(!swapped)throw Error('Computer could not exchange its letters.');
        notify('Computer swapped its letters to try something new.');
        afterTurn();return;
      }
      takePass(game,'pass');
      notify('Computer had no playable word and no tiles left to swap.');
      afterTurn();
    }catch(error){
      if(game===expectedGame&&game.turn===expectedTurn){
        computerNeedsRetry(error.message);
      }
    }
  },80);
}

function requestHint(){
  if(!humanTurn()||!dictionary||game.pending.length||hintWorking)return;
  hintWorking=true;hintMessage='Looking for a helpful word…';hintIndices=[];render();
  const turn=game.turn, player=game.current;
  try{
    hintWorker?.terminate();
    hintWorker=new Worker(new URL('./bot.worker.js?v=1.19.0',import.meta.url),{type:'module'});
    const worker=hintWorker;
    const finish=message=>{
      if(hintWorker===worker){hintWorker.terminate();hintWorker=null;}
      if(game.turn!==turn||game.current!==player||game.pending.length)return;
      hintWorking=false;hintMessage=message;render();
    };
    worker.onmessage=({data})=>{
      if(data.turn!==turn)return;
      if(data.type!=='hint'||!data.move?.length){finish('No hint found just now. Try swapping a letter.');return;}
      const result=evaluateMove(game,data.move,dictionary);
      if(!result.valid){finish('No hint found just now.');return;}
      hintIndices=data.move.map(p=>p.index);
      finish(`Try ${result.words[0].word}. The suggested spaces are highlighted on the board.`);
    };
    worker.onerror=()=>finish('Hints are not available right now.');
    worker.postMessage({type:'hint',game});
  }catch{hintWorking=false;hintMessage='Hints are not available right now.';render();}
}
function dialogShell(eyebrow,title,body,actions='',dismiss=true){
  $('modal').innerHTML=`${dismiss?'<button type="button" class="modal-close" data-action="close" aria-label="Close dialog">×</button>':''}<div class="eyebrow">${eyebrow}</div><h2 id="modal-title">${title}</h2>${body}${actions?`<div class="modal-actions">${actions}</div>`:''}`;
}
// Definitions are a learning aid, not the authority for valid word moves.
// A tap never places or removes a committed tile, even if a rack tile is selected.
function showWordMeaningAt(index){
  if(!game.board[index])return;
  const choices=wordsAtCell(game.board,index,SIZE);
  if(!choices.length){notify('This letter is not part of a completed word yet.');return;}
  definitionWords=choices;
  activeDefinitionWord=choices[0].word;
  openModal('definition');
}
async function showSelectedMeaning(word){
  if(modalType!=='definition'||!definitionWords.some(w=>w.word===word))return;
  activeDefinitionWord=word;
  const request=++definitionRequestId;
  const buttons=$('modal').querySelectorAll('[data-action="define-word"]');
  buttons.forEach(button=>{
    const selected=button.dataset.word===word;
    button.classList.toggle('chosen',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  const result=$('definition-result');
  currentDefinitionMeaning=null;
  // Historical moves stay on saved boards, even if their words are no longer
  // accepted. Explain their Roman-numeral meaning instead of saying playable.
  const numeralValue=excludedRomanNumeralValue(word);
  if(numeralValue!==null){
    result.innerHTML=`<h3 class="defined-word">${escapeText(word)}</h3><div class="meaning-item"><div class="meaning-type">Roman numeral · historical move</div><p>${escapeText(word)} represents the number ${numeralValue}. Roman numerals are no longer allowed in new Letterloom moves. Previous plays and their scores are preserved.</p></div>`;
    return;
  }
  result.innerHTML='<p class="definition-loading">Finding the meaning…</p>';
  const meaning=await lookUpDefinition(word);
  if(modalType!=='definition'||activeDefinitionWord!==word||request!==definitionRequestId)return;
  currentDefinitionMeaning=meaning;
  if(meaning.status==='found'){
    const main=meaning.entries[0];
    const canExpand=meaning.entries.length>1||meaning.canLookUpMore;
    result.innerHTML=`<h3 class="defined-word">${escapeText(word)}</h3><div class="meaning-item"><div class="meaning-type">${escapeText(main.partOfSpeech)}</div><p>${escapeText(main.definition)}</p></div>${canExpand?'<button type="button" class="other-meanings-button" data-action="other-meanings" aria-expanded="false" aria-controls="other-meanings-panel">Other meanings ▾</button><div id="other-meanings-panel" class="other-meanings-panel" hidden></div>':''}<p class="meaning-source">${escapeText(meaning.source)}${meaning.provider==='wiktionary'?` · <a href="https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}" target="_blank" rel="noopener noreferrer">View source ↗</a>`:''}</p>`;
  }else{
    const text=meaning.status==='offline'?'No saved definition for this word yet. Connect to the internet to look it up.':meaning.status==='not-found'?'This word is playable, but neither dictionary supplied a clear, useful explanation. Try the Collins link below.':'The definition service is unavailable just now. Please try again when you’re online.';
    result.innerHTML=`<h3 class="defined-word">${escapeText(word)}</h3><p class="meaning-unavailable">${escapeText(text)}</p><p class="meaning-help"><a class="definition-external" href="https://www.collinsdictionary.com/dictionary/english/${encodeURIComponent(word.toLowerCase())}" target="_blank" rel="noopener noreferrer">Look up ${escapeText(word)} in Collins ↗</a></p>`;
  }
}
async function toggleOtherMeanings(button){
  if(modalType!=='definition'||!currentDefinitionMeaning||currentDefinitionMeaning.status!=='found')return;
  const panel=$('other-meanings-panel');if(!panel)return;
  if(!panel.hidden){panel.hidden=true;button.setAttribute('aria-expanded','false');button.textContent='Other meanings ▾';return;}
  panel.hidden=false;button.setAttribute('aria-expanded','true');button.textContent='Hide other meanings ▴';
  const word=activeDefinitionWord, request=definitionRequestId;
  let meaning=currentDefinitionMeaning;
  if(meaning.canLookUpMore){
    panel.innerHTML='<p class="definition-loading">Looking for other meanings…</p>';
    meaning=await lookUpDefinition(word,{includeAlternatives:true});
    if(modalType!=='definition'||activeDefinitionWord!==word||request!==definitionRequestId)return;
    currentDefinitionMeaning=meaning;
  }
  const more=meaning.entries.slice(1);
  if(more.length){
    panel.innerHTML=`<h4>Other meanings</h4>${more.map(entry=>`<div class="meaning-item"><div class="meaning-type">${escapeText(entry.partOfSpeech)}</div><p>${escapeText(entry.definition)}</p></div>`).join('')}<p class="meaning-source">${escapeText(meaning.otherSource||meaning.source||'')}${(meaning.otherProvider||meaning.provider)==='wiktionary'?` · <a href="https://en.wiktionary.org/wiki/${encodeURIComponent(word.toLowerCase())}" target="_blank" rel="noopener noreferrer">View source ↗</a>`:''}</p>`;
  }else{
    panel.innerHTML=`<p class="meaning-unavailable">${meaning.moreStatus==='offline'?'No other meanings saved yet. Connect to the internet to check.':'No other suitable meanings were found.'}</p>`;
  }
}
const cancel='<button class="secondary-action" data-action="close">Cancel</button>';
function openModal(type){
  modalType=type;
  $('modal-backdrop').hidden=false;
  if(type==='new'){
    newMode=game.mode;newStyle=game.playStyle||'relaxed';newShortWords=newStyle==='relaxed';
    const body=`<p>Choose how you'd like to play. Starting a new match replaces your current game.</p><h3 class="choice-heading">Who is playing?</h3><div class="choice-grid"><button class="choice ${newMode==='solo'?'selected':''}" data-action="mode" data-mode="solo" aria-pressed="${newMode==='solo'}"><span class="choice-icon">✦</span><strong>Play computer</strong><span>A friendly offline opponent.</span></button><button class="choice ${newMode==='local'?'selected':''}" data-action="mode" data-mode="local" aria-pressed="${newMode==='local'}"><span class="choice-icon">♧</span><strong>Pass & play</strong><span>Two people on one device.</span></button></div><h3 class="choice-heading">Choose your play style</h3><div class="choice-grid"><button class="choice ${newStyle==='relaxed'?'selected':''}" data-action="style" data-style="relaxed" aria-pressed="${newStyle==='relaxed'}"><span class="choice-icon">☀</span><strong>Relaxed <small>Recommended</small></strong><span>Gentler computer, British English words, hints and one free swap each.</span></button><button class="choice ${newStyle==='classic'?'selected':''}" data-action="style" data-style="classic" aria-pressed="${newStyle==='classic'}"><span class="choice-icon">♜</span><strong>Classic</strong><span>The full British English word list, stronger computer and traditional swapping.</span></button></div><label id="short-words-option" class="short-words-option" ${newStyle==='classic'?'hidden':''}><input type="checkbox" id="short-words-checkbox" ${newShortWords?'checked':''}><span><strong>Everyday Short Words</strong><small>Recommended: common 2-letter words, only a few rare 3-letter forms excluded. Same rules for both players.</small></span></label>`;
    dialogShell('LET’S PLAY','A fresh set of letters.',body,`${cancel}<button class="primary-action" data-action="start">Start game →</button>`);
  }else if(type==='definition'){
    const choices=definitionWords.map(({word,direction})=>`<button type="button" class="definition-choice" data-action="define-word" data-word="${escapeText(word)}" aria-pressed="false"><span class="definition-choice-word">${escapeText(word)}</span> <small class="definition-choice-direction">· ${direction==='across'?'Across':'Down'}</small></button>`).join('');
    const body=`<p>Tap a word to read its main meaning. ${definitionWords.length>1?'This letter belongs to two words.':''}</p><div class="definition-choices" aria-label="Words on this square">${choices}</div><div id="definition-result" class="definition-result" aria-live="polite"></div><p class="meaning-explainer">Meanings favour clear, everyday explanations. Some unusual words may not have a suitable meaning available. Word meanings do not affect whether a move is allowed.</p>`;
    dialogShell('WORD DISCOVERY','What does it mean?',body,`<button class="primary-action" data-action="close">Back to game →</button>`);
    void showSelectedMeaning(activeDefinitionWord);
  }else if(type==='help'){
    const style=game.playStyle==='relaxed';
    const detail=style?`<li><strong>Relaxed Play:</strong> the computer prefers familiar British English, including any extra words made where tiles cross. It can still use less familiar words when necessary. Hints are available, and the first letter swap for each player is free. Incoming tiles aim for a balance of vowels when possible.</li>`:`<li><strong>Classic Play:</strong> a more competitive computer opponent, random draws and all swaps cost a turn.</li>`;
    const body=`<p>You're playing <strong>${style?'Relaxed':'Classic'}</strong> mode. Both players follow <strong>exactly the same word rules</strong>. ${style&&game.everydayShortWords?'Everyday Short Words is on: familiar two-letter words (including QI and OZ) and most three-letter words are allowed.':'The full British-English word-game list is used.'}</p><p>${dictionary?`<strong>${dictionary.size.toLocaleString('en-GB')} accepted words</strong> · ${escapeText(dictionaryInfo)}.`:'The offline British dictionary is loading.'}</p><ol class="rules"><li>Each player has <strong>7 letter tiles</strong>.</li><li>Tap a letter and then an empty square. You can <strong>drag letters along the rack</strong> to reorder them at any time. <strong>Before playing a word, drag a placed letter to another board square</strong> to correct its position, or drag it back to your rack. Arranging letters never costs a turn. Place your first word across the <strong>centre star</strong>.</li><li>Words after that must connect to the existing board. New tiles must form one row or column without gaps.</li><li><strong>Every word formed</strong> must be accepted, including small words crossing sideways.</li><li><strong>After the computer plays</strong>, its new tiles glow green briefly. Tap <strong>Show last move</strong> to see them again until you tap the board or hide the highlight.</li><li><strong>Tap any played letter</strong> to see the full word and its meaning. Where words cross, choose which to read. The main meaning appears first; tap <strong>Other meanings</strong> to explore less common uses. Some meanings require an internet connection on first lookup.</li><li>Bonus squares count only once. A blank tile can be any letter.</li>${detail}<li>The tile bag is finite. A match finishes when someone uses their last tile after the bag is empty, or after six consecutive scoreless turns. Remaining letter points are deducted at the end.</li></ol><div class="modal-highlight">No timer, no rush. Once loaded, the dictionary is saved for offline play.</div>`;
    dialogShell('THE RULES','The joy is in the words.',body,`<button class="primary-action" data-action="close">Got it →</button>`);
  }else if(type==='handoff'){
    dialogShell('NEXT UP',`Pass it to ${escapeText(game.players[game.current].name)}.`,`<p>It's their turn now. Their letters are hidden until they're ready to play.</p><div class="modal-highlight">✳ Hand over the device before revealing the rack.</div>`,`<button class="primary-action" data-action="ready">I’m ready →</button>`,false);
  }else if(type==='blank'){
    dialogShell('WILDCARD','Choose a letter.',`<p>Your blank tile can become any letter, worth 0 points.</p><div class="blank-grid">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c=>`<button data-action="choose-blank" data-letter="${c}">${c}</button>`).join('')}</div>`,cancel);
  }else if(type==='swap'){
    swapIds=new Set();
    dialogShell('FRESH LETTERS','Swap your tiles.',`<p>Tap the letters to exchange. ${game.playStyle==='relaxed' && !game.freeSwapUsed[game.current]?'<strong>Your first swap is free, so you keep your turn.</strong>':'Swapping uses your turn.'} ${game.playStyle==='relaxed'?'New letters aim for a balance of vowels and consonants when available.':'New letters are drawn randomly.'} There are ${game.bag.length} tiles in the bag.</p><div class="swap-tiles">${game.players[game.current].rack.map(t=>`<button class="swap-tile" data-action="toggle-swap" data-id="${t.id}">${t.letter}<small>${t.points||''}</small></button>`).join('')}</div>`,`${cancel}<button class="primary-action" id="confirm-swap" data-action="confirm-swap" disabled>Swap selected →</button>`);
  }else if(type==='bot-retry'){
    dialogShell('COMPUTER NEEDS A MOMENT','Let’s try that again.',`<p>The computer could not finish finding its word. <strong>No turn was lost</strong>, and your game is saved.</p><div class="modal-highlight">You can retry now. If it happens repeatedly, reopen the app while connected to the internet.</div>`,`<button class="secondary-action" data-action="restart-from-bot">New game</button><button class="primary-action" data-action="retry-bot">Try again →</button>`,false);
  }else if(type==='pass'){
    dialogShell('SKIP A TURN','Pass for now?',`<p>You won’t score this round. Any letters placed but not played will go back onto your rack.</p>`,`${cancel}<button class="primary-action" data-action="confirm-pass">Pass turn →</button>`);
  }else if(type==='finished'){
    const headline=game.winner===-1?'A lovely draw!':`${escapeText(game.players[game.winner].name)} wins!`;
    const adjustments=game.endAdjustments||[0,0];
    const scores=game.players.map((p,i)=>{
      const change=Number(adjustments[i])||0;
      const before=p.score-change;
      return `<div class="modal-scoreline"><span>${escapeText(p.name)}</span><strong>${p.score}</strong></div><p class="endgame-breakdown">${before} on the board ${change<0?'− '+Math.abs(change)+' unused-tile points':change>0?'+ '+change+' finishing bonus points':''}</p>`;
    }).join('');
    dialogShell('MATCH COMPLETE',headline,`<div class="winner-star">✳</div><p>${escapeText(game.finalReason)}</p>${scores}<div class="modal-highlight">Well played! Ready for another round?</div>`,`<button class="secondary-action" data-action="close">View board</button><button class="primary-action" data-action="new-from-end">Play again →</button>`);

  }
  $('modal').querySelector('button:not([disabled])')?.focus();
}
function closeModal(){if(modalType==='handoff'||modalType==='bot-retry')return;definitionRequestId++;currentDefinitionMeaning=null;modalType=null;$('modal-backdrop').hidden=true;}
$('modal').addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(action==='close'){closeModal();return;}
  if(action==='define-word'){void showSelectedMeaning(button.dataset.word);return;}
  if(action==='other-meanings'){void toggleOtherMeanings(button);return;}
  if(action==='mode'){
    newMode=button.dataset.mode;
    $('modal').querySelectorAll('[data-action="mode"]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===newMode);b.setAttribute('aria-pressed',String(b.dataset.mode===newMode));});
  }else if(action==='style'){
    newStyle=button.dataset.style;
    newShortWords=newStyle==='relaxed';
    const option=$('short-words-option');if(option)option.hidden=newStyle!=='relaxed';
    const checkbox=$('short-words-checkbox');if(checkbox)checkbox.checked=newShortWords;
    $('modal').querySelectorAll('[data-action="style"]').forEach(b=>{b.classList.toggle('selected',b.dataset.style===newStyle);b.setAttribute('aria-pressed',String(b.dataset.style===newStyle));});
  }else if(action==='start'){
    clearTimeout(botTimeout);botTimeout=null;
    hintWorker?.terminate();hintWorker=null;hintWorking=false;clearHint();
    stopComputerHighlight();
    game=createGame(newMode,newStyle,newShortWords);thinking=false;privacy=false;selectedId=null;dictionary=null;dictionaryInfo='Letterloom British English v1.21';closeModal();persist();render();notify('Fresh board, fresh possibilities!');loadDictionary();
  }else if(action==='new-from-end'){closeModal();openModal('new');}
  else if(action==='restart-from-bot'){modalType=null;$('modal-backdrop').hidden=true;openModal('new');}
  else if(action==='retry-bot'){modalType=null;$('modal-backdrop').hidden=true;runBot();}
  else if(action==='ready'){privacy=false;modalType=null;$('modal-backdrop').hidden=true;render();}
  else if(action==='choose-blank'){
    if(pendingBlankPosition){
      const {index,id}=pendingBlankPosition;
      const tile=rackAvailable().find(t=>t.id===id);
      if(tile && !game.board[index] && !game.pending.some(p=>p.index===index)){
        clearHint();game.pending.push({index,tile:{...tile,letter:button.dataset.letter,points:0}});
      }
    }
    pendingBlankPosition=null;selectedId=null;closeModal();persist();render();
  }else if(action==='toggle-swap'){
    const id=button.dataset.id;
    if(swapIds.has(id))swapIds.delete(id);else swapIds.add(id);
    button.classList.toggle('chosen',swapIds.has(id));
    $('confirm-swap').disabled=swapIds.size===0;
  }else if(action==='confirm-swap'){
    const previousTurn=game.turn;
    if(takePass(game,'swap',[...swapIds])){closeModal();clearHint();if(game.turn===previousTurn){persist();render();notify('Free swap used — you can still play this turn!');}else{notify('Fresh letters! Your turn is over.');afterTurn();}}
  }else if(action==='confirm-pass'){
    takePass(game,'pass');closeModal();notify('Turn passed.');afterTurn();
  }
});
$('modal').addEventListener('change',event=>{
  if(event.target.id==='short-words-checkbox')newShortWords=event.target.checked;
});
$('board').addEventListener('click',event=>{
  if(Date.now()<ignoreBoardClickUntil){event.preventDefault();return;}
  const cell=event.target.closest('[data-index]');if(!cell)return;
  const index=Number(cell.dataset.index);
  if(game.board[index]){showWordMeaningAt(index);return;}
  placeTile(index);
});
// Only tentative board letters can be moved. Permanent words are untouched.
$('board').addEventListener('pointerdown',event=>{
  if(computerHighlight==='replay')stopComputerHighlight();
  if(!humanTurn()||!event.isPrimary||event.button!==0||dragBoard||modalType)return;
  const cell=event.target.closest('.square.is-pending[data-index]');
  if(!cell)return;
  const index=Number(cell.dataset.index);
  if(!game.pending.some(p=>p.index===index))return;
  const rect=cell.getBoundingClientRect();
  dragBoard={index,pointerId:event.pointerId,source:cell,
    x:event.clientX,y:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,
    width:rect.width,height:rect.height,moved:false,preview:-2,ghost:null};
  try{cell.setPointerCapture(event.pointerId);}catch{}
});
window.addEventListener('pointermove',updateBoardDrag,{passive:false});
window.addEventListener('pointerup',event=>finishBoardDrag(event));
window.addEventListener('pointercancel',event=>finishBoardDrag(event,true));
window.addEventListener('blur',()=>{if(dragBoard)clearBoardDrag();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&dragBoard)clearBoardDrag();});
$('rack').addEventListener('click',event=>{
  if(Date.now()<ignoreRackClickUntil){event.preventDefault();return;}
  const tile=event.target.closest('[data-tile]');if(tile)selectTile(tile.dataset.tile);
});
// Use one Pointer Events path for touch, stylus and mouse. Capturing on the
// original TILE (not the rack) keeps regular taps working, even on Safari PWA.
$('rack').addEventListener('pointerdown',event=>{
  if(!humanTurn()||!event.isPrimary||event.button!==0)return;
  const tile=event.target.closest('.rack-tile[data-tile]');
  if(!tile || dragRack)return;
  const rect=tile.getBoundingClientRect();
  const tiles=Array.from($('rack').querySelectorAll('.rack-tile'));
  dragRack={
    id:tile.dataset.tile,pointerId:event.pointerId,source:tile,
    x:event.clientX,y:event.clientY,
    offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,
    width:rect.width,height:rect.height,
    from:tiles.indexOf(tile),
    centres:tiles.map(el=>{const r=el.getBoundingClientRect();return r.left+r.width/2;}),
    moved:false,preview:-2,ghost:null
  };
  // iOS may implicitly capture touches; explicit capture also protects mouse and pen.
  try{tile.setPointerCapture(event.pointerId);}catch{}
});
window.addEventListener('pointermove',updateRackDrag,{passive:false});
window.addEventListener('pointerup',event=>finishRackDrag(event));
window.addEventListener('pointercancel',event=>finishRackDrag(event,true));
window.addEventListener('blur',()=>{if(dragRack){clearRackDrag();renderRack();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden && dragRack){clearRackDrag();renderRack();}});

$('show-last-move').addEventListener('click',toggleLastComputerMove);
$('play-button').addEventListener('click',playMove);
$('undo-button').addEventListener('click',undo);
$('hint-button').addEventListener('click',requestHint);
$('shuffle-button').addEventListener('click',()=>{
  if(!humanTurn())return;
  shuffle(game.players[game.current].rack);selectedId=null;persist();renderRack();
});
$('pass-button').addEventListener('click',()=>{if(humanTurn())openModal('pass');});
$('swap-button').addEventListener('click',()=>{if(humanTurn()&&game.bag.length>=7)openModal('swap');});
$('new-button').addEventListener('click',()=>openModal('new'));
$('help-button').addEventListener('click',()=>openModal('help'));
$('rules-link').addEventListener('click',()=>openModal('help'));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&modalType!=='handoff'&&modalType!=='bot-retry')closeModal();
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!modalType){event.preventDefault();undo();}
});
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event;$('install-button').hidden=false;
});
$('install-button').addEventListener('click',async()=>{
  if(!installPrompt)return;
  const prompt=installPrompt;installPrompt=null;
  prompt.prompt();await prompt.userChoice;
  $('install-button').hidden=true;
});
window.addEventListener('appinstalled',()=>{$('install-button').hidden=true;notify('Letterloom is installed!');});
window.addEventListener('online',()=>{$('connection-status').textContent='Works offline';});
window.addEventListener('offline',()=>{$('connection-status').textContent='Offline mode';});

async function loadDictionary(){
  const expectedGame=game;
  try{
    const friendlyResponse=game.playStyle==='relaxed'
      ?await fetch(new URL('./everyday-words.txt?v=1.9.0',GAME_URL)):null;
    if(friendlyResponse&&!friendlyResponse.ok)throw Error('Computer vocabulary unavailable.');
    const {words,source}=await loadBritishWords();
    const friendly=friendlyResponse?(await friendlyResponse.text()).trim().split(/\s+/):null;
    if(game!==expectedGame)return;
    dictionary=createLegalDictionary(words,game.playStyle,game.everydayShortWords);
    dictionaryInfo=source;
    relaxedBotWords=friendly;
    render();
    if(privacy)openModal('handoff');
    else if(game.status==='finished')openModal('finished');
    else if(game.mode==='solo'&&game.current===1)runBot();
  }catch(error){
    if(game!==expectedGame)return;
    announce('The word list could not load. Reopen the app online to download it.');
    $('word-preview').textContent='Dictionary unavailable: '+error.message;
    notify('Word list unavailable. Check your connection on the first visit.');
  }
}

async function start(){
  render();
  loadDictionary();
  if('serviceWorker' in navigator && location.protocol!=='file:'){
    navigator.serviceWorker.register(new URL('./sw.js',GAME_URL)).catch(()=>{});
  }
  if(!localStorage.getItem(STORAGE_KEY))persist();
}
start();
