const db = require("../../config/db");

function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({ success: false, message, error });
}

exports.getAllAchievements = async (req, res) => {
  try {
    const { item_type, category } = req.query;
    let sql = `SELECT ach_id, item_type, category, name, description, reward_point FROM achievements`;
    const params = [];
    const conditions = [];

    if (item_type) {
      conditions.push("item_type = ?");
      params.push(item_type);
    }
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }
    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY ach_id ASC";

    const [rows] = await db.promise().query(sql, params);
    return success(res, "업적/칭호 조회 성공", rows);
  } catch (err) {
    console.error("업적/칭호 조회 오류:", err);
    return fail(res, "업적/칭호 조회 실패", err.message);
  }
};

exports.getAchievementById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT ach_id, item_type, category, name, description, reward_point FROM achievements WHERE ach_id = ?`;

    const [rows] = await db.promise().query(sql, [id]);

    if (rows.length === 0) {
      return fail(res, "해당 업적/칭호를 찾을 수 없습니다.", null, 404);
    }

    return success(res, "업적/칭호 상세 조회 성공", rows[0]);
  } catch (err) {
    console.error("업적/칭호 상세 조회 오류:", err);
    return fail(res, "업적/칭호 상세 조회 실패", err.message);
  }
};

exports.getMyAchievements = async (req, res) => {
  try {
    return success(res, "내 업적 조회 성공", {
      member_id: req.user.member_id,
      achievements: [],
    });
  } catch (err) {
    return fail(res, "내 업적 조회 실패", err.message);
  }
};