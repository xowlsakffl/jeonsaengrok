import test from 'node:test';
import assert from 'node:assert/strict';
import {example} from '../web/sample.js';
import {fullRecordLink, readFullRecord, recordSections, readQuiz} from '../web/result-export.js';
import {layoutRecord} from '../web/record-image.js';

const observations=[{name:'눈',reading:'측정 예시'}];
const references=[{heading:'풀이 문헌',body:'자료 설명',sources:[{label:'출처',url:'https://example.com/source'}]}];
test('one standalone link carries the complete result and pick, without raw profile or photograph',async()=>{
  const reading={...example,profile:{photo:'비밀사진',birth:'950102'},rawPhoto:'원본'};
  const url=new URL(await fullRecordLink(reading,'choiceOther',observations));
  assert.equal(url.pathname,'/result.html');
  assert.equal(url.search,'');
  const record=await readFullRecord(url.hash);
  assert.deepEqual(record.reading.paragraphs,example.paragraphs);
  assert.deepEqual(record.reading.sources,example.sources);
  assert.deepEqual(record.reading.clues,example.clues);
  assert.deepEqual(record.observations,observations);
  assert.equal(record.pick,'choiceOther');
  for(const field of ['title','role','era','place','summary','choiceMade','choiceOther','habitCue','fortune','keepsakeStory','otherOutcome','history']){
    assert.equal(record.reading[field],example[field]);
  }
  assert.doesNotMatch(JSON.stringify(record),/비밀사진|원본|950102/);
  assert.match(await fullRecordLink(example,'choiceOther',[],true),/#read-example-choiceOther$/);
});

test('the PNG layout includes the entire record, references, selected answer and final line in bounds',()=>{
  const options={pick:'choiceOther',observations,references};
  const ctx={measureText:t=>({width:[...t].length*30})};
  const layout=layoutRecord(ctx,example,options);
  const normalize=t=>t.replace(/\s/g,'');
  const text=normalize(layout.rows.map(r=>r.text||'').join(''));
  const sections=recordSections(example,options);
  for(const field of [example.title,example.role,example.era,example.place,example.summary,...example.paragraphs,
    ...sections.flatMap(s=>[s.heading,s.body,...(s.sources||[]).map(a=>a.url)])])assert.ok(text.includes(normalize(field)),field);
  assert.ok(layout.height>4096);
  assert.ok(layout.rows.every(r=>r.y>=0 && r.y+40<=layout.height));
  assert.match(layout.rows.at(-1).text,/전생록/);
});

test('old quiz links, partial legacy readings and bad record links are handled',async()=>{
  const card={title:'옛 기록',role:'서기',era:'',place:'',period:'',summary:'',choiceMade:'',choiceOther:''};
  assert.deepEqual(readQuiz('#v1.'+Buffer.from(JSON.stringify(card)).toString('base64url')),card);
  const old={title:'옛 기록',role:'서기',paragraphs:['처음','선택','끝']};
  const record=await readFullRecord(new URL(await fullRecordLink(old,null,[])).hash);
  assert.equal(record.reading.paragraphs.at(-1),'끝');
  assert.deepEqual(record.reading.clues,[]);
  for(const hash of ['','#record.z.a','#record.u.e30','#record.z.'+'A'.repeat(200000)])assert.equal(await readFullRecord(hash),null);
});
