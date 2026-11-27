const $ = id => document.getElementById(id);
document.body.insertAdjacentHTML('beforeend', `  <dialog id="guide"><div class="dialog-top"><h2>전생록 이용 안내</h2><button type="button" id="guideClose" class="icon-btn" aria-label="닫기"><i data-icon="close"></i></button></div>
    <p>정면 얼굴 사진 한 장과 현생의 단서를 입력하면 전생의 한 장면과 그 풀이가 열립니다.</p>
    <h3>무엇을 근거로 풀이하나요?</h3>
    <dl class="guide-criteria">
      <dt>생년월일</dt><dd>구석기부터 2023년까지의 30개 배경 중 태어난 해보다 앞선 곳을 남깁니다. 선사, 고대·고려, 조선, 근대, 광복 이후 중 가능한 시대권을 같은 확률로 뽑은 뒤 그 안에서 일터 한 곳을 뽑습니다. AI는 태어난 계절도 받습니다.</dd>
      <dt>성격과 행동</dt><dd>AI는 고른 배지와 직접 쓴 글을 읽고 그 시대에 맞는 갈림길을 씁니다. 어떤 선택을 했고 누구에게 어떤 대가가 돌아갔는지 이야기에서 확인할 수 있습니다.</dd>
      <dt>얼굴 사진</dt><dd>이 기기에서 얼굴 특징점 68개로 코 너비, 턱 너비, 두 눈 사이 간격, 눈썹과 윗눈꺼풀 사이 간격의 상대 비율을 잽니다. 한 부위를 골라 장면에 쓰고, 코를 재물과 연결할 때는 『마의상법』의 해석을 참고합니다.</dd>
      <dt>성씨·본관</dt><dd>성씨와 입력한 본관을 인물첩에 기록합니다. 본관은 성의 연고지이며 생략할 수 있습니다.</dd>
      <dt>현생 직업</dt><dd>필수 입력입니다. 직업이 없으면 ‘무직’이라고 쓰세요. AI는 현재의 생업이나 상황을 복 풀이에 씁니다. 전생 직업은 앞서 정한 역사적 일터의 실제 일거리에서 고릅니다.</dd>
      <dt>내 재산</dt><dd>빚을 포함한 현재 순자산 구간으로 내 살림에 돌아온 복을 풀이합니다. 비공개를 선택하면 이 단서를 건너뜁니다.</dd>
      <dt>집안 형편</dt><dd>자랄 때 누린 여유나 겪은 제약을 현재 내 재산과 구별해 읽습니다. 비공개를 선택하면 이 단서를 건너뜁니다.</dd>
    </dl>
    <p>결과에서 지금의 나라면 어떤 선택을 할지 고르면 전생의 선택과 결말이 펼쳐집니다. 직업·재산·집안 형편은 함께 읽어 전생에 베푼 일이 어떤 복으로 돌아왔는지 풀이합니다. 인물과 사건은 창작이며, 참고한 역사 기록과 경전을 직접 열어볼 수 있습니다.</p>
    <h3>내 정보는 어디로 가나요?</h3><p>얼굴 사진은 기기에서만 분석하고, 원본이나 축소본을 저장하지 않습니다. 분석에 사용한 사진 데이터는 분석 직후 지웁니다. 서버는 얼굴 비율을 설명하는 문장, 직업명, 공개한 순자산 구간·집안 형편, 태어난 계절, 성씨·본관과 성격을 OpenAI에 보냅니다. 입력값과 측정 결과는 페이지 이동을 위해 이 탭에 임시 보관하며, 새 풀이를 시작하면 지워집니다.</p>
    <button type="button" id="guideDone" class="primary wide">확인</button>
  </dialog>
`);
const icons = {
  book:'<path d="M3 4.5c3.5-1 6.4-.4 9 1.6 2.6-2 5.5-2.6 9-1.6V19c-3.5-1-6.5-.2-9 1.8C9.5 18.8 6.5 18 3 19Z"/><path d="M12 6v14"/>',
  scroll:'<path d="M6 4h12a2.5 2.5 0 0 1 0 5h-1V6.7M6 4a2.4 2.4 0 0 1 2.5 2.5v11c0 2.3-1 3.5-3 3.5s-3-1.4-3-3h10c0 1.8.9 3 2.8 3S18 19.5 18 18V9"/><path d="M11.5 9h3m-3 3h3"/>',
  face:'<path d="M3 8V4h4m10 0h4v4m0 8v4h-4M7 20H3v-4"/><path d="M8 8.2c0-3 8-3 8 0v2c0 3-2 5.4-4 5.4S8 13.2 8 10.2zM5.8 19c1-2 3.2-3.4 6.2-3.4s5.2 1.4 6.2 3.4"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8.3 10V7a3.7 3.7 0 1 1 7.4 0v3M12 14v3"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
  share:'<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.4 10.7 7.2-4.3m-7.2 6.9 7.2 4.3"/>',
  return:'<path d="M4 10h10a5 5 0 0 1 0 10h-3m-2-15-5 5 5 5"/>'
};
for (const el of document.querySelectorAll('[data-icon]')) {
  el.outerHTML = '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24">'+icons[el.dataset.icon]+'</svg>';
}


$('guideOpen').addEventListener('click',()=>$('guide').showModal());
for(const id of ['guideClose','guideDone']) $(id).addEventListener('click',()=>$('guide').close());
$('guide').addEventListener('click',e=>{if(e.target===$('guide')){const b=$('guide').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('guide').close();}});
