const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/", stockController.getAllStocks);
router.get("/liked", authMiddleware, stockController.getLikedStocks);
router.get("/owned", authMiddleware, stockController.getOwnedStocks);
router.get("/:symbol/chart", stockController.getStockChart);
router.get("/:symbol", stockController.getStockPrice);

module.exports = router;