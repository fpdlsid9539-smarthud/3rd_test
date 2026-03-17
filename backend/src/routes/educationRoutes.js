const express = require("express");
const router = express.Router();
const educationController = require("../controllers/educationController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/", authMiddleware, educationController.getEducationData);
router.post("/:lessonId/complete", authMiddleware, educationController.completeLesson);

module.exports = router;