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

exports.checkAndGrantAchievements = async (memberId) => {
  const grantedIds = [];

  const [[memberRow]] = await db.promise().query(
    `
    SELECT points, isr_score
    FROM members
    WHERE member_id = ?
    LIMIT 1
    `,
    [memberId]
  );

  const points = Number(memberRow?.points || 0);
  const isr = Number(memberRow?.isr_score || 0);

  // 퀴즈 누적 통계
  const [[quizStats]] = await db.promise().query(
    `
    SELECT
      COUNT(*) AS total_quiz_count,
      COALESCE(SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct_quiz_count
    FROM member_quiz_history
    WHERE member_id = ?
    `,
    [memberId]
  );

  const totalQuizCount = Number(quizStats?.total_quiz_count || 0);
  const correctQuizCount = Number(quizStats?.correct_quiz_count || 0);
  const quizAccuracy =
    totalQuizCount > 0 ? (correctQuizCount / totalQuizCount) * 100 : 0;

  // 11. 첫걸음 - 퀴즈 1회 참여
  if (totalQuizCount >= 1) {
    const granted = await grantAchievementIfNotExists(memberId, 11);
    if (granted) grantedIds.push(11);
  }

  // 12. 차트 리더 - 퀴즈 누적 10회 정답 달성
  if (correctQuizCount >= 10) {
    const granted = await grantAchievementIfNotExists(memberId, 12);
    if (granted) grantedIds.push(12);
  }

  // 13. 금융 박사 - 퀴즈 누적 50회 정답 달성
  if (correctQuizCount >= 50) {
    const granted = await grantAchievementIfNotExists(memberId, 13);
    if (granted) grantedIds.push(13);
  }

  // 26. 퀴즈왕 - 퀴즈 100회 참여
  if (totalQuizCount >= 100) {
    const granted = await grantAchievementIfNotExists(memberId, 26);
    if (granted) grantedIds.push(26);
  }

  // 2. 퀴즈 정답률 업적 - 정답률 80% 이상
  // 너무 적은 표본에서 바로 열리지 않게 10회 이상 참여 조건 추가
  if (totalQuizCount >= 10 && quizAccuracy >= 80) {
    const granted = await grantAchievementIfNotExists(memberId, 2);
    if (granted) grantedIds.push(2);
  }

  // 23. 시드 머니 - 보유 포인트 50,000pt 달성
  if (points >= 50000) {
    const granted = await grantAchievementIfNotExists(memberId, 23);
    if (granted) grantedIds.push(23);
  }

  // 19. 리스크 매니저 - ISR 50점 달성
  if (isr >= 50) {
    const granted = await grantAchievementIfNotExists(memberId, 19);
    if (granted) grantedIds.push(19);
  }

  // 20. 포트폴리오 마스터 - ISR 80점 달성
  if (isr >= 80) {
    const granted = await grantAchievementIfNotExists(memberId, 20);
    if (granted) grantedIds.push(20);
  }
  // 10. 전설의 투자자 - ISR 90점 이상 달성
  if (isr >= 90) {
    const granted = await grantAchievementIfNotExists(memberId, 10);
    if (granted) grantedIds.push(10);
  }

  // 29. 리스크 지배자 - ISR 95점 달성
  if (isr >= 95) {
    const granted = await grantAchievementIfNotExists(memberId, 29);
    if (granted) grantedIds.push(29);
  }

  return {
    grantedCount: grantedIds.length,
    grantedIds,
  };
};

exports.grantAchievementIfNotExists = grantAchievementIfNotExists;