const quizFields={title:80,role:64,era:120,place:160,summary:240,period:16,choiceMade:80,choiceOther:80};

export function quizCard(reading) {
  return Object.fromEntries(Object.entries(quizFields).map(([key,max])=>[
    key,typeof reading[key]==='string' ? reading[key].trim().slice(0,max) : '',
  ]));
}

export function quizLink(card) {
  const bytes=new TextEncoder().encode(JSON.stringify(quizCard(card)));
  const encoded=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  return 'https://jeonsaengrok.com/friend.html#v1.'+encoded;
}

export function readQuiz(hash) {
  if(typeof hash!=='string' || hash.length>5000 || !/^#v1\.[a-zA-Z0-9_-]+$/.test(hash))return null;
  try{
    const raw=atob(hash.slice(4).replaceAll('-','+').replaceAll('_','/'));
    const card=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0))));
    if(!card || Object.entries(quizFields).some(([key,max])=>typeof card[key]!=='string' || card[key].length>max))return null;
    if(!card.title.trim() || !card.role.trim())return null;
    return quizCard(card);
  }catch{return null;}
}

export function hasChoices(card) {
  return Boolean(card.choiceMade && card.choiceOther && card.choiceMade!==card.choiceOther);
}

export function storySections(reading) {
  const [opening,action,...ending]=reading.paragraphs || [];
  const options=reading.reverseChoices ? [reading.choiceOther,reading.choiceMade] : [reading.choiceMade,reading.choiceOther];
  return [
    ['이야기의 시작',opening],
    ['그날의 갈림길',hasChoices(reading)?options.map(x=>'· '+x).join('\n'):''],
    ['전생의 내가 한 선택',[reading.choiceMade,action].filter(Boolean).join('\n\n')],
    ['그날 이후',ending.join('\n\n')],
    ['당신이 남긴 물건'+(reading.keepsake?' · '+reading.keepsake:''),reading.keepsakeStory],
    ['다른 선택을 했다면?',[reading.choiceOther,reading.otherOutcome].filter(Boolean).join('\n\n')],
  ].filter(([,value])=>value);
}

export function storyText(reading) {
  return [reading.title,[reading.era,reading.place,reading.role].filter(Boolean).join(' · '),reading.summary,
    ...storySections(reading).map(([heading,body])=>heading+'\n'+body),'전생록 · 역사에서 영감을 얻은 창작 이야기'].filter(Boolean).join('\n\n');
}

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs=text=>String(text||'').split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+escapeHtml(p)+'</p>').join('\n');
function section(title,body) {
  return body ? '<section><h2>'+escapeHtml(title)+'</h2>'+paragraphs(body)+'</section>' : '';
}
function sourceList(sources=[]) {
  const links=sources.filter(s=>s && /^https:\/\//i.test(s.url)).map(s=>'<li><a href="'+escapeHtml(s.url)+'" rel="noreferrer">'+escapeHtml(s.label)+'</a></li>');
  return links.length?'<ul>'+links.join('')+'</ul>':'';
}

export function fullRecordHtml(reading,{pick,observations=[],references=[],isExample=false}={}) {
  const chosen=['choiceMade','choiceOther'].includes(pick) && reading[pick];
  const clues=(reading.clues||[]).filter(c=>c.label!=='전생에 쌓은 복');
  const fortune=reading.fortune || reading.clues?.find(c=>c.label==='전생에 쌓은 복')?.detail;
  const choices=storySections(reading).map(([heading,body])=>section(heading,body)
    +(heading==='그날의 갈림길' && chosen ? section('지금의 내가 고른 선택',chosen+'\n'+(pick==='choiceMade'?'전생의 당신도 같은 선택을 했습니다.':'전생의 당신은 다른 쪽을 택했습니다.')):'')).join('\n');
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    +'<meta name="referrer" content="no-referrer"><title>'+escapeHtml(reading.title)+' · 전생록</title><style>'
    +'html{color:#293d34;background:#f4efe3}body{margin:0 auto;max-width:42rem;padding:clamp(1.25rem,5vw,3rem);background:#fffdf7;font:1.05rem/1.85 Georgia,"Malgun Gothic",serif;overflow-wrap:anywhere}header{border-bottom:2px solid #445e4e;padding-bottom:1rem}h1{font-size:clamp(1.8rem,5vw,2.6rem);line-height:1.4;margin:.4rem 0}h2{font-size:1.15rem;margin:1.6rem 0 .25rem;color:#68472d}p{white-space:pre-line;margin:.55rem 0}a{color:#295846}small{color:#78523b}@page{margin:18mm}@media print{html,body{background:white}body{padding:0;max-width:none;font-size:11pt}h1,h2{break-after:avoid}p{orphans:3;widows:3}}'
    +'</style></head><body><header><small>전생록 · '+(isExample?'예시 기록':'나의 전생 기록')+'</small><h1>'+escapeHtml(reading.title)+'</h1>'
    +paragraphs([reading.era,reading.place,reading.role].filter(Boolean).join(' · '))+paragraphs(reading.summary)+'</header><main>'
    +choices+section('내 성격에서 온 단서',reading.habitCue)+section('이번 생에 돌아온 복',fortune)
    +clues.map(c=>section(c.label,c.detail)).join('')
    +(observations.length?section('부위별 얼굴 측정값',observations.map(o=>[o.name,o.reading].filter(Boolean).join(' · ')).join('\n')):'')
    +section('기록과 창작 사이',reading.history)+sourceList(reading.sources)
    +references.map(ref=>section(ref.heading,ref.body)+sourceList(ref.sources)).join('')
    +'</main><footer><hr><small>전생록 · 역사와 전통 관상에서 영감을 얻은 창작 이야기</small></footer></body></html>';
}
