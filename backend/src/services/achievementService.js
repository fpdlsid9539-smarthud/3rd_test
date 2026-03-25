const db = require("../../config/db");

/* 공통: 업적 중복 없이 지급 */
async function grantAchievementIfNotExists(memberId, achId) {
  const [rows] = await db.promise().query(
    `
    SELECT ach_id
    FROM member_achievements
    WHERE member_id = ?
      AND ach_id = ?
    LIMIT 1
    `,
    [memberId, achId]
  );

  if (rows.length > 0) {
    return false;
  }

  await db.promise().query(
    `
    INSERT INTO member_achievements (member_id, ach_id, is_equipped, obtained_at)
    VALUES (?, ?, 0, NOW())
    `,
    [memberId, achId]
  );

  return true;
}

/* 회원가입 시 1번 업적 지급 + 기본 장착 */
exports.grantSignupTitle = async (memberId) => {
  await grantAchievementIfNotExists(memberId, 1);

  await db.promise().query(
    `
    UPDATE members
    SET equipped_title_ach_id = 1
    WHERE member_id = ?
      AND (equipped_title_ach_id IS NULL OR equipped_title_ach_id = 0)
    `,
    [memberId]
  );

  const [rows] = await db.promise().query(
    `
    SELECT ach_id, item_type, category, name, description, reward_point
    FROM achievements
    WHERE ach_id = 1
    LIMIT 1
    `
  );

  return rows[0] || null;
};

/* 내 칭호 목록
   - 1~10 업적 중 내가 달성한 것만
*/
exports.getMyTitles = async (memberId) => {
  const [rows] = await db.promise().query(
    `
    SELECT
      a.ach_id,
      a.item_type,
      a.category,
      a.name,
      a.description,
      a.reward_point,
      ma.obtained_at,
      CASE
        WHEN m.equipped_title_ach_id = a.ach_id THEN 1
        ELSE 0
      END AS is_equipped
    FROM member_achievements ma
    INNER JOIN achievements a
      ON ma.ach_id = a.ach_id
    INNER JOIN members m
      ON m.member_id = ma.member_id
    WHERE ma.member_id = ?
      AND a.ach_id BETWEEN 1 AND 10
    ORDER BY
      CASE WHEN m.equipped_title_ach_id = a.ach_id THEN 0 ELSE 1 END,
      a.ach_id ASC
    `,
    [memberId]
  );

  return rows;
};

/* 현재 장착 칭호 */
exports.getEquippedTitle = async (memberId) => {
  const [rows] = await db.promise().query(
    `
    SELECT
      a.ach_id,
      a.item_type,
      a.category,
      a.name,
      a.description,
      a.reward_point
    FROM members m
    LEFT JOIN achievements a
      ON m.equipped_title_ach_id = a.ach_id
    WHERE m.member_id = ?
      AND (a.ach_id BETWEEN 1 AND 10 OR a.ach_id IS NULL)
    LIMIT 1
    `,
    [memberId]
  );

  return rows[0] || null;
};

/* 칭호 장착 */
exports.equipTitle = async (memberId, achId) => {
  const titleId = Number(achId);

  if (!titleId || titleId < 1 || titleId > 10) {
    throw new Error("유효한 칭호 ID가 아닙니다.");
  }

  const [ownedRows] = await db.promise().query(
    `
    SELECT ach_id
    FROM member_achievements
    WHERE member_id = ?
      AND ach_id = ?
    LIMIT 1
    `,
    [memberId, titleId]
  );

  if (ownedRows.length === 0) {
    throw new Error("달성하지 않은 칭호는 장착할 수 없습니다.");
  }

  await db.promise().query(
    `
    UPDATE members
    SET equipped_title_ach_id = ?
    WHERE member_id = ?
    `,
    [titleId, memberId]
  );

  return this.getEquippedTitle(memberId);
};

/* 업적 점검
   - 추후 퀴즈 로직 연결 예정
*/
exports.checkAndGrantAchievements = async () => {
  return {
    grantedCount: 0,
    grantedIds: [],
    grantedAchievements: [],
  };
};