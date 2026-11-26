import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../worker/api.mjs';
import { describeProfile } from '../web/profile.js';
import { candidateContexts } from '../web/history.js';
import { describePersonality, traitGroups } from '../web/traits.js';

const base = {
  birth:'1997-06-15', season:'여름', surname:'김', clan:'김해',
  personality:'제 차례를 기다리지만 친구 부탁을 거절하기는 어렵습니다.',
  job:'개발자', wealthLabel:'2억 원 ~ 5억 원 미만', familyLabel:'대체로 평범했어요',
  face:{observations:['코','턱','눈 사이','눈썹'].map(reading=>({reading}))},
};
const generated = {
  title:'갈림길에서', role:'짐꾼', summary:'누구의 짐을 먼저 나를지 정하는 날입니다.',
  opening:'당신은 짐을 나를 차례를 기다렸습니다.', deed:'당신은 기다리던 이에게 자기 차례를 내주었습니다.',
  middle:'그는 해가 지기 전에 집에 닿았습니다.', ending:'그다음 날에는 그가 당신의 짐을 받아 들었습니다.',
  fortune:'옛날에 비워 준 자리 하나가 지금의 살림에 남았습니다.',
  faceIndex:0, focusFace:'그 짐이 오가던 날입니다.', focusHabit:'누구 차례인지 따져 보았습니다.', focusBirth:'',
};

function makeRequest(profile) {
  const candidates=candidateContexts(profile).map(({era,place,work,detail,history})=>({era,place,work,detail,history}));
  return new Request('https://site.test/api/reading',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...describeProfile(profile),candidates}),
  });
}
async function run(profile) {
  let input;
  const response=await api(makeRequest(profile),{OPENAI_API_KEY:'test'},async (_url,options)=>{
    input=JSON.parse(JSON.parse(options.body).input);
    return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify(generated)}]}]});
  });
  assert.equal(response.status,200);
  const {reading}=await response.json();
  return {input,reading};
}

test('the job and both disclosed bands reach the model together, independently of the historical setting', async ()=>{
  const {input,reading}=await run(base);
  const changed=await run({...base,job:'택배 기사',wealthLabel:'빚이 더 많음',familyLabel:'매우 넉넉했어요'});
  assert.deepEqual(input.presentLife,{job:base.job,wealth:base.wealthLabel,family:base.familyLabel});
  assert.deepEqual(changed.input.setting,input.setting);
  assert.equal(input.setting.history,candidateContexts(base)[0].history);
  assert.deepEqual(changed.input.presentLife,{job:'택배 기사',wealth:'빚이 더 많음',family:'매우 넉넉했어요'});
  const [fortune]=reading.clues.filter(clue=>clue.label==='전생에 쌓은 복');
  assert.ok(fortune.detail.includes(generated.deed));
  assert.ok(reading.paragraphs[1].startsWith(generated.deed));
});

test('the setting explanation shows real matches and discloses ties when no behavior matches', ()=>{
  const personality='저는 고장 난 물건을 직접 고치고 원인을 찾아 다시 시도합니다.';
  const [matched]=candidateContexts({...base,personality});
  assert.match(matched.place,/전곡리/);
  assert.ok(matched.selectionNote.includes(personality));
  assert.match(matched.selectionNote,/세 묶음 중 3개/);
  const [unmatched]=candidateContexts({...base,personality:'가나다라마바사'});
  assert.match(unmatched.selectionNote,/0점/);
  assert.match(unmatched.selectionNote,/같은 점수의 배경 \d+곳/);
});

test('private financial fields are omitted and unemployed is a valid occupation', async ()=>{
  const partial=await run({...base,wealthLabel:'밝히지 않을래요',familyLabel:''});
  assert.deepEqual(partial.input.presentLife,{job:'개발자'});
  const hidden=await run({...base,job:' 무직 ',wealthLabel:'',familyLabel:'비공개'});
  assert.deepEqual(hidden.input.presentLife,{job:'무직'});
  assert.ok(hidden.reading.clues.some(clue=>clue.label==='전생에 쌓은 복'));
});

test('missing, empty and whitespace-only occupations cannot start generation', async ()=>{
  let calls=0;
  for(const job of [undefined,'','   ','　']){
    const response=await api(makeRequest({...base,job}),{OPENAI_API_KEY:'test'},async()=>{calls++;});
    assert.equal(response.status,422);
    assert.match((await response.json()).error,/직업/);
  }
  assert.equal(calls,0);
});

test('all behavior badges and a full free-text note reach the model together with the job', async ()=>{
  const traits = traitGroups.flatMap(group => group.traits);
  const labels = traits.map(([label]) => label);
  assert.equal(new Set(labels).size,labels.length);
  const note = '가'.repeat(260);
  const personality = describePersonality(note,labels);
  const {input} = await run({...base,personality});
  assert.equal(input.personality,[note,...traits.map(([,sentence])=>sentence)].join(' '));
  assert.equal(input.presentLife.job,base.job);
});

test('a note containing a badge sentence stays intact when the badge is selected or removed', ()=>{
  const [label,sentence] = traitGroups[0].traits[0];
  const note = '저는 '+sentence+' 가끔은 혼자 있고 싶어요.';
  assert.equal(describePersonality(note,[label]),note);
  assert.equal(describePersonality(note,[]),note);
});

test('a declined input lets the reader return to the form', async ()=>{
  const failures=[
    Response.json({error:{code:'invalid_prompt'}},{status:400}),
    Response.json({output:[{content:[{type:'refusal',refusal:'declined'}]}]}),
  ];
  for(const failure of failures){
    const response=await api(makeRequest(base),{OPENAI_API_KEY:'test'},async ()=>failure);
    assert.equal(response.status,422);
    assert.match((await response.json()).error,/입력으로 돌아가/);
  }
});
