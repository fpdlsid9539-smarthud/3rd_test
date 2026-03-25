const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/authMiddleware");
const pointHistoryController = require("../controllers/pointHistoryController");

/**
 * GET /api/points/notifications
 */
router.get(
  "/notifications",
  authMiddleware,
  pointHistoryController.getPointNotifications
);

module.exports = router;