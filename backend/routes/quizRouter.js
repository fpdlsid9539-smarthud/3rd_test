const express = require("express");
const router = express.Router();

const quizzes = require("../data/quizData");
const quizLogs = require("../data/quizLogData");
const devAuth = require("../middleware/devAuth");

/**
 * 다음 문제 조회
 * GET /quiz/next?lesson_id=1&difficulty=easy
 */
router.get("/next", devAuth, (req, res) => {

  const memberId = req.user.member_id;
  const lessonId = Number(req.query.lesson_id);
  const difficulty = req.query.difficulty;

  if (!lessonId || !difficulty) {
    return res.status(400).json({
      success: false,
      message: "lesson_id와 difficulty가 필요합니다."
    });
  }

  const targetQuizzes = quizzes
    .filter(q => q.lesson_id === lessonId && q.difficulty === difficulty)
    .sort((a,b)=> a.question_order - b.question_order);

  if (targetQuizzes.length === 0) {
    return res.status(404).json({
      success:false,
      message:"해당 조건의 퀴즈가 없습니다."
    });
  }

  const solvedQuizIds = quizLogs
    .filter(log => log.member_id === memberId)
    .map(log => log.quiz_id);

  const nextQuiz = targetQuizzes.find(
    q => !solvedQuizIds.includes(q.quiz_id)
  );

  if (!nextQuiz) {
    return res.json({
      success:true,
      message:"모든 문제를 완료했습니다.",
      data:null
    });
  }

  res.json({
    success:true,
    data: nextQuiz
  });

});

/**
 * 정답 제출
 */
router.post("/submit", devAuth, (req,res)=>{

  const memberId = req.user.member_id;
  const {quiz_id, selected_answer} = req.body;

  const quiz = quizzes.find(q => q.quiz_id === Number(quiz_id));

  if(!quiz){
    return res.status(404).json({
      success:false,
      message:"퀴즈를 찾을 수 없습니다."
    });
  }

  const isCorrect = quiz.correct_answer === selected_answer;
  const earnedPoints = isCorrect ? quiz.reward_points : 0;

  quizLogs.push({
    member_id: memberId,
    quiz_id: quiz.quiz_id,
    selected_answer,
    is_correct: isCorrect,
    earned_points: earnedPoints,
    created_at: new Date().toISOString()
  });

  res.json({
    success:true,
    data:{
      quiz_id:quiz.quiz_id,
      selected_answer,
      isCorrect,
      earnedPoints,
      explanation:quiz.explanation
    }
  });

});

module.exports = router;