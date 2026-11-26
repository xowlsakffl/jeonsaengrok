import './site.js';
import { readSession, clearSession } from './reading-session.js';
import { example } from './sample.js';
const $ = id => document.getElementById(id);
let activeReading = null;
let savingCard = false;
function node(tag,text,className){
  const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;
}
function makeFaceGuide(face, photo, selectedIndex) {
  const details=node('details',undefined,'face-guide');
  details.append(node('summary','내 사진에서 관상 위치 보기'));
  const box=node('div',undefined,'face-guide-frame');
  const canvas=node('canvas');
  canvas.width=560;
  canvas.height=400;
  canvas.setAttribute('aria-label','사진에서 측정한 얼굴 부위 네 곳');
  const width=photo.naturalWidth, height=photo.naturalHeight, points=face.observations;
  const xs=points.map(o=>o.mark.x*width), ys=points.map(o=>o.mark.y*height);
  const spread=Math.max(1,Math.max(...ys)-Math.min(...ys));
  const cropHeight=Math.min(height,width*5/7,spread*1.95), cropWidth=cropHeight*7/5;
  const left=Math.max(0,Math.min(width-cropWidth,(Math.min(...xs)+Math.max(...xs)-cropWidth)/2));
  const top=Math.max(0,Math.min(height-cropHeight,(Math.min(...ys)+Math.max(...ys)-cropHeight)/2));
  canvas.getContext('2d').drawImage(photo,left,top,cropWidth,cropHeight,0,0,560,400);
  box.append(canvas);
  const note=node('p',undefined,'face-note'),tabs=node('div',undefined,'face-tabs');
  note.setAttribute('aria-live','polite');
  const buttons=[],markers=[];
  points.forEach(({name,reading,mark},i)=>{
    const pin=node('span',String(i+1),'pin'), button=node('button',(i+1)+' '+name);
    pin.setAttribute('aria-hidden','true');
    pin.style.left=((mark.x*width-left)/cropWidth*100)+'%';
    pin.style.top=((mark.y*height-top)/cropHeight*100)+'%';
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

function showReading(reading,isExample,session) {
  activeReading = reading;
  $('resultView').hidden = false;
  document.title=reading.role+' · 전생록';
  $('resultKind').textContent=isExample?'전생 인물첩 · 예시':'전생 인물첩 · '+reading.engine+' 집필';
  $('resultTitle').textContent=reading.title;
  $('resultEra').textContent=reading.era;
  $('resultPlace').textContent=reading.place;
  $('resultRole').textContent=reading.role;
  $('storyText').replaceChildren(...reading.paragraphs.map(p=>node('p',p)));
  $('storyQuote').textContent=reading.summary;
  $('clues').replaceChildren(...reading.clues.map(clue=>{
    const div=node('div',undefined,'clue');
    const job=!isExample && clue.label==='일자리 여건' && session?.profile?.job;
    div.append(node('dt',job ? clue.label+' · '+job : clue.label),node('dd',clue.detail));
    return div;
  }));
  if(!isExample && session?.profile.face?.marks && session.draft.preview){
    const faceRow=Array.from($('clues').children).find(row=>row.querySelector('dt').textContent==='얼굴 관상');
    const photo = new Image();
    photo.src = session.draft.preview;
    photo.decode().then(() => {
      if (faceRow?.isConnected) faceRow.querySelector('dd').append(makeFaceGuide(session.profile.face, photo, reading.faceIndex));
    }).catch(() => {});
  }
  $('historyText').textContent=reading.history;
  $('sourceLinks').replaceChildren(...reading.sources.filter(s=>/^https:\/\//.test(s.url)).map(s=>{const a=node('a',s.label);a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';return a;}));
  $('resultBack').querySelector('span').textContent=isExample?'풀이로 돌아가기':'입력 수정하기';
  $('again').textContent=isExample?'내 전생 풀이하기':'새 전생 풀이 시작';
  $('resultMessage').textContent='';
  $('explain').open=true;
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
    const art=new Image();art.src='./assets/landscape.jpg';await art.decode();
    const artHeight=280;
    const crop=Math.min(art.naturalWidth,art.naturalHeight*1026/artHeight);
    ctx.drawImage(art,art.naturalWidth-crop,0,crop,art.naturalHeight,27,27,1026,artHeight);
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
    const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='전생록-결과카드.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    $('resultMessage').textContent='결과 카드를 이미지로 저장했습니다.';
  }catch{$('resultMessage').textContent='이미지를 저장하지 못했습니다. 다시 시도해주세요.';}
  finally{savingCard=false;}
});

function openRecord() {
  const session = readSession();
  const isExample = location.hash === '#example';
  const reading = isExample ? example : session?.reading;
  if (!reading) { location.replace('./#reading'); return; }
  showReading(reading, isExample, session);
}
$('resultBack').addEventListener('click', () => location.assign('./#reading'));
$('again').addEventListener('click', () => {
  if (location.hash !== '#example') clearSession();
  location.assign('./#reading');
});
document.querySelector('[data-example]').addEventListener('click', () => {
  if (location.hash !== '#example') location.hash = 'example';
});
window.addEventListener('hashchange', openRecord);
window.addEventListener('pageshow', event => { if (event.persisted) openRecord(); });
openRecord();
