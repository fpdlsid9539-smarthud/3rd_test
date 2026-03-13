const db = require("../../config/db");
const yahooService = require("../services/yahooService");

function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({ success: false, message, error });
}

exports.getAllStocks = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM stocks ORDER BY stock_name ASC"
    );
    return success(res, "종목 목록 조회 성공", rows);
  } catch (err) {
    return fail(res, "종목 목록 조회 실패", err.message);
  }
};

exports.getStockChart = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = "1mo", interval = "1d" } = req.query;

    const [rows] = await db.promise().query(
      "SELECT * FROM stocks WHERE stock_code = ?",
      [symbol]
    );

    if (rows.length === 0) {
      return fail(res, "해당 종목을 찾을 수 없습니다.", null, 404);
    }

    const stock = rows[0];
    const yahooSymbol = `${stock.stock_code}.KS`;
    const result = await yahooService.getChart(yahooSymbol, range, interval);

    const prices = (result.quotes || []).map((item) => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));

    return success(res, "종목 차트 조회 성공", {
      symbol: stock.stock_code,
      name: stock.stock_name,
      market: stock.market_type,
      range,
      interval,
      prices
    });
  } catch (err) {
    return fail(res, "차트 조회 실패", err.message);
  }
};

exports.getStockPrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    const [rows] = await db.promise().query(
      "SELECT * FROM stocks WHERE stock_code = ?",
      [symbol]
    );

    if (rows.length === 0) {
      return fail(res, "해당 종목을 찾을 수 없습니다.", null, 404);
    }

    const stock = rows[0];
    const yahooSymbol = `${stock.stock_code}.KS`;
    const quote = await yahooService.getQuote(yahooSymbol);

    return success(res, "종목 현재가 조회 성공", {
      symbol: stock.stock_code,
      name: stock.stock_name,
      market: stock.market_type,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changeRate: quote.regularMarketChangePercent,
      currency: quote.currency,
      marketState: quote.marketState
    });
  } catch (err) {
    return fail(res, "주식 조회 실패", err.message);
  }
};