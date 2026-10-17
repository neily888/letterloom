// Clear, grammatical turn labels for solo and pass-and-play matches.
export function currentTurnText(game){
  if(game.status==='finished')return 'Game finished';
  const name=game.players?.[game.current]?.name||'Player';
  return name==='You'?'Your turn':`${name}'s turn`;
}
