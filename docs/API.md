# FinSight API Specification

Base URL
```
http://localhost:5000
```

응답 기본 형식
```json
{
  "success": true,
  "message": "string",
  "data": {},
  "error": null
}
```

---

# 1. Auth (인증 / 유저)

## 소셜 로그인 페이지
**GET** `/api/auth`

소셜 로그인 시작 페이지

---

## 카카오 로그인
**GET** `/api/auth/kakao`

---

## 카카오 콜백
**GET** `/api/auth/kakao/callback`

---

## 구글 로그인
**GET** `/api/auth/google`

---

## 구글 콜백
**GET** `/api/auth/google/callback`

---

## 현재 로그인 사용자 조회
**GET** `/api/auth/me`

Auth Required: ✔

Response
```json
{
  "member": {
    "member_id": 1,
    "nickname": "김상훈",
    "tier": "브론즈 I",
    "points": 10000,
    "isr_score": 0
  }
}
```

---

## 닉네임 수정
**PATCH** `/api/auth/me`

Body
```json
{
  "nickname": "새닉네임"
}
```

---

## 프로필 메타 조회
**GET** `/api/auth/meta`

---

## 로그아웃
**POST** `/api/auth/logout`

---

# 2. Stocks (주식)

## 전체 종목 조회
**GET** `/api/stocks`

stocks 테이블 전체 조회

---

## 특정 종목 현재가
**GET** `/api/stocks/:symbol`

Example
```
/api/stocks/005930
```

Response
```json
{
  "symbol": "005930",
  "price": 73200,
  "change": 1200,
  "changeRate": 1.67
}
```

---

## 종목 차트 조회
**GET** `/api/stocks/:symbol/chart`

Query
```
range=1mo
interval=1d
```

---

## (추가예정) 대표 종목 조회
**GET** `/api/stocks/featured`

Query
```
type=popular | rising | falling
```

---

# 3. Quiz (퀴즈)

## 퀴즈 목록
**GET** `/api/quiz/all`

Query
```
difficulty=easy
```

---

## 랜덤 퀴즈
**GET** `/api/quiz/random`

---

## 특정 퀴즈 조회
**GET** `/api/quiz/:quiz_id`

---

## 정답 제출
**POST** `/api/quiz/check`

Body
```json
{
  "quiz_id": 1,
  "answer": 2
}
```

Response
```json
{
  "isCorrect": true,
  "correctAnswer": 2
}
```

---

## (추가예정) 사용자 퀴즈 기록
**GET** `/api/quiz/my`

---

## (추가예정) 퀴즈 풀이 여부
**GET** `/api/quiz/:quiz_id/status`

---

# 4. Achievements / Titles

## 업적 목록
**GET** `/api/achievements`

---

## 칭호 목록
**GET** `/api/titles`

---

## 기본 칭호
**GET** `/api/titles/default`

---

## (추가예정) 회원 업적 조회
**GET** `/api/member/achievements`

---

# 5. Education (교육실)

## 교육 목록
**GET** `/api/education`

Query
```
category
keyword
badge
```

---

## 교육 상세
**GET** `/api/education/:lessonId`

---

## 학습 진행도
**GET** `/api/education/progress`

---

## 교육 완료
**POST** `/api/education/:lessonId/complete`

---

# 6. Ranking

## 티어별 랭킹
**GET** `/api/ranking/grouped`

---

## 내 순위
**GET** `/api/ranking/me`

---

## 상위 랭커
**GET** `/api/ranking/top`

Query
```
limit=3
```

---

# 7. Dashboard / 투자현황

## 투자 요약
**GET** `/api/dashboard/invest-summary`

---

## 보유 종목
**GET** `/api/dashboard/holdings`

---

## 최근 거래 종목
**GET** `/api/dashboard/recent-stocks`

---

# 페이지별 사용 API

## 대시보드
- GET /api/auth/me
- GET /api/auth/meta
- GET /api/dashboard/invest-summary
- GET /api/member/achievements/recent

## 교육실
- GET /api/education
- GET /api/education/:lessonId
- GET /api/education/progress

## 전략실 - 주식
- GET /api/stocks
- GET /api/stocks/:symbol
- GET /api/stocks/:symbol/chart

## 전략실 - 퀴즈
- GET /api/quiz/random
- POST /api/quiz/check
- GET /api/quiz/:quiz_id/status

## 랭킹
- GET /api/ranking/grouped
- GET /api/ranking/me
