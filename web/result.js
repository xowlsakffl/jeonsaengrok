import './site.js';
import { readSession, clearSession, writeSession } from './reading-session.js';
import { example } from './sample.js';
import { fullRecordLink, readFullRecord } from './result-export.js';
import { recordImage } from './record-image.js';
const $ = id => document.getElementById(id);
let activeReading = null;
let activeExample = false;
let activePick = null;
let faceObservations = [];
let savingCard = false;
let sharedView = false;
let currentLink;
let opening = 0;
function node(tag,text,className){
  const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;
}
function showProse(id,text) {
  const paragraphs=(text || '').trim().split(/\n\s*\n/).filter(Boolean);
  $(id).replaceChildren(...paragraphs.map(paragraph=>node('p',paragraph)));
}
function makeFaceGuide(observations, selectedIndex) {
  const details=node('details',undefined,'face-guide');
  details.append(node('summary','부위별 측정값 보기'));
  const box=node('div',undefined,'face-guide-frame');
  box.append($('measurementDiagram').content.cloneNode(true));
  const positions=[[50,57],[50,90],[50,43],[60,36]];
  const note=node('p',undefined,'face-note'),tabs=node('div',undefined,'face-tabs');
  note.setAttribute('aria-live','polite');
  const buttons=[],markers=[];
  observations.forEach(({name,reading},i)=>{
    const pin=node('span',String(i+1),'pin'), button=node('button',(i+1)+' '+name);
    pin.setAttribute('aria-hidden','true');
    pin.style.left=positions[i][0]+'%';
    pin.style.top=positions[i][1]+'%';
    button.type='button';
    button.addEventListener('click',()=>{
      buttons.forEach((b,j)=>{b.setAttribute('aria-pressed',String(j===i));markers[j].hidden=j!==i;});
      note.textContent=reading;
    });
    buttons.push(button);markers.push(pin);box.append(pin);tabs.append(button);
  });
  (buttons[selectedIndex] ?? buttons[0]).click();
  details.append(box,tabs,note);
  return details;
}

const periodKeys = ['early','ancient','joseon','modern','recent'];
function eraImage(period) {
  return periodKeys.includes(period) ? './assets/era-'+period+'.jpg' : './assets/landscape.jpg';
}

function revealScene(pick,fromButton=false) {
  const reading=activeReading;
  activePick=pick;
  prepareLink();
  const guessed = pick === 'choiceMade' || pick === 'choiceOther';
  $('comparison').textContent = guessed
    ? (pick === 'choiceMade' ? '전생의 당신도 같은 선택을 했습니다.' : '전생의 당신은 다른 쪽을 택했습니다.')
    : '그날의 기록을 펼쳤습니다.';
  $('dilemma').hidden = true;
  $('outcome').hidden = false;
  $('fortuneCard').hidden = !$('fortuneText').textContent;
  if (fromButton) {
    $('comparison').focus();
    if (!activeExample) {
      const session=readSession();
      if (session?.reading?.title === reading.title && session.reading.place === reading.place) {
        try { writeSession({...session,scenePick:pick}); } catch {}
      }
    }
  }
}
$('skipChoice').addEventListener('click',()=>revealScene('skip',true));
$('fortuneSource').append($('fortuneReference').content.cloneNode(true));

function showReading(reading,isExample,session,shared = false) {
  sharedView = shared;
  $('unavailableRecord').hidden=true;
  activeReading = reading;
  activeExample = isExample;
  activePick=null;
  faceObservations=isExample ? [] : session?.profile?.face?.observations || [];
  $('manualCopy').hidden=true;
  $('resultBack').hidden=shared;
  $('resultView').hidden = false;
  document.title=reading.role+' · 전생록';
  $('resultKind').textContent=shared?'친구가 보낸 전생 인물첩':isExample?'전생 인물첩 · 예시':'전생 인물첩 · '+reading.engine+' 집필';
  $('resultTitle').textContent=reading.title;
  $('resultEra').textContent=reading.era;
  $('resultPlace').textContent=reading.place;
  $('resultRole').textContent=reading.role;
  $('eraArt').src=eraImage(reading.period);
  const [opening,action,...ending]=reading.paragraphs;
  showProse('sceneOpening',opening);
  showProse('sceneDeed',action);
  $('habitEcho').hidden=!reading.habitCue;
  $('habitEcho').textContent=reading.habitCue ? '내 성격에서 온 단서 · “'+reading.habitCue+'”' : '';
  showProse('sceneEnding',ending.join('\n\n'));
  $('keepsakeSection').hidden=!(reading.keepsake && reading.keepsakeStory);
  $('keepsakeTitle').textContent='당신이 남긴 물건 · '+(reading.keepsake || '');
  showProse('keepsakeText',reading.keepsakeStory || '');
  $('otherPath').hidden=!reading.otherOutcome;
  $('otherPath').open=false;
  showProse('otherText',reading.otherOutcome || '');
  $('fortuneText').textContent=reading.fortune || reading.clues.find(clue=>clue.label==='전생에 쌓은 복')?.detail || '';
  $('outcome').hidden=true;
  $('fortuneCard').hidden=true;
  $('dilemma').hidden=false;
  $('sceneChoices').replaceChildren();
  const keys=reading.reverseChoices ? ['choiceOther','choiceMade'] : ['choiceMade','choiceOther'];
  if (keys.every(key=>reading[key]) && reading.choiceMade!==reading.choiceOther) {
    for (const key of keys) {
      const button=node('button',reading[key]);
      button.type='button';
      button.addEventListener('click',()=>revealScene(key,true));
      $('sceneChoices').append(button);
    }
    if (!isExample && ['choiceMade','choiceOther','skip'].includes(session?.scenePick)) revealScene(session.scenePick);
  } else {
    revealScene('skip');
  }
  $('storyQuote').textContent=reading.summary;
  $('clues').replaceChildren(...reading.clues.filter(clue=>clue.label!=='전생에 쌓은 복').map(clue=>{
    const div=node('div',undefined,'clue');
    const description=node('dd',clue.detail);
    if (clue.label==='얼굴 관상') description.append($('faceReference').content.cloneNode(true));
    const measurements=faceObservations;
    if (clue.label==='얼굴 관상' && !isExample && measurements?.length===4) {
      if(shared){
        const list=node('ul');
        for(const item of measurements)list.append(node('li',item.name+' · '+item.reading));
        description.append(list);
      }else description.append(makeFaceGuide(measurements,reading.faceIndex));
    }
    div.append(node('dt',clue.label),description);
    return div;
  }));
  $('historyText').textContent=reading.history;
  $('sourceLinks').replaceChildren(...reading.sources.filter(s=>/^https:\/\//.test(s.url)).map(s=>{const a=node('a',s.label);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';return a;}));
  $('resultBack').querySelector('span').textContent=isExample?'풀이로 돌아가기':'입력 수정하기';
  $('again').textContent=isExample?'내 전생 풀이하기':'새 전생 풀이 시작';
  $('resultMessage').textContent='';
  const sharedChoices=$('sharedChoices');
  sharedChoices.replaceChildren();
  sharedChoices.hidden=!shared || !(reading.choiceMade || reading.choiceOther);
  if(!sharedChoices.hidden){
    const picked=session?.scenePick;
    for(const [label,answer] of [['전생 인물이 고른 쪽',reading.choiceMade],['또 다른 갈림길',reading.choiceOther],['공유한 사람이 고른 쪽',['choiceMade','choiceOther'].includes(picked) && reading[picked]]]){
      if(answer)sharedChoices.append(node('dt',label),node('dd',answer));
    }
  }
  $('explain').open=shared;
  if(shared){
    revealScene(session?.scenePick || 'skip');
    $('otherPath').open=true;
    for(const detail of document.querySelectorAll('#explain details, #fortuneCard details')) detail.open=true;
    $('again').textContent='나도 전생 테스트 하기';
  }
  prepareLink();
  $('readingNav').classList.toggle('nav-current',!isExample);
  document.querySelector('.masthead [data-example]').classList.toggle('nav-current',isExample);
  window.scrollTo(0,0);
  $('resultRole').focus({preventScroll:true});
}

function cardText(ctx,message,x,top,width,height,startSize,color) {
  ctx.save();
  ctx.fillStyle=color;
  ctx.textBaseline='top';
  for(let size=startSize;size>=18;size-=2){
    ctx.font='700 '+size+'px LocalMyeongjo,serif';
    const lines=[];
    let line='';
    for(const char of message){
      if(line&&ctx.measureText(line+char).width>width){lines.push(line.trimEnd());line='';}
      if(line||char.trim())line+=char;
    }
    if(line)lines.push(line);
    const leading=Math.ceil(size*1.36);
    if(lines.length*leading>height&&size>19)continue;
    lines.forEach((text,i)=>ctx.fillText(text,x,top+i*leading,width));
    break;
  }
  ctx.restore();
}
function downloadFile(blob,filename){
  const url=URL.createObjectURL(blob),a=node('a');
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}

$('saveCard').addEventListener('click',async()=>{
  if(!activeReading||savingCard)return;
  savingCard=true;
  const reading=activeReading;
  try{
    await document.fonts.ready;
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1280;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#29483f';ctx.fillRect(0,0,1080,1280);
    ctx.fillStyle='#f3ebd9';ctx.fillRect(27,27,1026,1226);
    const art=new Image();art.src=eraImage(reading.period);await art.decode();
    const artHeight=280;
    const scale=Math.max(1026/art.naturalWidth,artHeight/art.naturalHeight);
    const cropWidth=1026/scale,cropHeight=artHeight/scale;
    ctx.drawImage(art,(art.naturalWidth-cropWidth)/2,(art.naturalHeight-cropHeight)/2,cropWidth,cropHeight,27,27,1026,artHeight);
    ctx.fillStyle='#294439';ctx.font='700 37px LocalMyeongjo,serif';ctx.fillText('전생록',74,108);
    ctx.fillStyle='#924334';ctx.fillRect(935,65,61,61);ctx.fillStyle='#fff0d6';ctx.font='700 33px LocalMyeongjo,serif';ctx.fillText('錄',948,109);
    ctx.strokeStyle='#ac9266';ctx.lineWidth=2;ctx.strokeRect(39,39,1002,1202);
    ctx.fillStyle='#84402c';ctx.font='700 30px LocalSuit,sans-serif';ctx.fillText('당신의 전생 직업',76,375);
    cardText(ctx,reading.role,70,414,935,204,82,'#203d33');
    ctx.fillStyle='#aa946f';ctx.fillRect(76,645,928,2);
    cardText(ctx,reading.title,76,687,922,111,43,'#503828');
    cardText(ctx,reading.summary,76,819,922,162,32,'#4b493e');
    ctx.fillStyle='#29483f';ctx.fillRect(42,1001,996,238);
    const facts=[['시대',reading.era],['무대',reading.place]];
    facts.forEach(([label,value],i)=>{
      const yy=1076+i*86;ctx.fillStyle='#d9c399';ctx.font='26px LocalSuit,sans-serif';ctx.fillText(label,78,yy);
      cardText(ctx,value,183,yy-32,800,68,36,'#f9f2df');
    });
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(),'image/png'));
    downloadFile(blob,'전생록-결과카드.png');
    $('resultMessage').textContent='결과 카드를 이미지로 저장했습니다.';
  }catch{$('resultMessage').textContent='이미지를 저장하지 못했습니다. 다시 시도해주세요.';}
  finally{savingCard=false;}
});

$('saveRecord').addEventListener('click',async()=>{
  if(!activeReading || $('saveRecord').disabled)return;
  const reading=activeReading;
  $('saveRecord').disabled=true;
  $('resultMessage').textContent='전체 기록을 이미지로 만들고 있어요.';
  try{
    const references=['faceReference','fortuneReference'].map(id=>{
      const template=$(id).content;
      return {heading:template.querySelector('summary').textContent,
        body:[...template.querySelectorAll('p')].map(p=>p.textContent).join('\n\n'),
        sources:[...template.querySelectorAll('a')].map(a=>({label:a.textContent,url:a.href}))};
    });
    const blob=await recordImage(reading,{pick:activePick,observations:faceObservations,references});
    const title=reading.title.replace(/[<>:"/\\|?*\u0000-\u001f]/g,' ').trim().slice(0,72);
    downloadFile(blob,'전생록-'+(title || '전체 기록')+'-전체.png');
    $('resultMessage').textContent='이야기와 풀이 근거를 PNG 이미지 한 장에 담았어요.';
  }catch{$('resultMessage').textContent='전체 기록 이미지를 저장하지 못했어요. 다시 시도해주세요.';}
  finally{$('saveRecord').disabled=false;}
});

function prepareLink(){
  currentLink=sharedView ? Promise.resolve(location.href) :
    fullRecordLink(activeReading,activePick,faceObservations,activeExample).catch(()=>null);
}

$('shareRecord').addEventListener('click',async()=>{
  if(!activeReading)return;
  const url=await currentLink;
  if(!url){$('resultMessage').textContent='링크를 만들지 못했어요. 전체 기록 이미지를 저장해 보낼 수 있어요.';return;}
  const data={title:activeReading.title+' · 전생록',url};
  if(typeof navigator.share==='function' && (!navigator.canShare || navigator.canShare(data))){
    try{await navigator.share(data);return;}
    catch(error){if(error.name==='AbortError')return;}
  }
  try{
    await navigator.clipboard.writeText(url);
    $('resultMessage').textContent='전체 기록 링크를 복사했어요. 원하는 대화방에 붙여 넣으세요.';
  }catch{
    const field=$('manualCopy');field.value=url;field.hidden=false;field.focus();field.select();
    $('resultMessage').textContent='아래 링크를 복사해서 보내세요.';
  }
});

async function openRecord() {
  const version=++opening;
  const hash=location.hash;
  const sharedExample=/^#read-example(?:-(choiceMade|choiceOther))?$/.exec(hash);
  if(sharedExample){showReading(example,true,{scenePick:sharedExample[1] || 'skip'},true);return;}
  if(hash.startsWith('#record.')){
    $('resultView').hidden=true;
    const snapshot=await readFullRecord(hash);
    if(version!==opening)return;
    if(!snapshot){
      activeReading=null;
      $('unavailableRecord').hidden=false;
      document.title='공유 기록을 열 수 없어요 · 전생록';
      return;
    }
    showReading(snapshot.reading,false,{scenePick:snapshot.pick,profile:{face:{observations:snapshot.observations}}},true);
    return;
  }
  const session=readSession();
  const isExample=hash==='#example';
  const reading=isExample ? example : session?.reading;
  if(!reading){location.replace('./#reading');return;}
  showReading(reading,isExample,session);
}
$('resultBack').addEventListener('click', () => location.assign('./#reading'));
$('again').addEventListener('click', () => {
  if (!sharedView && location.hash !== '#example') clearSession();
  location.assign('./#reading');
});
document.querySelector('[data-example]').addEventListener('click', () => {
  if (location.hash !== '#example') location.hash = 'example';
});
window.addEventListener('hashchange', openRecord);
window.addEventListener('pageshow', event => { if (event.persisted) openRecord(); });
openRecord();
