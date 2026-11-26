import { analyzeFace } from './face.js';
import { generateReading } from './reading.js';
import { birthDate } from './profile.js';
import { example } from './sample.js';

const $ = id => document.getElementById(id);
const icons = {
  book:'<path d="M3 4.5c3.5-1 6.4-.4 9 1.6 2.6-2 5.5-2.6 9-1.6V19c-3.5-1-6.5-.2-9 1.8C9.5 18.8 6.5 18 3 19Z"/><path d="M12 6v14"/>',
  scroll:'<path d="M6 4h12a2.5 2.5 0 0 1 0 5h-1V6.7M6 4a2.4 2.4 0 0 1 2.5 2.5v11c0 2.3-1 3.5-3 3.5s-3-1.4-3-3h10c0 1.8.9 3 2.8 3S18 19.5 18 18V9"/><path d="M11.5 9h3m-3 3h3"/>',
  face:'<path d="M3 8V4h4m10 0h4v4m0 8v4h-4M7 20H3v-4"/><path d="M8 8.2c0-3 8-3 8 0v2c0 3-2 5.4-4 5.4S8 13.2 8 10.2zM5.8 19c1-2 3.2-3.4 6.2-3.4s5.2 1.4 6.2 3.4"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8.3 10V7a3.7 3.7 0 1 1 7.4 0v3M12 14v3"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  return:'<path d="M4 10h10a5 5 0 0 1 0 10h-3m-2-15-5 5 5 5"/>'
};
for (const el of document.querySelectorAll('[data-icon]')) {
  el.outerHTML = '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24">'+icons[el.dataset.icon]+'</svg>';
}

let operation;
let savedProfile = '';
let savedReading = null;
const dateHint = '연·월·일 순서로 숫자 6자리를 입력해주세요.';
function refreshBirth() {
  const field=$('birth');
  field.value=field.value.replace(/[^0-9]/g,'').slice(0,6);
  const date=birthDate(field.value);
  $('birthHint').textContent = date ? date.label+'로 풀이합니다.' : field.value.length===6 ? '달력에 있는 날짜인지 확인해주세요.' : dateHint;
}
$('birth').addEventListener('input',refreshBirth);
fetch('./api/availability',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
  if(data?.server===false)$('availability').hidden=false;
}).catch(()=>{});
let step = 1;
let requestId = 0;
let photoUrl = '';
let features = null;
let activeReading = null;
let lastTrigger = null;
let currentView = 'entry';
let savingCard = false;


function clearError(id) {
  $(id).hidden=true;
  $(id).textContent='';
}
function feedback(id, message, field) {
  $(id).hidden=false;
  $(id).textContent=message;
  if (field) {
    field.setAttribute('aria-invalid','true');
    field.focus();
  }
}
function changeStep(to, focus=false) {
  step=to;
  $('firstStep').hidden = step!==1;
  $('secondStep').hidden = step!==2;
  $('progressOne').classList.toggle('current',step===1);
  $('progressTwo').classList.toggle('current',step===2);
  $('progressOne').setAttribute('aria-current',step===1?'step':'false');
  $('progressTwo').setAttribute('aria-current',step===2?'step':'false');
  if (focus) $(step===1?'firstTitle':'secondTitle').focus({preventScroll:true});
  if (focus) $('reading').scrollIntoView({block:'start'});
}
function clearPhoto() {
  requestId++;
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl='';
  features=null;
  $('portrait').value='';
  $('portrait').removeAttribute('aria-invalid');
  $('photoPreview').removeAttribute('src');
  $('uploaded').hidden=true;
  $('uploadTrigger').hidden=false;
  $('photoStatus').textContent='';
  $('photoStatus').className='';
  $('nextBtn').disabled=false;
}
async function choosePhoto(file) {
  if (!file) return;
  clearPhoto();
  clearError('errOne');
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024||!file.size) {
    feedback('errOne','12MB 이하의 JPG, PNG 또는 WEBP 사진을 선택해주세요.',$('portrait')); return;
  }
  const id=requestId;
  photoUrl=URL.createObjectURL(file);
  $('photoName').textContent=file.name;
  $('photoStatus').textContent='이 기기에서 얼굴 특징점을 찾고 있어요…';
  $('uploadTrigger').hidden=true;
  $('uploaded').hidden=false;
  $('nextBtn').disabled=true;
  $('photoPreview').src=photoUrl;
  try {
    await $('photoPreview').decode();
    if (id!==requestId) return;
    const response=await analyzeFace($('photoPreview'));
    if (id!==requestId) return;
    features=response;
    $('photoStatus').textContent='얼굴 단서를 확인했어요.';
  } catch (error) {
    if (id!==requestId) return;
    $('photoStatus').className='bad';
    $('photoStatus').textContent=error instanceof Error && /[가-힣]/.test(error.message)?error.message:'사진을 읽지 못했어요. 정면 사진으로 다시 시도해주세요.';
    $('errOne').textContent='사진 오른쪽의 삭제 버튼을 누르고 다른 사진을 선택해주세요.';
    $('errOne').hidden=false;
  } finally {
    if (id===requestId) $('nextBtn').disabled=false;
  }
}
$('portrait').addEventListener('change',e=>choosePhoto(e.target.files[0]));
$('photoRemove').addEventListener('click',()=>{clearPhoto();clearError('errOne');$('portrait').focus();});
for (const name of ['dragenter','dragover']) $('dropzone').addEventListener(name,e=>{e.preventDefault();$('dropzone').classList.add('drag');});
$('dropzone').addEventListener('dragleave',()=>$('dropzone').classList.remove('drag'));
$('dropzone').addEventListener('drop',e=>{e.preventDefault();$('dropzone').classList.remove('drag');choosePhoto(e.dataTransfer.files[0]);});
function getProfile(){
  const date=birthDate($('birth').value);
  return {face:features,birth:date.iso,season:date.season,surname:$('surname').value.trim(),clan:$('clan').value.trim(),job:$('job').value.trim(),personality:$('personality').value.trim(),wealth:$('wealth').value,family:$('family').value};
}
$('profileForm').addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');clearError(step===1?'errOne':'errTwo');});
$('profileForm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(operation)return;
  if (step===1) {
    clearError('errOne');
    if(!features){feedback('errOne','정면 얼굴 사진 한 장을 올리고 얼굴 인식을 마쳐주세요.',photoUrl?$('photoRemove'):$('portrait'));return;}
    if(!birthDate($('birth').value)){feedback('errOne','생년월일을 숫자 6자리로 확인해주세요.',$('birth'));return;}
    if(!$('surname').value.trim()){feedback('errOne','성씨를 입력해주세요. 본관은 비워둘 수 있어요.',$('surname'));return;}
    changeStep(2,true);return;
  }
  clearError('errTwo');
  for(const [id,message] of [['wealth','내 재산 구간을 선택해주세요.'],['family','집안 형편을 선택해주세요.'],['job','직업이나 주로 하는 일을 입력해주세요.'],['personality','성격을 적거나 아래 예시에서 골라주세요.']]) {
    if(!$(id).value.trim()){feedback('errTwo',message,$(id));return;}
  }
  const profile=getProfile();
  const identity=JSON.stringify([requestId,profile]);
  if(savedReading&&savedProfile===identity){showReading(savedReading,false,$('revealBtn'));return;}
  const controller=new AbortController();
  operation=controller;
  setWriting(true);
  try {
    const result=await generateReading(profile,controller.signal);
    if(!controller.signal.aborted){
      savedProfile=identity;savedReading=result;showReading(result,false,$('revealBtn'));
    }
  } catch(error) {
    if(!controller.signal.aborted)feedback('errTwo',error.message||'이야기를 완성하지 못했어요. 다시 시도해주세요.');
  } finally {
    if(operation===controller){operation=null;setWriting(false);}
  }
});
function setWriting(busy) {
  $('writing').hidden=!busy;
  $('profileForm').setAttribute('aria-busy',String(busy));
  for(const el of $('secondStep').querySelectorAll('input,select,textarea,button'))if(el.id!=='stopWriting')el.disabled=busy;
  if(busy)$('writingStatus').textContent='이야기의 단서를 읽고 있어요…';
}
function cancelWriting(){
  if(!operation)return;
  operation.abort();operation=null;setWriting(false);
}
$('stopWriting').addEventListener('click',()=>{cancelWriting();feedback('errTwo','생성을 중단했습니다. 입력은 그대로 있어요.');$('revealBtn').focus();});
$('backBtn').addEventListener('click',()=>changeStep(1,true));
for(const btn of document.querySelectorAll('[data-trait]')) btn.addEventListener('click',()=>{
  const field=$('personality'), tag=btn.dataset.trait;
  if(!field.value.includes(tag)) {
    const next=(field.value.trim()?(field.value.trim()+' · '):'')+tag;
    if(next.length>field.maxLength) return;
    field.value=next;
  } else {
    field.value=field.value.split(' · ').filter(part=>part!==tag).join(' · ');
  }
  for(const b of document.querySelectorAll('[data-trait]')) b.setAttribute('aria-pressed',String(field.value.split(' · ').includes(b.dataset.trait)));
  clearError('errTwo');
  field.removeAttribute('aria-invalid');
});
$('personality').addEventListener('input',()=>{for(const b of document.querySelectorAll('[data-trait]')) b.setAttribute('aria-pressed',String($('personality').value.split(' · ').includes(b.dataset.trait)));});
function node(tag,text,className){
  const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;
}
function makeFaceGuide(face, photo) {
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
  buttons[0].click();
  details.append(box,tabs,note);
  return details;
}
function showReading(reading,isExample,trigger) {
  if(isExample)cancelWriting();
  activeReading=reading;
  currentView=isExample?'example':'personal';
  lastTrigger=trigger;
  $('entry').hidden=true;
  $('resultView').hidden=false;
  $('resultKind').textContent=isExample?'전생 인물첩 · 예시':'전생 인물첩 · '+reading.engine+' 집필';
  $('resultTitle').textContent=reading.title;
  $('resultEra').textContent=reading.era;
  $('resultPlace').textContent=reading.place;
  $('resultRole').textContent=reading.role;
  $('roast').textContent=reading.roast;
  $('storyText').replaceChildren(...reading.paragraphs.map(p=>node('p',p)));
  $('storyQuote').textContent=reading.summary;
  $('clues').replaceChildren(...reading.clues.map(clue=>{const div=node('div',undefined,'clue');div.append(node('dt',clue.label),node('dd',clue.detail));return div;}));
  if(!isExample&&features?.marks&&photoUrl){
    const faceRow=Array.from($('clues').children).find(row=>row.querySelector('dt').textContent==='얼굴 관상');
    faceRow?.querySelector('dd').append(makeFaceGuide(features,$('photoPreview')));
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
  $('resultTitle').focus({preventScroll:true});
}
function showEntry(target, focus=false) {
  cancelWriting();
  $('resultView').hidden=true;
  $('entry').hidden=false;
  $('readingNav').classList.add('nav-current');
  document.querySelector('.masthead [data-example]').classList.remove('nav-current');
  currentView='entry';
  if(target==='home'){window.scrollTo(0,0);return;}
  if(focus&&lastTrigger&&lastTrigger.isConnected)lastTrigger.focus({preventScroll:true});
  $('reading').scrollIntoView({block:'start'});
}
for(const btn of document.querySelectorAll('[data-example]')) btn.addEventListener('click',()=>showReading(example,true,btn));
document.querySelectorAll('a[href="#home"],a[href="#reading"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showEntry(a.getAttribute('href').slice(1));}));
$('resultBack').addEventListener('click',()=>showEntry('reading',true));
$('again').addEventListener('click',()=>{
  if(currentView==='personal'){
    $('profileForm').reset();clearPhoto();clearError('errOne');clearError('errTwo');
    document.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    document.querySelectorAll('[data-trait]').forEach(el=>el.setAttribute('aria-pressed','false'));
    changeStep(1);
    activeReading=null;savedReading=null;savedProfile='';refreshBirth();
    $('clues').replaceChildren();
  }
  showEntry('reading');
  $(step===1?'firstTitle':'secondTitle').focus({preventScroll:true});
});
$('guideOpen').addEventListener('click',()=>$('guide').showModal());
for(const id of ['guideClose','guideDone']) $(id).addEventListener('click',()=>$('guide').close());
$('guide').addEventListener('click',e=>{if(e.target===$('guide')){const b=$('guide').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('guide').close();}});

function canvasLines(ctx,message,x,y,maxWidth,lineHeight) {
  let line='';
  for(const char of message) {
    if(ctx.measureText(line+char).width>maxWidth&&line){ctx.fillText(line,x,y);line='';y+=lineHeight;}
    line+=char;
  }
  if(line)ctx.fillText(line,x,y);
  return y+lineHeight;
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
    const artHeight=350;
    const crop=Math.min(art.naturalWidth,art.naturalHeight*1026/artHeight);
    ctx.drawImage(art,art.naturalWidth-crop,0,crop,art.naturalHeight,27,27,1026,artHeight);
    ctx.fillStyle='#294439';ctx.font='700 37px LocalMyeongjo,serif';ctx.fillText('전생록',74,108);
    ctx.fillStyle='#924334';ctx.fillRect(935,65,61,61);ctx.fillStyle='#fff0d6';ctx.font='700 33px LocalMyeongjo,serif';ctx.fillText('錄',948,109);
    ctx.strokeStyle='#ac9266';ctx.lineWidth=2;ctx.strokeRect(39,39,1002,1202);
    ctx.fillStyle='#7a402e';ctx.font='700 25px LocalSuit,sans-serif';ctx.fillText('전생 인물첩',76,432);
    ctx.fillStyle='#253b32';ctx.font='700 54px LocalMyeongjo,serif';
    const y=canvasLines(ctx,reading.title,72,515,930,70);
    ctx.fillStyle='#4c483b';ctx.font='31px LocalMyeongjo,serif';canvasLines(ctx,reading.summary,76,y+9,922,47);
    ctx.fillStyle='#29483f';ctx.fillRect(42,787,996,255);
    const facts=[['시대',reading.era],['무대',reading.place],['직업',reading.role]];
    facts.forEach(([label,value],i)=>{
      const yy=852+i*72;ctx.fillStyle='#d9c399';ctx.font='25px LocalSuit,sans-serif';ctx.fillText(label,78,yy);
      ctx.fillStyle='#f9f2df';ctx.font='700 32px LocalMyeongjo,serif';ctx.fillText(value,190,yy,794);
    });
    ctx.fillStyle='#8d3d2d';ctx.font='700 26px LocalSuit,sans-serif';ctx.fillText('전생에서 온 팩폭',75,1096);
    ctx.fillStyle='#393528';ctx.font='700 29px LocalMyeongjo,serif';canvasLines(ctx,reading.roast,75,1150,925,39);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(),'image/png'));
    const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='전생록-결과카드.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    $('resultMessage').textContent='결과 카드를 이미지로 저장했습니다.';
  }catch{$('resultMessage').textContent='이미지를 저장하지 못했습니다. 다시 시도해주세요.';}
  finally{savingCard=false;}
});
changeStep(1);

