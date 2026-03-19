const db = require("../../config/db");
const { getTierKeyByRankingPoint } = require("../utils/tier");

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

function calcRankingPoint(points, maxPoints) {
  const myPoints = Number(points || 0);
  const highest = Number(maxPoints || 0);

  if (highest <= 0) return 0;

  return Number(((myPoints / highest) * 100).toFixed(1));
}

exports.getLeaderboard = async (req, res) => {
  try {
    const memberId = Number(req.user?.member_id || 0);

    const [maxRows] = await db.promise().query(`
      SELECT MAX(points) AS max_points
      FROM members
    `);

    const maxPoints = Number(maxRows[0]?.max_points || 0);

    const [rows] = await db.promise().query(
      `
      SELECT
        member_id,
        nickname,
        profile_image,
        points
      FROM members
      ORDER BY points DESC, member_id ASC
      `
    );

    const rankedRows = rows.map((row, index) => {
      const rankingPoint = calcRankingPoint(row.points, maxPoints);
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