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

exports.getLeaderboard = async (req, res) => {
  try {
    const memberId = Number(req.user?.member_id || 0);

    const [rows] = await db.promise().query(`
      SELECT
        ranked.member_id,
        ranked.nickname,
        ranked.profile_image,
        ranked.profile_image2,
        ranked.points,
        ranked.invested_asset,
        ranked.league_point,
        ROUND(
          PERCENT_RANK() OVER (ORDER BY ranked.league_point ASC) * 100,
          2
        ) AS ranking_point
      FROM (
        SELECT
          m.member_id,
          m.nickname,
          m.profile_image,
          m.profile_image2,
          m.points,
          COALESCE(SUM(os.quantity * os.avg_price), 0) AS invested_asset,
          (
            m.points + COALESCE(SUM(os.quantity * os.avg_price), 0)
          ) AS league_point
        FROM members m
        LEFT JOIN owned_stocks os
          ON m.member_id = os.member_id
        GROUP BY
          m.member_id,
          m.nickname,
          m.profile_image,
          m.profile_image2,
          m.points
      ) ranked
      ORDER BY ranked.league_point DESC, ranked.member_id ASC
    `);

    const maxPoints =
      rows.length > 0 ? Number(rows[0].league_point || 0) : 0;

    const rankedRows = rows.map((row, index) => {
      const rankingPoint = Number(row.ranking_point || 0);
      const tier = getTierKeyByRankingPoint(rankingPoint);

      return {
        memberId: row.member_id,
        nickname: row.nickname,
        profileImage: row.profile_image || null,
        profileImage2: row.profile_image2 || null,

        points: Number(row.points || 0),
        investedAsset: Number(row.invested_asset || 0),
        leaguePoint: Number(row.league_point || 0),

        rankingPoint,
        tier,
        overallRank: index + 1,
      };
    });

    const currentUserRow = rankedRows.find(
      (row) => Number(row.memberId) === memberId
    );

    if (memberId && currentUserRow?.overallRank === 1) {
      await achievementService.grantAchievementIfNotExists(memberId, 30);
    }

    const leagues = {
      bronze: [],
      silver: [],
      gold: [],
      diamond: [],
    };

    rankedRows.forEach((row) => {
      leagues[row.tier].push(row);
    });

    Object.keys(leagues).forEach((tierKey) => {
      leagues[tierKey] = leagues[tierKey].map((row, index) => ({
        ...row,
        leagueRank: index + 1,
      }));
    });

    return success(res, "랭킹 조회 성공", {
      seasonName: "포인트 랭킹",
      currentUserId: memberId || null,
      maxPoints,
      leagues,
    });
  } catch (err) {
    console.error("getLeaderboard error =", err);
    return fail(res, "랭킹 조회 실패", err.message, 500);
  }
};