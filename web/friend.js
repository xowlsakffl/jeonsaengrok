import { hasChoices, readQuiz } from './result-export.js';

const $=id=>document.getElementById(id);
function openCard(){
  const card=readQuiz(location.hash);
  $('friendCard').hidden=!card;
  $('missingCard').hidden=Boolean(card);
  $('friendChoices').replaceChildren();
  $('friendAnswer').textContent='';
  if(!card){document.title='친구의 전생 인물첩 · 전생록';return;}
  document.title=card.role+' · 친구의 전생 인물첩';
  const period=['early','ancient','joseon','modern','recent'].includes(card.period)?card.period:null;
  $('friendArt').src=period?'./assets/era-'+period+'.jpg':'./assets/landscape.jpg';
  $('friendEra').textContent=[card.era,card.place].filter(Boolean).join(' · ');
  $('friendRole').textContent=card.role;
  $('friendTitle').textContent=card.title;
  $('friendSummary').textContent=card.summary;
  $('friendQuiz').hidden=!hasChoices(card);
  if(!hasChoices(card))return;
  const options=[card.choiceMade,card.choiceOther];
  if(Math.random()<0.5)options.reverse();
  for(const choice of options){
    const button=document.createElement('button');
    button.type='button';button.textContent=choice;
    button.addEventListener('click',()=>{
      for(const b of $('friendChoices').children){
        b.disabled=true;
        b.classList.toggle('correct-choice',b.textContent===card.choiceMade);
      }
      $('friendAnswer').textContent=(choice===card.choiceMade?'맞혔어요!':'전생의 선택은 달랐어요.')+' 그날 고른 쪽은 “'+card.choiceMade+'”입니다.';
    });
    $('friendChoices').append(button);
  }
}
window.addEventListener('hashchange',openCard);
openCard();
