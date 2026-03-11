# API 명세서

Base URL

http://localhost:5000

---

# 1. 학습 콘텐츠 API (Education)

## 학습 목록 조회

GET /education

설명  
퀴즈 학습 전에 필요한 학습 콘텐츠 목록을 조회합니다.

응답 예시

{
  "message": "학습 콘텐츠 조회 성공",
  "data": [
    {
      "edu_id": 1,
      "category": "주식기초",
      "title": "주식이란 무엇인가",
      "summary": "주식의 기본 개념을 학습합니다."
    }
  ]
}

---

## 카테고리별 학습 조회

GET /education?category=주식기초

Query Parameter

| 이름 | 설명 |
|-----|-----|
| category | 학습 카테고리 |

---

## 학습 상세 조회

GET /education/:edu_id

예시

GET /education/1

응답 예시

{
  "message": "학습 콘텐츠 상세 조회 성공",
  "data": {
    "edu_id": 1,
    "category": "주식기초",
    "title": "주식이란 무엇인가",
    "content": "주식은 회사의 소유권 일부를 의미합니다."
  }
}

---


# 2. 업적 / 칭호 API

## 업적 목록 조회

GET /achievements

설명  
모든 업적 및 칭호 목록을 조회한다.

응답

```text
{
  "message": "업적/칭호 조회 성공",
  "data": [
    {
      "ach_id": 1,
      "item_type": "TITLE",
      "category": "학습",
      "name": "주식 입문자",
      "description": "첫 학습을 완료한 사용자에게 부여되는 칭호",
      "reward_point": 100
    }
  ]
}
```


---

## 업적 조건 조회

GET /achievements?item_type=TITLE

Query Parameter

| 이름 | 설명 |
|-----|-----|
| item_type | TITLE 또는 ACHIEVEMENT |
| category | 업적 카테고리 |

예시

GET /achievements?item_type=TITLE&category=학습

---

## 업적 상세 조회

GET /achievements/:id

예시

GET /achievements/1

응답

```text
{
  "message": "업적/칭호 상세 조회 성공",
  "data": {
    "ach_id": 1,
    "item_type": "TITLE",
    "category": "학습",
    "name": "주식 입문자",
    "description": "첫 학습을 완료한 사용자에게 부여되는 칭호",
    "reward_point": 100
  }
}
```


---

# 3. 퀴즈 API

## 퀴즈 목록 조회

GET /quiz

응답

{
  "message": "퀴즈 조회 성공",
  "data": [...]
}

---

## 랜덤 퀴즈 조회

GET /quiz/random

예시

GET /quiz/random?difficulty=중

---

## 퀴즈 상세 조회

GET /quiz/:quiz_id

---

# 4. 주식 API

## 종목 목록 조회

GET /stocks

---

## 특정 종목 조회

GET /stocks/:symbol

예시

GET /stocks/005930

---

## 종목 차트 조회

GET /stocks/:symbol/chart

Query Parameter

| 이름 | 설명 |
|-----|-----|
| range | 조회 기간 (1d, 5d, 1mo, 3mo 등) |
| interval | 차트 간격 |

예시

GET /stocks/005930/chart?range=1mo&interval=1d

---

# 5. 개발용 API

## 회원 목데이터 조회

GET /dev/member

---

## 랭킹 목데이터 조회

GET /dev/rank