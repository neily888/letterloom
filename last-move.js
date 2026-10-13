// The same saved move history powers the recent-moves panel and the replay.
// Tiles have their original owner and turn stored when they are committed.
// Deriving positions from the board preserves compatibility with old saves.
export function getLastComputerMove(game) {
  if (!game || game.mode !== 'solo' || !Array.isArray(game.history) || !Array.isArray(game.board)) return null;
  const move = game.history.find(entry => entry?.type === 'play' && entry.player === 1 && Number.isInteger(entry.turn));
  if (!move) return null;
  const indices = [];
  game.board.forEach((tile, index) => {
    if (tile && tile.owner === 1 && tile.turn === move.turn) indices.push(index);
  });
  if (!indices.length) return null;
  return {
    turn: move.turn,
    indices,
    words: Array.isArray(move.words) ? move.words.map(entry => String(entry.word || '')).filter(Boolean) : [],
    score: Number(move.score) || 0
  };
}
