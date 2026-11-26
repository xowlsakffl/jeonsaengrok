import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../worker/api.mjs';
import { describeProfile } from '../web/profile.js';
import { candidateContexts } from '../web/history.js';

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

async function run(profile) {
  const candidates=candidateContexts(profile).map(({era,place,work,detail})=>({era,place,work,detail}));
  const request=new Request('https://site.test/api/reading',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...describeProfile(profile),candidates}),
  });
  let input;
  const response=await api(request,{OPENAI_API_KEY:'test'},async (_url,options)=>{
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
  assert.deepEqual(changed.input.presentLife,{job:'택배 기사',wealth:'빚이 더 많음',family:'매우 넉넉했어요'});
  const [fortune]=reading.clues.filter(clue=>clue.label==='전생에 쌓은 복');
  assert.ok(fortune.detail.includes(generated.deed));
  assert.ok(reading.paragraphs[1].startsWith(generated.deed));
});

test('private fields are omitted, and an undisclosed profile has no fortune explanation', async ()=>{
  const partial=await run({...base,wealthLabel:'밝히지 않을래요',familyLabel:''});
  assert.deepEqual(partial.input.presentLife,{job:'개발자'});
  const hidden=await run({...base,job:'',wealthLabel:'',familyLabel:'비공개'});
  assert.equal(hidden.input.presentLife,undefined);
  assert.equal(hidden.reading.clues.some(clue=>clue.label==='전생에 쌓은 복'),false);
});
