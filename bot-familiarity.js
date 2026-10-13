// Relaxed Play preference only. This NEVER changes the shared legal dictionary.
// All words formed by a move (including perpendicular cross-words) are checked.
// A rare word may still be used when the computer cannot find a more familiar play.

// Two-letter words most people recognise in ordinary British English. A word
// absent from this short list is still playable, but not preferred by the bot.
export const FAMILIAR_SHORT_WORDS = new Set(`
AD AH AM AN AS AT AY AW BE BY DO EH EX GO HA HE HI HO IF IN IS IT MA ME MY NO OF OH OI OK ON OR OW OX PA PI RE SH SO TA TO UH UM UP US WE YA YE YO
`.trim().split(/\s+/));

// Shortened regional slang, specialist forms and obscure game vocabulary
// recently reported by players. Avoid as COMPUTER moves where any comfortable
// alternative exists; all remain valid for both sides whenever legal.
export const UNFAMILIAR_BOT_WORDS = new Set(`
AB AE AI AA BA BO CH DA DE DI EA EE EF EL EN ER ET EW FA FE FI FY GI GU HM IO JA JO KA KI KO KY LI LU NA NE NG NY OB OD OE OG OM OO OP OU OY PE PO QI QO RA RI ST TE UG UR UY XU YU ZA
ILIUM ORG
`.trim().split(/\s+/));

// Words in the known familiar-word bank provide a useful starting point, but
// some technical words slipped into that bank in previous versions.
export function assessMoveFamiliarity(formedWords, familiarWords){
  const words=formedWords.map(item=>typeof item==='string'?item:item.word).map(w=>String(w).toUpperCase());
  if(!words.length)return 0;
  let worst=2;
  for(const word of words){
    if(UNFAMILIAR_BOT_WORDS.has(word))return 0;
    if(word.length===2 && !FAMILIAR_SHORT_WORDS.has(word))worst=Math.min(worst,1);
    else if(word.length>=3 && familiarWords && !familiarWords.has(word))worst=Math.min(worst,1);
  }
  return worst;
}
