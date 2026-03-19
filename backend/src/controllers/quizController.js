const db = require("../../config/db");

/* =========================
   공통 응답
========================= */

function success(res, message, data = null, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}

/* =========================
   오늘 날짜 범위
========================= */

function getTodayRange() {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
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
   테이블 존재 여부 에러 체크
========================= */

function isTableMissingError(err) {
  return (
    err &&
    (err.code === "ER_NO_SUCH_TABLE" ||
      String(err.message || "").includes("doesn't exist"))
  );
}

/* =========================
   전체 퀴즈 조회
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
    console.error("getAllQuizzes error =", err);
    return fail(res, "퀴즈 조회 실패", err.message);
  }
};

/* =========================
   랜덤 퀴즈
========================= */

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
    console.error("getRandomQuiz error =", err);
    return fail(res, "랜덤 퀴즈 조회 실패", err.message);
  }
};

/* =========================
   퀴즈 1개 조회
========================= */

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
    console.error("getQuizById error =", err);
    return fail(res, "퀴즈 조회 실패", err.message);
  }
};

/* =========================
   정답 체크
========================= */

exports.checkAnswer = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    const { quiz_id, answer } = req.body;

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    if (!quiz_id || answer === undefined) {
      return fail(res, "quiz_id, answer 필요", null, 400);
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
      console.error("quiz history error =", err);

      if (!isTableMissingError(err)) {
        return fail(res, "퀴즈 기록 저장 실패", err.message);
      }
    }

    /* 정답이면 포인트 지급 */

    if (isCorrect) {
      await db.promise().query(
        `
        UPDATE members
        SET points = points + 100
        WHERE member_id = ?
        `,
        [memberId]
      );
    }

    /* 유저 정보 */

    const [memberRows] = await db.promise().query(
      `
      SELECT member_id,nickname,points
      FROM members
      WHERE member_id = ?
      `,
      [memberId]
    );

    return success(res, "정답 확인 완료", {
      isCorrect,
      correctAnswer,
      explanation: rows[0].explanation,
      rewardPoints: isCorrect ? 100 : 0,
      historySaved,
      member: memberRows[0] || null,
    });
  } catch (err) {
    console.error("checkAnswer error =", err);
    return fail(res, "정답 확인 실패", err.message);
  }
};

/* =========================
   퀘스트 현황
========================= */

exports.getMyQuestStatus = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    if (!memberId) {
      return fail(res, "사용자 인증 필요", null, 401);
    }

    const { start, end } = getTodayRange();

    const [totalQuizRows] = await db.promise().query(
      "SELECT COUNT(*) AS totalCount FROM quizzes"
    );

    const [todaySolvedRows] = await db.promise().query(
      `
      SELECT COUNT(*) AS todaySolved
      FROM member_quiz_history
      WHERE member_id = ?
      AND solved_at BETWEEN ? AND ?
      `,
      [memberId, start, end]
    );

    const [todayCorrectRows] = await db.promise().query(
      `
      SELECT COUNT(*) AS todayCorrect
      FROM member_quiz_history
      WHERE member_id = ?
      AND is_correct = 1
      AND solved_at BETWEEN ? AND ?
      `,
      [memberId, start, end]
    );

    const [totalSolvedRows] = await db.promise().query(
      `
      SELECT COUNT(*) AS totalSolved
      FROM member_quiz_history
      WHERE member_id = ?
      `,
      [memberId]
    );

    const [accuracyRows] = await db.promise().query(
      `
      SELECT
      ROUND(
      (SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) /
      NULLIF(COUNT(*),0))*100,2) AS accuracy
      FROM member_quiz_history
      WHERE member_id = ?
      `,
      [memberId]
    );

    const totalCount = Number(totalQuizRows[0].totalCount || 0);
    const todaySolved = Number(todaySolvedRows[0].todaySolved || 0);
    const todayCorrect = Number(todayCorrectRows[0].todayCorrect || 0);
    const totalSolved = Number(totalSolvedRows[0].totalSolved || 0);
    const accuracy = Number(accuracyRows[0].accuracy || 0);

    const dailyGoal = 3;

    const dailyPercent = Math.min(
      100,
      Number(((todaySolved / dailyGoal) * 100).toFixed(2))
    );

    return success(res, "퀘스트 현황 조회 성공", {
      todaySolved,
      todayCorrect,
      totalSolved,
      totalCount,
      accuracy,
      dailyGoal,
      dailyPercent,
    });
  } catch (err) {
    console.error("getMyQuestStatus error =", err);
    return fail(res, "퀘스트 조회 실패", err.message);
  }
};