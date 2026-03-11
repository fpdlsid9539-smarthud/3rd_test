const express = require("express");
const router = express.Router();
const db = require("../../config/db");

// 1) 퀴즈 목록 조회
router.get("/", async (req, res) => {
  try {
    const { difficulty } = req.query;

    let sql = `
      SELECT 
        quiz_id,
        difficulty,
        question,
        option_1,
        option_2,
        option_3,
        option_4,
        created_at
      FROM quizzes
    `;
    const params = [];

    if (difficulty) {
      sql += " WHERE difficulty = ?";
      params.push(difficulty);
    }

    sql += " ORDER BY quiz_id ASC";

    const [rows] = await db.promise().query(sql, params);

    res.json({
      message: "퀴즈 조회 성공",
      data: rows,
    });
  } catch (err) {
    console.error("퀴즈 조회 오류:", err);
    res.status(500).json({
      message: "퀴즈 조회 실패",
      error: err.message,
    });
  }
});

// 2) 퀴즈 1개 랜덤 조회
router.get("/random", async (req, res) => {
  try {
    const { difficulty } = req.query;

    let sql = `
      SELECT 
        quiz_id,
        difficulty,
        question,
        option_1,
        option_2,
        option_3,
        option_4,
        created_at
      FROM quizzes
    `;
    const params = [];

    if (difficulty) {
      sql += " WHERE difficulty = ?";
      params.push(difficulty);
    }

    sql += " ORDER BY RAND() LIMIT 1";

    const [rows] = await db.promise().query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "해당 조건의 퀴즈가 없습니다.",
      });
    }

    res.json({
      message: "랜덤 퀴즈 조회 성공",
      data: rows[0],
    });
  } catch (err) {
    console.error("랜덤 퀴즈 조회 오류:", err);
    res.status(500).json({
      message: "랜덤 퀴즈 조회 실패",
      error: err.message,
    });
  }
});

// 3) quiz_id로 퀴즈 1개 조회
router.get("/:quiz_id", async (req, res) => {
  try {
    const { quiz_id } = req.params;

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
        created_at
      FROM quizzes
      WHERE quiz_id = ?
      `,
      [quiz_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "해당 퀴즈가 없습니다.",
      });
    }

    res.json({
      message: "퀴즈 1개 조회 성공",
      data: rows[0],
    });
  } catch (err) {
    console.error("퀴즈 1개 조회 오류:", err);
    res.status(500).json({
      message: "퀴즈 1개 조회 실패",
      error: err.message,
    });
  }
});

// 4) 정답 확인
router.post("/answer", async (req, res) => {
  try {
    const { quiz_id, answer } = req.body;

    if (!quiz_id || !answer) {
      return res.status(400).json({
        message: "quiz_id와 answer를 모두 보내야 합니다.",
      });
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        quiz_id,
        answer,
        explanation
      FROM quizzes
      WHERE quiz_id = ?
      `,
      [quiz_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "해당 퀴즈가 없습니다.",
      });
    }

    const correctAnswer = rows[0].answer;
    const isCorrect = Number(answer) === Number(correctAnswer);

    res.json({
      message: "정답 확인 완료",
      data: {
        isCorrect,
        correctAnswer,
        explanation: rows[0].explanation,
      },
    });
  } catch (err) {
    console.error("정답 확인 오류:", err);
    res.status(500).json({
      message: "정답 확인 실패",
      error: err.message,
    });
  }
});

module.exports = router;