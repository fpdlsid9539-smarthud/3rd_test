const express = require("express");
const router = express.Router();

const stockController = require("../controllers/stockController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/", stockController.getAllStocks);
router.get("/liked", authMiddleware, stockController.getLikedStocks);
router.get("/owned", authMiddleware, stockController.getOwnedStocks);

router.post("/:stockCode/like", authMiddleware, stockController.toggleLikeStock);
router.post("/:stockCode/buy", authMiddleware, stockController.buyStock);
router.post("/:stockCode/sell", authMiddleware, stockController.sellStock);

router.get("/:symbol/chart", stockController.getStockChart);
router.get("/:symbol", stockController.getStockPrice);

module.exports = router;