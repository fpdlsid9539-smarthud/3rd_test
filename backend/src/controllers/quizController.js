const db = require("../../config/db");
const achievementService = require("../services/achievementService");
const {
  generateQuizExplanation,
  generateQuizFromKeywords,
  generateConceptOxQuiz,
} = require("../services/llmQuizService");

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
  테이블 / 컬럼 에러 체크
========================= */

function isTableMissingError(err) {
  return (
    err &&
    (err.code === "ER_NO_SUCH_TABLE" ||
      String(err.message || "").includes("doesn't exist"))
  );
}

function isUnknownColumnError(err) {
  return (
    err &&
    (err.code === "ER_BAD_FIELD_ERROR" ||
      String(err.message || "").includes("Unknown column"))
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
  일반 DB 퀴즈 정답 체크
========================= */

exports.checkAnswer = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const { quiz_id, answer, difficulty } = req.body;

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        quiz_id,
        difficulty,
        question,
        option_1,
        option_2,
        option_3,
        option_4,
        answer,
        explanation
      FROM quizzes
      WHERE quiz_id = ?
      `,
      [quiz_id]
    );

    if (rows.length === 0) {
      return fail(res, "퀴즈 없음", null, 404);
    }

    const quiz = rows[0];
    const correctAnswer = Number(quiz.answer);
    const selectedAnswer = Number(answer);
    const isCorrect = correctAnswer === selectedAnswer;

    const resolvedDifficulty = difficulty || quiz.difficulty || "하";

    const pts =
      POINT_TABLE[resolvedDifficulty]?.[isCorrect ? "correct" : "wrong"] ??
      (isCorrect ? 100 : 0);

    let historySaved = false;

    try {
      // 확장 스키마 대응 저장
      await db.promise().query(
        `
        INSERT INTO member_quiz_history
        (
          member_id,
          quiz_id,
          question,
          option_1,
          option_2,
          option_3,
          option_4,
          correct_answer,
          selected_answer,
          is_correct,
          explanation,
          difficulty,
          source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          memberId,
          quiz.quiz_id,
          quiz.question,
          quiz.option_1,
          quiz.option_2,
          quiz.option_3,
          quiz.option_4,
          correctAnswer,
          selectedAnswer,
          isCorrect ? 1 : 0,
          quiz.explanation || "",
          resolvedDifficulty,
          "db",
        ]
      );
      historySaved = true;
    } catch (err) {
      // 구 스키마 하위호환
      if (isUnknownColumnError(err)) {
        try {
          await db.promise().query(
            `
            INSERT INTO member_quiz_history
            (member_id, quiz_id, selected_answer, is_correct)
            VALUES (?, ?, ?, ?)
            `,
            [memberId, quiz.quiz_id, selectedAnswer, isCorrect ? 1 : 0]
          );
          historySaved = true;
        } catch (innerErr) {
          if (!isTableMissingError(innerErr)) {
            return fail(res, "퀴즈 기록 저장 실패", innerErr.message);
          }
        }
      } else if (!isTableMissingError(err)) {
        return fail(res, "퀴즈 기록 저장 실패", err.message);
      }
    }

    await db.promise().query(
      `UPDATE members SET points = points + ? WHERE member_id = ?`,
      [pts, memberId]
    );

    await db.promise().query(
      `
      INSERT INTO point_history (member_id, change_amount, reason)
      VALUES (?, ?, ?)
      `,
      [memberId, pts, `quiz_${resolvedDifficulty}_${isCorrect ? "correct" : "wrong"}`]
    );

    if (historySaved) {
      await refreshMemberAchievements(memberId);
    }

    let llmExplanation = "";

    if (!isCorrect) {
      llmExplanation = await generateQuizExplanation({
        question: quiz.question,
        option_1: quiz.option_1,
        option_2: quiz.option_2,
        option_3: quiz.option_3,
        option_4: quiz.option_4,
        correctAnswer,
        selectedAnswer,
        difficulty: resolvedDifficulty,
        fallbackExplanation: quiz.explanation,
      });
    }

    const [memberRows] = await db.promise().query(
      `SELECT member_id, nickname, points FROM members WHERE member_id = ?`,
      [memberId]
    );

    return success(res, "정답 확인 완료", {
      isCorrect,
      correctAnswer,
      explanation: quiz.explanation,
      llmExplanation,
      rewardPoints: pts,
      historySaved,
      member: memberRows[0] || null,
    });
  } catch (err) {
    return fail(res, "정답 확인 실패", err.message);
  }
};

/* =========================
  AI 퀴즈 정답 체크
========================= */

exports.checkAiAnswer = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const {
      question,
      option_1,
      option_2,
      option_3,
      option_4,
      answer,
      correctAnswer,
      explanation,
      difficulty = "하",
    } = req.body;

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const selectedAnswer = Number(answer);
    const actualCorrectAnswer = Number(correctAnswer);
    const isCorrect = selectedAnswer === actualCorrectAnswer;

    const pts =
      POINT_TABLE[difficulty]?.[isCorrect ? "correct" : "wrong"] ??
      (isCorrect ? 100 : 0);

    await db.promise().query(
      `UPDATE members SET points = points + ? WHERE member_id = ?`,
      [pts, memberId]
    );

    await db.promise().query(
      `
      INSERT INTO point_history (member_id, change_amount, reason)
      VALUES (?, ?, ?)
      `,
      [memberId, pts, `quiz_${difficulty}_${isCorrect ? "correct" : "wrong"}_ai`]
    );

    await refreshMemberAchievements(memberId);

    let llmExplanation = "";

    if (!isCorrect) {
      llmExplanation = await generateQuizExplanation({
        question: question || "",
        option_1: option_1 || "",
        option_2: option_2 || "",
        option_3: option_3 || "",
        option_4: option_4 || "",
        correctAnswer: actualCorrectAnswer,
        selectedAnswer,
        difficulty,
        fallbackExplanation: explanation || "",
      });
    }

    const [memberRows] = await db.promise().query(
      `SELECT member_id, nickname, points FROM members WHERE member_id = ?`,
      [memberId]
    );

    return success(res, "AI 퀴즈 정답 확인 완료", {
      isCorrect,
      correctAnswer: actualCorrectAnswer,
      explanation: explanation || "",
      llmExplanation,
      rewardPoints: pts,
      historySaved: false,
      member: memberRows[0] || null,
      question: question || "",
    });
  } catch (err) {
    return fail(res, "AI 퀴즈 정답 확인 실패", err.message);
  }
};

/* =========================
  오답노트 조회
========================= */

exports.getWrongAnswerNotes = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    let rows = [];

    try {
      // 확장 스키마 기준: AI/DB 둘 다 조회 가능
      const [newRows] = await db.promise().query(
        `
        SELECT
          h.history_id,
          h.quiz_id,
          h.selected_answer,
          h.is_correct,
          h.solved_at,
          COALESCE(h.difficulty, q.difficulty) AS difficulty,
          COALESCE(h.question, q.question) AS question,
          COALESCE(h.option_1, q.option_1) AS option_1,
          COALESCE(h.option_2, q.option_2) AS option_2,
          COALESCE(h.option_3, q.option_3) AS option_3,
          COALESCE(h.option_4, q.option_4) AS option_4,
          COALESCE(h.correct_answer, q.answer) AS correct_answer,
          COALESCE(h.explanation, q.explanation) AS explanation,
          COALESCE(h.source, CASE WHEN h.quiz_id IS NULL THEN 'ai' ELSE 'db' END) AS source
        FROM member_quiz_history h
        LEFT JOIN quizzes q
          ON h.quiz_id = q.quiz_id
        WHERE h.member_id = ?
          AND h.is_correct = 0
          AND (
            h.quiz_id IS NOT NULL
            OR h.question IS NOT NULL
          )
        ORDER BY h.solved_at DESC, h.history_id DESC
        `,
        [memberId]
      );

      rows = newRows;
    } catch (err) {
      // 구 스키마 하위호환: 기존 DB 문제만 조회 가능
      if (!isUnknownColumnError(err)) {
        throw err;
      }

      const [legacyRows] = await db.promise().query(
        `
        SELECT
          h.history_id,
          h.quiz_id,
          h.selected_answer,
          h.is_correct,
          h.solved_at,
          q.difficulty,
          q.question,
          q.option_1,
          q.option_2,
          q.option_3,
          q.option_4,
          q.answer AS correct_answer,
          q.explanation,
          'db' AS source
        FROM member_quiz_history h
        JOIN quizzes q
          ON h.quiz_id = q.quiz_id
        WHERE h.member_id = ?
          AND h.is_correct = 0
        ORDER BY h.solved_at DESC, h.history_id DESC
        `,
        [memberId]
      );

      rows = legacyRows;
    }

    return success(res, "오답노트 조회 성공", rows);
  } catch (err) {
    return fail(res, "오답노트 조회 실패", err.message);
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

/* =========================
  LLM 객관식 퀴즈 생성
========================= */

exports.generateLLMQuiz = async (req, res) => {
  try {
    const { keywords = [], difficulty = "하", seedQuestions = [] } = req.body;

    const normalizedKeywords = Array.isArray(keywords)
      ? keywords.map((v) => String(v).trim()).filter(Boolean)
      : [];

    const normalizedSeeds = Array.isArray(seedQuestions)
      ? seedQuestions.map((v) => String(v).trim()).filter(Boolean)
      : [];

    if (normalizedKeywords.length === 0 && normalizedSeeds.length === 0) {
      return fail(res, "키워드 또는 시드 문제가 필요합니다.", null, 400);
    }

    const quiz = await generateQuizFromKeywords({
      keywords: normalizedKeywords,
      difficulty,
      seedQuestions: normalizedSeeds,
    });

    return success(res, "LLM 퀴즈 생성 성공", quiz);
  } catch (err) {
    console.error("[generateLLMQuiz error]", err.message);
    return fail(res, "LLM 퀴즈 생성 실패", err.message, 500);
  }
};

/* ==========================================
  혼합형 OX 퀴즈
========================================== */

const activeOxQuizzes = new Map();
const oxParticipationLog = new Map();

let yfInstance = null;

async function getYahooFinance() {
  if (yfInstance) return yfInstance;
  const mod = await import("yahoo-finance2");
  const YahooFinance = mod.default || mod;

  yfInstance =
    typeof YahooFinance === "function"
      ? new YahooFinance({ suppressNotices: ["yahooSurvey"] })
      : YahooFinance;

  return yfInstance;
}

const POPULAR_STOCKS = [
  { code: "005930", name: "삼성전자" },
  { code: "000660", name: "SK하이닉스" },
  { code: "035420", name: "NAVER" },
  { code: "051910", name: "LG화학" },
  { code: "006400", name: "삼성SDI" },
  { code: "005380", name: "현대차" },
  { code: "000270", name: "기아" },
  { code: "068270", name: "셀트리온" },
  { code: "105560", name: "KB금융" },
  { code: "035720", name: "카카오" },
];

function getTodayKey(memberId) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${memberId}-${yyyy}-${mm}-${dd}`;
}

async function generateMarketOxQuiz() {
  const yf = await getYahooFinance();

  let historicalData = null;
  let stock = null;
  let selectedPeriod = null;
  let pastPrice = 0;
  let currentPrice = 0;
  let referenceDateStr = "";

  const periods = [
    { label: "일주일", days: 7 },
    { label: "1달", days: 30 },
    { label: "3달", days: 90 },
  ];

  for (let attempt = 0; attempt < 7; attempt++) {
    stock = POPULAR_STOCKS[Math.floor(Math.random() * POPULAR_STOCKS.length)];
    selectedPeriod = periods[Math.floor(Math.random() * periods.length)];

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);

    const pastDate = new Date(targetDate);
    pastDate.setDate(pastDate.getDate() - selectedPeriod.days);

    const formatDate = (date) => {
      const d = new Date(date);
      let month = "" + (d.getMonth() + 1);
      let day = "" + d.getDate();
      const year = d.getFullYear();
      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;
      return [year, month, day].join("-");
    };

    try {
      historicalData = await yf.historical(`${stock.code}.KS`, {
        period1: formatDate(pastDate),
        period2: formatDate(targetDate),
        interval: "1d",
      });

      if (historicalData && historicalData.length >= 2) {
        const validData = historicalData.filter((d) => d.close != null);

        if (validData.length >= 2) {
          pastPrice = Number(validData[0]?.close || 0);
          const latestValidData = validData[validData.length - 1];
          currentPrice = Number(latestValidData?.close || 0);

          const actualDate = new Date(latestValidData.date);
          referenceDateStr = `${actualDate.getFullYear()}년 ${
            actualDate.getMonth() + 1
          }월 ${actualDate.getDate()}일`;
        }

        if (pastPrice && currentPrice) {
          break;
        }
      }
    } catch (err) {
      console.log(`[시장형 OX 재시도] ${stock?.name || "종목없음"} 실패`);
    }
  }

  if (!historicalData || !pastPrice || !currentPrice) {
    throw new Error("시장형 OX용 주가 데이터를 가져오지 못했습니다.");
  }

  const changeRate = Number(
    ((((currentPrice - pastPrice) / pastPrice) * 100).toFixed(2))
  );
  const askUp = Math.random() > 0.5;
  const shownDirection = askUp ? "상승" : "하락";
  const truth = askUp ? changeRate > 0 : changeRate < 0;

  return {
    type: "market",
    quiz: {
      question: `${stock.name}의 주가는 ${selectedPeriod.label} 전 대비 ${shownDirection}했다.`,
      answer: truth ? "O" : "X",
      explanation: `${referenceDateStr} 기준 ${stock.name}의 ${selectedPeriod.label} 변동률은 ${changeRate}%입니다.`,
      referenceDate: referenceDateStr,
    },
  };
}

exports.getDailyOxQuiz = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const todayKey = getTodayKey(memberId);

    if (oxParticipationLog.has(todayKey)) {
      return success(res, "오늘 OX 참여 완료", {
        isLimitReached: true,
        todayCount: 1,
      });
    }

    if (activeOxQuizzes.has(todayKey)) {
      const saved = activeOxQuizzes.get(todayKey);
      return success(res, "오늘 OX 퀴즈 조회 성공", {
        isLimitReached: false,
        todayCount: 0,
        type: saved.type,
        quiz: saved.quiz,
      });
    }

    const roll = Math.random();
    const generated =
      roll < 0.5
        ? await generateMarketOxQuiz()
        : await generateConceptOxQuiz({ difficulty: "하" });

    activeOxQuizzes.set(todayKey, generated);

    return success(res, "오늘 OX 퀴즈 조회 성공", {
      isLimitReached: false,
      todayCount: 0,
      type: generated.type,
      quiz: generated.quiz,
    });
  } catch (err) {
    console.error("getDailyOxQuiz error =", err);
    return fail(res, "오늘 OX 퀴즈 조회 실패", err.message);
  }
};

exports.submitOxAnswer = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const { userAnswer } = req.body;

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    if (!["O", "X"].includes(String(userAnswer || "").toUpperCase())) {
      return fail(res, "O 또는 X만 제출할 수 있습니다.", null, 400);
    }

    const todayKey = getTodayKey(memberId);

    if (oxParticipationLog.has(todayKey)) {
      return fail(res, "오늘은 이미 참여했습니다.", null, 400);
    }

    const savedQuiz = activeOxQuizzes.get(todayKey);

    if (!savedQuiz) {
      return fail(res, "제출할 OX 퀴즈가 없습니다.", null, 404);
    }

    const normalizedUserAnswer = String(userAnswer).toUpperCase();
    const correctAnswer = String(savedQuiz.quiz.answer).toUpperCase();
    const isCorrect = normalizedUserAnswer === correctAnswer;
    const rewardPoints = isCorrect ? 500 : 100;

    oxParticipationLog.set(todayKey, true);

    await db.promise().query(
      `UPDATE members SET points = points + ? WHERE member_id = ?`,
      [rewardPoints, memberId]
    );

    await db.promise().query(
      `
      INSERT INTO point_history (member_id, change_amount, reason)
      VALUES (?, ?, ?)
      `,
      [
        memberId,
        rewardPoints,
        `daily_ox_${savedQuiz.type}_${isCorrect ? "correct" : "participation"}`,
      ]
    );

    await refreshMemberAchievements(memberId);

    return success(res, "OX 제출 완료", {
      type: savedQuiz.type,
      isCorrect,
      rewardPoints,
      correctAnswer,
      explanation: savedQuiz.quiz.explanation,
    });
  } catch (err) {
    console.error("submitOxAnswer error =", err);
    return fail(res, "OX 제출 실패", err.message);
  }
};

/* =========================
  랭킹
========================= */

exports.getQuizRanking = async (req, res) => {
  try {
    const { type = "accuracy" } = req.query;
    let sql = "";

    if (type === "total") {
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
    } else if (type === "weekly") {
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