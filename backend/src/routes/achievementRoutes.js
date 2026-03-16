const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");
const authMiddleware = require("../../middlewares/authMiddleware");

/* 전체 업적/칭호 조회 */
router.get("/achievements", achievementController.getAllAchievements);

/* 특정 업적/칭호 1개 조회 */
router.get("/achievements/:id", achievementController.getAchievementById);

/* 내 업적 조회 - 현재는 자리만 */
router.get("/my-achievements", authMiddleware, achievementController.getMyAchievements);

module.exports = router;