import './site.js';
import { analyzeFace } from './face.js';
import { birthDate } from './profile.js';
import { example } from './sample.js';
import { describePersonality, mountTraitPicker } from './traits.js';
import { readSession, writeSession, readingVersion } from './reading-session.js';

const $ = id => document.getElementById(id);
const traitPicker = mountTraitPicker(() => {
  clearError('errTwo');
  $('personality').removeAttribute('aria-invalid');
});
$('sampleRole').textContent=example.role;
$('sampleTeaser').textContent=example.summary;

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


const fieldIds = ['birth','surname','clan','job','personality','wealth','family'];

function makeDraft() {
  const values = Object.fromEntries(fieldIds.map(id => [id,$(id).value]));
  values.traits = traitPicker.selected();
  const photo = $('photoPreview');
  let preview = '';
  if (features && photo.naturalWidth) {
    if (photoUrl.startsWith('data:')) {
      preview = photoUrl;
    } else {
      const scale = Math.min(1, 640 / Math.max(photo.naturalWidth,photo.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(photo.naturalWidth*scale));
      canvas.height = Math.max(1,Math.round(photo.naturalHeight*scale));
      canvas.getContext('2d').drawImage(photo,0,0,canvas.width,canvas.height);
      preview = canvas.toDataURL('image/jpeg',0.8);
    }
  }
  return {values, step, features, preview, photoName:$('photoName').textContent};
}

function getProfile() {
  const date = birthDate($('birth').value);
  const label = field => field.value === 'private' ? '' : field.selectedOptions[0].textContent;
  return {
    birth:date.iso, season:date.season, surname:$('surname').value.trim(), clan:$('clan').value.trim(),
    face:features, job:$('job').value.trim(), personality:describePersonality($('personality').value,traitPicker.selected()),
    wealthLabel:label($('wealth')), familyLabel:label($('family'))
  };
}

function restoreDraft(draft) {
  if (!draft) { changeStep(1); return; }
  for (const id of fieldIds) $(id).value = draft.values[id] || '';
  traitPicker.restore(draft.values.traits);
  refreshBirth();
  $('personality').dispatchEvent(new Event('input'));
  if (draft.features && draft.preview) {
    photoUrl = draft.preview;
    features = draft.features;
    $('photoPreview').src = photoUrl;
    $('photoName').textContent = draft.photoName;
    $('photoStatus').textContent = '얼굴 단서를 확인했어요.';
    $('uploadTrigger').hidden = true;
    $('uploaded').hidden = false;
  }
  changeStep(draft.step === 2 && features ? 2 : 1);
}

$('profileForm').addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');clearError(step===1?'errOne':'errTwo');});
$('profileForm').addEventListener('submit',e=>{
  e.preventDefault();
  if (step===1) {
    clearError('errOne');
    if(!features){feedback('errOne','정면 얼굴 사진 한 장을 올리고 얼굴 인식을 마쳐주세요.',photoUrl?$('photoRemove'):$('portrait'));return;}
    if(!birthDate($('birth').value)){feedback('errOne','생년월일을 숫자 6자리로 확인해주세요.',$('birth'));return;}
    if(!$('surname').value.trim()){feedback('errOne','성씨를 입력해주세요. 본관은 비워둘 수 있어요.',$('surname'));return;}
    changeStep(2,true);return;
  }
  clearError('errTwo');
  for(const [id,message] of [['wealth','내 재산 구간을 선택해주세요.'],['family','집안 형편을 선택해주세요.'],['job','직업을 입력해주세요. 현재 직업이 없으면 ‘무직’이라고 적어주세요.']]) {
    if(!$(id).value.trim()){feedback('errTwo',message,$(id));return;}
  }
  if (!$('personality').value.trim() && !traitPicker.selected().length) {
    feedback('errTwo','나와 닮은 행동을 하나 고르거나 내 말로 적어주세요.',$('personality'));
    return;
  }

  try {
    const draft = makeDraft();
    const profile = getProfile();
    const previous = readSession();
    if (previous?.version === readingVersion && previous.reading?.choiceMade && JSON.stringify(previous.profile) === JSON.stringify(profile)) {
      writeSession({...previous,draft});
      location.assign('./result.html');
      return;
    }
    writeSession({draft,profile,stage:'ready',version:readingVersion});
    location.assign('./loading.html');
  } catch {
    feedback('errTwo','이 탭에 입력을 잠시 보관할 수 없습니다. 브라우저의 사이트 데이터 설정을 확인한 뒤 다시 시도해주세요.');
  }
});

$('backBtn').addEventListener('click',()=>changeStep(1,true));


for (const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click', () => {
    try {
      const draft = makeDraft();
      const previous = readSession();
      const unchanged = previous?.draft.preview === draft.preview &&
        JSON.stringify(previous?.draft.values) === JSON.stringify(draft.values);
      writeSession(unchanged ? {...previous,draft} : {draft});
    } catch {}
    location.assign('./result.html#example');
  });
}
restoreDraft(readSession()?.draft);
if (location.hash === '#example') location.replace('./result.html#example');
else if (location.hash === '#result') location.replace('./result.html');
else if (location.hash === '#loading') location.replace('./loading.html');
window.addEventListener('pageshow', event => {
  if (event.persisted && !readSession()) {
    $('profileForm').reset();
    traitPicker.restore();
    clearPhoto();
    refreshBirth();
    $('personality').dispatchEvent(new Event('input'));
    changeStep(1);
  }
});
