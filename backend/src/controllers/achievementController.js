const db = require("../../config/db");
const achievementService = require("../services/achievementService");

function success(res, message, data = null) {
  return res.json({ success: true, message, data });
}

function fail(res, message, error = null) {
  return res.status(500).json({ success: false, message, error });
}

/* 전체 업적 */
exports.getAllAchievements = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM achievements ORDER BY ach_id ASC`
    );
    return success(res, "전체 업적 조회", rows);
  } catch (err) {
    return fail(res, "실패", err.message);
  }
};

/* 업적 상세 */
exports.getAchievementById = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM achievements WHERE ach_id = ?`,
      [req.params.id]
    );
    return success(res, "조회 성공", rows[0]);
  } catch (err) {
    return fail(res, "실패", err.message);
  }
};

/* 내 업적 */
exports.getMyAchievements = async (req, res) => {
  try {
    const memberId = req.user.member_id;

    const [rows] = await db.promise().query(
      `
      SELECT
        a.*,
        ma.obtained_at,
        CASE
          WHEN ma.ach_id IS NOT NULL THEN 1
          ELSE 0
        END AS is_obtained
      FROM achievements a
      LEFT JOIN member_achievements ma
        ON a.ach_id = ma.ach_id
       AND ma.member_id = ?
      WHERE a.ach_id NOT IN (21, 22)
      ORDER BY a.ach_id ASC
      `,
      [memberId]
    );

    return success(res, "내 업적 조회", {
      achievements: rows,
      totalCount: rows.length,
      obtainedCount: rows.filter((row) => Number(row.is_obtained) === 1).length,
    });
  } catch (err) {
    return fail(res, "실패", err.message);
  }
};

/* 최근 업적 */
exports.getRecentAchievements = async (req, res) => {
  try {
    const memberId = req.user.member_id;

    const [rows] = await db.promise().query(
      `
      SELECT a.*, ma.obtained_at
      FROM member_achievements ma
      JOIN achievements a ON ma.ach_id = a.ach_id
      WHERE ma.member_id = ?
      ORDER BY ma.obtained_at DESC
      LIMIT 3
      `,
      [memberId]
    );

    return success(res, "최근 업적", rows);
  } catch (err) {
    return fail(res, "실패", err.message);
  }
};

/* 칭호 */
exports.getMyTitles = async (req, res) => {
  const data = await achievementService.getMyTitles(req.user.member_id);
  return success(res, "칭호", data);
};

exports.getEquippedTitle = async (req, res) => {
  const data = await achievementService.getEquippedTitle(req.user.member_id);
  return success(res, "장착 칭호", data);
};

exports.equipTitle = async (req, res) => {
  const data = await achievementService.equipTitle(
    req.user.member_id,
    req.body.ach_id
  );
  return success(res, "장착 완료", data);
};

exports.checkAchievements = async (req, res) => {
  const data = await achievementService.checkAndGrantAchievements(
    req.user.member_id
  );
  return success(res, "체크 완료", data);
};