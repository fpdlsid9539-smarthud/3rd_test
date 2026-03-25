const express = require("express");
const router = express.Router();
const achievementController = require("../controllers/achievementController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/achievements", achievementController.getAllAchievements);
router.get("/achievements/:id", achievementController.getAchievementById);

router.get("/my-achievements", authMiddleware, achievementController.getMyAchievements);
router.get("/recent-achievements", authMiddleware, achievementController.getRecentAchievements);

router.get("/titles", authMiddleware, achievementController.getMyTitles);
router.get("/titles/equipped", authMiddleware, achievementController.getEquippedTitle);
router.patch("/titles/equip", authMiddleware, achievementController.equipTitle);

router.post("/check-achievements", authMiddleware, achievementController.checkAchievements);

module.exports = router;