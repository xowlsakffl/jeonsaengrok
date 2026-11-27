import test from 'node:test';
import assert from 'node:assert/strict';
import { example } from '../web/sample.js';
import { fullRecordHtml, hasChoices, quizCard, quizLink, readQuiz, storyText } from '../web/result-export.js';

test('a recipient can open the quiz using only the link and its public card fields',()=>{
  const reading={...example,fortune:'개인재산단서',habitCue:'개인성격단서',clues:[{label:'성씨',detail:'개인본관단서'}]};
  const link=new URL(quizLink(reading));
  assert.equal(link.pathname,'/friend.html');
  assert.equal(link.search,'');
  assert.deepEqual(readQuiz(link.hash),quizCard(reading));
  assert.ok(hasChoices(readQuiz(link.hash)));
  for(const marker of ['개인재산단서','개인성격단서','개인본관단서']){
    assert.ok(!JSON.stringify(readQuiz(link.hash)).includes(marker));
    assert.ok(!storyText(reading).includes(marker));
    assert.ok(fullRecordHtml(reading).includes(marker));
  }
  assert.ok(storyText(reading).includes(example.otherOutcome));
});

test('the offline file includes the entire reading, selected alternative, measurements and references',()=>{
  const html=fullRecordHtml(example,{pick:'choiceOther',observations:[{name:'눈',reading:'측정 예시'}],
    references:[{heading:'풀이 문헌',body:'자료 설명',sources:[{label:'출처',url:'https://example.com/source'}]}]});
  for(const item of [example.title,example.role,...example.paragraphs,example.keepsakeStory,example.otherOutcome,example.fortune,example.history,
    example.choiceMade,example.choiceOther,example.habitCue,'지금의 내가 고른 선택','측정 예시','풀이 문헌','https://example.com/source',example.sources[0].url]){
    assert.ok(html.includes(item.split('\n\n')[0]),item);
  }
  assert.match(html,/@media print/);
  assert.doesNotMatch(html,/<script|<img|<link|<iframe/i);
  const text=fullRecordHtml({...example,title:'<제목 & 친구>'});
  assert.match(text,/&lt;제목 &amp; 친구&gt;/);
});

test('older cards and missing or damaged quiz links remain readable or fail cleanly',()=>{
  const old={role:'서기',title:'옛 기록',paragraphs:['시작','선택','결말'],clues:[],sources:[]};
  const card=readQuiz(new URL(quizLink(old)).hash);
  assert.equal(hasChoices(card),false);
  assert.match(fullRecordHtml(old),/옛 기록/);
  assert.doesNotMatch(fullRecordHtml(old),/undefined|null/);
  for(const hash of ['','#other','#v1.%%%','#v1.e30','#v1.'+'a'.repeat(5000)])assert.equal(readQuiz(hash),null);
});
