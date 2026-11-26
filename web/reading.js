import { candidateContexts } from './history.js';
import { describeProfile } from './profile.js';

const excerpt = (s,n) => s.length > n ? s.slice(0,n-1)+'…' : s;
const roleHints = [
  [/전돌|벽돌/,'전돌을 고르는 공인'],[/큰 종|주조/,'종 무늬를 다듬는 장인'],[/우표|우편|우정/,'소식을 배달하는 체전부'],
  [/경판|판가/,'경판을 돌보는 판전지기'],[/약재|약초/,'약재를 가리는 일꾼'],
  [/말에게 먹일|일행의 소식/,'길을 안내하는 마을 사람'],[/화물|선적|짐칸/,'뱃짐을 돌보는 선원'],
  [/실을|직조|베틀/,'모시를 짜는 직인'],[/돌려 볼 책|강학/,'서책을 베끼는 필사자'],
  [/거래|값을 옮겨/,'왜관의 통역 일꾼'],[/가면|악사/,'탈놀이 광대'],[/상차림|음식을 내는/,'숙설소의 조리 일꾼']
];
function workName(ctx) {
  const hint = roleHints.find(([pattern])=>pattern.test(ctx.work));
  return hint?.[1] || '현장 일꾼';
}
function personalAside(p) {
  const s = p.personality;
  if (/미루|게으|느긋|마감|벼락치기/.test(s) && /밥|사람|친구|챙|베풀|돈/.test(s)) return '내 일은 내일 해도 남의 밥값은 오늘 냅니다. 주변 사람들한테만큼은 마감이 참 정확하군요.';
  if (/미루|게으|느긋|마감|벼락치기/.test(s)) return '끝내 해내기는 합니다. 다만 매번 그걸 확인하느라 마지막 날의 내가 고생하는군요.';
  if (/밥|사람을 잘 챙|거절|부탁|양보/.test(s)) return '남의 몫은 참 빨리 알아보시네요. 자기 차례가 와도 그렇게 눈치가 빠른지는 궁금합니다.';
  if (/꼼꼼|완벽|다시 확인|파고들|끝까지/.test(s)) return '일이 끝났다는 말보다 마지막으로 한 번만 더 본다는 말을 믿는 편이겠습니다.';
  return '“'+excerpt(s,38)+'.” 스스로 적고 보니 전생의 그 사람한테만 한마디 하기도 좀 어렵겠군요.';
}
function localClues(p,c,role) {
  const items=[{label:'얼굴 관상',detail:p.face[0]+' 전통 관상에서는 이 부위를 재백궁이라 불렀습니다.'},
    {label:'직업',detail:'지금 하는 일은 ‘'+p.job+'’입니다. '+c.place+'에서 '+role+'에게 필요한 손놀림은 이런 일에서 드러납니다. '+c.work.split(',')[0]+'.'},
    {label:'성격',detail:'직접 적은 버릇은 “'+excerpt(p.personality,100)+'”입니다. 주인공이 난처해졌을 때 누구를 먼저 챙기고 무엇을 뒤로 미루는지 떠올려 보세요.'},
    {label:'생년월일',detail:'태어난 계절은 '+p.season+'입니다. 그 계절의 빛과 날씨가 이야기의 시간 단서입니다.'}];
  if(p.wealth)items.push({label:'내 재산',detail:'선택한 현재 순자산 구간은 ‘'+p.wealth+'’입니다. 재산을 어떻게 모았는지는 입력만으로 알 수 없습니다.'});
  if(p.family)items.push({label:'집안 형편',detail:'어릴 적 살림을 ‘'+p.family+'’라고 기억합니다. 지금 가진 재산과는 별개의 출발점입니다.'});
  items.push({label:'성씨·본관',detail:p.clan?'성은 '+p.surname+'씨, 본관은 '+p.clan+'입니다. 이 단서로 확인되는 것은 성의 연고까지입니다.':'성은 '+p.surname+'씨입니다. 구체적인 연고지는 비워두었습니다.'});
  return items;
}

function readLocal(text,p,c) {
  const lines = text.replace(/<think>[\s\S]*?<\/think>/gi,'').replace(/[*#]/g,'').trim().split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const tag = name => lines.find(s=>s.startsWith(name+'：')||s.startsWith(name+':'))?.replace(/^[^:：]+[:：]\s*/,'');
  const story = lines.filter(s=>!(/^(제목|직업|한마디|팩폭|시대|장소|역할)\s*[:：]/.test(s))).map(s=>s.replace(/^(이야기|본문|첫째 문단|둘째 문단)\s*[:：]\s*/,'')).filter(s=>(s.match(/[가-힣]/g)||[]).length>=10);
  if((story.join('').match(/[가-힣]/g)||[]).length<45) throw new Error('기기 AI가 온전한 한국어 이야기를 마치지 못했어요. 한 번 더 시도해주세요.');
  let paragraphs=story.slice(0,5);
  if(paragraphs.length===1) {
    const sentences=paragraphs[0].match(/[^.!?。！？]+[.!?。！？]+(?:[”’])?|[^.!?。！？]+$/g)||paragraphs;
    if(sentences.length>=4) {const cut=Math.ceil(sentences.length/2); paragraphs=[sentences.slice(0,cut).join('').trim(),sentences.slice(cut).join('').trim()];}
  }
  const role=excerpt(tag('직업')||tag('역할')||workName(c),30);
  const title=excerpt(tag('제목')||c.place+'의 '+role,40);
  const firstSentence=paragraphs[0].split(/(?<=[.!?])\s/)[0];
  return {title,role,summary:excerpt(firstSentence,78),roast:excerpt(tag('팩폭')||personalAside(p),120),paragraphs,clues:localClues(p,c,role)};
}

export async function generateReading(profile,mode,signal,onProgress) {
  const choices=candidateContexts(profile);
  let c=choices[0];
  const p=describeProfile(profile,c);
  let result;
  if(mode==='local') {
    const {completeLocal}=await import('./local-model.js');
    const messages=[
      {role:'system',content:'당신은 한국어 역사소설 작가입니다. 인물 한 사람의 일화만 자연스러운 한국어로 씁니다. /no_think'},
      {role:'user',content:'시대와 장소: '+c.era+' '+c.place+'. 당시의 일: '+c.work+'. 현장: '+c.detail+'\n현생 직업: '+p.job+'. 이 사람이 직접 적은 버릇: '+p.personality+'. 태어난 계절: '+p.season+'. 집안 형편: '+(p.family||'미상')+'. 재산 구간: '+(p.wealth||'미상')+'. 성씨와 본관: '+p.surname+' '+p.clan+'. 얼굴 묘사: '+p.face[0]+'\n전생의 주인공이 자기 버릇 때문에 곤란해졌다가 뜻밖의 선택을 하는 짧은 사연을 쓰세요. 현대 정보와 숫자를 그대로 복사하지 마세요. 성씨로 조상이나 적군을 단정하지 마세요. 첫 줄은 제목: 뒤에 짧은 제목, 둘째 줄은 직업: 뒤에 당시 직업, 이어서 2인칭 한국어 이야기 4~6문장을 쓰세요. 해설은 생략합니다.'}
    ];
    const answer=await completeLocal({messages,onProgress,signal,maxTokens:350});
    result=readLocal(answer,p,c);
  } else {
    onProgress('당신이 적은 단서로 전생의 한 장면을 쓰고 있어요…');
    const {era,place,work,detail,...person}=p;
    const candidates=choices.map(({era,place,work,detail})=>({era,place,work,detail}));
    let response;
    try {response=await fetch('./api/reading',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...person,candidates}),signal});}
    catch(e){if(signal.aborted)throw e;throw new Error('서버에 연결되지 않았어요. 인터넷 연결을 확인하고 다시 시도해주세요.');}
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data?.reading)throw new Error(data?.error||'서버 AI가 응답하지 않았습니다. 다시 시도하거나 내 기기 AI를 선택해주세요.');
    result=data.reading;
    c=choices[result.background]||choices[0];
  }
  return {...result,era:c.era,place:c.place,history:c.history,sources:c.sources,engine:mode==='local'?'기기 AI':'서버 AI'};
}

