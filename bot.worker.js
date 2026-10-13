import {findBotMove,findQuickBotMove} from './bot.js?v=1.19.0';
import {createLegalDictionary} from './engine.js?v=1.9.0';
import {loadBritishWords} from './uk-dictionary.js?v=1.9.0';
let dictionaryPromise;
let commonPromise;
let everydayPromise;
const fetchWords=(url)=>fetch(url).then(response=>{if(!response.ok)throw Error('Could not load word list');return response.text()}).then(text=>text.trim().split(/\s+/));
self.onmessage=async({data})=>{
  if(!['move','hint'].includes(data.type))return;
  try{
    const relaxed=data.game.playStyle==='relaxed';
    dictionaryPromise??=loadBritishWords().then(result=>result.words);
    if(relaxed)everydayPromise??=fetchWords('./everyday-words.txt?v=1.9.0');
    else commonPromise??=fetchWords('./bot-words.txt?v=1.9.0');
    const [baseDictionary,words]=await Promise.all([dictionaryPromise,relaxed?everydayPromise:commonPromise]);
    const dictionary=createLegalDictionary(baseDictionary,data.game.playStyle);
    const candidates=words.filter(w=>dictionary.has(w));
    // Provide an immediately valid backup. If a slow device times out during
    // full move search, the app can play this rather than passing by mistake.
    if(data.type==='move'){
      const backup=findQuickBotMove(data.game,dictionary,{preferFamiliar:relaxed,familiarWords:relaxed?new Set(candidates):null});
      self.postMessage({type:'backup',turn:data.game.turn,move:backup});
    }
    const move=findBotMove(data.game,candidates,dictionary,data.type==='hint'?1600:relaxed?3000:2000,{gentle:relaxed && data.type==='move',preferFamiliar:relaxed,familiarWords:relaxed?new Set(candidates):null});
    self.postMessage({type:data.type,turn:data.game.turn,move});
  }catch(error){self.postMessage({type:'error',request:data.type,turn:data.game.turn,message:error.message});}
};
