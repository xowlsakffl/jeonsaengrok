// 의뢰인의 직능에서 옛 일거리를 찾는다. work는 가능한 행동, history는 출처로 확인한 배경이다.
const catalog = [
  {
    regions: /충주|탄금대/,
    jobs: /군인|군무원|소방|구급|응급구조|경찰|재난|구호|구조대|수의사/,
    actions: [/응급처치|구조활동|구호활동/, /길을안내|길을알려|인솔/, /다친.{0,4}(돌보|챙기|돕)/],
    era: '조선 1592년',
    place: '충주 탄금대와 달천 강가',
    work: '말에게 먹일 풀을 모으기, 강가로 몰려온 사람에게 길을 일러주기, 떨어진 일행의 소식을 전하기',
    detail: '강가에는 말이 달리기 힘든 논이 이어졌고, 고개 너머에서 온 소식은 사람의 입을 거쳐야 했다.',
    history: '임진왜란 초기에 조선군과 일본군이 충주에서 맞붙었다. 성에 머물던 주민들도 피해를 입었다.',
    sources: [{ label: '한국학중앙연구원 · 탄금대전투', url: 'https://encykorea.aks.ac.kr/Article/E0058773' }],
  },
  {
    regions: /공주|웅진/,
    jobs: /건축|인테리어|토목|건설|타일|도예|미장|시공|공간디자인|설계사/,
    actions: [/도면|평면도|모형집/, /집을꾸|가구를배치|실내를꾸/, /치수를재|수평을맞/],
    era: '백제 웅진시대, 6세기 전반',
    place: '웅진의 왕릉 공사터',
    work: '가마에서 온 전돌을 무늬대로 가려 놓기, 둥글게 휘는 천장에 맞춰 벽돌 줄을 맞추기',
    detail: '무덤방의 양쪽 벽은 위로 갈수록 안쪽으로 휜다. 글자가 새겨진 전돌도 나왔다.',
    history: '지금의 공주에 있는 무령왕릉은 벽돌을 쌓은 무덤이다. 부여 정동리 가마터에서도 공주의 벽돌무덤에서 나온 것과 같은 전돌이 발견됐다.',
    sources: [
      { label: '국사편찬위원회 · 무령왕릉 발굴 자료', url: 'https://db.history.go.kr/id/gskh_002_0020_0010_0010' },
      { label: '한국학중앙연구원 · 공주 출토 백제와전명', url: 'https://encykorea.aks.ac.kr/Article/E0077875' },
    ],
  },
  {
    regions: /경주|월성/,
    jobs: /기계|금속|제조|주조|생산직|용접|반도체|자동차|조각|금형|정비|주얼리|엔지니어/,
    actions: [/분해|뜯어보/, /수리|고쳐쓰|직접고치/, /조립|납땜|금속을다듬/],
    era: '통일신라 8세기, 771년 무렵',
    place: '신라 왕경, 오늘날의 경주',
    work: '큰 종에 들어갈 무늬의 본을 손보기, 글자 획과 꽃무늬가 뭉개진 곳을 살피기',
    detail: '종 몸체의 글과 넝쿨무늬는 청동을 부을 때 함께 만들어졌다. 완성된 종은 무게가 약 19톤이다.',
    history: '성덕대왕신종은 두 왕의 재위 기간에 걸쳐 만들어져 771년에 완성됐다. 종 표면에 남은 명문과 장식으로 당시의 작업을 살필 수 있다.',
    sources: [{ label: '국립경주박물관 · 성덕대왕신종 해설', url: 'https://gyeongju.museum.go.kr/kor/html/sub03/0305.html?file_id=9599&mode=D&no=5307' }],
  },
  {
    regions: /신안|압해|무안/,
    jobs: /물류|선원|해운|창고|구매|재고|조선소|항해|유통|수산|포장|선박/,
    actions: [/포장|짐을싸|짐싸기/, /물건.{0,4}분류|꼬리표|라벨/, /재고|수량을세|짐을나르/],
    era: '고려와 원의 교역기, 1323년',
    place: '닝보에서 하카타로 가는 바닷길과 신안 앞바다',
    work: '도자기 꾸러미의 임자를 목간으로 구분하기, 짐칸에서 그릇이 서로 부딪히지 않게 살피기',
    detail: '화물에는 나무 꼬리표를 달았다. 한 배에 깨지기 쉬운 그릇과 무거운 동전이 함께 실렸다.',
    history: '중국 닝보를 떠나 일본 하카타로 향하던 무역선이 신안 앞바다에 가라앉았다. 출수된 화물과 목간은 누가 무엇을 실었는지 보여준다.',
    sources: [{ label: '국립광주박물관 · 신안해저문화재', url: 'https://modu.museum.go.kr/explore/video/691' }],
  },
  {
    regions: /합천|초계/,
    jobs: /개발|프로그래|소프트웨어|데이터|서버|보안|사서|기록|보존|환경|전산|devops|software|developer|백엔드|프론트엔드|클라우드/,
    actions: [/기록|체크리스트|목록을만/, /오류|틀린곳|오탈자|빠진곳|교정/, /백업|대조|버전을비교/],
    era: '조선 15세기 후반',
    place: '합천 가야산 해인사 장경판전',
    work: '일정한 순서로 경판을 판가에 꽂기, 빠진 판을 찾아 짝을 맞추기, 습기가 밴 나무를 살피기',
    detail: '경판을 세운 판가 사이로 바람이 돌아야 했다. 앞뒤 벽의 위아래 창은 서로 크기가 다르다.',
    history: '고려 때 새긴 대장경판을 보존하려고 조선에서 장경판전을 갖추었다. 창의 배치와 자연 통풍은 나무가 상하는 것을 줄였다.',
    sources: [{ label: '문화체육관광부 · 해인사 장경판전', url: 'https://www.mcst.go.kr/usr/child/cultureStory/traditional/heritage.jsp?pMenuCD=4102020202' }],
  },
  {
    regions: /순흥|풍기|영주/,
    jobs: /교사|교육|선생|강사|교수|연구|지도사|학예|편집|작가|과외|학원|법무|변호/,
    actions: [/가르치|알려주는|설명해주|설명하는/, /필사|독서|책을읽|낭독/, /토론|질문을모|공부를도/],
    era: '조선 16세기 후반',
    place: '풍기 순흥의 소수서원, 오늘날의 영주',
    work: '여러 사람이 돌려 볼 책을 베끼기, 같은 경전 구절을 달리 풀이한 대목을 모아 강학을 준비하기',
    detail: '유생들은 강학당에 모였고 서책은 따로 보관했다. 여럿이 한 책을 보려면 손으로 옮겨 쓸 시간이 들었다.',
    history: '1543년에 세운 백운동서원이 1550년에 소수서원이라는 이름을 받았다. 강학과 제향을 함께 맡은 지방 교육기관이었다.',
    sources: [{ label: '국사편찬위원회 · 풍기 소수서원', url: 'https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_30&levelId=kc_r300680' }],
  },
  {
    regions: /동래|부산|초량/,
    jobs: /무역|영업|통역|번역|외교|관세|세관|협상|해외|회계|세무|금융|은행|통상|중개|판매/,
    actions: [/통역|번역|외국어/, /흥정|값을깎|협상|가격을비교/, /중재|중고거래|거래를주선/],
    era: '조선 18세기',
    place: '동래부 초량왜관의 개시대청',
    work: '서로 다른 말로 오간 값을 옮겨 전하기, 약속한 수량과 창고에 들인 물목을 맞춰 보기',
    detail: '공식 거래는 왜관 안의 개시대청에서 했다. 여기에 드나들며 교역할 수 있는 조선 상인의 수가 정해져 있었다.',
    history: '1678년 초량으로 옮긴 왜관은 조선과 일본 사이 외교와 무역의 무대였다. 사절이 묵는 곳과 상인이 물건을 거래하는 곳이 따로 있었다.',
    sources: [{ label: '국사편찬위원회 · 초량왜관', url: 'https://contents.history.go.kr/mobile/kc/view.do?levelId=kc_i302810' }],
  },
  {
    regions: /대구|달성/,
    jobs: /약사|약국|제약|의사|간호|병원|한의|보건|임상|원예|약재|식물|바이오/,
    actions: [/식물.{0,3}(기르|키우|돌보)|화분을돌/, /약초|약재|허브를말/, /원산지.{0,3}(확인|비교)/],
    era: '조선 후기, 18세기',
    place: '대구 경상감영 객사 주변 약령시',
    work: '산지별로 온 약재 꾸러미를 나누기, 말린 뿌리를 골라 무게를 달고 운송할 양을 정하기',
    detail: '장은 봄과 가을에 섰다. 먼 고을에서 나온 약재도 장이 열리는 시기에 맞춰 가져와야 했다.',
    history: '육로와 물길이 만나는 대구에는 여러 고을의 약재가 모였다. 조선 후기의 약령시는 감영 객사 일대에 열렸다.',
    sources: [{ label: '한국학중앙연구원 · 대구 약령시', url: 'https://encykorea.aks.ac.kr/Article/E0014120' }],
  },
  {
    regions: /강릉|명주/,
    jobs: /음악|가수|연주|무용|공연|배우|연극|댄스|영상|방송|유튜|크리에이터|홍보|광고|연출|마케터|마케팅|콘텐츠/,
    actions: [/춤을추|춤추|몸짓|안무/, /악기|연주|박자를맞|장단을맞/, /무대에|공연|흉내|연기연습/],
    era: '조선 후기',
    place: '강릉 단오의 놀이마당',
    work: '가면 너머로 악사의 장단에 맞춰 몸짓하기, 뒤쪽 구경꾼에게까지 동작의 뜻이 보이게 자리 잡기',
    detail: '관노가면극은 대사가 없는 탈놀이다. 무거운 장면도 우스운 장면도 몸짓과 음악으로 전해야 한다.',
    history: '조선시대 관청의 노비들이 놀았다는 강릉 관노가면극은 강릉단오제의 연희로 이어진다. 가면을 쓴 연희자와 악사가 함께한다.',
    sources: [{ label: '강릉단오제위원회 · 관노가면극', url: 'https://www.danojefestival.or.kr/kor/info/yeonhee.html' }],
  },
  {
    regions: /한산|서천|임천/,
    jobs: /의류|패션|섬유|봉제|바느질|원단|농업|농부|농사|공예|공방|스타일리스트|공예가|패턴|디자이너|디자인/,
    actions: [/바느질|재봉|옷을짓|옷을만들/, /뜨개|실을잇|자수|코바늘/, /재단|옷을줄|옷을고쳐/],
    era: '조선 후기, 18세기',
    place: '충청도 한산의 모시 짜는 집',
    work: '모시풀에서 뽑은 섬유를 가늘게 쪼개 잇기, 베틀에서 날실의 긴장과 방 안의 습기를 살피기',
    detail: '공기가 마르면 가는 날실이 끊어진다. 같은 베틀에 앉아도 그날의 습기에 따라 손이 가는 데가 다르다.',
    history: '18세기 『택리지』에는 한산의 모시밭이 나온다. 모시를 짓는 데는 풀을 재배하는 일부터 실을 잇고 베를 짜는 일까지 여러 사람의 손이 들었다.',
    sources: [
      { label: '한국학중앙연구원 · 한산모시짜기', url: 'https://encykorea.aks.ac.kr/Article/E0061679' },
      { label: '한국학중앙연구원 · 한산모시의 직조', url: 'https://encykorea.aks.ac.kr/Article/E0061678' },
    ],
  },
  {
    regions: /수원|화성/,
    jobs: /조리|요리|셰프|제과|제빵|파티시|영양|음식|식당|급식|외식|바리스타|접객|호텔|케이터링|행사|주방|전업주부/,
    actions: [/요리|반찬을만|도시락|빵을굽|베이킹/, /밥.{0,3}(사주|사는|차려)|음식.{0,3}(나눠|대접)/, /식단|식재료|레시피|장보기/],
    era: '조선 정조 19년, 1795년',
    place: '수원 화성 행궁의 잔칫상 준비터',
    work: '여럿이 나눠 만들 상차림의 수를 헤아리기, 그릇과 재료를 나누고 음식을 내는 때를 맞추기',
    detail: '큰 잔치에는 임시 주방인 숙설소를 두었다. 여러 상에 오르는 음식을 차례에 맞춰 내야 했다.',
    history: '『원행을묘정리의궤』에는 화성 행차 때 차린 음식이 실려 있다. 왕실의 여드레 행차에 어떤 식사가 마련됐는지 살필 수 있다.',
    sources: [{ label: '국사편찬위원회 · 궁중음식과 의궤', url: 'https://contents.history.go.kr/play/view.do?levelId=tt_b44' }],
  },
  {
    regions: /한성|한양|인천|제물포/,
    jobs: /우편|배달|택배|배송|운송|통신|집배|우체|행정|사무|고객|상담|접수|공무원|서비스직|콜센터/,
    actions: [/편지.{0,3}(쓰|써|보내)|손편지/, /주소.{0,3}(확인|정리)/, /소식을전|안부를전|우표를모/],
    era: '조선 개항기, 1884년',
    place: '한성 우정총국과 인천 제물포 사이',
    work: '처음 온 손님에게 우표 쓰는 법을 보이기, 봉투의 수신처를 읽어 같은 곳으로 갈 편지를 나누기',
    detail: '처음 쓸 수 있었던 우표는 5문과 10문 두 종류였다. 첫 우편 노선은 한성과 인천을 이었다.',
    history: '1884년에 우정총국이 근대식 우편 업무를 시작했다. 갑신정변으로 곧 문을 닫았고 우편 업무는 1895년에 재개됐다.',
    sources: [
      { label: '우정박물관 · 우편사업의 개시', url: 'https://www.koreapost.go.kr/postmuseum/subIndex/4513.do' },
      { label: '우정박물관 · 최초의 우표', url: 'https://kpds.koreapost.go.kr/postmuseum/subIndex/4531.do' },
    ],
  },
];

function normalize(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
}

// 생일은 동점인 배경에만 쓰는 재현 가능한 추첨값이다.
function tieBreaker(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
  }
  return hash >>> 0;
}

function publicContext({ era, place, work, detail, history, sources }) {
  return { era, place, work, detail, history, sources: sources.map(source => ({ ...source })) };
}

export function candidateContexts(profile = {}, limit = 3) {
  const clan = normalize(profile.clan);
  const job = normalize(profile.job);
  const habits = normalize(profile.personality);
  const seed = tieBreaker([profile.birth, job, habits].join('|'));
  const groups = new Map();
  for (const entry of catalog) {
    const actions = entry.actions.filter(pattern => pattern.test(habits)).length;
    const relevance = Number(entry.jobs.test(job)) * 2 + actions;
    const score = relevance * 2 + Number(entry.regions.test(clan));
    if (!groups.has(score)) groups.set(score, []);
    groups.get(score).push(entry);
  }
  const scores = [...groups.keys()].sort((a, b) => b - a);
  const ranked = scores.flatMap(score => {
    const tied = groups.get(score);
    const start = seed % tied.length;
    return [...tied.slice(start), ...tied.slice(0, start)];
  });
  return ranked.slice(0, Math.max(0, limit)).map(publicContext);
}

export function selectContext(profile = {}) {
  return candidateContexts(profile, 1)[0];
}
