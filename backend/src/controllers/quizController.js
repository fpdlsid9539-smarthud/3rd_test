const db = require("../../config/db");

// 공통 응답 함수
function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}
function fail(res, message, error = null, status = 500) {
  return res.status(status).json({ success: false, message, error });
}

exports.getAllQuizzes = async (req, res) => {
  try {
    const { difficulty } = req.query;
    // 💡 수정됨: SELECT * 를 써서 answer와 explanation까지 모두 프론트로 보냅니다!
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
    // 💡 수정됨: 여기도 SELECT * 로 변경!
    let sql = "SELECT * FROM quizzes";
    const params = [];

    if (difficulty) {
      sql += " WHERE difficulty = ?";
      params.push(difficulty);
    }
    sql += " ORDER BY RAND() LIMIT 1";

    const [rows] = await db.promise().query(sql, params);
    if (rows.length === 0) return fail(res, "해당 조건의 퀴즈가 없습니다.", null, 404);

    return success(res, "랜덤 퀴즈 조회 성공", rows[0]);
  } catch (err) {
    return fail(res, "랜덤 퀴즈 조회 실패", err.message);
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const { quiz_id } = req.params;
    // 💡 수정됨: 여기도 SELECT * 로 변경!
    const [rows] = await db.promise().query(
      "SELECT * FROM quizzes WHERE quiz_id = ?",
      [quiz_id]
    );

    if (rows.length === 0) return fail(res, "해당 퀴즈가 없습니다.", null, 404);
    return success(res, "퀴즈 1개 조회 성공", rows[0]);
  } catch (err) {
    return fail(res, "퀴즈 1개 조회 실패", err.message);
  }
};

exports.checkAnswer = async (req, res) => {
  try {
    const { quiz_id, answer } = req.body;
    if (!quiz_id || !answer) return fail(res, "quiz_id와 answer를 모두 보내야 합니다.", null, 400);

    const [rows] = await db.promise().query("SELECT quiz_id, answer, explanation FROM quizzes WHERE quiz_id = ?", [quiz_id]);
    if (rows.length === 0) return fail(res, "해당 퀴즈가 없습니다.", null, 404);

    const correctAnswer = rows[0].answer;
    const isCorrect = Number(answer) === Number(correctAnswer);

    return success(res, "정답 확인 완료", { isCorrect, correctAnswer, explanation: rows[0].explanation });
  } catch (err) {
    return fail(res, "정답 확인 실패", err.message);
  }
};