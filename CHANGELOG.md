# Letterloom changelog

## v1.22.6 — Prevent accidental pinch zoom on touch devices

- Keep the word-game view fitted to the screen when two fingers touch the page accidentally on iPhone or iPad.
- Preserve one-finger scrolling and the existing drag-to-arrange, drag-to-place and tap controls.
- Use touch-action panning with an iOS Safari gesture fallback without preventing normal touchmove events.
- Keep the 15 × 15 board, layout, colours, word rules, saved games and scores unchanged.
- Refresh the offline cache and add targeted interaction-regression tests.

## v1.22.5 — Dark Forest colour refresh (appearance only)

- Apply the approved warmer, dark forest-green palette to the app, board, bonuses, rack, buttons, labels and dialogs.
- Preserve the existing 15 × 15 board dimensions, responsive layout, rack controls, accessibility interactions, dictionary and gameplay exactly as implemented.
- Keep saved games and scores intact; update visual-theme PWA resources and cache only.
- Add a theme-isolation regression check and retain existing gameplay tests.

## v1.22.4 — Clearer unplayed tiles and gentle alignment guidance

- Make every unplayed tile on the board clearly identifiable with a thicker red outline.
- If tentative letters are out of line, softly pulse the misplaced tile(s) three times and explain how to move them or tap them back into the rack.
- When the intended line is ambiguous, highlight all tentative tiles instead of guessing. Respect the device's Reduce Motion preference.
- Keep the full-size board, tile values, gameplay rules, scores and saved-game format unchanged.

## v1.22.3 — Roman numerals are not playable words

- Reject canonical Roman numeral spellings (including VII, VIII, XII, XIII, XIV and XXXIX) for both people and the computer in Classic and Relaxed Play, with Everyday Short Words on or off.
- Preserve words with independent English meanings that share numeral spellings, including XI, MI, LI, MM, MIX and DIV. The original word list stays bundled and unchanged.
- The Word Discovery view explains Roman numerals in older saved games accurately instead of saying they are still playable.
- Existing saved boards, move histories, scores and all other gameplay features remain unchanged. The new rule only affects new moves.
- Add extensive numeral, computer-play and saved-game regression tests, and refresh the offline cache.

## v1.22.2 — Clear turn announcement and no Roman numeral III

- Make **Your turn** bold and prominent below the board with a high-contrast green badge; the human player no longer sees the ungrammatical “You's turn”.
- Show **Computer's turn**, **Player 1's turn**, or **Player 2's turn** appropriately, with an accessible live status for turn changes.
- Exclude Roman numeral **III** consistently in Classic and Relaxed (Everyday Short Words on or off), for people, computer moves, and crossing words. Preserve QI, Relaxed-only OZ, and all other existing word rules.
- Keep the board size, saved-game key and format, scores and offline dictionary source unchanged. Refresh versioned app, styles and offline cache.

## v1.22.1 — Full-size iPad board with larger text

- Keep the 15 × 15 board at its full available width on iPhones and portrait iPads rather than reducing it to make controls fit.
- Place turn information and the previous move on the same compact row on iPads, while preserving the Show last move action.
- Reduce redundant headings and instructional text without removing the Help or word-meaning features.
- Increase board letter weight and size, premium-square labels, score text and button lettering; preserve roomy rack and tap targets.
- Leave game state, saving and word rules untouched. Refresh the offline stylesheet cache.

## v1.22 — Compact play screen and shared Relaxed short words

- QI and OZ are available to both human and computer in Relaxed, even with Everyday Short Words enabled. OZ remains a Relaxed-only house rule.
- Removed Arrange and its tap-two-letters mode. Drag along the rack remains available at all times without taking a turn.
- A larger outlined Shuffle control and tighter spacing above and below the board.
- Prioritises full-width 15 × 15 board tiles on large portrait iPhones, a height-aware large board on portrait 10-inch iPads and a compact laptop/Chromebook layout.
- Maintains saved games, scores, dictionary, gameplay mechanics, and offline support; refreshed the PWA cache and added regression tests.

# Letterloom release notes

## v1.21 — One consistent offline British dictionary
- Bundled 158,873 distinct playable words; merged expanded LibreOffice en_GB and previous Letterloom fallback.
- Removed runtime network download and alternate cache-dependent dictionary choices.
- Word selection remains identical for both players; Everyday Short Words stays optional in Relaxed.
- Existing match storage and rules preserved; service-worker offline cache version updated.


## v1.20 — Everyday Short Words
- Optional shared short-word rules, on by default for new Relaxed matches.
- Classic retains the comprehensive dictionary.
- Existing saved games preserve their earlier rules.
- UI and PWA caching versioned to v1.20.


## v1.19 — More natural British English in Relaxed Play

- The Relaxed computer now considers **all** new words formed in a turn, including cross-words, when choosing among legal moves. A high score from strange short words such as ZA or PO is no longer automatically preferred over a familiar alternative.
- Uncommon regional slang and specialist vocabulary is **discouraged for the computer only**, never banned from the player's accepted word list. A fallback still allows unusual legitimate words if nothing better can be found; Classic play remains score-focused.
- Word Discovery labels **ZA** explicitly as American slang for pizza and **PO** as an old-fashioned British word for a chamber pot; both explanations work offline.
- The existing saved-match format, tile values, word validation, board and user-interface controls are unchanged. Versioned app resources and a new service-worker cache ensure the update reaches installed iPhones and iPads.

## v1.18 — Familiar meanings first

- Displays only the top relevant sense initially, with an accessible **Other meanings** button to reveal the less familiar senses on demand.
- AB is now explained as an informal short form of abdominal muscle (commonly used as **abs**) rather than opening with obscure drug slang. Simplified UT as an old name for musical DO.
- Existing curated explanations appear instantly offline. Alternative meanings for those words are queried only if the player asks; successful queries are cached for later offline use.
- Raises the ranking of everyday definitions above ones marked slang, obsolete or technical, while still allowing legitimate alternative senses on request.
- Keeps saved matches and playable-word rules unchanged. Updated word-definition cache, versioned app files and service worker.

## v1.17 — Show last computer move

- Computer's newly placed tiles are outlined in soft green for 3.5 seconds after each scoring turn.
- A **Show last move** button keeps those exact tiles highlighted until toggled off or the board is tapped.
- Move positions are reconstructed from the saved board and turn history: existing shared letters are not highlighted, and replay works after reopening a match.
- The existing word-and-points summary is preserved; the new control is hidden in pass-and-play games or before the computer has played.
- The match storage key and game rules are unchanged. Updated version label and offline service-worker cache.
- **Word Discovery's larger hybrid dictionary is not part of this release.**

## v1.16 — Move tentative letters on the board

- Drag any newly placed (unplayed) tile directly to another empty board square without returning it to the rack first.
- Drop it onto another pending tile to swap their positions without losing either tile.
- Drag it back onto the rack to take it off the board. Tapping still returns it as before.
- Committed letters are not movable; occupied committed squares cannot be overwritten.
- Updated styling, help text and versioned offline resources; existing matches are preserved.

## v1.15 — Reliable letter dragging

- Rebuilt rack drag handling around pointer capture for iPhone, iPad, and desktop.
- Releasing in gaps or just beyond the ends of letters now chooses the nearest available slot.
- The dragged tile follows your finger, while adjacent tiles visibly slide aside.
- Dragging and tapping are separate gestures; tapping still selects a tile to play normally.
- Moving a tile never costs a turn, changes letters, or affects scores. The **Arrange** tap-to-swap option remains.
- Updated versioned resources and service-worker cache for reliable Netlify updates.

# Letterloom release notes

## v1.14 — Manual letter arrangement

- Reorder tiles directly on your rack by finger drag on iPhone/iPad, or drag and drop with a mouse.
- New accessible Arrange button: tap two rack tiles to exchange positions; Done returns to ordinary tile selection.
- Reordering never changes the tile bag, points, turn or game rules; changes save to the existing match.
- Updated in-game help and service-worker cache for a reliable Home Screen update.

# Letterloom release notes

## v1.13 — Clearer word-game definitions

- Offline meaning for DE (a French-origin word used in names and phrases), plus additional familiar short game words.
- Rank and filter online meanings to favour readable English definitions rather than language codes, scripts or software symbols.
- Ignore the previous definition cache so old irrelevant meanings do not reappear.
- If a source offers only technical senses, try the backup provider; show a clear explanation when neither has a suitable definition.
- No changes to board rules, tile counts, scores, saved game format or the British-English word list.

## v1.12 — More reliable meanings
- SLY and over 100 additional common words have built-in offline definitions.
- Tries Wiktionary before Free Dictionary API for additional definitions; one service failing does not immediately end the lookup.
- Credits Wiktionary contributors, with an entry link and CC BY-SA notice.
- Unchanged gameplay, playable-word dictionary and saved games.

## v1.11 — Word Discovery reliability
- Added carefully written offline meanings for LI, EL, ILIUM and DUEL, plus several familiar example words; these work without contacting a dictionary website.
- Clearer, accessible word choices at letter intersections: “LI · Down” and “DUEL · Across”.
- Versioned the CSS and offline cache so new popup styles replace stale styles in an installed Home Screen app.
- When online definitions are unavailable, offer a direct Collins dictionary lookup link. Accepted word-game rules are unchanged and saved games remain intact.


## v1.10 — Tap to define

- Tap any completed word on the board to read a meaning. Choose between horizontal and vertical words at an intersection.
- Includes short offline meanings for common examples and a cached online definition service for less common words.
- Safe for existing saved games: board selection never places, moves, or removes committed tiles.
- New tap guidance on the game screen and an updated Help explanation.
- Version label updated to v1.10.

# Letterloom version history

## v1.9 — British English and endgame
- UK English Hunspell word-list loader with persistent offline cache, plus bundled British-style fallback.
- Both player and computer, and Relaxed and Classic styles, use exactly the same playable word list.
- Restored ORG; accepted AD, TUG, HOAX and other legitimate entries.
- Clearer end-of-game score adjustment and Play Again screen.
- Footer shows version and verified word count.
- Retained all previous PWA, balanced rack and computer-opponent improvements.

## v1.8 — Short words
- Allowed AD in Relaxed mode; temporary short-word policy (superseded by v1.9).

## v1.7 — Larger legal dictionary
- Recognised TUG in Relaxed mode; used a broader dictionary.

## v1.6 — More ordinary words
- Accepted HOAX and additional everyday words.

## v1.5 — Computer turns
- Reworked the computer turn pipeline and versioned assets.

## v1.4 — Computer pass safety
- Better fallback moves and retry option.

## v1.3 — Play styles
- Relaxed and Classic play choices.

## v1.2 — Balanced tiles
- Vowel-balancing and discreet version label.

## v1.1 — Cross-word validation
- Corrected rejected two-letter abbreviations such as FT and RT.
