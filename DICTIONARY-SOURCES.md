# Letterloom British English dictionary — sources and licence notes

The `dictionary.txt` shipped in Letterloom v1.21 is a **bundled, fixed 158,873-entry list**, produced by merging:

1. **Letterloom's existing offline word list** (`dictionary.txt`, v1.20, 108,833 entries). That previous compiled list remains part of this release; its source history should be retained when redistributing.
2. **LibreOffice English (United Kingdom) spell-checking dictionary** (`en/en_GB.dic` and `en/en_GB.aff`), at the version available on 15 October 2026. Words were expanded using Letterloom's `expandBritishHunspell` function in `uk-dictionary.js`. Original upstream source: https://github.com/LibreOffice/dictionaries/tree/master/en

Upstream copyright and redistribution notices are maintained in LibreOffice's repository. The en_GB dictionary is distributed with an LGPL 2.1 licence notice; downstream distributors should review and preserve the relevant upstream attribution and licensing information. Do not assume that the dictionary data is public domain.

The merge converted all entries to upper-case alphabetic words of length 2–15, removed duplicates, and applied the existing `US_ONLY_SPELLINGS` exclusions in `uk-dictionary.js`. It also includes Letterloom's allowed two-letter words and existing ORG/DEF additions. It deliberately does **not** copy the proprietary Collins Scrabble Words/CSW24 or Oxford Languages lexicons.

## Behaviour

- At runtime `loadBritishWords()` fetches only the local, service-worker-cached `dictionary.txt?v=1.21.0`, never LibreOffice's external URL.
- The list is identical for both players, online or offline.
- Everyday Short Words is an optional Relaxed mode filter applied on top of the same master list.
- Existing saved matches and their choice of rules are retained.
- The current count is **158,873 unique entries** and the plain-text file size is **1,603,334 bytes**.

## Updating

To rebuild, retrieve the pinned historical upstream `en_GB.dic` and `en_GB.aff`, expand them using the supplied function, union them with the previous Letterloom word list, apply the explicit American-only exclusions, sort and de-duplicate, and run the tests. A future dictionary upgrade should include a reproducible build script, a source-commit manifest, and updated attribution as appropriate. Do not replace the master list with an automatically changing upstream download.
