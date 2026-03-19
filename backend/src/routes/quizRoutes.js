const express = require("express");
const router = express.Router();

const quizController = require("../controllers/quizController");
const authMiddleware = require("../../middlewares/authMiddleware");

/* API 확인 페이지 */

router.get("/all", quizController.getAllQuizzes);

router.get("/random", quizController.getRandomQuiz);

router.get("/:quiz_id", quizController.getQuizById);

router.post("/check", authMiddleware, quizController.checkAnswer);

router.get("/status/me", authMiddleware, quizController.getMyQuestStatus);

module.exports = router;