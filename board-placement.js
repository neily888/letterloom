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
