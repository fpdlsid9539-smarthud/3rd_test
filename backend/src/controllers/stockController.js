const db = require("../../config/db");
const axios = require("axios");

let yfInstance = null;
async function getYahooFinance() {
  if (yfInstance) return yfInstance;
  const mod = await import('yahoo-finance2');
  const YahooFinance = mod.default || mod;
  yfInstance = new YahooFinance(); 
  return yfInstance;
}

function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({ success: false, message, error });
}

function extractMemberId(req) {
  if (!req.user || typeof req.user !== "object") return null;
  return req.user.member_id || req.user.id || req.user.memberId || req.user.userId || null;
}

function normalizeStockCode(value) {
  return String(value || "").padStart(6, "0");
}

const KOR_NAME_MAP = {
  '005930': '삼성전자', '000660': 'SK하이닉스', '373220': 'LG에너지솔루션', '207940': '삼성바이오로직스', '005380': '현대차',
  '000270': '기아', '068270': '셀트리온', '005490': 'POSCO홀딩스', '035420': 'NAVER', '003670': '포스코퓨처엠',
  '051910': 'LG화학', '012330': '현대모비스', '028260': '삼성물산', '035720': '카카오', '105560': 'KB금융',
  '055550': '신한지주', '066570': 'LG전자', '032830': '삼성생명', '096770': 'SK이노베이션', '034730': 'SK',
  '015760': '한국전력', '033780': 'KT&G', '009150': '삼성전기', '017670': 'SK텔레콤', '011200': 'HMM',
  '018260': '삼성SDS', '316140': '우리금융지주', '010130': '고려아연', '042700': '한미반도체', '003550': 'LG',
  '086520': '에코프로', '000810': '삼성화재', '010950': 'S-Oil', '051900': 'LG생활건강', '323410': '카카오뱅크',
  '329180': 'HD현대중공업', '011170': '롯데케미칼', '161390': '한국타이어앤테크놀로지', '011070': 'LG이노텍', '004020': '현대제철',
  '047050': '포스코인터내셔널', '005830': 'DB손해보험', '090430': '아모레퍼시픽', '241560': '두산밥캣', '024110': '기업은행',
  '008770': '호텔신라', '001450': '현대해상', '029780': '삼성카드', '000100': '유한양행', '001440': '대한전선',
  '006400': '삼성SDI', '247540': '에코프로비엠', '028300': 'HLB', '066970': '엘앤에프', '352820': '하이브',
  '036570': '엔씨소프트', '259960': '크래프톤', '012450': '한화에어로스페이스', '042660': '한화오션', '010140': '삼성중공업',
  '009830': '한화솔루션', '000880': '한화', '028050': '팬오션', '078930': 'GS', '377300': '카카오페이',
  '322310': '현대오토에버', '047810': '한국항공우주', '272210': '한화시스템', '003490': '대한항공', '000120': 'CJ대한통운',
  '097950': 'CJ제일제당', '001040': 'CJ', '004990': '롯데지주', '023530': '롯데쇼핑', '007070': 'GS리테일',
  '139480': '이마트', '006800': '미래에셋증권', '039490': '키움증권', '016360': '삼성증권', '005940': 'NH투자증권',
  '031430': '신세계', '145020': '휴젤', '214150': '클래시스', '196170': '알테오젠', '035900': 'JYP Ent.',
  '041510': '에스엠', '122870': '와이지엔터테인먼트', '293490': '카카오게임즈', '263750': '펄어비스', '112040': '위메이드',
  '008930': '한미사이언스', '128940': '한미약품', '002380': 'KCC', '011790': 'SKC', '014680': '한솔케미칼',
  '298380': '에코프로머티', '020150': '일진머티리얼즈', '000080': '하이트진로', '030200': 'KT', '032640': 'LG유플러스'
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
        const code = normalizeStockCode(row.stock_code || row["단축코드"] || Object.values(row)[0] || "");
        const name = String(row.stock_name || row["한글 종목명"] || Object.values(row)[1] || "");

        if ((name.includes(keyword) || code.includes(keyword)) && !seenCodes.has(code)) {
          seenCodes.add(code);
          uniqueRows.push({ code, name });
        }
      }

      const results = [];
      for (const item of uniqueRows.slice(0, 5)) {
        try {
          let quote = await yahooFinance.quote(`${item.code}.KS`).catch(() => null);
          if (!quote) quote = await yahooFinance.quote(`${item.code}.KQ`).catch(() => null);

          results.push({
            symbol: item.code,
            name: item.name,
            price: Number(quote?.regularMarketPrice || 0),
            change: Number(quote?.regularMarketChange || 0),
            rate: Number(quote?.regularMarketChangePercent || 0),
          });
        } catch (e) {
          results.push({ symbol: item.code, name: item.name, price: 0, change: 0, rate: 0 });
        }
      }
      return success(res, "검색 성공", results);
    }

    let realResults = [];

    if (cachedStocks && Date.now() - lastFetchTime < CACHE_TTL) {
      realResults = [...cachedStocks]; 
    } else {
      const querySymbols = TOP_100_STOCKS.map(code => `${code}.KS`);
      const chunkPromises = querySymbols.map(sym => yahooFinance.quote(sym).catch(() => null));
      const quotes = await Promise.all(chunkPromises);

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
          volume: Number(q.regularMarketVolume || 0)
        });
      });

      cachedStocks = [...realResults];
      lastFetchTime = Date.now();
    }

    let filteredResults = [...realResults];

    if (type === 'popular') {
      filteredResults.sort((a, b) => b.volume - a.volume);
    } else if (type === 'rising') {
      filteredResults = filteredResults.filter(item => item.rate > 0);
      filteredResults.sort((a, b) => b.rate - a.rate);
    } else if (type === 'falling') {
      filteredResults = filteredResults.filter(item => item.rate < 0);
      filteredResults.sort((a, b) => a.rate - b.rate);
    }

    return success(res, `${type} 실시간 조회 성공`, filteredResults.slice(0, 20));

  } catch (err) {
    return fail(res, "조회 실패", err.message, 500);
  }
};

/* =========================
   2) 캔들 차트 조회 
========================= */
exports.getStockChart = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = "6mo", interval = "1d" } = req.query;
    const cleanCode = normalizeStockCode(symbol);
    const yahooFinance = await getYahooFinance();

    const now = new Date();
    let period1 = new Date();
    
    if (range === '6mo') period1.setMonth(now.getMonth() - 6);
    else if (range === '2y') period1.setFullYear(now.getFullYear() - 2);
    else if (range === '5y') period1.setFullYear(now.getFullYear() - 5);
    else if (range === '10y') period1.setFullYear(now.getFullYear() - 10);
    else period1.setFullYear(now.getFullYear() - 1);

    const queryOptions = { period1: period1, interval: interval };

    let result = await yahooFinance.chart(`${cleanCode}.KS`, queryOptions).catch(() => null);
    if (!result) {
      result = await yahooFinance.chart(`${cleanCode}.KQ`, queryOptions).catch(() => null);
    }

    if (result && result.quotes && result.quotes.length > 0) {
      const prices = result.quotes
        .filter((q) => q.open != null && q.high != null && q.low != null && q.close != null)
        .map((item) => ({
          x: new Date(item.date).getTime(),
          o: item.open,
          h: item.high,
          l: item.low,
          c: item.close,
          v: item.volume
        }));
      
      prices.sort((a, b) => a.x - b.x); 
      return success(res, "차트 성공", prices);
    }

    return success(res, "차트 데이터 없음", []);
  } catch (err) {
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
    const yahooFinance = await getYahooFinance();

    const quote = await yahooFinance.quote(`${cleanCode}.KS`).catch(() => yahooFinance.quote(`${cleanCode}.KQ`));

    if (!quote) return fail(res, "해당 종목을 찾을 수 없습니다.", null, 404);

    return success(res, "현재가 조회 성공", {
      symbol: cleanCode,
      price: Number(quote.regularMarketPrice || 0),
      change: Number(quote.regularMarketChange || 0),
      rate: Number(quote.regularMarketChangePercent || 0),
    });
  } catch (err) {
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
    const yahooFinance = await getYahooFinance();

    const [rows] = await db.promise().query(
      `SELECT l.id, l.member_id, l.stock_code, l.created_at, s.stock_name
       FROM liked_stocks l INNER JOIN stocks s ON l.stock_code = s.stock_code
       WHERE l.member_id = ? ORDER BY l.created_at DESC, l.id DESC`, [memberId]
    );

    const result = await Promise.all(
      rows.map(async (row) => {
        let quote = await yahooFinance.quote(`${normalizeStockCode(row.stock_code)}.KS`).catch(() => null);
        if (!quote) quote = await yahooFinance.quote(`${normalizeStockCode(row.stock_code)}.KQ`).catch(() => null);

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
    const yahooFinance = await getYahooFinance();

    const [rows] = await db.promise().query(
      `SELECT o.id, o.member_id, o.stock_code, o.quantity, o.avg_price, o.created_at, o.updated_at, s.stock_name
       FROM owned_stocks o INNER JOIN stocks s ON o.stock_code = s.stock_code
       WHERE o.member_id = ? ORDER BY o.created_at DESC, o.id DESC`, [memberId]
    );

    const result = await Promise.all(
      rows.map(async (row) => {
        let quote = await yahooFinance.quote(`${normalizeStockCode(row.stock_code)}.KS`).catch(() => null);
        if (!quote) quote = await yahooFinance.quote(`${normalizeStockCode(row.stock_code)}.KQ`).catch(() => null);

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
          totalPrice: price * quantity,
          changeAmount: (price - avgPrice) * quantity,
          changeRate,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      })
    );
    return success(res, "보유 주식 조회 성공", result);
  } catch (err) {
    return fail(res, "보유 주식 조회 실패", err.message, 500);
  }
};