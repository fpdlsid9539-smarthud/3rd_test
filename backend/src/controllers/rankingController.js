const db = require("../../config/db");
const { getTierKeyByRankingPoint } = require("../utils/tier");
const achievementService = require("../services/achievementService");

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

let yfInstance = null;

async function getYahooFinance() {
  if (yfInstance) return yfInstance;
  const mod = await import("yahoo-finance2");
  const YahooFinance = mod.default || mod;
  yfInstance = new YahooFinance();
  return yfInstance;
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

exports.getLeaderboard = async (req, res) => {
  try {
    const memberId = Number(req.user?.member_id || 0);

    // 1. 모든 유저 가져오기
    const [members] = await db.promise().query(`
      SELECT
        member_id,
        nickname,
        profile_image,
        profile_image2,
        points
      FROM members
    `);

    // 2. 각 유저별 자산 계산
    const rankedRows = await Promise.all(
      members.map(async (member) => {
        const [stocks] = await db.promise().query(
          `
          SELECT stock_code, quantity, avg_price
          FROM owned_stocks
          WHERE member_id = ?
          `,
          [member.member_id]
        );

        let totalStockValue = 0;

        for (const stock of stocks) {
          const quote = await getQuoteByCode(stock.stock_code).catch(() => null);
          const price = Number(quote?.regularMarketPrice || 0);
          const quantity = Number(stock.quantity || 0);

          totalStockValue += price * quantity;
        }

        const leaguePoint = Number(member.points || 0) + totalStockValue;

        return {
          memberId: member.member_id,
          nickname: member.nickname,
          profileImage: member.profile_image || null,
          profileImage2: member.profile_image2 || null,
          points: Number(member.points || 0),
          leaguePoint,
        };
      })
    );

    // 3. 정렬
    rankedRows.sort((a, b) => b.leaguePoint - a.leaguePoint);

    // 4. 랭킹 / 티어 계산
    const maxPoints = rankedRows.length > 0 ? rankedRows[0].leaguePoint : 0;

    const totalCount = rankedRows.length;

    const finalRows = rankedRows.map((row, index) => {
      const rankingPoint =
        totalCount > 1
          ? ((totalCount - 1 - index) / (totalCount - 1)) * 100
          : 100;

      const tier = getTierKeyByRankingPoint(rankingPoint);

      return {
        ...row,
        rankingPoint: Number(rankingPoint.toFixed(2)),
        tier,
        overallRank: index + 1,
      };
    });

    const leagues = {
      bronze: [],
      silver: [],
      gold: [],
      diamond: [],
    };

    finalRows.forEach((row) => {
      leagues[row.tier].push(row);
    });

    Object.keys(leagues).forEach((tierKey) => {
      leagues[tierKey] = leagues[tierKey].map((row, index) => ({
        ...row,
        leagueRank: index + 1,
      }));
    });

    return success(res, "랭킹 조회 성공", {
      seasonName: "자산 랭킹",
      currentUserId: memberId || null,
      maxPoints,
      leagues,
    });

  } catch (err) {
    console.error("getLeaderboard error =", err);
    return fail(res, "랭킹 조회 실패", err.message, 500);
  }
};