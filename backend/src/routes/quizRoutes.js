const express = require("express");
const router = express.Router();

const quizController = require("../controllers/quizController");
const authMiddleware = require("../../middlewares/authMiddleware");

/* API 확인 페이지 */

router.get("/all", quizController.getAllQuizzes);

router.get("/random", quizController.getRandomQuiz);

router.post("/check", authMiddleware, quizController.checkAnswer);

router.get("/status/me", authMiddleware, quizController.getMyQuestStatus);

router.get("/ranking", quizController.getQuizRanking);

router.get("/ox", authMiddleware, quizController.getDailyOxQuiz);

router.post("/ox/submit", authMiddleware, quizController.submitOxQuiz);

router.get("/:quiz_id", quizController.getQuizById);

module.exports = router;