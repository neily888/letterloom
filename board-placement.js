// Moves only uncommitted tiles. Committed letters are never draggable.
// Pending entries retain their tile id (including a blank's chosen letter).
export function movePendingTile(pending,board,from,to){
  if(!Array.isArray(pending)||!Array.isArray(board))return false;
  if(!Number.isInteger(from)||!Number.isInteger(to)||from===to||from<0||to<0||from>=board.length||to>=board.length)return false;
  if(board[to])return false;
  const source=pending.find(p=>p.index===from);
  if(!source)return false;
  const other=pending.find(p=>p.index===to);
  source.index=to;
  if(other)other.index=from; // Swap two tentative tiles, never discard one.
  return true;
}

export function returnPendingTile(pending,index){
  if(!Array.isArray(pending))return null;
  const at=pending.findIndex(p=>p.index===index);
  if(at<0)return null;
  return pending.splice(at,1)[0];
}


/**
 * Identify likely out-of-line tentative tiles without changing the move.
 * A unique longest row/column (at least two placed tiles) is treated as the
 * intended word. If two directions tie, highlight all tentative tiles rather
 * than guessing which the player meant. Committed tiles are not passed here.
 */
export function misplacedPendingIndices(pending,size=15){
  if(!Array.isArray(pending)||pending.length<2)return [];
  const indices=pending.map(p=>p?.index);
  if(indices.some(i=>!Number.isInteger(i)||i<0||i>=size*size))return [];
  const rows=indices.map(i=>Math.floor(i/size));
  const cols=indices.map(i=>i%size);
  if(rows.every(r=>r===rows[0])||cols.every(c=>c===cols[0]))return [];
  const groups=[];
  for(const row of new Set(rows)){
    const members=indices.filter(i=>Math.floor(i/size)===row);
    if(members.length>=2)groups.push(members);
  }
  for(const col of new Set(cols)){
    const members=indices.filter(i=>i%size===col);
    if(members.length>=2)groups.push(members);
  }
  const maximum=Math.max(0,...groups.map(members=>members.length));
  const strongest=groups.filter(members=>members.length===maximum);
  if(maximum<2||strongest.length!==1)return indices; // An ambiguous layout: highlight all.
  const mainLine=new Set(strongest[0]);
  return indices.filter(i=>!mainLine.has(i));
}
