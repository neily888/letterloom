import {SIZE, CENTER, evaluateMove, isPlayableWord} from './engine.js?v=1.22.0';
import {assessMoveFamiliarity} from './bot-familiarity.js?v=1.19.0';

// The computer favours familiar vocabulary, but must still be able to play
// the same Relaxed-only short words as the human player.
export function computerCandidateWords(words,dictionary,relaxed=false){
  const candidates=relaxed?[...words,'QI','OZ']:words;
  return [...new Set(candidates)].filter(word=>isPlayableWord(word,dictionary));
}

const indexAt=(r,c)=>r*SIZE+c;
function makeTrie(words, dictionary){
  const root={next:new Map(),end:false};
  for(const word of words){
    if(word.length>11||word.length<2||!isPlayableWord(word,dictionary))continue;
    let node=root;
    for(const char of word){
      if(!node.next.has(char))node.next.set(char,{next:new Map(),end:false});
      node=node.next.get(char);
    }
    node.end=true;
  }
  return root;
}
// A tiny, dependable fallback for slow phones/tablets: try single-tile
// extensions beside letters already on the board. The full move validator
// still checks every main and perpendicular word, so nothing illegal slips in.
// This candidate can be sent to the app immediately while the deeper search runs.
export function findQuickBotMove(game, dictionary, options={}){
  const rack=game.players[game.current]?.rack || [];
  if(!rack.length || !game.board.some(Boolean))return null;
  const neighbors=new Set();
  for(let i=0;i<SIZE*SIZE;i++){
    if(!game.board[i])continue;
    const r=Math.floor(i/SIZE),c=i%SIZE;
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<SIZE&&nc>=0&&nc<SIZE){
        const at=indexAt(nr,nc);
        if(!game.board[at])neighbors.add(at);
      }
    }
  }
  let choice=null, score=-1, tier=-1;
  for(const index of neighbors){
    for(const tile of rack){
      const letters=tile.blank?'ABCDEFGHIJKLMNOPQRSTUVWXYZ':[tile.letter];
      for(const letter of letters){
        const move=[{index,tile:{...tile,letter}}];
        const evaluated=evaluateMove(game,move,dictionary);
        if(!evaluated.valid)continue;
        const friendliness=options.preferFamiliar?assessMoveFamiliarity(evaluated.words,options.familiarWords):0;
        if(friendliness>tier || (friendliness===tier && evaluated.score>score)){
          choice=move;score=evaluated.score;tier=friendliness;
        }
      }
    }
  }
  return choice;
}
export function findBotMove(game, words, dictionary, timeLimit=1200, options={}){
  const begin=Date.now(), rack=game.players[game.current].rack;
  if(!rack.length)return null;
  let best=null, bestScore=-1, bestTier=-1;
  const alternatives=[];
  const finish=()=>{
    if(!options.gentle || alternatives.length===0)return best;
    const sameTier=alternatives.filter(x=>x.tier===bestTier);
    const choices=sameTier.filter(x=>x.score>=bestScore*.57 && x.score<bestScore*.92);
    const pool=choices.length?choices:sameTier.filter(x=>x.score>=bestScore*.7);
    return pool.length?pool[Math.floor(Math.random()*pool.length)].move:best;
  };
  const within=()=>Date.now()-begin<timeLimit;
  function consider(pending){
    const scored=evaluateMove(game,pending,dictionary);
    if(!scored.valid)return;
    const score=scored.score;
    const tier=options.preferFamiliar?assessMoveFamiliarity(scored.words,options.familiarWords):0;
    if(tier>bestTier || (tier===bestTier && (score>bestScore || score===bestScore && Math.random()<0.15))){
      bestTier=tier;bestScore=score;best=pending.map(p=>({index:p.index,tile:{...p.tile}}));
    }
    if(options.gentle && tier===bestTier && score>=Math.max(2,bestScore*.5)){
      alternatives.push({tier,score,move:pending.map(p=>({index:p.index,tile:{...p.tile}}))});
      if(alternatives.length>75){alternatives.sort((a,b)=>b.tier-a.tier||b.score-a.score);alternatives.length=50;}
    }
  }
  const occupied=game.board.some(Boolean);
  if(!occupied){
    for(const word of words){
      if(!within())break;
      if(word.length>7||!isPlayableWord(word,dictionary))continue;
      const available=rack.slice(), placements=[];
      let possible=true;
      for(const char of word){
        let j=available.findIndex(t=>t.letter===char);
        if(j<0)j=available.findIndex(t=>t.blank);
        if(j<0){possible=false;break;}
        const [tile]=available.splice(j,1);
        placements.push({...tile,letter:char});
      }
      if(!possible)continue;
      for(let direction=0;direction<2;direction++){
        for(let k=0;k<word.length;k++){
          const r=7-(direction===1?k:0),c=7-(direction===0?k:0);
          const pending=placements.map((tile,j)=>({index:indexAt(r+(direction===1?j:0),c+(direction===0?j:0)),tile}));
          consider(pending);
        }
      }
    }
    return finish();
  }
  const root=makeTrie(words,dictionary);
  const crossAllowed=[Array(225).fill(null),Array(225).fill(null)];
  // A cross check tests each new letter against the perpendicular word already on the board.
  for(let axis=0;axis<2;axis++){
    const dr=axis===0?1:0,dc=axis===0?0:1;
    for(let i=0;i<225;i++){
      if(game.board[i])continue;
      const r0=Math.floor(i/15),c0=i%15;
      let before='',after='';
      for(let r=r0-dr,c=c0-dc;r>=0&&r<15&&c>=0&&c<15&&game.board[indexAt(r,c)];r-=dr,c-=dc)before=game.board[indexAt(r,c)].letter+before;
      for(let r=r0+dr,c=c0+dc;r>=0&&r<15&&c>=0&&c<15&&game.board[indexAt(r,c)];r+=dr,c+=dc)after+=game.board[indexAt(r,c)].letter;
      if(before||after){
        const allowed=new Set();
        for(let code=65;code<=90;code++){
          const letter=String.fromCharCode(code);
          if(isPlayableWord(before+letter+after,dictionary))allowed.add(letter);
        }
        crossAllowed[axis][i]=allowed;
      }
    }
  }
  let visited=0;
  for(let axis=0;axis<2;axis++){
    const dr=axis===0?0:1,dc=axis===0?1:0;
    for(let line=0;line<15;line++){
      for(let offset=0;offset<15;offset++){
        if(!within())return finish();
        const r=axis===0?line:offset,c=axis===0?offset:line;
        const prevR=r-dr,prevC=c-dc;
        if(prevR>=0&&prevC>=0&&game.board[indexAt(prevR,prevC)])continue;
        const available=rack.slice();
        const placement=[];
        function dfs(node, rr, cc, length, touched){
          if(++visited%256===0&&!within())return;
          if(length>=2 && node.end && placement.length && touched){
            if(rr>=15||cc>=15||!game.board[indexAt(rr,cc)])consider(placement);
          }
          if(rr>=15||cc>=15||length>=11||placement.length>=7 && !game.board[indexAt(rr,cc)])return;
          const i=indexAt(rr,cc), existing=game.board[i];
          if(existing){
            const next=node.next.get(existing.letter);
            if(next)dfs(next,rr+dr,cc+dc,length+1,true);
            return;
          }
          const allowed=crossAllowed[axis][i];
          if(allowed?.size===0)return;
          const usedLetters=new Set();
          for(let j=0;j<available.length;j++){
            const tile=available[j];
            if(!tile)continue;
            if(tile.blank){
              for(const [letter,next] of node.next){
                if(allowed&&!allowed.has(letter))continue;
                available[j]=null;
                placement.push({index:i,tile:{...tile,letter}});
                dfs(next,rr+dr,cc+dc,length+1,touched||!!allowed);
                placement.pop();available[j]=tile;
              }
            }else{
              if(usedLetters.has(tile.letter))continue;
              usedLetters.add(tile.letter);
              const next=node.next.get(tile.letter);
              if(!next||(allowed&&!allowed.has(tile.letter)))continue;
              available[j]=null;
              placement.push({index:i,tile});
              dfs(next,rr+dr,cc+dc,length+1,touched||!!allowed);
              placement.pop();available[j]=tile;
            }
          }
        }
        dfs(root,r,c,0,false);
      }
    }
  }
  return finish();
}
