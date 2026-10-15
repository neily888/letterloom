# Letterloom v1.21 — One bundled British English dictionary

The game's complete dictionary is now a **single, versioned, fully offline** file: **158,807 unique words, 1,603,136 bytes** (UTF-8 plain text). This combines the previous bundled fallback list with the expanded LibreOffice en_GB Hunspell word list, removing duplicates and explicitly disallowed American-only spellings.

There is **no external dictionary download at game startup or when creating a new game**. The bundled file is cached by the service worker for offline play. Exactly the same master list supports humans, the computer and hints. Relaxed mode's Everyday Short Words preference is still applied evenly to both players. The familiar-word preference for the computer remains intact. Existing saved matches, including their selected word-rule preference, are preserved.

See [DICTIONARY-SOURCES.md](DICTIONARY-SOURCES.md) for provenance, rebuilding, and licensing.

# Letterloom v1.20 — Everyday Short Words

New Relaxed matches default to **Everyday Short Words**, a selectable option on the New game screen. Both players use the same rules for every word formed, including crossings. Familiar short forms like AD, AB, IN, GO and PO are allowed; EL, EF, LI, UT, QI and ZA are excluded when enabled. Most three-letter words remain accepted. Classic uses the full list.

Existing saved games keep their previous word rules. Begin a new Relaxed match to try this change. Cloudflare Pages will publish automatically from the GitHub main branch.

# Letterloom v1.19 — A friendlier British-English computer opponent

Letterloom v1.19 builds on v1.18. In **Relaxed** mode, the computer now looks at **every word created by a move**, including the little perpendicular words formed when tiles touch. It prefers familiar British English vocabulary over less familiar slang and specialist expressions when there is a legal alternative. **Classic** still favours strong-scoring moves.

No words have been removed from the actual playing dictionary: **the player and the computer use precisely the same legal-word checks**. Unusual legal words such as **ZA**, **PO**, **GI**, **AB**, **ORG** and **ILIUM** remain allowed. If the computer genuinely cannot find a familiar play, it may still use an unusual word instead of passing unnecessarily. This is a preference, not an absolute ban.

Word Discovery now includes helpful offline notes for **ZA** (American slang for pizza) and **PO** (an old-fashioned British name for a chamber pot). Other definitions work as in v1.18.

**To update:** Extract `letterloom-pwa-v1.19.zip`, then upload the contained **letterloom-pwa folder** to your existing Netlify site's **Deploys** page. Reopen the Home Screen app online and confirm **v1.19** in its footer. Your saved match and URL should remain unchanged. You can continue an existing game; you do not have to start a new one.

This version has automated game-engine, bot-preference, dictionary and offline-cache tests. A full real-device Safari gesture and dictionary test is still recommended.

## Earlier release notes: v1.18 — Clearer Word Discovery

Letterloom is a playable, installable 15 × 15 word-board Progressive Web App (PWA). This release focuses on British spellings, consistent word-validation rules and a clearer end-of-match experience. It runs as a static website on Netlify; no account, API key, or build step is needed.

## New in v1.18 — Everyday meaning first, with optional Other meanings

Tap a played word as before. Letterloom now shows **one useful main definition** rather than immediately filling the popup with several dictionary senses. If additional senses exist, tap **Other meanings** to expand them; tap again to hide them.

- **AB** now has a built-in, offline definition: an informal short form for *abdominal muscle*, most often used in the plural **abs**. The obscure drug-related slang sense no longer appears first. Less common meanings can still be viewed on request when available online.
- **UT** now has a simple built-in explanation as the old musical note DO.
- When an everyday explanation is built in, Word Discovery won't contact an online dictionary unless the player taps **Other meanings**. Other meanings fetched from Wiktionary (or the backup provider) are saved for offline reading.
- For other words, the original on-demand internet lookup still applies, but its chosen best meaning is shown first, and remaining suitable meanings are kept behind the optional button. This is a best-effort ranking, not a guarantee that the most common meaning is always first.
- Saved games, existing gameplay, dictionary acceptance, scoring, letter dragging, and last-move highlighting remain unchanged. The glossary cache has a new version to avoid reusing previously poor-ranked online definitions, so some old meaning lookups may need one new internet request.

**How to update:** Extract the ZIP and upload its `letterloom-pwa` folder to your *existing* Netlify site (not a new site). Open it on your iPhone/iPad while connected, then look for **v1.18** in the footer. Your saved match should remain.

## Earlier: v1.17 — Computer move highlighting and replay

In a game against the computer, its **newly placed letters** are highlighted in gentle green for **3.5 seconds** after its turn. This includes only the new tiles, not older letters that form part of the word. The regular move summary still lists all words formed and the points scored.

Once the computer has played at least one scoring move, the **◉ Show last move** button appears below the board. Tap it to keep the computer's most recent scoring move highlighted for as long as you want. Tap **✓ Hide last move**, or tap the board, to clear the highlight. The button works on a loaded saved match, including after later passes or your own move. No timer or score changes are involved.

The v1.17 release focused on identifying computer moves; v1.18 adds the Word Discovery changes described above.

## Earlier: v1.16 — Move unplayed letters on the board

Drag a letter you have placed onto the board to another square **before pressing Play word**. Drop it onto another unplayed letter to exchange their positions, or drag it back onto your rack to remove it from the board. You can still tap an unplayed letter to return it to your rack. Already played words cannot be moved.

Repositioning does not use a turn, cost points or change which letters you have. The move is saved and the score preview updates immediately. Dragging into the small gaps between board squares selects the nearest board cell.

## Earlier: v1.14 — Arrange your letter rack

You can arrange your seven letters by hand, without losing a turn:

- **On iPhone and iPad**, drag a tile along the rack with your finger, or tap **⇄ Arrange**, then tap any two letters to swap them. Tap **✓ Done** when ready to play. A finger-drag can also place a tile onto the board in normal play.
- **On Chromebook or desktop**, drag a tile onto another tile to reorder it. The two-tap Arrange option also works with a mouse or keyboard.
- **Shuffle** still works exactly as before.
- These changes rearrange only your existing letter tiles. They never swap tiles with the bag, change scores, or advance the turn. The order is saved with your existing match.

## Word Discovery — tap any played word for its meaning

Tap an **existing letter tile on the board** to see the word it belongs to and read an easy-to-follow definition. If a square connects a horizontal and vertical word, choose either word in the pop-up. Tap **Back to game** when you're done. A dictionary lookup does **not** use up a turn or change a tile or score.

- **Works on iPhone, iPad and Chromebook**, including after the game has finished.
- Includes a small built-in glossary of common words and game-related examples such as **GI**, **LI**, **EL**, **ILIUM**, **DUEL**, **GOAT**, **TUG**, **HOAX** and **ORG**. Those meanings work without an internet connection.
- For other words, the game requests a definition on demand from the free [Free Dictionary API](https://dictionaryapi.dev/) (requires internet access). Successful lookups are kept on that device for later offline use, up to the most recent 150 lookups. **Not every playable word has a definition** in that service; an unavailable definition does not mean the word is invalid. When a definition cannot be fetched, the app provides a link to look the word up in Collins while you are online.
- The popup buttons now have clearly separated word/direction labels, and the stylesheet is explicitly versioned to avoid older Home Screen installations retaining the previous popup formatting.
- The online meanings are general English and **are not guaranteed to use exclusively British wording or spelling**. The game's actual playable dictionary **remains British English**; the definition provider does not decide which words count.
- A small, unobtrusive **v1.18** version number is displayed in the footer.

## What's new in v1.9 (still included)

- **British English as the word-list standard**, with familiar British forms such as **COLOUR**, **CENTRE**, **FAVOUR**, **ORGANISE**, **TRAVELLING** and **THEATRE**. The code explicitly excludes representative American-only spellings such as **COLOR**, **CENTER**, **FAVOR**, **ORGANIZE** and **TRAVELING**.
- **Exactly the same word validation for both people and the computer**, in **Relaxed** and **Classic**. Valid word-game entries such as **AD**, **ORG**, **DEF**, **TUG**, and **HOAX** are no longer excluded just from Relaxed mode. Every perpendicular crossing word must still be legitimate.
- **Relaxed** is still the default: a gentler computer, optional hint, vowel-balancing when possible, and one free swap per player. **Classic** has a stronger computer, random draws, and swaps cost turns. The vocabulary is *not different* between the modes.
- **End-of-game scoring and an improved Game Over screen.** If someone uses their last tile after the bag is empty, any remaining tiles on the other rack are subtracted from that player's score and added to the finishing player's score. If there are six consecutive scoreless turns, both players lose the value of their remaining tiles. Final adjustments, winner and Play Again appear when the game ends (including when a finished saved game reopens).
- A discreet **v1.9** label and **actual word count** in the footer. The rules explain where the word list came from.

## How the British dictionary works

**Primary source:** the [LibreOffice British English Hunspell dictionary](https://github.com/LibreOffice/dictionaries/tree/master/en), created and maintained by the British-English dictionary contributors. On its first online run, Letterloom fetches `en_GB.dic` and `en_GB.aff`, expands the inflected forms on the device, filters out capitalised names/non-playable tokens, and caches the resulting word list on the device. Reopening the installed game uses this cache, including when offline. This is specifically a British-English spelling source, not a US-English dictionary with only a few substitutions. The primary source is distributed under LGPL 2.1; see `THIRD_PARTY_NOTICES.md`.

**Offline fallback:** the ZIP *also* contains a standalone, British-style word list (`dictionary.txt`) containing **108,833 words**. It was adapted from the previously shipped SCOWL/Hunspell word list, including 2,702 conversions of US spelling forms into British forms. It covers a large number of ordinary words without needing the online source but is not claimed to be a perfect, exhaustive UK lexicon. The game automatically uses it on first launch if the LibreOffice source cannot be reached. On a subsequent launch while online, it tries the larger UK source again. The exact number and source are shown in **How to Play**, while the count is shown in the footer.

**Why no fixed 200,000-word claim?** The actual playable word count depends on the authoritative UK source, exclusion of names, punctuation and words longer than 15 letters, and which inflections are generated. The number shown in the running game is the checked unique count. We deliberately prioritise correct British spellings over artificially inflating the count.

**Dictionary policy:** a curated set of 118 accepted two-letter game words is shared by all players, and familiar game entries ORG and DEF are additionally permitted. Abbreviations such as FT and RT are not accepted. This is Letterloom's own lexicon, **not** the licensed Words With Friends dictionary. As with any word list, edge cases may still need correction.

## Upload to your existing Netlify site (Chromebook)

1. Download `letterloom-pwa-v1.19.zip` and choose **Extract all** in the Chromebook Files app.
2. Open [Netlify](https://app.netlify.com) and select the **same existing Letterloom site** (don't create another site).
3. Open **Deploys** and manually upload the newly extracted `letterloom-pwa` folder.
4. Open your existing Netlify game link in Safari while connected to the internet. The British dictionary may take a few seconds to download and process on its first use.
5. Close and reopen the Home Screen app. Look for **v1.19** and a **UK words** number in the footer. On iPad, you can use Safari's Share → Add to Home Screen.

The game saves its match in localStorage on each device. Keeping the same Netlify URL preserves existing saved matches (subject to your browser retaining website storage). The v1.9 word list applies to future plays, not to words already placed. **Starting a new Relaxed game** is the cleanest way to test the updated game rules.

## Features and rules

- 100 physical letter tiles, including 2 blanks (Letterloom's original distribution — *not* identical to the 104 tiles used in Words With Friends).
- Seven-tile racks, 15 × 15 bonus-square board, 35-point bonus for playing all seven tiles.
- Computer or local two-player pass-and-play modes.
- Tap-to-place, touchscreen and mouse drag-to-reorder racks, two-tap Arrange mode, tile shuffle, swap, undo, hint in Relaxed mode.
- Persistent saved games and installable PWA with a service worker.
- No accounts or cloud syncing. Games on your iPhone and iPad are stored separately.

## Run and test on a computer

The website is static and needs no build process. To serve the files locally:

```sh
cd letterloom-pwa
npm start
# open http://localhost:4173
```

Or with Python: `python3 -m http.server 4173` in the same directory. Do not open `index.html` directly with `file://`; module scripts and service workers need an HTTP(S) server.

Run tests with:

```sh
npm test
```

## Testing status and limitations

The retained v1.9 regression tests cover spelling variants, accepted short words, cross-word validation, both play styles, computer moves, swaps, both game-finishing conditions and offline-cache configuration. **Automated live-browser navigation is blocked by the test environment**, so a check on the target iPhone/iPad is still needed after uploading.

The dictionary loader needs an internet connection **once** to download and cache the larger British source. If this isn't possible, the bundled offline fallback is used. The source code is included for transparency. There is no asynchronous online multiplayer, accounts, invitations or syncing yet.

## Attributions

See `THIRD_PARTY_NOTICES.md` and `SCOWL_COPYRIGHT.txt`. Letterloom is an original, unofficial game, not associated with or endorsed by Words With Friends or Zynga.


### v1.13 definition clarity
- The built-in DE meaning explains “of” and “from” in names and loan phrases; several short game words also have additional offline meanings.
- Online definition choices are now ranked for readable English meaning. Technical metadata such as language codes, software operators and symbol names are skipped.
- If Wiktionary supplies only such technical entries, the game tries the backup dictionary service before showing a plain-English no-clear-meaning message.
- Inaccurate cached lookups from older versions are ignored using a new cache version. Older saved definitions may need to be looked up again while online; gameplay and saved matches are unaffected.
- The game does **not** claim that every unusual word has an everyday meaning.

### v1.12 definition reliability
- Adds SLY and over 100 other short, readable offline meanings.
- When a word is not in the built-in list, tries Wiktionary first and Free Dictionary API second.
- Definitions obtained online are saved locally for offline viewing. Either service may be unavailable or lack a particular word; in that case a Collins lookup link remains.
- No changes to playable words, scoring or save format.

### v1.15 — smoother rack dragging

Drag a letter directly along the rack on iPhone, iPad or desktop. Keep your finger down to move it; adjacent tiles slide apart and you can release between tiles (or just past either end). Short taps still select a letter for normal play. For accessibility, **Arrange** lets you swap two letters by tapping. Neither method changes a turn or score. Updated app assets use v1.15 cache-busting URLs; saved matches retain the original key.

### v1.16 — freely reposition tentative board tiles

Pointer events now support dragging an unplayed board tile to another square, swapping two tentative letters, and dragging back to the rack. A committed tile cannot be moved or overwritten. Tap-to-return and rack dragging still work; no turn or points are affected. The installed app caches the new board-placement helper for offline play.
