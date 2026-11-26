const $ = id => document.getElementById(id);
document.body.insertAdjacentHTML('beforeend', `  <dialog id="guide"><div class="dialog-top"><h2>전생록 이용 안내</h2><button type="button" id="guideClose" class="icon-btn" aria-label="닫기"><i data-icon="close"></i></button></div>
    <p>정면 얼굴 사진 한 장과 현생의 단서를 입력하면 전생의 한 장면과 그 풀이가 열립니다.</p>
    <h3>얼굴은 어떻게 읽나요?</h3><p>이 기기에서 얼굴 특징점 68개를 찾고, 코·턱선·눈 사이·눈썹을 읽습니다. 사진에서 어느 지점을 보았는지 결과에서 눌러볼 수 있어요. 관상은 전통적인 상징 풀이입니다.</p>
    <h3>이야기는 어떻게 쓰나요?</h3><p>당신이 태어나기 전, 구석기부터 2020년대까지 한국사 자료에 남은 일터 중 한 곳을 고릅니다. 그곳에서 맡는 일과 사건은 당신이 적은 버릇에서 시작됩니다. 지금의 일자리 여건은 전생에 얻은 신뢰나 기회로, 현생의 재산은 누군가에게 베푼 도움이 돌아온 복으로 풀이합니다. 인물과 사건은 역사소설처럼 즐기는 창작입니다.</p>
    <h3>내 정보는 어디로 가나요?</h3><p>서버 AI는 태어난 계절, 성씨·본관, 선택한 형편과 일자리 여건, 성격, 얼굴의 묘사를 OpenAI로 보냅니다. 직업명과 사진 원본은 이 기기에 남습니다. 입력과 축소한 미리보기는 페이지 이동을 위해 이 탭에 임시 보관하며, 새 풀이를 시작하면 지워집니다.</p>
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
  return:'<path d="M4 10h10a5 5 0 0 1 0 10h-3m-2-15-5 5 5 5"/>'
};
for (const el of document.querySelectorAll('[data-icon]')) {
  el.outerHTML = '<svg aria-hidden="true" class="icon" viewBox="0 0 24 24">'+icons[el.dataset.icon]+'</svg>';
}


$('guideOpen').addEventListener('click',()=>$('guide').showModal());
for(const id of ['guideClose','guideDone']) $(id).addEventListener('click',()=>$('guide').close());
$('guide').addEventListener('click',e=>{if(e.target===$('guide')){const b=$('guide').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('guide').close();}});
