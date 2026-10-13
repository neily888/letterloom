"""Generate a self-contained conservative British fallback word list.

The primary high-coverage source is the LibreOffice UK dictionary downloaded and
cached in-browser. This file transforms the bundled SCOWL US-derived source so
that the game remains usable even on first launch offline. This fallback is not
claimed to be a complete British-English lexicon.
"""
from pathlib import Path
import re,sys
ROOT=Path(__file__).resolve().parents[1]
orig=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'dictionary.txt'
words=set(orig.read_text().split())
# Morphological replacements focused on words whose US forms are mainly US-only.
substrings=[
 ('NEIGHBOR','NEIGHBOUR'),('COLOR','COLOUR'),('FAVOR','FAVOUR'),('HONOR','HONOUR'),
 ('LABOR','LABOUR'),('HARBOR','HARBOUR'),('SAVOR','SAVOUR'),('FLAVOR','FLAVOUR'),
 ('HUMOR','HUMOUR'),('RUMOR','RUMOUR'),('ARMOR','ARMOUR'),('VAPOR','VAPOUR'),
 ('VIGOR','VIGOUR'),('SPLENDOR','SPLENDOUR'),('CENTER','CENTRE'),
 ('THEATER','THEATRE'),('SPECTER','SPECTRE'),('FIBER','FIBRE'),
 ('CALIBER','CALIBRE'),('SABER','SABRE'),('SOMBER','SOMBRE'),('LUSTER','LUSTRE'),
 ('MEAGER','MEAGRE'),('ALUMINUM','ALUMINIUM'),('SULFUR','SULPHUR'),
 ('PEDIATR','PAEDIATR'),('HEMOGLOBIN','HAEMOGLOBIN'),('HEMORRH','HAEMORRH'),
 ('ANEMIA','ANAEMIA'),('LEUKEMIA','LEUKAEMIA'),('PAJAMAS','PYJAMAS'),
 ('CATALOG','CATALOGUE'),('DIALOG','DIALOGUE'),('MONOLOG','MONOLOGUE'),
 ('MUSTACHE','MOUSTACHE'),('OESTROGEN','OESTROGEN'),('ESTROGEN','OESTROGEN'),
 ('GYNECOLOG','GYNAECOLOG'),('HEMATO','HAEMATO'),('FECES','FAECES'),
 ('TRAVELED','TRAVELLED'),('TRAVELING','TRAVELLING'),('TRAVELER','TRAVELLER'),
 ('CANCELED','CANCELLED'),('CANCELING','CANCELLING'),('JEWELER','JEWELLER'),
 ('JEWELRY','JEWELLERY'),('LABELED','LABELLED'),('LABELING','LABELLING'),
 ('MODELED','MODELLED'),('MODELING','MODELLING'),('SIGNALING','SIGNALLING'),
 ('SIGNALED','SIGNALLED'),('COUNSELED','COUNSELLED'),('COUNSELING','COUNSELLING'),
 ('MARVELED','MARVELLED'),('MARVELING','MARVELLING'),('GRAY','GREY'),
 ('DEFENSE','DEFENCE'),('OFFENSE','OFFENCE'),('PRETENSE','PRETENCE'),
 ('ORGANIZ','ORGANIS'),('RECOGNIZ','RECOGNIS'),('REALIZ','REALIS'),
 ('APOLOGIZ','APOLOGIS'),('ANALYZ','ANALYS'),('PARALYZ','PARALYS'),
 ('MOLD','MOULD'),('PLOWED','PLOUGHED'),('PLOWING','PLOUGHING'),
]
converted={}
protected_ize={'SIZE','SIZES','SIZED','SIZING','SIZER','SIZERS','PRIZE','PRIZES','PRIZED','PRIZING','PRIZELESS','SEIZE','SEIZES','SEIZED','SEIZING','SEIZURE','MAIZE','CAPSIZE','CAPSIZES','CAPSIZED','CAPSIZING','FRIEZE','FRIEZES'}
for w in sorted(words):
 new=w
 if w not in protected_ize:
  if re.search(r'IZ(?:E|ES|ED|ER|ERS|ING|ATION|ATIONS|ABLE|ABILITY)$',w):
   new=re.sub(r'IZ(?=(?:E|ES|ED|ER|ERS|ING|ATION|ATIONS|ABLE|ABILITY)$)','IS',new)
  if re.search(r'YZ(?:E|ES|ED|ER|ING)$',w):
   new=re.sub(r'YZ(?=(?:E|ES|ED|ER|ING)$)','YS',new)
 for us,gb in substrings:
  if us in new:
   new=new.replace(us,gb)
 if new!=w and len(new)<=15 and new.isalpha():converted[w]=new
# Avoid collateral changes where US words have their own UK sense, e.g.
# "Check" remains valid; do not blanket-convert it to "Cheque".
for us,gb in converted.items():
 if us in ('GRAYLING','MOLDER'):
  continue
 words.discard(us);words.add(gb)
words.update(['COLOUR','FAVOUR','NEIGHBOUR','CENTRE','THEATRE','ORGANISE','TRAVELLING','ALUMINIUM','CHEQUE','LICENCE','PRACTISE','TYRE','MOAT','TUG','AD','ORG','DEF','HOAX'])
words.difference_update('COLOR COLORS COLORFUL FAVOR FAVORITE FAVORITES NEIGHBOR NEIGHBORS CENTER CENTERS THEATER THEATERS TRAVELING TRAVELED ORGANIZE ORGANIZED REALIZE REALIZED ANALYZE ANALYZED GRAY PAJAMAS ALUMINUM'.split())
# Curated two-letter whitelist is unchanged from the game rules.
from subprocess import check_output
engine=(ROOT/'engine.js').read_text()
twos=set(re.search(r'export const TWO_LETTER_WORDS = new Set\(`(.*?)`\.trim',engine,re.S).group(1).split())
words={w for w in words if 2<=len(w)<=15 and (len(w)!=2 or w in twos)}
words.update(twos)
(ROOT/'dictionary.txt').write_text('\n'.join(sorted(words))+'\n')
print(f'British-style offline fallback: {len(words):,} entries; transformed {len(converted):,} American spellings')
