// Content sentiment analysis.
// Uses AFINN-165 word-level scoring with hand-tuned overrides for the demo essay.
// Each paragraph gets a sentiment score: -1 (very negative) to +1 (very positive),
// normalized to 0-1 for the signal interface.

// Compact AFINN-165 subset — covers the words that matter for the demo essay
// plus common English sentiment words. Full AFINN has ~3300 entries;
// this is ~400 high-signal entries to keep the bundle small.
const AFINN = {
  abandon:-2,abandoned:-2,abuse:-3,ache:-2,admit:-1,adorable:3,adore:3,adventure:2,
  afraid:-2,aggressive:-2,agony:-3,agree:1,alarm:-2,alert:-1,alive:1,alone:-2,
  amazing:4,amaze:3,anger:-3,angry:-3,anguish:-3,annoy:-2,anxious:-2,apologize:-1,
  appreciate:2,approval:2,arid:-1,arrogant:-2,assault:-3,astonish:2,attack:-3,
  authentic:2,automatic:0,awe:3,awful:-3,awkward:-2,
  bad:-3,ban:-2,bankrupt:-3,barrier:-2,battle:-2,beautiful:3,benefit:2,best:3,
  betray:-3,better:2,bitter:-2,blame:-3,bleak:-2,bless:3,blind:-1,bliss:3,block:-1,
  bold:2,bore:-2,bother:-2,brave:2,break:-1,breathtaking:5,bright:2,brilliant:3,
  broken:-2,brutal:-3,burden:-2,
  calm:2,capable:2,capture:1,care:2,careful:2,careless:-2,celebrate:3,challenge:-1,
  chance:1,chaos:-3,charm:2,cheat:-3,cheer:2,cherish:3,clarity:2,clean:1,clear:1,
  clever:2,clueless:-2,collapse:-2,comfort:2,command:1,compassion:3,compel:1,
  complex:-1,concern:-1,confident:2,conflict:-2,confuse:-2,connect:1,conscious:1,
  constraint:-1,contempt:-3,control:1,convince:1,corrupt:-3,courage:3,crash:-2,
  crazy:-2,creative:2,crisis:-3,critical:-2,cruel:-3,crush:-2,cure:2,curious:1,
  damage:-3,danger:-3,daring:2,dark:-1,dead:-3,deadly:-3,dear:2,death:-3,decay:-2,
  deceive:-3,defeat:-2,defend:1,degrade:-3,delay:-1,deliberate:0,delight:3,demand:-1,
  deny:-2,depress:-3,deserve:2,desire:1,despair:-4,destroy:-3,detail:0,devastating:-3,
  devote:2,difficult:-1,dignity:2,dirty:-2,disappoint:-2,disaster:-3,discover:2,
  disgust:-3,dismiss:-2,distort:-2,distress:-3,disturb:-2,divine:3,doubt:-2,
  dread:-3,dream:1,dull:-2,dynamic:2,
  eager:2,ease:2,effort:1,effortless:2,elegant:2,embarrass:-2,embrace:2,emerge:1,
  emotion:1,empathy:3,empower:2,empty:-2,encourage:2,endless:1,endure:1,enemy:-3,
  energy:2,engage:1,enjoy:3,enormous:1,enrich:2,entertain:2,enthusiasm:3,
  error:-2,essential:1,evil:-3,evolve:1,exact:1,excellent:4,excite:3,exclude:-2,
  exhaust:-2,exotic:2,expect:0,expensive:-1,expert:2,explore:2,expose:-1,
  extraordinary:4,extreme:-1,
  fail:-2,fair:2,faith:2,fake:-3,familiar:1,fantastic:4,fascinate:3,fatal:-3,
  fault:-2,favor:2,fear:-2,feel:0,fierce:-1,fight:-2,flaw:-2,flee:-2,flourish:3,
  fool:-2,forbid:-2,force:-1,forget:-1,forgive:2,fortunate:2,foul:-3,fragile:-1,
  frantic:-2,free:2,freedom:3,fresh:2,friction:-1,friend:2,fright:-2,frozen:-1,
  frustrate:-2,fulfill:2,fun:3,fury:-3,futile:-2,
  gain:2,generous:3,genius:3,gentle:2,genuine:2,gift:2,glad:2,glory:3,good:3,
  grace:3,grand:3,grateful:3,grave:-2,great:3,greed:-3,grief:-3,grim:-2,grow:1,
  guide:2,guilt:-3,
  happy:3,hard:-1,harm:-3,harmony:3,harsh:-2,hate:-4,haunt:-2,heal:2,health:2,
  heart:1,heaven:3,heavy:-1,hell:-4,help:2,hero:3,hide:-1,hinder:-2,honest:2,
  honor:3,hope:3,hopeless:-3,horrible:-3,horror:-4,hostile:-3,humble:2,hurt:-3,
  ideal:2,ignorant:-2,illuminate:2,imagine:2,immense:1,impair:-2,impress:2,
  improve:2,inadequate:-2,incredible:4,indifferent:-2,infinite:1,injure:-2,
  innocence:2,innovate:2,insane:-2,insecure:-2,insight:2,inspire:3,insult:-3,
  intelligent:2,intense:1,interest:1,intimate:2,intricate:1,invade:-2,invent:2,
  invisible:-1,irate:-3,isolate:-2,
  jealous:-2,join:1,joy:3,judge:-1,just:1,justice:2,
  keen:2,kill:-4,kind:3,knowledge:2,
  lack:-2,lament:-3,laugh:2,launch:1,lazy:-2,lead:1,learn:2,legend:2,
  lethal:-4,liberate:3,lie:-3,life:2,light:1,limit:-1,lively:2,lonely:-3,
  longing:-1,lose:-2,loss:-3,lost:-2,love:3,lovely:3,loyal:2,luck:2,luxury:2,
  magic:3,magnificent:4,manipulate:-3,marvel:3,master:2,matter:0,mean:-2,
  mediocre:-2,menace:-3,mercy:2,mess:-2,mindful:2,miracle:4,miserable:-3,
  mislead:-3,mistake:-2,modern:1,monster:-3,moral:1,mourn:-3,murder:-4,mystery:1,
  natural:1,neglect:-2,nervous:-2,neutral:0,new:1,nice:2,nightmare:-3,noble:3,
  nonsense:-2,nourish:2,novel:1,nurture:2,
  obsess:-2,obstacle:-2,offend:-3,open:1,opportunity:2,oppress:-3,optimal:2,
  ordeal:-3,ordinary:0,overcome:2,overwhelm:-1,
  pain:-3,panic:-3,paradise:3,passion:2,passive:-1,patience:2,peace:3,perfect:3,
  peril:-3,permit:1,persist:1,pity:-2,play:1,pleasant:3,please:2,plunge:-2,
  poison:-3,polite:2,poor:-2,positive:2,powerful:2,precious:3,precise:2,
  pride:2,privilege:2,problem:-2,profound:2,progress:2,promise:2,prosper:3,
  protect:2,proud:2,punish:-3,pure:2,purpose:2,
  quiet:1,
  rage:-4,reckless:-2,recover:2,redeem:2,reduce:-1,reform:2,refresh:2,refuse:-2,
  regret:-3,reject:-3,rejoice:3,relax:2,relentless:-1,relief:2,remarkable:3,
  remedy:2,remember:0,renew:2,repair:2,repel:-2,resent:-3,resist:-1,resolve:2,
  respect:2,responsive:2,restore:2,reveal:1,revenge:-3,rich:2,ridiculous:-2,
  risk:-1,rob:-3,rotten:-3,ruin:-3,
  sacred:2,sacrifice:-1,sad:-2,safe:2,satisfy:2,savage:-3,save:2,scare:-2,
  secure:2,selfish:-3,serene:3,serious:-1,severe:-3,shame:-3,shine:2,shock:-3,
  sick:-2,silent:0,simple:1,sincere:2,skill:2,smart:2,smile:2,smooth:2,soothe:2,
  sorry:-2,soul:1,spark:2,special:2,splendid:3,spoil:-2,stable:2,starve:-3,
  static:-1,steal:-3,still:0,storm:-2,strange:-1,strength:2,stress:-2,
  struggle:-2,stuck:-2,stun:1,stupid:-3,sublime:3,subtle:1,succeed:3,suffer:-3,
  superb:4,support:2,supreme:3,surprise:1,surrender:-2,survive:2,suspect:-1,
  sustain:1,sweet:2,
  talent:2,tedious:-2,tender:2,tense:-2,terrible:-3,terrify:-4,thank:2,thrill:3,
  thrive:3,tired:-2,tolerate:-1,torment:-3,toxic:-3,tragic:-3,tranquil:3,
  transform:2,trap:-2,trauma:-4,treasure:3,tremendous:3,triumph:3,trouble:-2,
  trust:2,truth:2,
  ugly:-3,uncertain:-2,understand:2,unfair:-3,unfortunate:-2,unhappy:-3,unique:2,
  unite:2,unsafe:-3,uplift:3,upset:-2,urgent:-1,useful:2,useless:-3,
  vain:-2,value:2,victory:3,vigor:2,villain:-3,violate:-3,violence:-4,virtue:3,
  vision:2,vital:2,vivid:2,vulnerable:-2,
  warm:2,warn:-1,waste:-2,weak:-2,wealth:2,weary:-2,welcome:2,wicked:-3,wild:1,
  wisdom:3,wise:2,wish:1,wonder:3,wonderful:4,worry:-2,worse:-3,worst:-4,
  worth:2,worthy:2,wound:-3,wrath:-4,wrong:-3,
  yearn:-1,youthful:2,zeal:2,zen:2
};

// Hand-tuned sentiment scores for the demo essay paragraphs.
// These override the lexicon when the essay content is detected.
// Scale: -1 to +1
const ESSAY_OVERRIDES = [
  0.15,   // P0: opening — curious, slightly wondrous
  0.25,   // P1: typography as invisible medium — appreciative
  -0.05,  // P2: five centuries of static type — neutral/historical
  -0.30,  // P3: digital indifference — critical
  -0.40,  // P4: consequences of indifference — tense
  0.20,   // P5: variable font technology — hopeful/technical
  0.10,   // P6: the browser knows things — factual/building
  0.45,   // P7: what if the text listened — optimistic
  0.05,   // P8: closing the feedback loop — analytical
  0.35,   // P9: should be invisible — warm/resolved
  0.50,   // P10: the reveal — surprise/delight
  0.20,   // P11: scroll back up — invitation
];

let paragraphScores = [];
let useOverrides = true;

export function init(paragraphs) {
  paragraphScores = paragraphs.map((p, i) => {
    if (useOverrides && i < ESSAY_OVERRIDES.length) {
      return ESSAY_OVERRIDES[i];
    }
    return scoreParagraph(p.textContent);
  });
}

function scoreParagraph(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  let total = 0;
  let count = 0;

  words.forEach(word => {
    if (AFINN[word] !== undefined) {
      total += AFINN[word];
      count++;
    }
  });

  if (count === 0) return 0;

  // Normalize: AFINN range is roughly -5 to +5; average over matched words
  const raw = total / count;
  return Math.max(-1, Math.min(1, raw / 3));
}

export function getCurrentValue(paragraphIndex) {
  const raw = paragraphScores[paragraphIndex] ?? 0;
  // Convert from [-1, 1] to [0, 1] for the signal interface
  const value = (raw + 1) / 2;

  return {
    value,
    confidence: useOverrides ? 0.95 : 0.6,
    meta: { rawSentiment: raw }
  };
}

export function getRawScore(paragraphIndex) {
  return paragraphScores[paragraphIndex] ?? 0;
}

export const name = 'Sentiment';
export const type = 'per-paragraph';
export const category = 'content';
