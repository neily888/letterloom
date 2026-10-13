# Dictionary source and licensing notices — Letterloom v1.14

## Primary British English dictionary (downloaded on first online use)

The PWA fetches the `en_GB.dic` and `en_GB.aff` files from the [LibreOffice dictionaries repository](https://github.com/LibreOffice/dictionaries/tree/master/en), maintained by David Bartlett, Andrew Brown, Marco A.G.Pinto and other contributors. This spelling dictionary is distributed under the **GNU Lesser General Public License v2.1 (LGPL 2.1)**. Full licence: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html. The British dictionary's README and attribution are available here: https://github.com/LibreOffice/dictionaries/blob/master/en/README_en_GB.txt.

The word-list expansion is carried out on the user's own device. The application does not package or claim ownership of that dictionary; it caches generated entries locally for offline use. For a copy of the source and details of its authorship and licence, use the links above.

## Bundled British-style offline fallback

`dictionary.txt` derives from the American English Hunspell/SCOWL dictionary previously used in Letterloom, then applies conversion and exclusion rules to move closer to common British spellings. SCOWL is maintained by Kevin Atkinson and contributors; redistribution notices from Debian's `hunspell-en-us` package are included in `SCOWL_COPYRIGHT.txt`, which must remain with distributions.

The resulting offline fallback is not guaranteed to reject every Americanism or contain every valid British English word.

## Other notes

The game is not connected to Zynga or Words With Friends. The dictionary is not the official Words With Friends lexicon. The original Letterloom artwork, gameplay interface and branding are independent of those products.

## Optional online definitions in v1.13

Letterloom uses [Wiktionary](https://en.wiktionary.org/) with the [Free Dictionary API](https://dictionaryapi.dev/) as a backup to request meanings **when the user taps a word without an embedded or cached meaning, or explicitly requests Other meanings**. This feature requires internet access for first lookup of most words. The site may receive the requested word, subject to its own privacy practices. Results are cached locally on the player's device and do not affect legal-word validation. See [the API's project](https://github.com/meetDeveloper/freeDictionaryAPI). Letterloom's hand-written short offline glossary is separate from that service.

### Word Discovery: Wiktionary (online definitions)
When online and no offline definition is available, Letterloom can display meanings from Wiktionary, authored by Wiktionary contributors, licensed under the Creative Commons Attribution–ShareAlike 4.0 International Licence (CC BY-SA 4.0).
Word entries can be viewed via the "View source" link in the definition popup.
https://en.wiktionary.org/
https://creativecommons.org/licenses/by-sa/4.0/

The secondary online provider is Free Dictionary API (https://dictionaryapi.dev/). Content remains attributed to the supplying service, and individual entries may include their own third-party licence terms.
