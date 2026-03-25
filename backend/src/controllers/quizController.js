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
];

const activeOxQuizzes = new Map();
const oxParticipationLog = new Map();

exports.getDailyOxQuiz = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const stock =
      POPULAR_STOCKS[Math.floor(Math.random() * POPULAR_STOCKS.length)];

    const yf = await getYahooFinance();
    await yf.quote(`${stock.code}.KS`);

    const isUp = Math.random() > 0.5;
    const answer = isUp ? "O" : "X";

    activeOxQuizzes.set(memberId, { answer });
    oxParticipationLog.set(memberId, {
      ...(oxParticipationLog.get(memberId) || {}),
      lastQuizAt: new Date(),
      stockCode: stock.code,
    });

    return success(res, "OX 퀴즈", {
      question: `${stock.name} 상승 여부 맞추기`,
    });
  } catch (err) {
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
    activeOxQuizzes.delete(memberId);

    return success(res, "OX 결과", {
      isCorrect,
      rewardPoints: pts,
    });
  } catch (err) {
    return fail(res, "OX 제출 실패", err.message);
  }
};