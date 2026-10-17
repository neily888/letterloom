/* Letterloom British English v1.21 master dictionary.
 * One bundled, deterministic offline word list combines LibreOffice en_GB
 * Hunspell expansion with Letterloom's previously bundled words.
 * Licence notices: see DICTIONARY-SOURCES.md.
 * Retain expandBritishHunspell for regression checks and future rebuilds.
 */
import {TWO_LETTER_WORDS} from './engine.js?v=1.22.3';

const UK_DIC='https://raw.githubusercontent.com/LibreOffice/dictionaries/master/en/en_GB.dic';
const UK_AFF='https://raw.githubusercontent.com/LibreOffice/dictionaries/master/en/en_GB.aff';
const STORE='letterloom-uk-dictionary-v1.9';
const KEY=new URL('./british-word-cache-v1.9.txt',import.meta.url).href;
const standardWord=/^[a-z]{2,15}$/;
export const GAME_WORD_EXTRAS=['ORG','DEF']; // Legitimate familiar word-game entries requested by players.

export function expandBritishHunspell(dicText,affText){
  const rules=new Map();
  const cross=new Map();
  for(const raw of affText.replace(/^\uFEFF/,'').split(/\r?\n/)){
    const line=raw.trim();
    if(!line || line.startsWith('#'))continue;
    const part=line.split(/\s+/);
    if(!['SFX','PFX'].includes(part[0]) || part.length<4)continue;
    const kind=part[0], flag=part[1], key=`${kind}:${flag}`;
    if(part[2]==='Y' || part[2]==='N'){
      rules.set(key,[]);cross.set(key,part[2]==='Y');
      continue;
    }
    if(part.length<5 || !rules.has(key))continue;
    const [, , remove,addRaw,condition]=part;
    // Hunspell permits affix-continuation flags after the slash; ignore those.
    const add=addRaw.split('/')[0];
    try{
      const regex=new RegExp(kind==='SFX'?`${condition}$`:`^${condition}`);
      rules.get(key).push({remove:remove==='0'?'':remove,add:add==='0'?'':add,regex});
    }catch{/* unsupported affix condition: skip instead of inventing a word */}
  }
  const words=new Set();
  const include=w=>{if(standardWord.test(w))words.add(w.toUpperCase());};
  for(const raw of dicText.replace(/^\uFEFF/,'').split(/\r?\n/).slice(1)){
    const entry=raw.trim().split(/\s+/)[0];
    if(!entry)continue;
    const slash=entry.indexOf('/');
    const base=(slash<0?entry:entry.slice(0,slash));
    if(!standardWord.test(base))continue; // exclude names, acronyms and punctuation
    include(base);
    const flags=slash<0?'':entry.slice(slash+1);
    const prefixes=[],suffixes=[];
    for(const flag of flags){
      for(const kind of ['PFX','SFX']){
        const key=`${kind}:${flag}`;
        if(!rules.has(key))continue;
        for(const r of rules.get(key)){
          if(!r.regex.test(base))continue;
          if(r.remove && !(kind==='PFX'?base.startsWith(r.remove):base.endsWith(r.remove)))continue;
          const stem=kind==='PFX'?base.slice(r.remove.length):(r.remove?base.slice(0,-r.remove.length):base);
          const form=kind==='PFX'?r.add+stem:stem+r.add;
          include(form);
          (kind==='PFX'?prefixes:suffixes).push({form,key,rule:r});
        }
      }
    }
    // Hunspell allows combined prefix + suffix when both rule flags permit it.
    for(const p of prefixes){
      if(!cross.get(p.key))continue;
      for(const s of suffixes){
        if(!cross.get(s.key))continue;
        const r=s.rule;
        if(!r.regex.test(p.form) || (r.remove&&!p.form.endsWith(r.remove)))continue;
        const stem=r.remove?p.form.slice(0,-r.remove.length):p.form;
        include(stem+r.add);
      }
    }
  }
  // Word-game entries are curated equally for human and computer.
  for(const word of TWO_LETTER_WORDS)words.add(word);
  for(const word of GAME_WORD_EXTRAS)words.add(word);
  // Removing common US-only orthographic forms even if included as variants
  // in the upstream source. Avoid a sweeping blacklist (e.g. CHECK is UK too).
  for(const word of US_ONLY_SPELLINGS)words.delete(word);
  return words;
}

export const US_ONLY_SPELLINGS=new Set(`COLOR COLORS COLORED COLORFUL COLORLESS COLORING
FAVOR FAVORS FAVORED FAVORING FAVORITE FAVORITES FAVORITISM
HONOR HONORS HONORED HONORING HONORABLE HONORARY
NEIGHBOR NEIGHBORS NEIGHBORHOOD NEIGHBORHOODS NEIGHBORING
LABOR LABORS LABORED LABORING LABORER LABORERS
HARBOR HARBORS HARBORING HARBORING SAVOR SAVORS SAVORED SAVORY
FLAVOR FLAVORS FLAVORED FLAVORING FLAVORFUL HUMOR HUMORS HUMORLESS
RUMOR RUMORS ARMOR ARMORED VAPOR VAPORS VIGOR SPLENDOR
CENTER CENTERS CENTERED CENTERING CENTERPIECE
THEATER THEATERS THEATERGOER THEATERGOERS
LITER LITERS LITERATEE FIBER FIBERS FIBERGLASS
TRAVELED TRAVELING TRAVELER TRAVELERS CANCELING CANCELED
JEWELER JEWELERS JEWELRY LABELING LABELED MODELED MODELING
SIGNALING SIGNALED MARVELED MARVELING COUNSELED COUNSELING
GRAY GRAYS GRAYER GRAYEST GRAYISH
ORGANIZE ORGANIZES ORGANIZED ORGANIZING ORGANIZER ORGANIZERS
REALIZE REALIZES REALIZED REALIZING REALIZATION REALIZATIONS
RECOGNIZE RECOGNIZES RECOGNIZED RECOGNIZING
APOLOGIZE APOLOGIZES APOLOGIZED APOLOGIZING
ANALYZE ANALYZES ANALYZED ANALYZING
PARALYZE PARALYZES PARALYZED PARALYZING
DEFENSE DEFENSES OFFENSE OFFENSES PRETENSE PRETENSES
PAJAMAS ALUMINUM SULFUR PEDIATRIC PEDIATRICS
HEMOGLOBIN HEMORRHAGE HEMORRHAGING ANEMIA LEUKEMIA
SPECTER SPECTERS CALIBER CALIBERS SABER SABERS
MOLD MOLDS MOLDED MOLDING PLOW PLOWS PLOWED PLOWING`.split(/\s+/));

// Every match loads the same bundled list: no remote calls, cache variance or
// dependence on the network when opening or starting a game.
export async function loadBritishWords(){
  const response=await fetch(new URL('./dictionary.txt?v=1.21.0',import.meta.url));
  if(!response.ok)throw Error('The bundled British English dictionary is unavailable.');
  const raw=await response.text();
  const words=new Set(raw.trim().split(/\s+/));
  if(words.size!==158807)throw Error('The bundled British English dictionary is incomplete.');
  return {words,source:'Letterloom British English v1.21',cached:true};
}
