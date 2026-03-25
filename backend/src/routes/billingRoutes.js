const express = require("express");
const router = express.Router();

const billingController = require("../controllers/billingController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/membership", authMiddleware, billingController.getMembership);
router.post("/premium/upgrade", authMiddleware, billingController.upgradeToPremium);
router.post("/premium/cancel", authMiddleware, billingController.cancelPremium);
router.post("/confirm", authMiddleware, billingController.confirmPayment);

module.exports = router;