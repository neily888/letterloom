/** Discover complete existing words on the board without touching game state. */
export function wordsAtCell(board,index,size=15){
  if(!Array.isArray(board)||board.length!==size*size||!Number.isInteger(index)||index<0||index>=board.length||!board[index])return [];
  const row=Math.floor(index/size),col=index%size;
  const words=[];
  // Restrict traversal to its row/column: adjacent rows must never wrap.
  for(const [dr,dc] of [[0,1],[1,0]]){
    let r=row,c=col;
    while(r-dr>=0&&r-dr<size&&c-dc>=0&&c-dc<size&&board[(r-dr)*size+c-dc]){r-=dr;c-=dc;}
    const cells=[];
    while(r<size&&c<size&&board[r*size+c]){cells.push(r*size+c);r+=dr;c+=dc;}
    if(cells.length>1)words.push({word:cells.map(i=>String(board[i]?.letter||'')).join('').toUpperCase(),indices:cells,direction:dr?'down':'across'});
  }
  // Small crossing words are often the ones a player wants to understand.
  return words.sort((a,b)=>a.word.length-b.word.length || a.word.localeCompare(b.word));
}

// Hand-written, short and age-friendly definitions to keep useful examples
// available offline. The optional online service is separate from legal moves.
export const OFFLINE_MEANINGS={
  AB:['noun · informal','A short form of abdominal muscle, most often used in the plural: abs.'],
  ABS:['noun · informal','Abdominal muscles, especially the muscles at the front of your tummy.'],
  UT:['noun · music','An old name for the musical note DO, the first note of the DO–RE–MI scale.'],
  AD:['noun','A short form of advertisement.'],
  DE:['particle','An expression meaning “of” or “from”, used in names and phrases borrowed from French.'],
  AA:['noun','A type of rough lava formed by a volcano.'],
  AE:['adjective','A Scots word meaning one or a single.'],
  AI:['noun','A South American sloth, a slow-moving animal that lives in trees.'],
  FA:['noun','The fourth note of the musical scale in sol-fa.'],
  ID:['noun','In psychology, the part of the mind associated with basic desires.'],
  JO:['noun','A Scots word for a sweetheart or loved one.'],
  LA:['noun','The sixth note of the musical scale in sol-fa.'],
  MI:['noun','The third note of the musical scale in sol-fa.'],
  MU:['noun','The twelfth letter of the Greek alphabet.'],
  NU:['noun','The thirteenth letter of the Greek alphabet.'],
  OI:['exclamation','A British expression used to attract someone’s attention.'],
  PI:['noun','The number used in mathematics to describe the ratio of a circle’s circumference to its diameter.'],
  QI:['noun','In Chinese philosophy, the life energy believed to flow through all living things.'],
  RE:['noun','The second note of the musical scale in sol-fa.'],
  SI:['noun','A note of the musical scale, also called ti.'],
  TI:['noun','The seventh note of the musical scale in sol-fa.'],
  XI:['noun','The fourteenth letter of the Greek alphabet.'],
  PO:['noun · old-fashioned British English','A chamber pot: a container that used to be kept in a bedroom for use as a toilet at night.'],
  ZA:['noun · American slang','A shortened American slang word for pizza, mainly heard in the United States or seen in word games.'],
  AH:['exclamation','A sound used when you understand something or are surprised.'],
  AM:['verb','The form of “be” used with “I”.'],
  AN:['determiner','Used before a singular noun beginning with a vowel sound.'],
  AS:['adverb','Used to compare things or say that something is equally so.'],
  AT:['preposition','Used to say where or when something happens.'],
  BE:['verb','To exist or to be in a particular state.'],
  BY:['preposition','Near, beside or through the action of someone.'],
  DO:['verb','To carry out an action or task.'],
  ED:['noun','A shortened form sometimes used for education or an editor.'],
  EX:['noun','A former partner, or someone who held a position previously.'],
  GO:['verb','To travel or move from one place to another.'],
  HE:['pronoun','Used to refer to a male person or animal.'],
  HI:['exclamation','A friendly greeting.'],
  IF:['conjunction','Used to introduce a possible condition.'],
  IN:['preposition','Inside or within a place.'],
  IS:['verb','The form of “be” used with he, she or it.'],
  IT:['pronoun','Used to refer to a thing, animal or situation.'],
  MA:['noun','An informal word for mother.'],
  ME:['pronoun','Used to refer to yourself as the object of an action.'],
  MY:['determiner','Belonging to me.'],
  NO:['adverb','A word used to refuse, disagree or answer negatively.'],
  OF:['preposition','Used to show belonging, connection or origin.'],
  OH:['exclamation','An expression of surprise or understanding.'],
  ON:['preposition','Touching or supported by a surface.'],
  OR:['conjunction','Used to offer an alternative or choice.'],
  OW:['exclamation','A cry of pain.'],
  OX:['noun','A large farm animal used for pulling heavy loads.'],
  OZ:['abbreviation','Short for ounce, a unit of weight. In Letterloom this is a Relaxed Play house-rule word.'],
  PA:['noun','An informal word for father.'],
  SO:['adverb','To such a degree; also used to introduce a result.'],
  TA:['exclamation','An informal British way of saying thank you.'],
  TO:['preposition','Used to show direction or a destination.'],
  UP:['adverb','Towards a higher place or position.'],
  US:['pronoun','Used to refer to yourself and one or more other people.'],
  WE:['pronoun','Used to refer to yourself and one or more other people.'],
  YE:['pronoun','An old-fashioned way of saying you.'],
  LI:['noun','A traditional Chinese unit of distance, now usually about 500 metres.'],
  EL:['noun','An informal word for an elevated railway; also a name for the letter L.'],
  ILIUM:['noun','The broad, uppermost part of the hip bone.'],
  DUEL:['noun','A fight or contest between two people, often arranged to settle a disagreement.'],
  VOWS:['noun','Solemn promises.'],
  AWAKEN:['verb','To wake someone or to become awake.'],
  REPEAT:['verb','To say or do something again.'],
  VOICE:['noun','The sound made when a person speaks or sings.'],
  BELL:['noun','A hollow metal object that rings when struck.'],
  GI:['noun','A loose uniform worn for martial arts such as judo or karate.'],
  SLY:['adjective','Clever in a secretive, crafty or sometimes dishonest way.'],
  SLYLY:['adverb','In a secretive or cunning way.'],
  SLYNESS:['noun','The quality of being secretive, clever or crafty.'],
  CUNNING:['adjective','Clever at getting what you want, often by using tricks.'],
  CRAFTY:['adjective','Clever at planning things, sometimes in a slightly dishonest way.'],
  SMILE:['noun','A happy, friendly or amused expression on someone’s face.'],
  SECRET:['noun','Something that is kept hidden or not told to others.'],
  QUICK:['adjective','Doing something or happening in a short time.'],
  SLOW:['adjective','Moving or happening without much speed.'],
  KIND:['adjective','Caring and helpful towards other people.'],
  BRAVE:['adjective','Showing courage in a difficult or frightening situation.'],
  CALM:['adjective','Peaceful and not upset, anxious or excited.'],
  CLEVER:['adjective','Good at learning, understanding or working things out.'],
  HAPPY:['adjective','Feeling or showing joy or pleasure.'],
  GLAD:['adjective','Pleased or happy about something.'],
  SAD:['adjective','Feeling unhappy.'],
  HOPE:['noun','A feeling that something good might happen.'],
  LOVE:['noun','A strong feeling of affection for someone or something.'],
  FRIEND:['noun','Someone you like and know well.'],
  FAMILY:['noun','A group of people related to one another.'],
  HOME:['noun','The place where someone lives.'],
  DOOR:['noun','A movable panel used to open or close an entrance.'],
  FLOOR:['noun','The surface of a room that people walk on.'],
  WINDOW:['noun','An opening in a wall with glass to let in light.'],
  ROOF:['noun','The covering at the top of a building.'],
  ROAD:['noun','A hard surface made for travelling along.'],
  STREET:['noun','A road in a town or city, usually with buildings alongside it.'],
  PATH:['noun','A track for people to walk along.'],
  BRIDGE:['noun','A structure that carries a road or path across a gap.'],
  RIVER:['noun','A large natural stream of water flowing towards the sea or a lake.'],
  LAKE:['noun','A large area of water surrounded by land.'],
  SEA:['noun','A large body of salt water.'],
  BEACH:['noun','An area of sand or stones beside the sea.'],
  HILL:['noun','An area of land higher than the ground around it.'],
  FIELD:['noun','A piece of open land, often used for farming.'],
  FARM:['noun','Land and buildings used for growing crops or keeping animals.'],
  HORSE:['noun','A large animal often ridden by people.'],
  SHEEP:['noun','A farm animal kept for its wool and meat.'],
  COW:['noun','A farm animal kept for milk or meat.'],
  DOG:['noun','An animal often kept as a pet.'],
  CAT:['noun','A small animal often kept as a pet.'],
  FISH:['noun','An animal that lives in water and breathes through gills.'],
  DUCK:['noun','A water bird with a broad bill.'],
  FOX:['noun','A wild animal with a bushy tail, related to dogs.'],
  ROSE:['noun','A flower often grown for its beauty and scent.'],
  LEAF:['noun','The usually green part of a plant that grows from a stem.'],
  GRASS:['noun','A common green plant with narrow leaves, found in lawns and fields.'],
  SEED:['noun','The part of a plant from which a new plant can grow.'],
  RAIN:['noun','Drops of water falling from clouds.'],
  SNOW:['noun','Soft white ice crystals that fall from the sky.'],
  WIND:['noun','Air moving outdoors.'],
  SUN:['noun','The star that gives Earth light and warmth.'],
  MOON:['noun','The natural object that travels around Earth.'],
  STAR:['noun','A bright object in the night sky that gives out its own light.'],
  LIGHT:['noun','Brightness that lets you see things.'],
  DARK:['adjective','Having little or no light.'],
  DAY:['noun','The time when it is light outside; also a period of 24 hours.'],
  NIGHT:['noun','The time between evening and morning when it is dark.'],
  TIME:['noun','The ongoing passage of moments, hours and days.'],
  HOUR:['noun','A period of sixty minutes.'],
  WEEK:['noun','A period of seven days.'],
  YEAR:['noun','A period of twelve months.'],
  SPRING:['noun','The season between winter and summer.'],
  SUMMER:['noun','The warmest season of the year.'],
  AUTUMN:['noun','The season between summer and winter.'],
  WINTER:['noun','The coldest season of the year.'],
  BOOK:['noun','Written or printed pages bound together to read.'],
  PAGE:['noun','One side of a sheet of paper in a book.'],
  STORY:['noun','An account of events, real or imagined.'],
  MUSIC:['noun','Sounds arranged to make a tune or piece of art.'],
  SONG:['noun','A piece of music with words that people sing.'],
  DANCE:['verb','To move rhythmically to music.'],
  PAINT:['verb','To cover a surface with colour using a brush or other tool.'],
  DRAW:['verb','To make a picture or shape using lines.'],
  WRITE:['verb','To form letters or words on a surface.'],
  READ:['verb','To look at written words and understand them.'],
  LEARN:['verb','To gain knowledge or skill through study or experience.'],
  TEACH:['verb','To help someone gain knowledge or skill.'],
  THINK:['verb','To use your mind to consider something.'],
  PLAY:['verb','To take part in a game or activity for enjoyment.'],
  MOVE:['verb','To change position or go from one place to another.'],
  TURN:['noun','An opportunity to act or play in a game.'],
  POINT:['noun','A unit used to measure a score.'],
  WIN:['verb','To be successful in a game or competition.'],
  LOSE:['verb','To fail to win a competition or game.'],
  TIE:['noun','A result in which both sides have the same score.'],
  MORE:['determiner','A greater amount or number.'],
  LESS:['determiner','A smaller amount or number.'],
  NEW:['adjective','Not used or known before; recently made.'],
  OLD:['adjective','Having existed or lived for a long time.'],
  BIG:['adjective','Large in size or amount.'],
  SMALL:['adjective','Little in size or amount.'],
  LONG:['adjective','Measuring a great distance from end to end.'],
  SHORT:['adjective','Not long in distance or time.'],
  GOOD:['adjective','Pleasant, useful or of a high standard.'],
  BEST:['adjective','Better than all others in a group.'],
  BAD:['adjective','Not good; poor or unpleasant.'],
  TRUE:['adjective','Correct or agreeing with the facts.'],
  FALSE:['adjective','Not true or correct.'],
  EASY:['adjective','Not difficult to do or understand.'],
  HARD:['adjective','Difficult to do; or solid and firm.'],
  OPEN:['verb','To move something so that it is no longer closed.'],
  CLOSE:['verb','To shut something or bring parts together.'],
  START:['verb','To begin doing something.'],
  STOP:['verb','To bring an action or movement to an end.'],
  BEGIN:['verb','To start.'],
  END:['noun','The final part of something.'],
  AGAIN:['adverb','One more time.'],
  ALSO:['adverb','As well; in addition.'],
  ONLY:['adverb','And no one or nothing else.'],
  EVEN:['adverb','Used to emphasise something surprising or unexpected.'],
  VERY:['adverb','To a great degree.'],
  JUST:['adverb','Only or exactly, depending on context.'],
  STILL:['adverb','Continuing up to the present time.'],
  NEAR:['preposition','At or a short distance from.'],
  FAR:['adverb','A long distance away.'],
  OVER:['preposition','Above or across something.'],
  UNDER:['preposition','Below or beneath something.'],
  NEXT:['adjective','Following immediately after another.'],
  LAST:['adjective','Coming after all the others.'],
  FIRST:['adjective','Coming before all others.'],
  SAME:['adjective','Not different.'],
  DIFFERENT:['adjective','Not the same as something else.'],
  WISE:['adjective','Showing good judgement and understanding.'],
  WIT:['noun','The ability to say clever or amusing things.'],
  JOKE:['noun','Something said or done to make people laugh.'],
  LAUGH:['verb','To make sounds or movements that show amusement.'],
  LAUGHTER:['noun','The sound or act of laughing.'],
  GOAT:['noun','An animal with horns, often kept for its milk, meat or wool.'],
  GIFT:['noun','Something given to another person as a present.'],
  HOAX:['noun','A trick or false story designed to fool people.'],
  TUG:['verb','To pull something sharply or with effort.'],
  ORG:['abbreviation','A shortened form of organisation, often used in website addresses.'],
  DEF:['adjective','A slang word meaning excellent or impressive.'],
  MOAT:['noun','A deep ditch, often filled with water, around a castle.'],
  TAT:['noun','Cheap or poor-quality decorative objects.'],
  DIRT:['noun','Earth, dust or something that makes an object unclean.'],
  FAIR:['adjective','Treating people equally and following the rules.'],
  MANE:['noun','The long hair on a horse’s or lion’s neck.'],
  BIRTH:['noun','The moment when a baby or young animal is born.'],
  TONE:['noun','The quality of a sound or the way someone speaks.'],
  WATER:['noun','The clear liquid people, animals and plants need to live.'],
  FLOWER:['noun','The colourful part of a plant that can make seeds.'],
  GARDEN:['noun','An area where flowers, trees or vegetables are grown.'],
  HOUSE:['noun','A building where people live.'],
  TABLE:['noun','A piece of furniture with a flat top and legs.'],
  VOWEL:['noun','A speech sound commonly represented by A, E, I, O or U.'],
  LETTER:['noun','A written symbol used to represent a sound.'],
  WORD:['noun','A unit of language with a meaning.'],
  WORDS:['noun','Units of language that carry meanings.'],
  GAME:['noun','An activity played for enjoyment, often using rules.'],
  SWAP:['verb','To exchange one thing for another.'],
  PASS:['verb','To let your turn go by without making a move.'],
  SCORE:['noun','The number of points a player has won.'],
  BIRD:['noun','An animal with feathers, a beak and wings.'],
  TREE:['noun','A tall plant with a woody trunk and branches.'],
  RETURN:['verb','To come or go back to a place.'],
  VOW:['noun','A serious promise.'],
  WAVE:['noun','A moving swell on water; also a gesture made with the hand.'],
  WAKE:['verb','To stop sleeping or to rouse someone from sleep.'],
  AWAKE:['adjective','Not asleep.'],
  JAIL:['noun','A place where people are held as prisoners.'],
  LANE:['noun','A narrow road or a marked section of a larger road.'],
  COLOUR:['noun','The appearance of something resulting from the light it reflects.'],
  CENTRE:['noun','The middle of something.'],
  FAVOUR:['noun','An act of kindness or help given to someone.'],
  ORGANISE:['verb','To arrange or plan things in an orderly way.'],
  TRAVELLING:['verb','Going from one place to another.'],
  THEATRE:['noun','A building where plays are performed.'],
};

export function parseDictionaryResponse(data){
  if(!Array.isArray(data))return [];
  const seen=new Set(),result=[];
  for(const entry of data){
    for(const meaning of entry?.meanings||[]){
      for(const item of meaning.definitions||[]){
        const definition=typeof item?.definition==='string'?item.definition.trim():'';
        if(!definition||seen.has(definition.toLowerCase()))continue;
        seen.add(definition.toLowerCase());
        result.push({partOfSpeech:String(meaning.partOfSpeech||''),definition:definition.slice(0,400)});
        if(result.length>=24)return result;
      }
    }
  }
  return result;
}

/** Convert Wiktionary's small HTML definition fragments into safe plain text.
 * The UI additionally escapes this text before inserting it into HTML. */
export function plainDefinition(html){
  return String(html||'').replace(/<[^>]*>/g,' ')
   .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(Number(n),0x10ffff)))
   .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/g,entity=>({'&nbsp;':' ','&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'})[entity]||entity)
   .replace(/\s+/g,' ').trim().slice(0,400);
}

export function parseWiktionaryResponse(data){
  const english=Array.isArray(data?.en)?data.en:[];
  const entries=[],seen=new Set();
  for(const meaning of english){
    for(const sense of meaning.definitions||[]){
      const definition=plainDefinition(sense?.definition);
      if(!definition||seen.has(definition.toLowerCase()))continue;
      seen.add(definition.toLowerCase());
      entries.push({partOfSpeech:String(meaning.partOfSpeech||''),definition});
      if(entries.length>=24)return entries;
    }
  }
  return entries;
}


/** Keep the readable, English-language senses rather than blindly displaying the
 * first dictionary API definitions. The underlying playing dictionary is
 * independent; rejecting a *definition* never rejects a legal move. */
const NON_WORD_POS=/\b(symbol|initialism|acronym|proper noun|letter|code|prefix|suffix)\b/i;
const TECHNICAL_GLOSS=[
  /\b(?:ISO\s*\d+|BCP\s*47|Unicode|ASCII|UTF[ -]?\d+|IETF|HTML|XML|CSS|HTTP)\b/i,
  /\b(?:language|country|currency|region) code\b/i,
  /\b(?:code|symbol|abbreviation) for (?:the )?(?:German|French|English|Spanish|Chinese|[A-Z]{2,})\b/i,
  /\b(?:Cyrillic|Greek|Latin) (?:script )?letter\b/i,
  /\b(?:file extension|internet domain|domain suffix|top.level domain|programming language|software package|command.line|operator|keyboard shortcut|chemical symbol)\b/i,
  /\b(?:identifier|markup tag|web address|URL parameter|abbreviation of an? (?:internet|software))\b/i,
  /^(?:from|to|of)\s*\(operator\)/i,
];
export function definitionQuality(entry){
  const description=String(entry?.definition||'').replace(/\s+/g,' ').trim();
  const part=String(entry?.partOfSpeech||'').trim().toLowerCase();
  if(description.length<9 || NON_WORD_POS.test(part) || TECHNICAL_GLOSS.some(rule=>rule.test(description)))return -1;
  // Prefer ordinary grammatical uses, clear sentences, and uncomplicated text.
  let score=10;
  if(/^(noun|verb|adjective|adverb|preposition|pronoun|conjunction|determiner|interjection|exclamation|particle)$/.test(part))score+=30;
  else if(part==='')score+=12;
  if(description.length>=20 && description.length<=180)score+=8;
  if(/[.?!]$/.test(description))score+=3;
  if(/\b(?:obsolete|archaic|rare|chiefly historical|technical term|initialism)\b/i.test(description))score-=18;
  if(/\b(?:slang|vulgar|offensive|derogatory|coarse|taboo)\b/i.test(description))score-=16;
  if(/[{}<>]|(?:\b[a-z]\b\s*\(\s*[a-z]\s*\))/i.test(description))score-=10;
  return score;
}
export function selectReadableMeanings(entries,limit=3){
  if(!Array.isArray(entries))return [];
  const seen=new Set();
  return entries.map((entry,index)=>({entry,index,score:definitionQuality(entry)}))
    .filter(item=>item.score>=15)
    .sort((a,b)=>b.score-a.score||a.index-b.index)
    .filter(item=>{const key=item.entry.definition.trim().toLowerCase();if(seen.has(key))return false;seen.add(key);return true;})
    .slice(0,limit).map(item=>item.entry);
}

// Separate version keeps old, less carefully prioritised saved senses from
// overriding the improved word discovery experience. Saved matches are separate.
const CACHE_KEY='letterloom-definition-cache-v3';
const MAX_SENSES=9;

function distinctOtherMeanings(primary, onlineEntries){
  const normalise=definition=>String(definition||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
  const seen=new Set([normalise(primary.definition)]);
  return onlineEntries.filter(entry=>{
    const value=normalise(entry.definition);
    if(!value||seen.has(value))return false;
    seen.add(value);return true;
  }).slice(0,MAX_SENSES-1);
}

export function createDefinitionLookup({fetcher=globalThis.fetch,storage=globalThis.localStorage,online=()=>typeof navigator==='undefined'||navigator.onLine!==false}={}){
  let memo={};
  try{const value=JSON.parse(storage?.getItem(CACHE_KEY)||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))memo=value;}catch{}
  const inFlight=new Map();
  function cached(key){
    const saved=memo[key];
    // The cache stores the original provider so Wiktionary attribution remains visible.
    if(!saved||!Array.isArray(saved.entries))return null;
    const entries=selectReadableMeanings(saved.entries,MAX_SENSES);
    return entries.length?{entries,source:saved.source||'Previously looked up',provider:saved.provider}:null;
  }
  function save(key,entries,provider){
    memo[key]={entries,source:provider.source,provider:provider.provider};
    try{
      const keys=Object.keys(memo);while(keys.length>150){delete memo[keys.shift()];}
      storage?.setItem(CACHE_KEY,JSON.stringify(memo));
    }catch{}
  }
  async function fetchMeanings(key){
    if(inFlight.has(key))return inFlight.get(key);
    const promise=(async()=>{
      const slug=encodeURIComponent(key.toLowerCase());
      const providers=[
        {url:`https://en.wiktionary.org/api/rest_v1/page/definition/${slug}`,parse:parseWiktionaryResponse,source:'Wiktionary contributors (CC BY-SA 4.0)',provider:'wiktionary'},
        {url:`https://api.dictionaryapi.dev/api/v2/entries/en/${slug}`,parse:parseDictionaryResponse,source:'Free Dictionary API',provider:'free-dictionary'}
      ];
      let missing=0;
      try{
        for(const provider of providers){
          const controller=new AbortController();
          const timeout=setTimeout(()=>controller.abort(),4500);
          try{
            const response=await fetcher(provider.url,{signal:controller.signal});
            if(!response.ok){if(response.status===404)missing++;continue;}
            const entries=selectReadableMeanings(provider.parse(await response.json()),MAX_SENSES);
            if(!entries.length){missing++;continue;}
            save(key,entries,provider);
            return {status:'found',entries,source:provider.source,provider:provider.provider};
          }catch{/* Try the other provider. */}
          finally{clearTimeout(timeout);}
        }
        return {status:missing===providers.length?'not-found':'unavailable',entries:[]};
      }finally{inFlight.delete(key);}
    })();
    inFlight.set(key,promise);return promise;
  }
  return async function lookUp(word,{includeAlternatives=false}={}){
    const key=String(word||'').toUpperCase();
    if(!/^[A-Z]{2,15}$/.test(key))return {status:'unavailable',entries:[]};
    const local=OFFLINE_MEANINGS[key];
    const primary=local?{partOfSpeech:local[0],definition:local[1]}:null;
    // The curated, straightforward explanation always takes precedence.
    // More unusual online senses are fetched ONLY on explicit request.
    if(primary&&!includeAlternatives)return {status:'found',entries:[primary],source:'Letterloom quick meanings',canLookUpMore:true};
    const stored=cached(key);
    if(primary){
      if(stored){
        return {status:'found',entries:[primary,...distinctOtherMeanings(primary,stored.entries)],
          source:'Letterloom quick meanings',otherSource:stored.source,otherProvider:stored.provider,canLookUpMore:false};
      }
      if(!online())return {status:'found',entries:[primary],source:'Letterloom quick meanings',moreStatus:'offline',canLookUpMore:false};
      const fetched=await fetchMeanings(key);
      return {status:'found',entries:[primary,...distinctOtherMeanings(primary,fetched.entries||[])],
        source:'Letterloom quick meanings',otherSource:fetched.source,otherProvider:fetched.provider,
        moreStatus:fetched.status==='found'?'':fetched.status,canLookUpMore:false};
    }
    if(stored)return {status:'found',entries:stored.entries,source:stored.source+' (saved offline)',provider:stored.provider,canLookUpMore:false};
    if(!online())return {status:'offline',entries:[]};
    return fetchMeanings(key);
  };
}
