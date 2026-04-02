const express = require("express");
const router = express.Router();

const quizController = require("../controllers/quizController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/all", quizController.getAllQuizzes);
router.get("/random", quizController.getRandomQuiz);
router.get("/ranking", quizController.getQuizRanking);

router.get("/status/me", authMiddleware, quizController.getMyQuestStatus);
router.get("/wrong-notes/me", authMiddleware, quizController.getWrongAnswerNotes);

router.post("/check-ai", authMiddleware, quizController.checkAiAnswer);
router.post("/check", authMiddleware, quizController.checkAnswer);
router.post("/bonus", authMiddleware, quizController.bonusReward);
router.post("/generate", authMiddleware, quizController.generateLLMQuiz);

router.get("/ox", authMiddleware, quizController.getDailyOxQuiz);
router.post("/ox/submit", authMiddleware, quizController.submitOxAnswer);

router.get("/:quiz_id", quizController.getQuizById);

module.exports = router;