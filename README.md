<h1 align="center">전생록 · 前生錄</h1>

<p align="center"><strong>다른 시대에 태어났어도, 나는 같은 선택을 했을까?</strong></p>

<p align="center">
  <a href="https://jeonsaengrok.com/#reading">내 전생 테스트하기</a>
  &nbsp;·&nbsp;
  <a href="https://jeonsaengrok.com/result.html#example">예시 결과 카드 열기</a>
  &nbsp;·&nbsp;
  <a href="https://jeonsaengrok.com/records.html">이야기 서고</a>
</p>

[![강 위의 작은 배와 붉은 해가 그려진 전생록의 수묵 산수화](web/assets/landscape.jpg)](https://jeonsaengrok.com/)

전생록은 **얼굴과 성격, 오늘의 삶을 단서로 AI가 한 사람의 전생을 역사 단편으로 쓰는 한국어 웹 서비스**입니다. 카드를 열면 먼저 시대와 직업이 드러납니다. 이야기의 갈림길에서 지금의 내가 고를 쪽을 누르면, 전생의 내가 내린 결정과 그 뒤에 벌어진 일이 펼쳐집니다.

## 장부에서 사라진 세 줄

> **조선 후기 · 수원 화성 / 품삯을 셈하는 서기**
>
> 돈궤는 하나, 장부에서 이름이 빠진 일꾼은 셋. 열쇠를 쥔 감독이 당신 앞을 지나갑니다.

감독을 붙잡고 내 실수를 밝힐까요? 아니면 내 쌀로 세 집의 저녁부터 챙길까요? 선택을 누르면 막내 일꾼이 보름 뒤에 어떤 말을 꺼냈는지 읽을 수 있습니다. [사진 없이 이 장면 체험하기](https://jeonsaengrok.com/result.html#example)

## 시대별 이야기 서고

| 구석기 · 전곡리 | 조선 후기 · 한산 | 1974년 · 서울 종로 |
| :--- | :--- | :--- |
| [![한탄강가에 놓인 돌과 석기](web/assets/era-early.jpg)](https://jeonsaengrok.com/stories/jeongokri-stone-flake.html) | [![산 아래 마을에서 열린 장터](web/assets/era-joseon.jpg)](https://jeonsaengrok.com/stories/hansan-ramie-sleeve.html) | [![강 위의 다리를 건너는 초록색 버스](web/assets/era-recent.jpg)](https://jeonsaengrok.com/stories/jongno-ticket-window.html) |
| **[망치돌을 놓은 손](https://jeonsaengrok.com/stories/jeongokri-stone-flake.html)** | **[기름 반 병 값의 소맷부리](https://jeonsaengrok.com/stories/hansan-ramie-sleeve.html)** | **[창구 밖에선 거짓말이 된 세 글자](https://jeonsaengrok.com/stories/jongno-ticket-window.html)** |

## 내 정보는 어떻게 이야기가 될까?

- **시대와 직업** — 구석기부터 현대까지 30개 배경에서 태어나기 전의 시대와 일터를 뽑습니다. 현재 직업은 공개한 순자산·집안 형편과 함께 ‘이번 생에 돌아온 복’ 풀이에 쓰입니다.
- **성격과 선택** — 성격 배지와 직접 쓴 습관을 읽고 AI가 갈림길을 씁니다. 같은 장부 앞에서도 실수를 바로 털어놓는 사람과 조용히 수습하려는 사람은 서로 다른 결말을 맞을 수 있습니다.
- **얼굴과 기록** — 결과 카드에는 풀이에 쓰인 얼굴 비율과 행동 단서가 나옵니다. 배경에 참고한 역사 자료도 함께 읽을 수 있습니다. [전생의 뜻과 풀이법](https://jeonsaengrok.com/past-life.html)

얼굴 사진은 브라우저에서 분석하고 지웁니다. 서버에는 원본 사진이나 생년월일 여섯 자리 대신 얼굴 비율을 설명한 문장과 태어난 계절 등 집필에 필요한 단서가 전달됩니다. 개인 결과는 해당 탭에서 읽습니다. [개인정보와 광고 안내](https://jeonsaengrok.com/privacy.html)

<details>
<summary><strong>개발 환경과 테스트</strong></summary>

브라우저 화면과 공개 단편은 [web](./web/), AI 집필과 이용 한도 처리는 [worker](./worker/), D1 스키마 변경은 [drizzle](./drizzle/)에 있습니다. Node.js 22.13 이상에서 다음 명령으로 테스트할 수 있습니다.

```sh
npm ci
npm test
```

</details>
