import { analyzeFace } from './face.js';
import { generateReading } from './story.js';

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

const today = new Date();
$('birth').max = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
let step = 1;
let requestId = 0;
let photoUrl = '';
let features = null;
let activeReading = null;
let lastTrigger = null;
let currentView = 'entry';
let savingCard = false;

const example = {
  title:'적장의 성을 이어받은 서기',era:'1592년 · 충주',summary:'전생에 적장의 이름을 썼던 손으로, 이번 생에는 내 이름을 씁니다.',
  paragraphs:[
    '탄금대 전투가 끝난 저녁, 당신은 일본군 진영의 등잔 아래 앉았습니다. 당신의 일은 장수가 보내온 글을 새 장부에 옮겨 적는 것이었습니다. 그날 마지막 줄에는 조선 장수 신립의 이름이 있었습니다.',
    '장부를 덮으려는데 문밖에 아이 하나가 서 있었습니다. 징발한 쌀을 한 되만 돌려주면 어머니가 죽을 끓일 수 있다고 했습니다. 남들 앞에서는 말 한마디 보태기 어렵던 당신이었지만, 다른 이가 돌아간 뒤라면 이야기가 달랐습니다. 아이의 그릇을 채운 뒤 모자란 쌀은 당신 몫에서 냈습니다.',
    '이번 생에 첫 집의 문을 열던 날, 모자랐던 보증금을 먼저 보태 준 사람은 부모님이었습니다. 그리고 계약서에 이름을 쓰며 그날 장부에 적었던 글자를 다시 썼습니다. 이제는 당신의 성인 신(申)이었습니다.'
  ],
  clues:[
    {label:'얼굴 관상',detail:'가상 인물의 도톰한 코끝을 전통 관상의 재백궁 모티프로 읽어, 쌀 한 되를 건네는 장면을 골랐습니다.'},
    {label:'생년월일',detail:'5월생의 늦봄을 창작 장면의 계절 단서로 썼습니다.'},
    {label:'성씨·본관',detail:'신립과 같은 평산 신씨라는 단서에서, 한때 적군의 서기였던 사람이 현생에서 그 성을 쓰게 되는 반전을 만들었습니다.'},
    {label:'내 재산',detail:'순자산 2억~5억 원 구간을 삶의 기반을 마련한 결말로 풀었습니다.'},
    {label:'집안 형편',detail:'여유로운 집안에서 받은 도움을, 전생에 먼저 내어 준 한 사람의 몫이 돌아오는 장면으로 연결했습니다.'},
    {label:'성격',detail:'소심하지만 남에게 돈 쓰는 데 너그럽다는 성격이 아무도 보지 않을 때 자기 몫을 내주는 행동으로 이어집니다.'},
    {label:'직업',detail:'오류를 찾아 기록을 대조하는 개발자의 일에서 글과 장부를 다루는 서기의 역할을 골랐습니다.'}
  ],
  history:'신립의 본관은 평산이며 1592년 충주에서 일본군과 싸웠습니다. 서기와 아이, 두 생을 잇는 인연은 예시를 위해 창작했습니다.',
  sources:[{label:'한국민족문화대백과사전 · 신립',url:'https://encykorea.aks.ac.kr/Article/E0032901'},{label:'전통 관상 풀이',url:'https://encykorea.aks.ac.kr/Article/E0004873'}]
};

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
  return {face:features,birth:$('birth').value,surname:$('surname').value.trim(),clan:$('clan').value.trim(),job:$('job').value.trim(),personality:$('personality').value.trim(),wealth:$('wealth').value,family:$('family').value};
}
$('profileForm').addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');clearError(step===1?'errOne':'errTwo');});
$('profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  if (step===1) {
    clearError('errOne');
    if(!features){feedback('errOne','정면 얼굴 사진 한 장을 올리고 얼굴 인식을 마쳐주세요.',photoUrl?$('photoRemove'):$('portrait'));return;}
    if(!$('birth').value||!$('birth').validity.valid){feedback('errOne','태어난 날짜를 확인해주세요.',$('birth'));return;}
    if(!$('surname').value.trim()){feedback('errOne','성씨를 입력해주세요. 본관은 비워둘 수 있어요.',$('surname'));return;}
    changeStep(2,true);return;
  }
  clearError('errTwo');
  for(const [id,message] of [['wealth','내 재산 구간을 선택해주세요.'],['family','집안 형편을 선택해주세요.'],['job','직업이나 주로 하는 일을 입력해주세요.'],['personality','성격을 적거나 아래 예시에서 골라주세요.']]) {
    if(!$(id).value.trim()){feedback('errTwo',message,$(id));return;}
  }
  try {
    const reading=generateReading(getProfile());
    showReading(reading,false,$('revealBtn'));
  } catch {
    feedback('errTwo','기록을 펼치지 못했습니다. 입력을 확인하고 다시 시도해주세요.');
  }
});
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
  canvas.setAttribute('aria-label','입력한 사진의 코끝과 턱끝 위치');
  const width=photo.naturalWidth, height=photo.naturalHeight;
  const nose=face.marks.nose, jaw=face.marks.jaw;
  const lowerFace=Math.hypot((nose.x-jaw.x)*width,(nose.y-jaw.y)*height);
  const cropHeight=Math.min(height,width*5/7,Math.max(1,lowerFace*3.2));
  const cropWidth=cropHeight*7/5;
  const left=Math.max(0,Math.min(width-cropWidth,nose.x*width-cropWidth/2));
  const top=Math.max(0,Math.min(height-cropHeight,nose.y*height-cropHeight*.5));
  canvas.getContext('2d').drawImage(photo,left,top,cropWidth,cropHeight,0,0,560,400);
  box.append(canvas);
  const note=node('p',undefined,'face-note');
  note.setAttribute('aria-live','polite');
  const buttons=[];
  const texts={
    nose:'재백궁 · 코 폭을 눈 사이 너비와 대조한 특징에서 이야기 속 재물의 모티프를 골랐습니다.',
    jaw:'지각 · 턱선의 상대적인 너비에서 이야기 속 인연을 지켜본 목격자를 골랐습니다.'
  };
  for (const [part,title] of [['nose','코'],['jaw','턱']]) {
    const point=face.marks[part];
    const button=node('button',title,'pin');
    button.type='button';
    button.setAttribute('aria-label',title+' 위치의 관상 풀이');
    button.style.left=((point.x*width-left)/cropWidth*100)+'%';
    button.style.top=((point.y*height-top)/cropHeight*100)+'%';
    button.addEventListener('click',()=>{
      for(const other of buttons)other.setAttribute('aria-pressed',String(other===button));
      note.textContent=texts[part];
    });
    buttons.push(button);
    box.append(button);
  }
  buttons[0].click();
  details.append(box,note);
  return details;
}
function showReading(reading,isExample,trigger) {
  activeReading=reading;
  currentView=isExample?'example':'personal';
  lastTrigger=trigger;
  $('entry').hidden=true;
  $('resultView').hidden=false;
  $('resultKind').textContent=isExample?'예시 전생 기록':'나의 전생 기록';
  $('resultTitle').textContent=reading.title;
  $('resultEra').textContent=reading.era;
  $('storyText').replaceChildren(...reading.paragraphs.map(p=>node('p',p)));
  $('storyQuote').textContent=reading.summary;
  $('clues').replaceChildren(...reading.clues.map(clue=>{const div=node('div',undefined,'clue');div.append(node('dt',clue.label),node('dd',clue.detail));return div;}));
  if(!isExample&&features?.marks&&photoUrl){
    $('clues').querySelector('dd').append(makeFaceGuide(features,$('photoPreview')));
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
    activeReading=null;
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
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=780;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f7f1e2';ctx.fillRect(0,0,1080,780);
    const art=new Image();art.src='./assets/landscape.jpg';await art.decode();ctx.drawImage(art,0,0,1080,360);
    ctx.fillStyle='#8a392b';ctx.font='700 29px LocalMyeongjo,serif';ctx.fillText('전생록',56,65);
    ctx.fillStyle='#5a5649';ctx.font='25px LocalSuit,sans-serif';ctx.fillText(reading.era,58,426);
    ctx.fillStyle='#292c25';ctx.font='700 51px LocalMyeongjo,serif';const y=canvasLines(ctx,reading.title,54,508,965,65);
    ctx.fillStyle='#554f42';ctx.font='31px LocalSuit,sans-serif';canvasLines(ctx,reading.summary,57,y+6,958,46);
    ctx.fillStyle='#7a7465';ctx.font='21px LocalSuit,sans-serif';ctx.fillText('전생록 · 역사에서 영감을 얻은 창작 이야기',57,738);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(),'image/png'));
    const url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='전생록-결과카드.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    $('resultMessage').textContent='결과 카드를 이미지로 저장했습니다.';
  }catch{$('resultMessage').textContent='이미지를 저장하지 못했습니다. 다시 시도해주세요.';}
  finally{savingCard=false;}
});
changeStep(1);

