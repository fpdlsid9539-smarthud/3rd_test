const db = require("../../config/db");
const achievementService = require("../services/achievementService");

let yfInstance = null;

async function getYahooFinance() {
  if (yfInstance) return yfInstance;
  const mod = await import("yahoo-finance2");
  const YahooFinance = mod.default || mod;
  yfInstance = new YahooFinance();
  return yfInstance;
}

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

function extractMemberId(req) {
  if (!req.user || typeof req.user !== "object") return null;

  const rawId =
    req.user.member_id ??
    req.user.id ??
    req.user.memberId ??
    req.user.userId ??
    null;

  const memberId = Number(rawId);
  return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
}

function normalizeStockCode(value) {
  return String(value || "").trim().padStart(6, "0");
}

async function getQuoteByCode(stockCode) {
  const yahooFinance = await getYahooFinance();
  const code = normalizeStockCode(stockCode);

  let quote = await yahooFinance.quote(`${code}.KS`).catch(() => null);
  if (!quote) {
    quote = await yahooFinance.quote(`${code}.KQ`).catch(() => null);
  }

  return quote;
}

async function insertPointHistory(executor, memberId, changeAmount, reason) {
  await executor.query(
    `
    INSERT INTO point_history (member_id, change_amount, reason, created_at)
    VALUES (?, ?, ?, NOW())
    `,
    [memberId, Number(changeAmount || 0), String(reason || "포인트 변동")]
  );
}

async function insertTradeHistory(
  executor,
  memberId,
  stockCode,
  stockName,
  tradeType,
  quantity,
  price
) {
  await executor.query(
    `
    INSERT INTO trade_history
    (member_id, stock_code, stock_name, trade_type, quantity, price, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      memberId,
      normalizeStockCode(stockCode),
      stockName,
      tradeType,
      Number(quantity || 0),
      Number(price || 0),
    ]
  );
}

async function insertGameLogOnBuy(
  executor,
  memberId,
  stockCode,
  quantity,
  unitPrice
) {
  const normalizedStockCode = normalizeStockCode(stockCode);
  const betAmount = Math.round(Number(quantity || 0) * Number(unitPrice || 0));

  await executor.query(
    `
    INSERT INTO gameLog
    (
      member_id,
      stock_code,
      prediction,
      bet_amount,
      pnl_amount,
      penalty_amount,
      status,
      created_at,
      strategy_type_user,
      strategy_type_actual,
      holding_time,
      market_trend
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)
    `,
    [
      memberId,
      normalizedStockCode,
      "UP",
      betAmount,
      0,
      0,
      "PENDING",
      "SWING",
      "SWING",
      null,
      "UNKNOWN",
    ]
  );
}

async function settleGameLogOnSell(
  executor,
  memberId,
  stockCode,
  sellQuantity,
  sellUnitPrice,
  avgBuyPrice
) {
  const normalizedStockCode = normalizeStockCode(stockCode);
  const quantity = Number(sellQuantity || 0);
  const unitPrice = Number(sellUnitPrice || 0);
  const avgPrice = Number(avgBuyPrice || 0);

  const pnlAmount = Math.round((unitPrice - avgPrice) * quantity);
  const penaltyAmount = pnlAmount < 0 ? Math.abs(pnlAmount) : 0;
  const status = pnlAmount >= 0 ? "SUCCESS" : "FAIL";

  const [[pendingRow]] = await executor.query(
    `
    SELECT log_id
    FROM gameLog
    WHERE member_id = ?
      AND stock_code = ?
      AND status = 'PENDING'
    ORDER BY created_at DESC, log_id DESC
    LIMIT 1
    `,
    [memberId, normalizedStockCode]
  );

  if (pendingRow?.log_id) {
    await executor.query(
      `
      UPDATE gameLog
      SET
        pnl_amount = ?,
        penalty_amount = ?,
        status = ?,
        strategy_type_actual = ?,
        market_trend = ?
      WHERE log_id = ?
      `,
      [
        pnlAmount,
        penaltyAmount,
        status,
        "SWING",
        pnlAmount >= 0 ? "BULL" : "BEAR",
        pendingRow.log_id,
      ]
    );
    return;
  }

  await executor.query(
    `
    INSERT INTO gameLog
    (
      member_id,
      stock_code,
      prediction,
      bet_amount,
      pnl_amount,
      penalty_amount,
      status,
      created_at,
      strategy_type_user,
      strategy_type_actual,
      holding_time,
      market_trend
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)
    `,
    [
      memberId,
      normalizedStockCode,
      unitPrice >= avgPrice ? "UP" : "DOWN",
      Math.round(quantity * avgPrice),
      pnlAmount,
      penaltyAmount,
      status,
      "SWING",
      "SWING",
      null,
      pnlAmount >= 0 ? "BULL" : "BEAR",
    ]
  );
}

function toDateOnlyString(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function hasConsecutiveDays(dateStrings, requiredDays) {
  const uniqueSortedDesc = [...new Set(dateStrings)].sort(
    (a, b) => parseDateOnly(b) - parseDateOnly(a)
  );

  if (uniqueSortedDesc.length < requiredDays) {
    return false;
  }

  for (
    let start = 0;
    start <= uniqueSortedDesc.length - requiredDays;
    start += 1
  ) {
    let ok = true;

    for (let i = 0; i < requiredDays - 1; i += 1) {
      const current = parseDateOnly(uniqueSortedDesc[start + i]);
      const next = parseDateOnly(uniqueSortedDesc[start + i + 1]);
      const diffDays = Math.round(
        (current - next) / (1000 * 60 * 60 * 24)
      );

      if (diffDays !== 1) {
        ok = false;
        break;
      }
    }

    if (ok) return true;
  }

  return false;
}

function analyzeTradeHistory(tradeRows) {
  const holdings = new Map();
  const sellEvents = [];

  for (const row of tradeRows) {
    const stockCode = normalizeStockCode(row.stock_code);
    const tradeType = String(row.trade_type || "").toLowerCase();
    const quantity = Number(row.quantity || 0);
    const price = Number(row.price || 0);
    const createdAt = row.created_at;

    const holding = holdings.get(stockCode) || {
      quantity: 0,
      avgPrice: 0,
    };

    if (tradeType === "buy") {
      const nextQty = holding.quantity + quantity;
      const nextAvg =
        nextQty > 0
          ? (holding.quantity * holding.avgPrice + quantity * price) / nextQty
          : 0;

      holdings.set(stockCode, {
        quantity: nextQty,
        avgPrice: nextAvg,
      });
      continue;
    }

    if (tradeType === "sell") {
      const qtyToSell = Math.min(quantity, holding.quantity);
      const avgPrice = Number(holding.avgPrice || 0);
      const saleAmount = price * qtyToSell;
      const costAmount = avgPrice * qtyToSell;
      const profitAmount = saleAmount - costAmount;
      const profitRate =
        avgPrice > 0 ? ((price - avgPrice) / avgPrice) * 100 : 0;
      const isProfit = profitAmount > 0;

      sellEvents.push({
        stockCode,
        quantity: qtyToSell,
        sellPrice: price,
        avgPrice,
        createdAt,
        profitAmount,
        profitRate,
        isProfit,
      });

      const remainQty = Math.max(holding.quantity - qtyToSell, 0);

      holdings.set(stockCode, {
        quantity: remainQty,
        avgPrice: remainQty > 0 ? avgPrice : 0,
      });
    }
  }

  return {
    sellEvents,
  };
}

function getMaxProfitStreak(sellEvents) {
  let streak = 0;
  let maxProfitStreak = 0;

  for (const item of sellEvents) {
    if (item.isProfit) {
      streak += 1;
      if (streak > maxProfitStreak) {
        maxProfitStreak = streak;
      }
    } else {
      streak = 0;
    }
  }

  return maxProfitStreak;
}

async function checkAndGrantStockAchievements(memberId, context = {}) {
  const grantedIds = [];

  const [tradeRows] = await db.promise().query(
    `
    SELECT
      history_id,
      stock_code,
      trade_type,
      quantity,
      price,
      created_at
    FROM trade_history
    WHERE member_id = ?
    ORDER BY created_at ASC, history_id ASC
    `,
    [memberId]
  );

  const tradeDates = tradeRows.map((row) => toDateOnlyString(row.created_at));
  const buyDates = tradeRows
    .filter((row) => String(row.trade_type).toLowerCase() === "buy")
    .map((row) => toDateOnlyString(row.created_at));

  const distinctStockCount = new Set(
    tradeRows.map((row) => normalizeStockCode(row.stock_code))
  ).size;

  const { sellEvents } = analyzeTradeHistory(tradeRows);
  const totalProfitTrades = sellEvents.filter((item) => item.isProfit).length;
  const last3SellEvents = sellEvents.slice(-3);
  const last10SellEvents = sellEvents.slice(-10);
  const maxProfitStreak = getMaxProfitStreak(sellEvents);

  if (
    context.tradeType === "buy" &&
    Number(context.preTradePoints || 0) > 0 &&
    Number(context.totalCost || 0) >= Number(context.preTradePoints || 0) * 0.5
  ) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      3
    );
    if (granted) grantedIds.push(3);
  }

  if (hasConsecutiveDays(buyDates, 3)) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      4
    );
    if (granted) grantedIds.push(4);
  }

  if (
    last3SellEvents.length === 3 &&
    last3SellEvents.every((item) => Number(item.profitRate) >= -5)
  ) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      5
    );
    if (granted) grantedIds.push(5);
  }

  if (last10SellEvents.length === 10) {
    const recentWinCount = last10SellEvents.filter(
      (item) => item.isProfit
    ).length;
    const recentWinRate = recentWinCount / 10;

    if (recentWinRate >= 0.7) {
      const granted = await achievementService.grantAchievementIfNotExists(
        memberId,
        6
      );
      if (granted) grantedIds.push(6);
    }
  }

  if (maxProfitStreak >= 3) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      7
    );
    if (granted) grantedIds.push(7);
  }

  for (let i = 1; i < sellEvents.length; i += 1) {
    const prev = sellEvents[i - 1];
    const curr = sellEvents[i];

    if (!prev.isProfit && curr.isProfit) {
      const granted = await achievementService.grantAchievementIfNotExists(
        memberId,
        8
      );
      if (granted) grantedIds.push(8);
      break;
    }
  }

  if (distinctStockCount >= 30) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      9
    );
    if (granted) grantedIds.push(9);
  }

  if (totalProfitTrades >= 1) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      14
    );
    if (granted) grantedIds.push(14);
  }

  if (maxProfitStreak >= 5) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      15
    );
    if (granted) grantedIds.push(15);
  }

  if (maxProfitStreak >= 7) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      16
    );
    if (granted) grantedIds.push(16);
  }

  if (totalProfitTrades >= 50) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      17
    );
    if (granted) grantedIds.push(17);
  }

  {
    let pendingLoss = 0;
    let recovered = false;

    for (const item of sellEvents) {
      if (item.profitAmount < 0) {
        pendingLoss += Math.abs(item.profitAmount);
      } else if (pendingLoss > 0) {
        pendingLoss -= item.profitAmount;
        if (pendingLoss <= 0) {
          recovered = true;
          break;
        }
      }
    }

    if (recovered) {
      const granted = await achievementService.grantAchievementIfNotExists(
        memberId,
        18
      );
      if (granted) grantedIds.push(18);
    }
  }

  if (hasConsecutiveDays(tradeDates, 3)) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      24
    );
    if (granted) grantedIds.push(24);
  }

  if (hasConsecutiveDays(tradeDates, 30)) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      25
    );
    if (granted) grantedIds.push(25);
  }

  if (distinctStockCount >= 5) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      27
    );
    if (granted) grantedIds.push(27);
  }

  if (distinctStockCount >= 15) {
    const granted = await achievementService.grantAchievementIfNotExists(
      memberId,
      28
    );
    if (granted) grantedIds.push(28);
  }

  return {
    grantedCount: grantedIds.length,
    grantedIds,
  };
}

const KOR_NAME_MAP = {
  "005930": "삼성전자",
  "000660": "SK하이닉스",
  "373220": "LG에너지솔루션",
  "207940": "삼성바이오로직스",
  "005380": "현대차",
  "000270": "기아",
  "068270": "셀트리온",
  "005490": "POSCO홀딩스",
  "035420": "NAVER",
  "003670": "포스코퓨처엠",
  "051910": "LG화학",
  "012330": "현대모비스",
  "028260": "삼성물산",
  "035720": "카카오",
  "105560": "KB금융",
  "055550": "신한지주",
  "066570": "LG전자",
  "032830": "삼성생명",
  "096770": "SK이노베이션",
  "034730": "SK",
  "015760": "한국전력",
  "033780": "KT&G",
  "009150": "삼성전기",
  "017670": "SK텔레콤",
  "011200": "HMM",
  "018260": "삼성SDS",
  "316140": "우리금융지주",
  "010130": "고려아연",
  "042700": "한미반도체",
  "003550": "LG",
  "086520": "에코프로",
  "000810": "삼성화재",
  "010950": "S-Oil",
  "051900": "LG생활건강",
  "323410": "카카오뱅크",
  "329180": "HD현대중공업",
  "011170": "롯데케미칼",
  "161390": "한국타이어앤테크놀로지",
  "011070": "LG이노텍",
  "004020": "현대제철",
  "047050": "포스코인터내셔널",
  "005830": "DB손해보험",
  "090430": "아모레퍼시픽",
  "241560": "두산밥캣",
  "024110": "기업은행",
  "008770": "호텔신라",
  "001450": "현대해상",
  "029780": "삼성카드",
  "000100": "유한양행",
  "001440": "대한전선",
  "006400": "삼성SDI",
  "247540": "에코프로비엠",
  "028300": "HLB",
  "066970": "엘앤에프",
  "352820": "하이브",
  "036570": "엔씨소프트",
  "259960": "크래프톤",
  "012450": "한화에어로스페이스",
  "042660": "한화오션",
  "010140": "삼성중공업",
  "009830": "한화솔루션",
  "000880": "한화",
  "028050": "팬오션",
  "078930": "GS",
  "377300": "카카오페이",
  "322310": "현대오토에버",
  "047810": "한국항공우주",
  "272210": "한화시스템",
  "003490": "대한항공",
  "000120": "CJ대한통운",
  "097950": "CJ제일제당",
  "001040": "CJ",
  "004990": "롯데지주",
  "023530": "롯데쇼핑",
  "007070": "GS리테일",
  "139480": "이마트",
  "006800": "미래에셋증권",
  "039490": "키움증권",
  "016360": "삼성증권",
  "005940": "NH투자증권",
  "031430": "신세계",
  "145020": "휴젤",
  "214150": "클래시스",
  "196170": "알테오젠",
  "035900": "JYP Ent.",
  "041510": "에스엠",
  "122870": "와이지엔터테인먼트",
  "293490": "카카오게임즈",
  "263750": "펄어비스",
  "112040": "위메이드",
  "008930": "한미사이언스",
  "128940": "한미약품",
  "002380": "KCC",
  "011790": "SKC",
  "014680": "한솔케미칼",
  "298380": "에코프로머티",
  "020150": "일진머티리얼즈",
  "000080": "하이트진로",
  "030200": "KT",
  "032640": "LG유플러스",
};

const TOP_100_STOCKS = Object.keys(KOR_NAME_MAP);

let cachedStocks = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 1000;

/* =========================
   1) 전체 종목 / 검색 / 인기 / 상승 / 하락
========================= */
exports.getAllStocks = async (req, res) => {
  try {
    const { type = "popular", keyword = "" } = req.query;
    const yahooFinance = await getYahooFinance();

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

        if (
          (name.includes(keyword) || code.includes(keyword)) &&
          !seenCodes.has(code)
        ) {
          seenCodes.add(code);
          uniqueRows.push({ code, name });
        }
      }

      const results = [];
      for (const item of uniqueRows.slice(0, 20)) {
        try {
          const quote = await getQuoteByCode(item.code);
          results.push({
            symbol: item.code,
            name: item.name,
            price: Number(quote?.regularMarketPrice || 0),
            change: Number(quote?.regularMarketChange || 0),
            rate: Number(quote?.regularMarketChangePercent || 0),
          });
        } catch (e) {
          results.push({
            symbol: item.code,
            name: item.name,
            price: 0,
            change: 0,
            rate: 0,
          });
        }
      }

      return success(res, "검색 성공", results);
    }

    let realResults = [];

    if (cachedStocks && Date.now() - lastFetchTime < CACHE_TTL) {
      realResults = [...cachedStocks];
    } else {
      const querySymbols = TOP_100_STOCKS.map((code) => `${code}.KS`);
      const quotes = await Promise.all(
        querySymbols.map((sym) => yahooFinance.quote(sym).catch(() => null))
      );

      quotes.forEach((q, index) => {
        if (!q || !q.symbol) return;

        const code = TOP_100_STOCKS[index];
        const korName = KOR_NAME_MAP[code] || q.shortName || code;

        realResults.push({
          symbol: code,
          name: korName,
          price: Number(q.regularMarketPrice || 0),
          change: Number(q.regularMarketChange || 0),
          rate: Number(q.regularMarketChangePercent || 0),
          volume: Number(q.regularMarketVolume || 0),
        });
      });

      cachedStocks = [...realResults];
      lastFetchTime = Date.now();
    }

    let filteredResults = [...realResults];

    if (type === "popular") {
      filteredResults.sort((a, b) => b.volume - a.volume);
    } else if (type === "rising") {
      filteredResults = filteredResults.filter((item) => item.rate > 0);
      filteredResults.sort((a, b) => b.rate - a.rate);
    } else if (type === "falling") {
      filteredResults = filteredResults.filter((item) => item.rate < 0);
      filteredResults.sort((a, b) => a.rate - b.rate);
    }

    return success(res, `${type} 실시간 조회 성공`, filteredResults.slice(0, 20));
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
    const rawSymbol = req.params.symbol || req.params.stockCode;
    const { range = "1y", interval = "1d" } = req.query;

    if (!rawSymbol) {
      return fail(res, "종목 코드가 없습니다.", null, 400);
    }

    const cleanCode = normalizeStockCode(rawSymbol);
    const yahooFinance = await getYahooFinance();

    const endDate = new Date();
    const startDate = new Date();

    if (range.endsWith("mo")) {
      startDate.setMonth(endDate.getMonth() - parseInt(range, 10));
    } else if (range.endsWith("y")) {
      startDate.setFullYear(endDate.getFullYear() - parseInt(range, 10));
    } else if (range.endsWith("d")) {
      startDate.setDate(endDate.getDate() - parseInt(range, 10));
    } else {
      startDate.setFullYear(endDate.getFullYear() - 1);
    }

    const period1 = startDate;
    const period2 = endDate;

    let result = null;

    try {
      result = await yahooFinance.chart(`${cleanCode}.KS`, {
        period1,
        period2,
        interval,
      });
    } catch (e) {
      try {
        result = await yahooFinance.chart(`${cleanCode}.KQ`, {
          period1,
          period2,
          interval,
        });
      } catch (err) {
        console.error(
          `[차트 에러] ${cleanCode} 데이터를 야후에서 가져올 수 없습니다.`,
          err.message
        );
        return fail(res, "야후 파이낸스 차트 데이터 로딩 실패", err.message, 404);
      }
    }

    if (result && result.quotes && result.quotes.length > 0) {
      const prices = result.quotes
        .filter((q) => q.open != null && q.close != null)
        .map((item) => ({
          x: new Date(item.date).getTime(),
          o: item.open,
          h: item.high,
          l: item.low,
          c: item.close,
        }));

      return success(res, "차트 성공", prices);
    } else {
      return fail(res, "유효한 차트 데이터가 없습니다.", null, 404);
    }
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
    const quote = await getQuoteByCode(cleanCode);

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
========================= */
exports.getLikedStocks = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    if (!memberId) return fail(res, "인증이 필요합니다.", null, 401);

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

    const result = await Promise.all(
      rows.map(async (row) => {
        const quote = await getQuoteByCode(row.stock_code).catch(() => null);

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

    return success(res, "찜한 주식 조회 성공", result);
  } catch (err) {
    console.error("getLikedStocks error =", err);
    return fail(res, "찜한 주식 조회 실패", err.message, 500);
  }
};

/* =========================
   5) 보유 주식 조회
========================= */
exports.getOwnedStocks = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    if (!memberId) return fail(res, "인증이 필요합니다.", null, 401);

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

    const result = await Promise.all(
      rows.map(async (row) => {
        const quote = await getQuoteByCode(row.stock_code).catch(() => null);

        const price = Number(quote?.regularMarketPrice || 0);
        const changeRate = Number(quote?.regularMarketChangePercent || 0);
        const quantity = Number(row.quantity || 0);
        const avgPrice = Number(row.avg_price || 0);

        return {
          id: row.id,
          memberId: row.member_id,
          stockCode: normalizeStockCode(row.stock_code),
          stockName: row.stock_name,
          quantity,
          avgPrice,
          price,
          principal: avgPrice * quantity,
          totalPrice: price * quantity,
          changeAmount: Number((price - avgPrice) * quantity),
          myChangeRate: avgPrice > 0 ? Number((((price - avgPrice) / avgPrice) * 100).toFixed(2)) : 0,
          changeRate,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      })
    );

    return success(res, "보유 주식 조회 성공", result);
  } catch (err) {
    console.error("getOwnedStocks error =", err);
    return fail(res, "보유 주식 조회 실패", err.message, 500);
  }
};

/* =========================
   6) 찜하기 / 찜해제 토글
========================= */
exports.toggleLikeStock = async (req, res) => {
  try {
    const memberId = extractMemberId(req);
    if (!memberId) return fail(res, "인증이 필요합니다.", null, 401);

    const stockCode = normalizeStockCode(req.params.stockCode);
    if (!stockCode) return fail(res, "종목 코드가 필요합니다.", null, 400);

    const [[stockRow]] = await db.promise().query(
      `
      SELECT stock_code, stock_name
      FROM stocks
      WHERE stock_code = ?
      LIMIT 1
      `,
      [stockCode]
    );

    if (!stockRow) {
      return fail(res, "존재하지 않는 종목입니다.", null, 404);
    }

    const [[likedRow]] = await db.promise().query(
      `
      SELECT id
      FROM liked_stocks
      WHERE member_id = ? AND stock_code = ?
      LIMIT 1
      `,
      [memberId, stockCode]
    );

    if (likedRow) {
      await db.promise().query(
        `
        DELETE FROM liked_stocks
        WHERE id = ?
        `,
        [likedRow.id]
      );

      return success(res, "찜 해제 성공", {
        liked: false,
        stockCode,
        stockName: stockRow.stock_name,
      });
    }

    await db.promise().query(
      `
      INSERT INTO liked_stocks (member_id, stock_code)
      VALUES (?, ?)
      `,
      [memberId, stockCode]
    );

    return success(res, "찜 추가 성공", {
      liked: true,
      stockCode,
      stockName: stockRow.stock_name,
    });
  } catch (err) {
    console.error("toggleLikeStock error =", err);
    return fail(res, "찜 처리 실패", err.message, 500);
  }
};

/* =========================
   7) 매수
========================= */
exports.buyStock = async (req, res) => {
  let conn = null;

  try {
    const memberId = extractMemberId(req);
    if (!memberId) return fail(res, "인증이 필요합니다.", null, 401);

    const stockCode = normalizeStockCode(req.params.stockCode);
    const quantity = Number(req.body?.quantity);
    const unitPrice = Number(req.body?.unitPrice);

    if (!stockCode) return fail(res, "종목 코드가 필요합니다.", null, 400);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return fail(res, "수량은 1 이상의 정수여야 합니다.", null, 400);
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return fail(res, "현재가 정보가 올바르지 않습니다.", null, 400);
    }

    conn = await db.promise().getConnection();
    await conn.beginTransaction();

    const [[memberRow]] = await conn.query(
      `
      SELECT member_id, points
      FROM members
      WHERE member_id = ?
      FOR UPDATE
      `,
      [memberId]
    );

    if (!memberRow) {
      await conn.rollback();
      return fail(res, "사용자 정보를 찾을 수 없습니다.", null, 404);
    }

    const currentPoints = Number(memberRow.points || 0);
    const totalCost = Math.round(unitPrice * quantity);

    if (currentPoints < totalCost) {
      await conn.rollback();
      return fail(res, "보유 포인트가 부족합니다.", null, 400);
    }

    const [[stockRow]] = await conn.query(
      `
      SELECT stock_code, stock_name
      FROM stocks
      WHERE stock_code = ?
      LIMIT 1
      `,
      [stockCode]
    );

    if (!stockRow) {
      await conn.rollback();
      return fail(res, "존재하지 않는 종목입니다.", null, 404);
    }

    const stockName = stockRow.stock_name || stockCode;

    const [[ownedRow]] = await conn.query(
      `
      SELECT id, quantity, avg_price
      FROM owned_stocks
      WHERE member_id = ? AND stock_code = ?
      LIMIT 1
      FOR UPDATE
      `,
      [memberId, stockCode]
    );

    if (ownedRow) {
      const currentQty = Number(ownedRow.quantity || 0);
      const currentAvg = Number(ownedRow.avg_price || 0);
      const nextQty = currentQty + quantity;
      const nextAvg =
        nextQty > 0
          ? ((currentQty * currentAvg) + quantity * unitPrice) / nextQty
          : unitPrice;

      await conn.query(
        `
        UPDATE owned_stocks
        SET quantity = ?, avg_price = ?, updated_at = NOW()
        WHERE id = ?
        `,
        [nextQty, nextAvg, ownedRow.id]
      );
    } else {
      await conn.query(
        `
        INSERT INTO owned_stocks (member_id, stock_code, quantity, avg_price)
        VALUES (?, ?, ?, ?)
        `,
        [memberId, stockCode, quantity, unitPrice]
      );
    }

    await conn.query(
      `
      UPDATE members
      SET points = points - ?
      WHERE member_id = ?
      `,
      [totalCost, memberId]
    );

    await insertPointHistory(
      conn,
      memberId,
      -totalCost,
      `[매수] ${stockName} ${quantity}주`
    );

    await insertTradeHistory(
      conn,
      memberId,
      stockCode,
      stockName,
      "buy",
      quantity,
      unitPrice
    );

    await insertGameLogOnBuy(
      conn,
      memberId,
      stockCode,
      quantity,
      unitPrice
    );

    const [[updatedMember]] = await conn.query(
      `
      SELECT points
      FROM members
      WHERE member_id = ?
      LIMIT 1
      `,
      [memberId]
    );

    await conn.commit();

    let stockAchievementResult = { grantedCount: 0, grantedIds: [] };

    try {
      stockAchievementResult = await checkAndGrantStockAchievements(memberId, {
        tradeType: "buy",
        preTradePoints: currentPoints,
        totalCost,
      });

      await achievementService.checkAndGrantAchievements(memberId);
    } catch (achievementErr) {
      console.error("buyStock achievement error =", achievementErr);
    }

    return success(res, `${stockName} ${quantity}주 매수 완료`, {
      stockCode,
      stockName,
      quantity,
      unitPrice,
      totalCost,
      remainingPoints: Number(updatedMember?.points || 0),
      achievements: stockAchievementResult,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("buyStock error =", err);
    return fail(res, "매수 실패", err.message, 500);
  } finally {
    if (conn) conn.release();
  }
};

/* =========================
   8) 매도
========================= */
exports.sellStock = async (req, res) => {
  let conn = null;

  try {
    const memberId = extractMemberId(req);
    if (!memberId) return fail(res, "인증이 필요합니다.", null, 401);

    const stockCode = normalizeStockCode(req.params.stockCode);
    const quantity = Number(req.body?.quantity);
    const unitPrice = Number(req.body?.unitPrice);

    if (!stockCode) return fail(res, "종목 코드가 필요합니다.", null, 400);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return fail(res, "수량은 1 이상의 정수여야 합니다.", null, 400);
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return fail(res, "현재가 정보가 올바르지 않습니다.", null, 400);
    }

    conn = await db.promise().getConnection();
    await conn.beginTransaction();

    const [[memberRow]] = await conn.query(
      `
      SELECT member_id, points
      FROM members
      WHERE member_id = ?
      FOR UPDATE
      `,
      [memberId]
    );

    if (!memberRow) {
      await conn.rollback();
      return fail(res, "사용자 정보를 찾을 수 없습니다.", null, 404);
    }

    const [[stockRow]] = await conn.query(
      `
      SELECT stock_code, stock_name
      FROM stocks
      WHERE stock_code = ?
      LIMIT 1
      `,
      [stockCode]
    );

    if (!stockRow) {
      await conn.rollback();
      return fail(res, "존재하지 않는 종목입니다.", null, 404);
    }

    const stockName = stockRow.stock_name || stockCode;

    const [[ownedRow]] = await conn.query(
      `
      SELECT id, quantity, avg_price
      FROM owned_stocks
      WHERE member_id = ? AND stock_code = ?
      LIMIT 1
      FOR UPDATE
      `,
      [memberId, stockCode]
    );

    if (!ownedRow) {
      await conn.rollback();
      return fail(res, "보유 중인 종목이 아닙니다.", null, 400);
    }

    const currentQty = Number(ownedRow.quantity || 0);
    const avgPrice = Number(ownedRow.avg_price || 0);

    if (currentQty < quantity) {
      await conn.rollback();
      return fail(
        res,
        "보유 수량보다 많이 매도할 수 없습니다.",
        null,
        400
      );
    }

    const totalSale = Math.round(unitPrice * quantity);
    const remainQty = currentQty - quantity;

    if (remainQty === 0) {
      await conn.query(
        `
        DELETE FROM owned_stocks
        WHERE id = ?
        `,
        [ownedRow.id]
      );
    } else {
      await conn.query(
        `
        UPDATE owned_stocks
        SET quantity = ?, updated_at = NOW()
        WHERE id = ?
        `,
        [remainQty, ownedRow.id]
      );
    }

    await conn.query(
      `
      UPDATE members
      SET points = points + ?
      WHERE member_id = ?
      `,
      [totalSale, memberId]
    );

    await insertPointHistory(
      conn,
      memberId,
      totalSale,
      `[매도] ${stockName} ${quantity}주`
    );

    await insertTradeHistory(
      conn,
      memberId,
      stockCode,
      stockName,
      "sell",
      quantity,
      unitPrice
    );

    await settleGameLogOnSell(
      conn,
      memberId,
      stockCode,
      quantity,
      unitPrice,
      avgPrice
    );

    const [[updatedMember]] = await conn.query(
      `
      SELECT points
      FROM members
      WHERE member_id = ?
      LIMIT 1
      `,
      [memberId]
    );

    await conn.commit();

    let stockAchievementResult = { grantedCount: 0, grantedIds: [] };

    try {
      stockAchievementResult = await checkAndGrantStockAchievements(memberId, {
        tradeType: "sell",
      });

      await achievementService.checkAndGrantAchievements(memberId);
    } catch (achievementErr) {
      console.error("sellStock achievement error =", achievementErr);
    }

    return success(res, `${stockName} ${quantity}주 매도 완료`, {
      stockCode,
      stockName,
      quantity,
      unitPrice,
      totalSale,
      remainQty,
      remainingPoints: Number(updatedMember?.points || 0),
      achievements: stockAchievementResult,
    });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("sellStock error =", err);
    return fail(res, "매도 실패", err.message, 500);
  } finally {
    if (conn) conn.release();
  }
};