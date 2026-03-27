const db = require("../../config/db");
const achievementService = require("../services/achievementService");

/* =========================
  공통 응답
========================= */

function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({ success: false, message, error });
}

/* =========================
  memberId 추출
========================= */

function extractMemberId(req) {
  if (!req.user || typeof req.user !== "object") return null;
  return (
    req.user.member_id ||
    req.user.id ||
    req.user.memberId ||
    req.user.userId ||
    null
  );
}

/* =========================
  테이블 에러 체크
========================= */

function isTableMissingError(err) {
  return (
    err &&
    (err.code === "ER_NO_SUCH_TABLE" ||
      String(err.message || "").includes("doesn't exist"))
  );
}

/* =========================
  포인트 정책
========================= */

const POINT_TABLE = {
  하: { correct: 1000, wrong: 0 },
  중: { correct: 2000, wrong: 0 },
  상: { correct: 3000, wrong: 0 },
};

const PERFECT_BONUS = { 하: 5000, 중: 10000, 상: 20000 };

/* =========================
  공통 후처리
========================= */

async function refreshMemberAchievements(memberId) {
  try {
    await achievementService.checkAndGrantAchievements(memberId);
  } catch (err) {
    console.error("refreshMemberAchievements error =", err);
  }
}

/* =========================
  퀴즈 조회
========================= */

exports.getAllQuizzes = async (req, res) => {
  try {
    const { difficulty } = req.query;

    let sql = "SELECT * FROM quizzes";
    const params = [];

    if (difficulty) {
      sql += " WHERE difficulty = ?";
      params.push(difficulty);
    }

    sql += " ORDER BY quiz_id ASC";

    const [rows] = await db.promise().query(sql, params);
    return success(res, "퀴즈 조회 성공", rows);
  } catch (err) {
    return fail(res, "퀴즈 조회 실패", err.message);
  }
};

exports.getRandomQuiz = async (req, res) => {
  try {
    const { difficulty } = req.query;

    let sql = "SELECT * FROM quizzes";
    const params = [];

    if (difficulty) {
      sql += " WHERE difficulty = ?";
      params.push(difficulty);
    }

    sql += " ORDER BY RAND() LIMIT 1";

    const [rows] = await db.promise().query(sql, params);

    if (rows.length === 0) {
      return fail(res, "퀴즈가 없습니다.", null, 404);
    }

    return success(res, "랜덤 퀴즈 조회 성공", rows[0]);
  } catch (err) {
    return fail(res, "랜덤 퀴즈 조회 실패", err.message);
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const { quiz_id } = req.params;

    const [rows] = await db.promise().query(
      "SELECT * FROM quizzes WHERE quiz_id = ?",
      [quiz_id]
    );

    if (rows.length === 0) {
      return fail(res, "해당 퀴즈 없음", null, 404);
    }

    return success(res, "퀴즈 조회 성공", rows[0]);
  } catch (err) {
    return fail(res, "퀴즈 조회 실패", err.message);
  }
};

/* =========================
  정답 체크 + 포인트 + 업적
========================= */

exports.checkAnswer = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const { quiz_id, answer, difficulty } = req.body;

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const [rows] = await db.promise().query(
      "SELECT quiz_id, answer, explanation FROM quizzes WHERE quiz_id = ?",
      [quiz_id]
    );

    if (rows.length === 0) {
      return fail(res, "퀴즈 없음", null, 404);
    }

    const correctAnswer = Number(rows[0].answer);
    const selectedAnswer = Number(answer);
    const isCorrect = correctAnswer === selectedAnswer;

    const pts =
      POINT_TABLE[difficulty]?.[isCorrect ? "correct" : "wrong"] ??
      (isCorrect ? 100 : 0);

    /* 기록 저장 */
    let historySaved = false;

    try {
      await db.promise().query(
        `
        INSERT INTO member_quiz_history
        (member_id, quiz_id, selected_answer, is_correct)
        VALUES (?, ?, ?, ?)
        `,
        [memberId, quiz_id, selectedAnswer, isCorrect ? 1 : 0]
      );
      historySaved = true;
    } catch (err) {
      if (!isTableMissingError(err)) {
        return fail(res, "퀴즈 기록 저장 실패", err.message);
      }
    }

    /* 포인트 지급 */
    await db.promise().query(
      `UPDATE members SET points = points + ? WHERE member_id = ?`,
      [pts, memberId]
    );

    await db.promise().query(
      `
      INSERT INTO point_history (member_id, change_amount, reason)
      VALUES (?, ?, ?)
      `,
      [memberId, pts, `quiz_${difficulty}_${isCorrect ? "correct" : "wrong"}`]
    );

    /* 업적 갱신 */
    if (historySaved) {
      await refreshMemberAchievements(memberId);
    }

    const [memberRows] = await db.promise().query(
      `SELECT member_id, nickname, points FROM members WHERE member_id = ?`,
      [memberId]
    );

    return success(res, "정답 확인 완료", {
      isCorrect,
      correctAnswer,
      explanation: rows[0].explanation,
      rewardPoints: pts,
      historySaved,
      member: memberRows[0] || null,
    });
  } catch (err) {
    return fail(res, "정답 확인 실패", err.message);
  }
};

/* =========================
  보너스
========================= */

exports.bonusReward = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const { difficulty } = req.body;

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const bonusPts = PERFECT_BONUS[difficulty] ?? 5000;

    await db.promise().query(
      `UPDATE members SET points = points + ? WHERE member_id = ?`,
      [bonusPts, memberId]
    );

    await db.promise().query(
      `
      INSERT INTO point_history (member_id, change_amount, reason)
      VALUES (?, ?, ?)
      `,
      [memberId, bonusPts, `quiz_perfect_bonus_${difficulty}`]
    );

    await refreshMemberAchievements(memberId);

    return success(res, "보너스 지급 완료", { bonusPoints: bonusPts });
  } catch (err) {
    return fail(res, "보너스 지급 실패", err.message);
  }
};

/* =========================
  퀘스트
========================= */

exports.getMyQuestStatus = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const [totalQuizRows] = await db.promise().query(
      `SELECT COUNT(*) AS totalCount FROM quizzes`
    );

    const [todayRows] = await db.promise().query(
      `
      SELECT
        COUNT(*) AS todaySolved,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS todayCorrect
      FROM member_quiz_history
      WHERE member_id = ?
        AND DATE(solved_at) = CURDATE()
      `,
      [memberId]
    );

    const [totalRows] = await db.promise().query(
      `
      SELECT
        COUNT(*) AS totalSolved,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS totalCorrect
      FROM member_quiz_history
      WHERE member_id = ?
      `,
      [memberId]
    );

    const totalCount = Number(totalQuizRows[0]?.totalCount || 0);
    const todaySolved = Number(todayRows[0]?.todaySolved || 0);
    const todayCorrect = Number(todayRows[0]?.todayCorrect || 0);
    const totalSolved = Number(totalRows[0]?.totalSolved || 0);
    const totalCorrect = Number(totalRows[0]?.totalCorrect || 0);

    const dailyGoal = 3;
    const dailyPercent = Math.min(
      100,
      Number((((todaySolved || 0) / dailyGoal) * 100).toFixed(2))
    );

    const accuracy =
      totalSolved > 0
        ? Number(((totalCorrect / totalSolved) * 100).toFixed(2))
        : 0;

    return success(res, "퀘스트 조회 성공", {
      todaySolved,
      todayCorrect,
      totalSolved,
      totalCount,
      accuracy,
      dailyGoal,
      dailyPercent,
    });
  } catch (err) {
    return fail(res, "퀘스트 조회 실패", err.message);
  }
};

/* ==========================================
  OX 퀴즈
========================================== */

let yfInstance = null;

async function getYahooFinance() {
  if (yfInstance) return yfInstance;
  const mod = await import("yahoo-finance2");
  const YahooFinance = mod.default || mod;
  yfInstance =
    typeof YahooFinance === "function"
      ? new YahooFinance()
      : YahooFinance;
  return yfInstance;
}

const POPULAR_STOCKS = [
  { code: "005930", name: "삼성전자" },
  { code: "000660", name: "SK하이닉스" },
  { code: "373220", name: "LG에너지솔루션" },
  { code: "207940", name: "삼성바이오로직스" },
  { code: "005380", name: "현대차" },
  { code: "000270", name: "기아" },
  { code: "068270", name: "셀트리온" },
  { code: "005490", name: "POSCO홀딩스" },
  { code: "035420", name: "NAVER" },
  { code: "006400", name: "삼성SDI" },
  { code: "051910", name: "LG화학" },
  { code: "028260", name: "삼성물산" },
  { code: "035720", name: "카카오" },
  { code: "105560", name: "KB금융" },
  { code: "012330", name: "현대모비스" },
  { code: "055550", name: "신한지주" },
  { code: "066570", name: "LG전자" },
  { code: "032830", name: "삼성생명" },
  { code: "003670", name: "포스코퓨처엠" },
  { code: "033780", name: "KT&G" },
  { code: "086790", name: "하나금융지주" },
  { code: "003550", name: "LG" },
  { code: "034020", name: "두산에너빌리티" },
  { code: "323410", name: "카카오뱅크" },
  { code: "015760", name: "한국전력" },
  { code: "329180", name: "HD현대중공업" },
  { code: "034730", name: "SK" },
  { code: "018260", name: "삼성SDS" },
  { code: "011200", name: "HMM" },
  { code: "316140", name: "우리금융지주" },
  { code: "009150", name: "삼성전기" },
  { code: "004020", name: "현대제철" },
  { code: "010950", name: "S-Oil" },
  { code: "010130", name: "고려아연" },
  { code: "096770", name: "SK이노베이션" },
  { code: "005830", name: "DB손해보험" },
  { code: "036570", name: "엔씨소프트" },
  { code: "090430", name: "아모레퍼시픽" },
  { code: "011170", name: "롯데케미칼" },
  { code: "259960", name: "크래프톤" },
  { code: "000100", name: "유한양행" },
  { code: "008770", name: "호텔신라" },
  { code: "011070", name: "LG이노텍" },
  { code: "024110", name: "기업은행" },
  { code: "028050", name: "삼성엔지니어링" },
  { code: "000810", name: "삼성화재" },
  { code: "029780", name: "삼성카드" },
  { code: "006800", name: "미래에셋증권" },
  { code: "012450", name: "한화에어로스페이스" },
  { code: "010140", name: "삼성중공업" }
];

const activeOxQuizzes = new Map();
const oxParticipationLog = new Map();

exports.getDailyOxQuiz = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    // 🟢 1. 오늘 이미 참여했는지 확인
    const log = oxParticipationLog.get(memberId);
    const todayStr = new Date().toDateString();
    
    if (log && log.lastQuizAt.toDateString() === todayStr && log.completed) {
      return success(res, "이미 참여함", {
        isLimitReached: true, 
        todayCount: 1,
        quiz: null
      });
    }

    const yf = await getYahooFinance();

    // 🟢 2. 에러 발생 시 다른 종목으로 재시도하기 위한 안전장치 (최대 5번 재시도)
    let historicalData = null;
    let stock = null;
    let selectedPeriod = null;
    let pastPrice = 0;
    let currentPrice = 0;
    let referenceDateStr = "";

    const periods = [
      { label: '일주일', days: 7 },
      { label: '1달', days: 30 },
      { label: '3달', days: 90 }
    ];

    for (let attempt = 0; attempt < 5; attempt++) {
      stock = POPULAR_STOCKS[Math.floor(Math.random() * POPULAR_STOCKS.length)];
      selectedPeriod = periods[Math.floor(Math.random() * periods.length)];

      // 🟢 1. 기준일을 '오늘'이 아닌 '어제'로 확실하게 설정합니다.
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1); 

      // 🟢 2. '어제'를 기준으로 1주/1달/3달 전의 날짜를 계산합니다.
      const pastDate = new Date(targetDate);
      pastDate.setDate(pastDate.getDate() - selectedPeriod.days);

      const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-');
      };

      try {
        // 야후 파이낸스에서 과거 주가 가져오기 (과거일 ~ 어제)
        historicalData = await yf.historical(`${stock.code}.KS`, {
          period1: formatDate(pastDate),
          period2: formatDate(targetDate),
          interval: '1d'
        });

        // 데이터가 정상적으로 들어왔는지 꼼꼼하게 확인
        if (historicalData && historicalData.length >= 2) {
          // null 값이 섞여 있을 수 있으므로 정상적인(close가 있는) 데이터만 추려냅니다.
          const validData = historicalData.filter(d => d.close != null);

          if (validData.length >= 2) {
            pastPrice = validData[0]?.close;
            const latestValidData = validData[validData.length - 1];
            currentPrice = latestValidData.close;

            const actualDate = new Date(latestValidData.date);
            referenceDateStr = `${actualDate.getFullYear()}년 ${actualDate.getMonth() + 1}월 ${actualDate.getDate()}일`;
          }

          // 종가가 정상적으로 세팅되었다면 루프 탈출
          if (pastPrice && currentPrice) {
            break; 
          }
        }
      } catch (yfErr) {
        // null 에러 등이 발생하면 무시하고 다음 루프로 넘어가 다른 종목을 뽑습니다.
        console.log(`[OX퀴즈] ${stock.name} 데이터 불량 (다른 종목으로 재시도 중...)`);
      }
    }

    // 5번이나 시도했는데도 데이터를 못 가져왔다면 에러 처리
    if (!historicalData || !pastPrice || !currentPrice) {
      throw new Error("시장 주가 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
    }

    // 🟢 3. 과거 가격과 현재(최근) 가격 비교해서 등락률 계산
    const changeRate = ((currentPrice - pastPrice) / pastPrice) * 100;
    const isUpActual = changeRate >= 0; // 실제 올랐는지 여부

    // 🟢 4. 질문 및 정답/해설 생성
    const isAskingUp = Math.random() > 0.5; // true면 '올랐을까요?', false면 '내렸을까요?'
    const question = `${selectedPeriod.label} 전보다 ${stock.name} 주식은 ${isAskingUp ? '올랐을까요' : '내렸을까요'}?`;

    // 실제 올랐는데 올랐냐고 물어보면 O, 내렸냐고 물어보면 X
    const answer = (isUpActual === isAskingUp) ? "O" : "X";
    const changeText = isUpActual ? '올랐' : '내렸';
    
    // 해설 작성
    const explanation = `${stock.name}은(는) ${selectedPeriod.label} 대비 ${Math.abs(changeRate).toFixed(2)}% ${changeText}어요.`;

    // 🟢 5. 메모리에 임시 저장 (제출 시 확인용)
    activeOxQuizzes.set(memberId, { 
      answer, 
      correctAnswer: answer,
      explanation 
    });

    oxParticipationLog.set(memberId, {
      lastQuizAt: new Date(),
      stockCode: stock.code,
      completed: false // 아직 문제는 풀지 않은 상태
    });

    // 🟢 6. 프론트엔드로 문제 전송
    return success(res, "OX 퀴즈", {
      isLimitReached: false,
      todayCount: 0,
      quiz: { 
        question: question,
        referenceDate: referenceDateStr
    }});
  } catch (err) {
    console.error("OX 퀴즈 출제 오류:", err);
    return fail(res, "OX 퀴즈 실패", err.message);
  }
};

exports.submitOxQuiz = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const { userAnswer } = req.body;

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const quiz = activeOxQuizzes.get(memberId);
    if (!quiz) {
      return fail(res, "퀴즈 없음");
    }

    const isCorrect = quiz.answer === userAnswer;
    const pts = isCorrect ? 500 : 100;

    await db.promise().query(
      `UPDATE members SET points = points + ? WHERE member_id = ?`,
      [pts, memberId]
    );

    await db.promise().query(
      `
      INSERT INTO point_history (member_id, change_amount, reason)
      VALUES (?, ?, ?)
      `,
      [memberId, pts, isCorrect ? "ox_quiz_correct" : "ox_quiz_wrong"]
    );

    await refreshMemberAchievements(memberId);
    
    const log = oxParticipationLog.get(memberId) || {};
    oxParticipationLog.set(memberId, {
      ...log,
      lastQuizAt: new Date(),
      completed: true // 이제 오늘 참여 완료!
    });

    activeOxQuizzes.delete(memberId);

    // 🟢 4. 프론트엔드 모달창에 띄워줄 결과 데이터 꽉꽉 채워서 전송
    return success(res, "OX 결과", {
      isCorrect,
      rewardPoints: pts,
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation
    });
  } catch (err) {
    return fail(res, "OX 제출 실패", err.message);
  }
};

/* =========================
  퀴즈 명예의 전당 랭킹 조회
========================= */
exports.getQuizRanking = async (req, res) => {
  try {
    const { type = 'accuracy' } = req.query; // 'accuracy', 'total', 'weekly'
    let sql = '';

    if (type === 'total') {
      // 1. 다득점 TOP (정답을 가장 많이 맞춘 순)
      sql = `
        SELECT
          m.member_id AS id,
          m.nickname,
          m.profile_image AS profileImage,
          SUM(CASE WHEN ph.reason LIKE '%correct%' THEN 1 ELSE 0 END) AS score
        FROM members m
        JOIN point_history ph ON m.member_id = ph.member_id
        WHERE ph.reason LIKE '%quiz%'
        GROUP BY m.member_id
        HAVING score > 0
        ORDER BY score DESC, m.member_id ASC
        LIMIT 5
      `;
    } else if (type === 'weekly') {
      // 2. 주간 TOP (최근 7일 내 정답률, 최소 3문제 이상)
      sql = `
        SELECT
          m.member_id AS id,
          m.nickname,
          m.profile_image AS profileImage,
          COUNT(ph.history_id) AS total_cnt,
          (SUM(CASE WHEN ph.reason LIKE '%correct%' THEN 1 ELSE 0 END) / COUNT(ph.history_id) * 100) AS score
        FROM members m
        JOIN point_history ph ON m.member_id = ph.member_id
        WHERE ph.reason LIKE '%quiz%' AND ph.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY m.member_id
        HAVING total_cnt >= 3
        ORDER BY score DESC, total_cnt DESC
        LIMIT 5
      `;
    } else {
      // 3. 정답률 TOP (전체 기간 정답률, 최소 5문제 이상)
      sql = `
        SELECT
          m.member_id AS id,
          m.nickname,
          m.profile_image AS profileImage,
          COUNT(ph.history_id) AS total_cnt,
          (SUM(CASE WHEN ph.reason LIKE '%correct%' THEN 1 ELSE 0 END) / COUNT(ph.history_id) * 100) AS score
        FROM members m
        JOIN point_history ph ON m.member_id = ph.member_id
        WHERE ph.reason LIKE '%quiz%'
        GROUP BY m.member_id
        HAVING total_cnt >= 5
        ORDER BY score DESC, total_cnt DESC
        LIMIT 5
      `;
    }

    const [rows] = await db.promise().query(sql);
    return success(res, "퀴즈 랭킹 조회 성공", rows);
  } catch (err) {
    console.error("getQuizRanking error =", err);
    return fail(res, "랭킹 조회 실패", err.message);
  }
};