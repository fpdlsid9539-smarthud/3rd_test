const express = require("express");
const router = express.Router();
const rankingController = require("../controllers/rankingController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/", authMiddleware, rankingController.getLeaderboard);

module.exports = router;