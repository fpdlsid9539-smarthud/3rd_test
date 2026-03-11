const express = require("express");
const router = express.Router();
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();
const db = require("../config/db");

function getPeriod1ByRange(range) {
  const now = new Date();
  const period1 = new Date(now);

  switch (range) {
    case "1d":
      period1.setDate(now.getDate() - 1);
      break;
    case "5d":
      period1.setDate(now.getDate() - 5);
      break;
    case "1mo":
      period1.setMonth(now.getMonth() - 1);
      break;
    case "3mo":
      period1.setMonth(now.getMonth() - 3);
      break;
    case "6mo":
      period1.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      period1.setFullYear(now.getFullYear() - 1);
      break;
    case "2y":
      period1.setFullYear(now.getFullYear() - 2);
      break;
    case "5y":
      period1.setFullYear(now.getFullYear() - 5);
      break;
    case "10y":
      period1.setFullYear(now.getFullYear() - 10);
      break;
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    case "max":
      return new Date("2000-01-01");
    default:
      period1.setMonth(now.getMonth() - 1);
      break;
  }

  return period1;
}

// 전체 종목 목록 조회
router.get("/", async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM stocks ORDER BY stock_name ASC");

    res.json({
      message: "종목 목록 조회 성공",
      data: rows,
    });
  } catch (err) {
    console.error("종목 목록 조회 오류:", err);
    res.status(500).json({
      message: "종목 목록 조회 실패",
      error: err.message,
    });
  }
});

// 특정 종목 차트 조회
// ex) GET /stocks/005930/chart?range=1mo&interval=1d
router.get("/:symbol/chart", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = "1mo", interval = "1d" } = req.query;

    const [rows] = await db.promise().query(
      "SELECT * FROM stocks WHERE stock_code = ?",
      [symbol]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "해당 종목을 찾을 수 없습니다.",
      });
    }

    const stock = rows[0];
    const yahooSymbol = `${stock.stock_code}.KS`;

    const period1 = getPeriod1ByRange(range);
    const period2 = new Date();

    const result = await yahooFinance.chart(yahooSymbol, {
      period1,
      period2,
      interval,
    });

    const prices = (result.quotes || []).map((item) => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    res.json({
      message: "종목 차트 조회 성공",
      data: {
        symbol: stock.stock_code,
        name: stock.stock_name,
        market: stock.market_type,
        range,
        interval,
        prices,
      },
    });
  } catch (err) {
    console.error("종목 차트 조회 오류:", err);
    res.status(500).json({
      message: "차트 조회 실패",
      error: err.message,
    });
  }
});

// 특정 종목 현재가 조회
router.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    const [rows] = await db.promise().query(
      "SELECT * FROM stocks WHERE stock_code = ?",
      [symbol]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "해당 종목을 찾을 수 없습니다.",
      });
    }

    const stock = rows[0];
    const yahooSymbol = `${stock.stock_code}.KS`;

    const quote = await yahooFinance.quote(yahooSymbol);

    res.json({
      message: "종목 현재가 조회 성공",
      data: {
        symbol: stock.stock_code,
        name: stock.stock_name,
        market: stock.market_type,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changeRate: quote.regularMarketChangePercent,
        currency: quote.currency,
        marketState: quote.marketState,
      },
    });
  } catch (err) {
    console.error("종목 현재가 조회 오류:", err);
    res.status(500).json({
      message: "주식 조회 실패",
      error: err.message,
    });
  }
});

module.exports = router;