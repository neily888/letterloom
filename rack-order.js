// Reorder only the existing tile objects. Ids, bag contents, scores and turns never change.
export function swapRackTiles(rack,firstId,secondId){
  if(!Array.isArray(rack)||firstId===secondId)return false;
  const first=rack.findIndex(tile=>tile.id===firstId);
  const second=rack.findIndex(tile=>tile.id===secondId);
  if(first<0||second<0)return false;
  [rack[first],rack[second]]=[rack[second],rack[first]];
  return true;
}
// For dragging, insert the moved tile at the drop location, shifting intervening tiles.
export function moveRackTile(rack,fromId,toId){
  if(!Array.isArray(rack)||fromId===toId)return false;
  const from=rack.findIndex(tile=>tile.id===fromId);
  const to=rack.findIndex(tile=>tile.id===toId);
  if(from<0||to<0)return false;
  const [moved]=rack.splice(from,1);
  rack.splice(to,0,moved);
  return true;
}

// Find the nearest rack slot, including gaps between letters and the ends of the rack.
// Empty slots may be supplied by the UI; a drag never creates a new tile.
export function nearestRackSlot(slotCentres, x, availableCount=slotCentres.length){
  if(!Array.isArray(slotCentres)||!Number.isFinite(x)||!Number.isInteger(availableCount)||availableCount<1)return -1;
  const count=Math.min(slotCentres.length,availableCount);
  if(!count)return -1;
  let nearest=0, distance=Infinity;
  for(let i=0;i<count;i++){
    const candidate=Math.abs(x-slotCentres[i]);
    if(candidate<distance){distance=candidate;nearest=i;}
  }
  return nearest;
}

// Move one playable tile while leaving any tiles already placed on the board
// in their original rack slots. The physical tile IDs and total tile counts stay unchanged.
export function moveVisibleRackTile(rack,hiddenIds,fromId,toVisibleIndex){
  if(!Array.isArray(rack)||!Number.isInteger(toVisibleIndex))return false;
  const hidden=new Set(hiddenIds);
  const positions=rack.map((t,i)=>hidden.has(t.id)?-1:i).filter(i=>i>=0);
  const available=positions.map(i=>rack[i]);
  const from=available.findIndex(t=>t.id===fromId);
  if(from<0||toVisibleIndex<0||toVisibleIndex>=available.length||from===toVisibleIndex)return false;
  const [tile]=available.splice(from,1);
  available.splice(toVisibleIndex,0,tile);
  positions.forEach((position,i)=>{rack[position]=available[i];});
  return true;
}

// Visual offsets used while a tile is being dragged; neighbouring tiles slide
// out of its way before the player lets go.
export function rackShiftOffsets(slotCentres,from,to){
  const offsets=slotCentres.map(()=>0);
  if(from<0||to<0||from>=offsets.length||to>=offsets.length)return offsets;
  if(to>from)for(let i=from+1;i<=to;i++)offsets[i]=slotCentres[i-1]-slotCentres[i];
  if(to<from)for(let i=to;i<from;i++)offsets[i]=slotCentres[i+1]-slotCentres[i];
  return offsets;
}
