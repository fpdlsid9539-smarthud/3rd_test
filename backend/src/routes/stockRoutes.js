const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");


router.get("/", stockController.getAllStocks);


router.get("/:symbol/chart", stockController.getStockChart);

router.get("/:symbol", stockController.getStockPrice);

module.exports = router;