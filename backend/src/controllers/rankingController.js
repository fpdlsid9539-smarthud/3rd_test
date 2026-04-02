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

    // PERCENT_RANK() returns 0.0–1.0 representing the fraction of players
    // scoring strictly below each member. Multiply by 100 for a 0–100 percentile.
    // This guarantees every tier has players as long as scores vary.
    const [rows] = await db.promise().query(`
      SELECT
        member_id,
        nickname,
        profile_image,
        points,
        ROUND(
          PERCENT_RANK() OVER (ORDER BY points ASC) * 100,
          2
        ) AS ranking_point
      FROM members
      ORDER BY points DESC, member_id ASC
    `);

    const maxPoints = rows.length > 0 ? Number(rows[0].points || 0) : 0;

    const rankedRows = rows.map((row, index) => {
      const rankingPoint = Number(row.ranking_point || 0);
      const tier = getTierKeyByRankingPoint(rankingPoint);

      return {
        memberId: row.member_id,
        nickname: row.nickname,
        profileImage: row.profile_image || null,
        points: Number(row.points || 0),
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