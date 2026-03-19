const db = require("../../config/db");
const axios = require("axios");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

/* 공통 응답 */
function success(res, message, data = null, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}

/* 로그인 사용자 member_id 추출 */
function extractMemberId(req) {
  if (!req.user || typeof req.user !== "object") return null;

  return (
    req.user.member_id ||
    req.user.id ||
    req.user.memberId ||
    req.user.userId ||
    null
  );
}

/* 종목코드 6자리 보정 */
function normalizeStockCode(value) {
  return String(value || "").padStart(6, "0");
}

/* =========================
   1) 전체 종목 / 검색 / 인기 / 상승 / 하락
========================= */
exports.getAllStocks = async (req, res) => {
  try {
    const { type = "popular", keyword = "" } = req.query;

    /* A. 검색 */
    if (keyword) {
      const [rows] = await db.promise().query("SELECT * FROM stocks");

      const uniqueRows = [];
      const seenCodes = new Set();

      for (const row of rows) {
        const code = normalizeStockCode(
          row.stock_code || row["단축코드"] || Object.values(row)[0] || ""
        );
        const name = String(
          row.stock_name || row["한글 종목명"] || Object.values(row)[1] || ""
        );

        if ((name.includes(keyword) || code.includes(keyword)) && !seenCodes.has(code)) {
          seenCodes.add(code);
          uniqueRows.push({ code, name });
        }
      }

      const results = [];

      for (const item of uniqueRows.slice(0, 5)) {
        try {
          let quote = await yahooFinance.quote(`${item.code}.KS`).catch(() => null);
          if (!quote) {
            quote = await yahooFinance.quote(`${item.code}.KQ`).catch(() => null);
          }

          results.push({
            symbol: item.code,
            name: item.name,
            price: Number(quote?.regularMarketPrice || 50000),
            change: Number(quote?.regularMarketChange || 0),
            rate: Number(quote?.regularMarketChangePercent || 0),
          });
        } catch (e) {
          results.push({
            symbol: item.code,
            name: item.name,
            price: 50000,
            change: 0,
            rate: 0,
          });
        }
      }

      return success(res, "검색 성공", results);
    }

    /* B. 다음 금융 기반 인기/상승/하락 */
    let url = "";

    if (type === "popular") {
      url =
        "https://finance.daum.net/api/trend/trade_volume?page=1&perPage=20&fieldName=tradeVolume&order=desc&market=KOSPI&pagination=true";
    } else if (type === "rising") {
      url =
        "https://finance.daum.net/api/trend/fluctuation_rate?page=1&perPage=20&fieldName=fluctuationRate&order=desc&market=KOSPI&pagination=true";
    } else if (type === "falling") {
      url =
        "https://finance.daum.net/api/trend/fluctuation_rate?page=1&perPage=20&fieldName=fluctuationRate&order=asc&market=KOSPI&pagination=true";
    }

    try {
      const response = await axios.get(url, {
        headers: {
          Referer: "https://finance.daum.net/",
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 5000,
      });

      const formatted = (response.data.data || []).map((s) => ({
        symbol: String(s.symbolCode || "").replace("A", ""),
        name: s.name,
        price: Number(s.tradePrice || 0),
        change: Number(s.changePrice || 0) * (s.change === "FALL" ? -1 : 1),
        rate: Number(s.changeRate || 0) * 100 * (s.change === "FALL" ? -1 : 1),
      }));

      return success(res, `${type} 조회 성공`, formatted);
    } catch (daumErr) {
      console.warn("Daum API 실패, DB/Yahoo fallback 사용:", daumErr.message);

      /* C. fallback: DB + Yahoo */
      const [rows] = await db.promise().query("SELECT * FROM stocks");

      const symbols = rows.map(
        (r) => `${normalizeStockCode(r.stock_code || r["단축코드"] || "")}.KS`
      );

      const stockMap = Object.fromEntries(
        rows.map((r) => [
          `${normalizeStockCode(r.stock_code || r["단축코드"] || "")}.KS`,
          r.stock_name || r["한글 종목명"] || "",
        ])
      );

      const realResults = [];
      const chunkSize = 50;

      for (let i = 0; i < symbols.length; i += chunkSize) {
        const chunk = symbols.slice(i, i + chunkSize);
        const quotes = await Promise.all(
          chunk.map((sym) => yahooFinance.quote(sym).catch(() => null))
        );

        quotes.forEach((q) => {
          if (q?.regularMarketPrice) {
            realResults.push({
              symbol: String(q.symbol || "").split(".")[0],
              name: stockMap[q.symbol] || q.shortName || "",
              price: Number(q.regularMarketPrice || 0),
              change: Number(q.regularMarketChange || 0),
              rate: Number(q.regularMarketChangePercent || 0),
              volume: Number(q.regularMarketVolume || 0),
            });
          }
        });
      }

      if (type === "popular") {
        realResults.sort((a, b) => b.volume - a.volume);
      } else if (type === "rising") {
        realResults.sort((a, b) => b.rate - a.rate);
      } else if (type === "falling") {
        realResults.sort((a, b) => a.rate - b.rate);
      }

      return success(res, `${type} (DB/Yahoo 기반) 성공`, realResults.slice(0, 20));
    }
  } catch (err) {
    console.error("getAllStocks error =", err);
    return fail(res, "조회 실패", err.message, 500);
  }
};

/* =========================
   2) 캔들 차트 조회
========================= */
exports.getStockChart = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = "1y", interval = "1d" } = req.query;
    const cleanCode = normalizeStockCode(symbol);

    let result = null;

    try {
      result = await yahooFinance.chart(`${cleanCode}.KS`, { range, interval });
    } catch (e) {
      result = await yahooFinance
        .chart(`${cleanCode}.KQ`, { range, interval })
        .catch(() => null);
    }

    if (result?.quotes?.length > 0) {
      const prices = result.quotes
        .filter((q) => q.open != null)
        .map((item) => ({
          x: new Date(item.date).getTime(),
          o: item.open,
          h: item.high,
          l: item.low,
          c: item.close,
          v: item.volume,
        }));

      return success(res, "차트 성공", prices);
    }

    /* fallback 차트 */
    const fallbackPrices = [];
    let basePrice = 15000;
    const now = Date.now();

    for (let i = 50; i >= 0; i--) {
      const open = basePrice + (Math.random() * 400 - 200);
      const close = open + (Math.random() * 600 - 300);

      fallbackPrices.push({
        x: now - i * 86400000,
        o: open,
        h: Math.max(open, close) + 100,
        l: Math.min(open, close) - 100,
        c: close,
      });

      basePrice = close;
    }

    return success(res, "임시 차트 성공 (Fallback)", fallbackPrices);
  } catch (err) {
    console.error("getStockChart error =", err);
    return fail(res, "차트 에러", err.message, 500);
  }
};

/* =========================
   3) 현재가 조회
========================= */
exports.getStockPrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    const cleanCode = normalizeStockCode(symbol);

    const quote = await yahooFinance
      .quote(`${cleanCode}.KS`)
      .catch(() => yahooFinance.quote(`${cleanCode}.KQ`));

    if (!quote) {
      return fail(res, "해당 종목을 찾을 수 없습니다.", null, 404);
    }

    return success(res, "현재가 조회 성공", {
      symbol: cleanCode,
      price: Number(quote.regularMarketPrice || 0),
      change: Number(quote.regularMarketChange || 0),
      rate: Number(quote.regularMarketChangePercent || 0),
    });
  } catch (err) {
    console.error("getStockPrice error =", err);
    return fail(res, "주식 조회 실패", err.message, 500);
  }
};

/* =========================
   4) 찜한 주식 조회
   - Dashboard.jsx 형식 맞춤
========================= */
exports.getLikedStocks = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    console.log("===== GET LIKED STOCKS =====");
    console.log("liked req.user =", req.user);
    console.log("liked memberId =", memberId);

    if (!memberId) {
      return fail(res, "인증이 필요합니다.", null, 401);
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        l.id,
        l.member_id,
        l.stock_code,
        l.created_at,
        s.stock_name
      FROM liked_stocks l
      INNER JOIN stocks s
        ON l.stock_code = s.stock_code
      WHERE l.member_id = ?
      ORDER BY l.created_at DESC, l.id DESC
      `,
      [memberId]
    );

    console.log("liked rows =", rows);

    const result = await Promise.all(
      rows.map(async (row) => {
        let quote = await yahooFinance
          .quote(`${normalizeStockCode(row.stock_code)}.KS`)
          .catch(() => null);

        if (!quote) {
          quote = await yahooFinance
            .quote(`${normalizeStockCode(row.stock_code)}.KQ`)
            .catch(() => null);
        }

        return {
          id: row.id,
          memberId: row.member_id,
          stockCode: normalizeStockCode(row.stock_code),
          stockName: row.stock_name,
          price: Number(quote?.regularMarketPrice || 0),
          change: Number(quote?.regularMarketChange || 0),
          changeRate: Number(quote?.regularMarketChangePercent || 0),
          createdAt: row.created_at,
        };
      })
    );

    console.log("liked result =", result);

    return success(res, "찜한 주식 조회 성공", result);
  } catch (err) {
    console.error("getLikedStocks error =", err);
    return fail(res, "찜한 주식 조회 실패", err.message, 500);
  }
};

/* =========================
   5) 보유 주식 조회
   - Dashboard.jsx 형식 맞춤
========================= */
exports.getOwnedStocks = async (req, res) => {
  try {
    const memberId = extractMemberId(req);

    console.log("===== GET OWNED STOCKS =====");
    console.log("owned req.user =", req.user);
    console.log("owned memberId =", memberId);

    if (!memberId) {
      return fail(res, "인증이 필요합니다.", null, 401);
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        o.id,
        o.member_id,
        o.stock_code,
        o.quantity,
        o.avg_price,
        o.created_at,
        o.updated_at,
        s.stock_name
      FROM owned_stocks o
      INNER JOIN stocks s
        ON o.stock_code = s.stock_code
      WHERE o.member_id = ?
      ORDER BY o.created_at DESC, o.id DESC
      `,
      [memberId]
    );

    console.log("owned rows =", rows);

    const result = await Promise.all(
      rows.map(async (row) => {
        let quote = await yahooFinance
          .quote(`${normalizeStockCode(row.stock_code)}.KS`)
          .catch(() => null);

        if (!quote) {
          quote = await yahooFinance
            .quote(`${normalizeStockCode(row.stock_code)}.KQ`)
            .catch(() => null);
        }

        const price = Number(quote?.regularMarketPrice || 0);
        const changeRate = Number(quote?.regularMarketChangePercent || 0);
        const quantity = Number(row.quantity || 0);
        const avgPrice = Number(row.avg_price || 0);

        const totalPrice = price * quantity;
        const changeAmount = (price - avgPrice) * quantity;

        return {
          id: row.id,
          memberId: row.member_id,
          stockCode: normalizeStockCode(row.stock_code),
          stockName: row.stock_name,
          quantity,
          avgPrice,
          price,
          totalPrice,
          changeAmount,
          changeRate,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      })
    );

    console.log("owned result =", result);

    return success(res, "보유 주식 조회 성공", result);
  } catch (err) {
    console.error("getOwnedStocks error =", err);
    return fail(res, "보유 주식 조회 실패", err.message, 500);
  }
};