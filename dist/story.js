// Historical settings come from the linked records. The people, decisions, and
// connections between lifetimes are authored fiction assembled on this device.
const sources = {
  physiognomy: { label: '한국민족문화대백과사전 · 관상', url: 'https://encykorea.aks.ac.kr/Article/E0004873' },
  sin: { label: '한국민족문화대백과사전 · 신립', url: 'https://encykorea.aks.ac.kr/Article/E0032901' },
  battle: { label: '한국민족문화대백과사전 · 탄금대전투', url: 'https://encykorea.aks.ac.kr/Article/E0058773' },
  book: { label: '전주시 · 완판본문화관', url: 'https://www.jeonju.go.kr/qrcode/108.jsp?landingurl=108' },
  kiln: { label: '한국민족문화대백과사전 · 강진 고려청자 요지', url: 'https://encykorea.aks.ac.kr/Article/E0001415' },
  wall: { label: '국가유산청 · 수원 화성', url: 'https://www.heritage.go.kr/heri/html/HtmlPage.do?pageNo=5_9_2_1&pg=%2Funesco%2FHeritage%2FHeritage_05.jsp' },
  shore: { label: '유네스코 · 제주 해녀 문화', url: 'https://ich.unesco.org/en/RL/culture-of-jeju-haenyeo-women-divers-01068' },
};

const aptitudes = [
  { key: 'systems', pattern: /개발|프로그래|코딩|회계|데이터|분석|수학|연구|엔지니어|품질|서버|금융|세무|재무|감사|전산|설계|software|engineer|programmer|accountant|developer/i, skill: '엇갈린 수와 규칙을 대조하는 일', worlds: ['wall', 'book'] },
  { key: 'making', pattern: /공예|제조|생산|도예|디자인|화가|일러스트|건축|미술|정비|공사|인테리어|공장|수리|목수|재봉|designer|artist|mechanic/i, skill: '손으로 모양을 잡고 어긋난 곳을 고치는 일', worlds: ['kiln', 'wall'] },
  { key: 'care', pattern: /간호|의사|치료|병원|돌봄|약사|상담|복지|보육|육아|요양|재활|보건|수의|doctor|nurse|care/i, skill: '사람의 상태를 살피고 필요한 손길을 보태는 일', worlds: ['shore', 'kiln'] },
  { key: 'words', pattern: /교사|교수|강사|교육|작가|편집|기자|번역|통역|사서|출판|음악|방송|마케팅|홍보|콘텐츠|영상|teacher|writer|editor/i, skill: '누군가의 말과 생각이 다른 이에게 닿게 하는 일', worlds: ['book', 'shore'] },
  { key: 'supply', pattern: /배송|배달|물류|유통|영업|판매|요리|음식|카페|조리|식당|장사|자영업|사업|구매|무역|운전|서비스|매장|경영|창업|판매|chef|sales|driver/i, skill: '사람과 물건이 제때 만날 자리를 마련하는 일', worlds: ['shore', 'kiln', 'wall'] },
  { key: 'learning', pattern: /학생|취준|취업준비|공시생|수험|학원생|대학원|student/i, skill: '처음 보는 일을 익히고 물어가며 배우는 일', worlds: ['book', 'wall', 'kiln'] },
];
const everyday = { key: 'everyday', skill: '그날 맡은 몫을 살피며 현장을 지키는 일', worlds: ['book', 'shore', 'wall', 'kiln'] };

const traits = [
  { key: 'quiet', pattern: /소심|내향|조용|낯가|신중|조심|내성|혼자|말수|겁이|수줍|차분/, name: '먼저 나서기를 망설인다는 단서', act: '사람들이 돌아설 때까지 기다렸습니다.' },
  { key: 'bold', pattern: /외향|외성|활발|사교|앞장|적극|대담|솔직|직설|당당|리더|용감|결단|활동/, name: '먼저 나선다는 단서', act: '모두 듣는 앞에서 먼저 자기 이름을 댔습니다.' },
  { key: 'careful', pattern: /꼼꼼|계획|분석|정확|완벽|세심|성실|논리|침착|현실적|계산/, name: '하나씩 확인하는 성향', act: '혹여 다른 누군가에게 피해가 갈까 처음부터 다시 살폈습니다.' },
  { key: 'last', pattern: /게으|게을|미루|벼락|귀찮|느긋|느리|할\s*땐|할\s*때/, name: '막판에 힘을 쓰는 성향', act: '다른 때 같으면 내일까지 미뤘을 일을 그날 밤에 마쳤습니다.' },
  { key: 'open', pattern: /베풀|돈도?\s*잘\s*쓰|돈을?\s*잘\s*쓰|남을?\s*도|착하|착한|배려|다정|퍼주|정이\s*많|사람.*좋아|공감|친절|이타|챙기|따뜻|밥.*사/, name: '남에게 자기 몫을 내어주는 성향', act: '이 일로 모자랄 몫은 자기가 메우겠다고 마음먹었습니다.' },
  { key: 'curious', pattern: /호기심|궁금|관찰|새로운|상상|창의|탐구|모험/, name: '그냥 지나치지 못하는 호기심', act: '남들이 지나친 뒷면도 한 번 뒤집어 보았습니다.' },
];
const noseNames = { full: '양쪽 눈 바깥 사이의 거리에 비해 넓은 코 폭', balanced: '양쪽 눈 바깥 사이의 거리와 중간 비율을 이루는 코 폭', narrow: '양쪽 눈 바깥 사이의 거리에 비해 좁은 코 폭' };
const jawNames = { wide: '비교적 넓은 턱선', narrow: '아래로 좁아지는 턱선', balanced: '중간 너비의 턱선' };
const noseThemes = { full: '여럿이 나눠 갖는 몫', balanced: '서로 주고받은 두 몫', narrow: '하나만 남은 귀한 몫' };
const witnesses = { wide: '마당에 모인 이웃들', balanced: '늘 곁에서 일하던 동무', narrow: '그날 거기 있던 아이' };
const seasonByMonth = ['겨울', '겨울', '봄', '봄', '봄', '여름', '여름', '여름', '가을', '가을', '가을', '겨울'];
const seasonImages = {
  봄: ['담장 밑에 제비꽃이 올라온 봄', '버들가지에 연둣빛이 번진 봄', '처마 끝에서 봄비가 떨어지던 날'],
  여름: ['매미가 한꺼번에 울던 여름', '소나기가 지나 흙냄새가 짙던 여름', '낮이 길어 저녁까지 길이 환하던 여름'],
  가을: ['짚을 말리는 냄새가 나던 가을', '감잎이 담장 너머로 떨어지던 가을', '마른 갈대가 바스락거리던 가을'],
  겨울: ['첫눈이 마당에 얇게 쌓인 겨울', '우물가에 고드름이 잡히던 겨울', '문지방의 서리가 발밑에서 녹던 겨울'],
};

// Wealth is an individual snapshot and the family option describes circumstances.
// Neither establishes inherited sums or a person's merit.
const wealthThreads = {
  debt: { image: '다 갚지 못한 외상 하나', echo: '장부에서 가장 오래 살아남은 건 다 갚지 못한 외상 한 줄입니다.' },
  under50: { image: '생활 속에서 아껴 둔 작은 몫', echo: '마지막 날까지 남은 건 주머니 속 동전 몇 닢이었습니다. 꼭 필요할 때 쓰려고 떼어 둔 몫이었지요.' },
  to200: { image: '조금씩 모아 마련한 일상의 터전', echo: '문을 나설 때 당신은 작은 궤짝을 챙겼습니다. 푼돈이 모일 때마다 그 안에 한 닢씩 넣어 두곤 했습니다.' },
  to500: { image: '다시 시작할 수 있을 만큼 모은 밑천', echo: '몇 해 품삯을 모은 밑천이 남았습니다. 그 돈에서 누군가 먼저 자기 몫을 꺼내 갈 수 있도록 당신은 함의 뚜껑을 열어 두었습니다.' },
  to1000: { image: '남의 몫까지 맡아 간수하는 책임', echo: '혼자 들 수 없는 돈궤 하나가 남았습니다. 당신은 제 것과 남의 것을 나누어 종이 한 장에 써 두었습니다.' },
  over1000: { image: '여럿의 살림에 손을 뻗을 만큼 큰 재물', echo: '집 한 채 값의 재물이 당신 손을 거쳐 갔습니다. 사람들은 액수보다 그 돈이 가장 먼저 닿았던 집을 기억했습니다.' },
  private: { image: '돈으로 값을 매기지 않은 약속', echo: '그때의 약속에는 끝내 값이 매겨지지 않았습니다.' },
};
const familyThreads = {
  struggle: { image: '빠듯한 살림을 함께 건너는 인연', echo: '이번 생에 돌아온 인연은 어려운 날에도 한 숟갈을 나눠 줄 사람입니다.' },
  modest: { image: '작은 생활을 오래 이어가는 집안복', echo: '이번 생에서는 식구들이 당연한 듯 차려 놓은 한 끼 밥상으로 그 인연을 다시 만납니다.' },
  comfortable: { image: '먼저 손 내밀어 주는 집안의 여유', echo: '전생에는 당신이 남의 시작을 거들었습니다. 이번 생에는 당신이 발을 디딜 때 집안에서 먼저 자리를 내줍니다.' },
  affluent: { image: '처음부터 넉넉하게 주어진 집안복', echo: '한 사람의 빈자리를 먼저 채워 둔 일은, 이번 생에 태어나 보니 이미 차려져 있던 집안의 넉넉한 몫으로 돌아옵니다.' },
  private: { image: '혈연 밖에서 이어지는 인연', echo: '다음 생에서 그 인연은 문득 당신의 편을 들어 주는 낯선 이로 돌아옵니다.' },
};

const worlds = {
  war: {
    era: '1592년 · 충주', title: '적장의 성을 이어받은 서기', roles: {
      systems: '일본군의 군량 장부를 대조하는 서기', making: '군량 됫박의 눈금을 고치던 일본군 목수',
      care: '부상자에게 죽을 나눠 주던 일본군의 취사 일꾼', words: '보고서를 정서하는 일본군 필사자',
      supply: '곡식의 출납을 맡은 일본군 창고지기', learning: '군량 장부 쓰는 법을 배우던 일본군 견습 서기', everyday: '장부를 전하던 일본군 심부름꾼',
    },
    titles: { making: '적장의 성을 깎아 새긴 목수', care: '적에게 한 그릇을 남긴 취사꾼', words: '적장의 성을 옮겨 쓴 필사자', supply: '적의 곳간을 지킨 창고지기', everyday: '적장의 이름을 나른 심부름꾼' },
    setup: '당신 일이 끝날 때면 충주의 집마다 쌀독 바닥이 한 뼘씩 더 드러났습니다. 어느 집의 됫박에는 유난히 작은 손자국이 남아 있었습니다.',
    shortage: { full: '세 집에 나눠 줄 한 자루', narrow: '어느 아이의 마지막 한 줌', balanced: '양쪽이 다 제 것이라던 두 됫박' },
    act: '그 집에 돌아갈 쌀을 몰래 떼어 두고, 저녁에 받을 자기 몫으로 빈자리를 메웠습니다. 그날 보고서에서 당신이 몇 번이나 마주친 글자는 적장 신립의 성, 申이었습니다.',
    remains: '비어 있던 됫박 바닥에 누군가 申을 손가락으로 써 두었습니다. 오늘 당신이 서명할 때 첫머리에 적는 바로 그 글자입니다.',
    summary: '적장의 이름에서 처음 만난 성을 이번 생에는 제 이름으로 씁니다.',
    history: '1592년 충주 탄금대에서 조선군을 이끈 신립의 본관은 평산입니다. 이 전투와 본관이 역사적 배경이며, 장부와 집 한 채에 얽힌 사연은 소설입니다.',
    sources: [sources.sin, sources.battle],
  },
  book: {
    era: '조선 후기 · 전주', title: '남의 이름을 되살린 책방 사람', roles: {
      systems: '뒤집힌 글자를 찾아내는 교정 일꾼', making: '나무에 글씨를 새기는 각수', care: '책을 빌려 주고 살림 소식을 듣던 책방지기',
      words: '이야기를 글로 옮기는 필사자', supply: '장터로 책을 져 나르던 책장수', learning: '먹칠부터 배우던 책방의 견습생', everyday: '갓 찍은 종이를 말리는 책방 일꾼',
    },
    setup: '새 책의 마지막 장이 마를 때, 이야기를 들려준 사람의 이름만 빠져 있는 걸 보았습니다. 책 주인은 이미 팔기로 한 책이니 다시 찍을 수 없다고 했습니다.',
    shortage: { full: '여럿이 모아 준 붓과 종이', narrow: '딱 한 장 남은 깨끗한 종이', balanced: '끝장이 다른 두 권의 책' },
    act: '끝장 안쪽에 이름을 손으로 적었습니다. 책이 한 권 팔리면 다른 한 권을 열어 다시 적었습니다. 그 사람이 누구였는지 묻는 아이에게는 그의 목소리까지 흉내 내어 읽어 주었습니다.',
    remains: '오래되어 표지가 떨어진 책에서 누군가 그 이름을 또박또박 읽었습니다. 한 번도 만나지 못한 이의 성이 입에서 입으로 옮겨 갔습니다.',
    summary: '사라질 뻔한 이름 한 줄이 책보다 오래 사람들 입에 남았습니다.',
    history: '조선 후기 전주에서는 민간 책방들이 소설 등을 목판으로 인쇄해 판매했습니다. 이 이야기 속 책방과 책 한 권에 얽힌 사연은 창작입니다.',
    sources: [sources.book],
  },
  wall: {
    era: '정조 시대 · 수원', title: '지워진 품삯을 돌려준 사람', roles: {
      systems: '돌 수와 일꾼의 품을 대조하는 셈꾼', making: '돌의 이음새를 맞추는 석공', care: '일꾼들의 상처를 돌보던 약방 심부름꾼',
      words: '일한 날수를 받아 적는 필사자', supply: '짐수레와 품삯을 챙기던 현장 일꾼', learning: '돌 고르는 눈을 배우던 석공의 제자', everyday: '성 아래로 물과 연장을 나르던 일꾼',
    },
    setup: '성문에 돌 하나를 더 얹던 날, 며칠째 손을 다쳐 누운 일꾼의 이름이 명단에서 지워졌습니다. 빈 칸 덕에 장부의 수는 오히려 딱 맞았습니다.',
    shortage: { full: '일곱 사람의 품삯 꾸러미', narrow: '단 하루치 품삯', balanced: '서로 맞지 않는 품삯표 두 장' },
    act: '다친 사람이 맡았던 몫까지 끝내 두 사람의 이름을 나란히 올렸습니다. 덧댄 종이가 들뜨지 않도록 작은 돌 하나를 모서리에 올려 두었습니다.',
    remains: '다친 이가 돌아와 그 돌을 자기 집 주춧돌 곁에 묻었습니다. 사람 하나를 버티게 한 작은 돌은 성곽 밖에도 남았습니다.',
    summary: '성벽을 세운 날, 한 사람의 이름도 다시 세웠습니다.',
    history: '수원 화성은 정조 때인 1794년에 착공해 1796년에 완성되었습니다. 이 이야기에는 화성을 짓던 현장에서 영감을 얻어 지은 인물과 일화가 등장합니다.',
    sources: [sources.wall],
  },
  kiln: {
    era: '고려 시대 · 강진', title: '깨진 그릇을 물려준 가마지기', roles: {
      systems: '불빛을 지켜보고 굽는 순서를 적는 가마지기', making: '그릇 굽에 무늬를 새기는 도공', care: '화상 입은 손들을 씻겨 주던 가마 일꾼',
      words: '그릇마다 주문자의 표식을 그리는 일꾼', supply: '가마에서 나온 그릇을 꾸리는 장사꾼', learning: '흙을 고르는 일부터 배우던 어린 제자', everyday: '가마 곁에서 장작을 고르던 일꾼',
    },
    setup: '가마 문을 열자 어린 제자가 처음 빚은 그릇이 비스듬히 갈라져 있었습니다. 누가 책임질지 가리려는 사람들 앞에서 아이는 자기 손을 등 뒤로 숨겼습니다.',
    shortage: { full: '한 상을 다 채울 대접들', narrow: '오직 하나 남은 멀쩡한 사발', balanced: '짝을 이룬 크고 작은 그릇' },
    act: '갈라진 그릇을 둘로 갈라 제자 손에 쥐여 주었습니다. 단면에 낀 작은 돌멩이를 보고서야 아이도 깨진 까닭을 알았습니다. 당신은 아이를 데리고 함께 흙을 다시 걸렀습니다.',
    remains: '어른이 된 그 제자는 두 쪽 난 사발을 작업대 곁에 두었습니다. 누가 실수할 때마다 꺼내 보여 주느라 그릇 끝은 마침내 손에 베이지 않을 만큼 닳았습니다.',
    summary: '망친 그릇 하나가 누군가의 평생 스승이 되었습니다.',
    history: '고려시대 강진 대구면의 가마에서는 청자 대접, 병, 잔과 여러 그릇을 구웠습니다. 이 이야기 속 가마 사람들과 사발에 얽힌 사연은 창작입니다.',
    sources: [sources.kiln],
  },
  shore: {
    era: '옛 제주 · 바닷마을', title: '물 밖에서 한 사람을 더 센 이', roles: {
      systems: '물질 나간 사람 수와 돌아온 망사리를 세는 일꾼', making: '해진 그물을 손보던 바닷가 일꾼', care: '물에서 오른 이들의 마른 옷과 물을 챙기던 동무',
      words: '물길과 바람의 변화를 전하던 마을 전령', supply: '거둬들인 해산물을 나누는 장터 일꾼', learning: '바닷일을 배우며 물가를 지키던 견습생', everyday: '물가에서 짐을 받는 마을 일꾼',
    },
    setup: '돌아온 짐은 수가 맞았는데 마당 한쪽의 마른 옷이 그대로였습니다. 너울이 이는 동안 바닷가에서는 누구나 누군가를 이미 보았다고 했습니다.',
    shortage: { full: '여럿의 몫이 담긴 망사리', narrow: '물가에 남은 옷가지 하나', balanced: '서로 주인이 바뀐 짐 두 개' },
    act: '주인을 잃은 옷을 들고 해안을 따라 걸었습니다. 한참 뒤 다른 포구에서 돌담에 기대어 쉬는 사람을 만나, 말이 나오기 전에 옷부터 어깨에 덮어 주었습니다.',
    remains: '당신 발걸음을 기억한 이가 물가에 옷걸이 하나를 더 세웠습니다. 그 집에는 누가 늦어도 마지막 옷걸이까지 비는 것을 보고서야 불을 끄는 버릇이 생겼습니다.',
    summary: '짐을 세던 손이 마지막에는 돌아오지 않은 사람 하나를 셌습니다.',
    history: '제주 해녀 문화에는 함께 물질하고 바다에 대한 지식을 나누는 공동체의 관습이 전합니다. 포구의 인물과 그날 있었던 사건은 창작입니다.',
    sources: [sources.shore],
  },
};

// An outspoken or questioning account opens a different conflict within the
// same historical setting, so one family origin need not mean one life.
const secondLives = {
  war: {
    title: '적의 집에 제 이름을 남긴 사람',
    summary: '없던 집으로 적어 돌려보낸 한 가족, 그 집의 성이 돌아왔습니다.',
    setup: '당신은 충주 성밖의 집을 돌아 남은 곡식을 셌습니다. 한 집 아이가 곡식독 안에 숨고, 어머니는 빈 바구니를 가슴에 끌어안았습니다. 뒤에서 장부를 내놓으라는 소리가 났습니다.',
    act: '빈집이라고 적고, 나중에 틀리면 자기를 찾아오라며 이름을 남겼습니다. 그날 적장 신립의 성 申을 베끼던 손으로, 한 집안의 이름을 목록에서 지워 주었습니다.',
    remains: '그 집의 아이는 끝내 당신 이름을 읽지 못했지만 종이만은 간직했습니다. 이번 생에 돌아온 글자는 지워 주었던 집안의 성, 申이었습니다.',
  },
  book: {
    title: '끝장을 팔고 첫 장을 남긴 사람',
    summary: '옛날에 빌려준 책의 마지막 한 줄이 오늘 당신의 첫 글자가 되었습니다.',
    setup: '책을 빌려 간 장돌뱅이가 돌아오지 않았습니다. 며칠 뒤 손때 묻은 책의 앞 절반이 문턱에 놓였습니다. 나머지는 돈이 떨어진 사람이 하룻밤 방값으로 맡기고 갔다는 전갈도 붙어 있었습니다.',
    act: '여관으로 찾아가 끝장 값 대신 사연 하나를 읽어 주겠다고 했습니다. 이야기가 절정에 이르자 주인이 먼저 책의 나머지 반을 내밀었습니다. 둘이 한 장씩 번갈아 읽은 뒤에야 온전한 책을 돌려받았습니다.',
    remains: '오래된 책을 펼치자 앞장과 뒷장의 먹빛이 달랐습니다. 서로 다른 집을 돌아 한 책이 된 흔적을 손끝으로 짚어 볼 수 있었습니다.',
  },
  wall: {
    title: '제 이름을 빼고 성을 세운 사람',
    summary: '자기 이름을 비석에서 뺀 그날, 비로소 누가 성을 쌓았는지 보였습니다.',
    setup: '함께 일한 사람들의 이름을 기념할 작은 돌이 마당에 놓였습니다. 돌 위에는 석공의 이름이 있었고 매일 그들을 먹인 밥 짓는 이의 이름은 없었습니다. 더 새길 자리가 없다는 것이었습니다.',
    act: '당신은 자기 이름 위에 붓으로 금을 그었습니다. 자리가 비자 다른 이도 제 이름을 한 칸씩 좁혔습니다. 새겨진 글자는 전보다 작아졌지만 돌에 담긴 사람은 많아졌습니다.',
    remains: '누군가 그 돌을 탁본해 마당에 널었습니다. 끝에 덧붙인 한 사람의 이름이 먹물 속에서 제일 먼저 말랐습니다.',
  },
  kiln: {
    title: '그릇 밑에서 편지를 건진 사람',
    summary: '완성된 그릇을 팔러 갔다가 그 밑에 묻혀 있던 말을 돌려보냈습니다.',
    setup: '그릇 하나를 닦다가 밑굽에 다섯 글자가 숨어 있는 것을 보았습니다. 고향에 두고 온 이에게, 글을 모르는 장인이 겨우 베껴 넣은 안부였습니다. 아침이면 다른 고을 상인에게 넘어갈 그릇이었습니다.',
    act: '좋은 그릇을 덜어 내고 밑굽에 말이 담긴 그릇을 꾸렸습니다. 고향 가는 장꾼 손에 보낼 때까지 그릇 값을 당신이 대신 치렀습니다.',
    remains: '그릇을 받은 집에서는 해마다 그릇을 채웠다가 밥이 다 비면 뒤집어 그 밑의 안부를 읽었습니다.',
  },
  shore: {
    title: '제 몫을 놓고 물때를 적은 사람',
    summary: '그날 놓친 장삿배가 바다를 건너는 사람들의 달력이 되었습니다.',
    setup: '장에 먼저 가려던 이들이 서둘러 해산물을 꾸리고 있었습니다. 바람은 잦아들었는데 늘 드러나던 바위가 좀처럼 보이지 않았습니다. 섬으로 건너갈 작은 배가 물가에서 기다렸습니다.',
    act: '당신은 짐을 풀고 물이 빠지는 자리에 작은 돌 세 개를 놓았습니다. 다른 사람들이 그 돌이 드러날 때를 기다리느라 장은 놓쳤지만, 모두 제 발로 뭍에 올랐습니다.',
    remains: '포구 아이들이 바위 높이를 보며 돌아갈 시간을 헤아렸습니다. 누가 처음 한 일인지 잊고서도 세 개의 돌은 오래 남았습니다.',
  },
};

function cleaned(value) {
  return String(value ?? '').trim().normalize('NFC');
}

function copula(noun) {
  const last = noun.charCodeAt(noun.length - 1) - 0xac00;
  return last >= 0 && last < 11172 && last % 28 !== 0 ? '이었습니다' : '였습니다';
}

function stableIndex(value, length) {
  let hash = 2166136261;
  for (const letter of value) hash = Math.imul(hash ^ letter.codePointAt(0), 16777619);
  return (hash >>> 0) % length;
}

function pickWorld(surname, clan, work, seed) {
  if (['신', '申', '신(申)'].includes(surname) && /평산|平山/.test(clan)) return 'war';
  if (/전주|완산/.test(clan)) return 'book';
  if (/수원/.test(clan)) return 'wall';
  if (/강진/.test(clan)) return 'kiln';
  if (/제주|탐라/.test(clan)) return 'shore';
  return work.worlds[stableIndex(seed, work.worlds.length)];
}

export function generateReading(profile) {
  const surname = cleaned(profile.surname).replace(/씨$/, '');
  const clan = cleaned(profile.clan);
  const hasClan = Boolean(clan && !/^(모름|모르겠|미상|알 수 없|모르|없음)/.test(clan));
  const birth = cleaned(profile.birth);
  const job = cleaned(profile.job);
  const personality = cleaned(profile.personality);
  const work = aptitudes.find(option => option.pattern.test(job)) ?? everyday;
  const matched = traits.filter(option => option.pattern.test(personality));
  const visibleTraits = matched.length > 2 ? [matched[0], matched[matched.length - 1]] : matched;
  const nose = Object.hasOwn(noseNames, profile.face?.nose) ? profile.face.nose : 'balanced';
  const jaw = Object.hasOwn(jawNames, profile.face?.jaw) ? profile.face.jaw : 'balanced';
  const wealth = wealthThreads[profile.wealth] ?? wealthThreads.private;
  const family = familyThreads[profile.family] ?? familyThreads.private;
  const month = Number(birth.split('-')[1]);
  const season = seasonByMonth[month - 1] ?? '봄';
  const seasonScene = seasonImages[season][stableIndex(birth, seasonImages[season].length)];
  const seed = [surname, clan, birth, job, nose, jaw].join('|');
  const worldId = pickWorld(surname, clan, work, seed);
  const alternate = matched.some(trait => trait.key === 'bold' || trait.key === 'curious');
  const world = alternate ? { ...worlds[worldId], ...secondLives[worldId] } : worlds[worldId];
  const role = world.roles[work.key];
  const object = world.shortage[nose];
  const witness = witnesses[jaw];
  const decision = visibleTraits.map(trait => trait.act).join(' ') || '누구에게 물어도 답을 정해 주지 못하는 순간, 당신은 손에 든 것부터 다시 살폈습니다.';
  let clanClue;
  let familyNameEcho = '';
  if (worldId === 'war') {
    clanClue = '평산 신씨라는 단서로 같은 본관의 신립이 등장하는 충주를 골랐습니다. 맞은편에 있던 인물이 적장의 성을 달고 태어나는 반전으로 엮었습니다.';
  } else {
    const placeInClan = /전주|완산|수원|강진|제주|탐라/.test(clan);
    clanClue = hasClan && placeInClan
      ? `본관 ‘${clan}’과 이어지는 지명을 무대로 골랐고, 성씨 ‘${surname}’를 후일담 속 글자로 남겼습니다.`
      : `성씨 ‘${surname}’를 후일담에 남은 글자로 삼았습니다. ${hasClan ? '입력한 본관에 연결되는 사료가 준비되지 않아' : '본관을 비워 두어'} 직업의 성격과 생일 단서로 시대와 장소를 골랐습니다.`;
    familyNameEcho = ` 그 이야기를 간직한 집에는 ‘${surname}’이라는 성 한 글자가 전했고, 이번 생의 당신에게도 그 글자가 남았습니다.`;
  }
  return {
    title: (!alternate && world.titles?.[work.key]) || world.title,
    era: world.era,
    summary: world.summary,
    paragraphs: [
      `당신은 ${role}${copula(role)}. ${world.setup} 그날 당신 손에 남은 것은 ${object}${copula(object)}.`,
      `${decision} ${world.act} ${wealth.echo}`,
      `세월이 흘렀습니다. ${seasonScene}, ${world.remains} 그 내력을 전한 것은 ${witness}${copula(witness)}.${familyNameEcho} ${family.echo}`,
    ],
    clues: [
      { label: '얼굴 관상', detail: `사진의 특징점에서 ${noseNames[nose]}과 ${jawNames[jaw]}이 함께 보였습니다. 전통 관상의 재백궁(코)과 지각(턱)을 빌려 이야기의 두 단서를 정했습니다. 코 비율로 고른 상징은 ‘${noseThemes[nose]}’이고, 턱 비율로 고른 목격자는 ‘${witness}’입니다.` },
      { label: '생년월일', detail: `생일 ${birth}에서 ${season}을 골랐습니다. ‘${seasonScene}’은 역사적 사건 이후의 후일담을 여는 창작 장면입니다.` },
      { label: '성씨와 본관', detail: clanClue },
      { label: '내 재산', detail: `선택한 응답은 ‘${wealth.image}’에 연결했습니다. 그 흔적을 결정 직후 인물의 손에 남은 것으로 풀었습니다.` },
      { label: '집안 형편', detail: profile.family === 'private' ? '집안 형편을 비워 두어, 혈연 밖의 인물이 다음 생에서도 당신 편에 서는 결말을 골랐습니다.' : `선택한 응답은 ‘${family.image}’에 연결했습니다. 집안으로부터 받는 지원도 그 자체로 복으로 헤아리는 이 작품의 결말입니다.` },
      { label: '성격', detail: visibleTraits.length ? `당신이 적은 말에서 ${visibleTraits.map(trait => trait.name).join(', ')}을 읽었습니다. 이 성향으로 결정적인 순간의 행동 방식을 정했습니다.` : `‘${personality.slice(0, 60)}’라는 단서에는 정해진 성격 유형을 붙이기 어려워, 스스로 판단을 내리는 순간을 중심으로 풀었습니다.` },
      { label: '직업', detail: `‘${job.slice(0, 70)}’에서 ${work.skill}을 가져왔습니다. 그 일을 ${world.era}의 ‘${role}’에 연결했습니다.` },
    ],
    history: world.history,
    sources: [...world.sources, sources.physiognomy],
  };
}
