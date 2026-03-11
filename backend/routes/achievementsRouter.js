const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 1) 전체 업적/칭호 조회
router.get("/", async (req, res) => {
  try {
    const { item_type, category } = req.query;

    let sql = `
      SELECT
        ach_id,
        item_type,
        category,
        name,
        description,
        reward_point
      FROM achievements
    `;
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

    res.json({
      message: "업적/칭호 조회 성공",
      data: rows,
    });
  } catch (err) {
    console.error("업적/칭호 조회 오류:", err);
    res.status(500).json({
      message: "업적/칭호 조회 실패",
      error: err.message,
    });
  }
});

// 2) 특정 업적/칭호 1개 조회
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        ach_id,
        item_type,
        category,
        name,
        description,
        reward_point
      FROM achievements
      WHERE ach_id = ?
    `;

    const [rows] = await db.promise().query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "해당 업적/칭호를 찾을 수 없습니다.",
      });
    }

    res.json({
      message: "업적/칭호 상세 조회 성공",
      data: rows[0],
    });
  } catch (err) {
    console.error("업적/칭호 상세 조회 오류:", err);
    res.status(500).json({
      message: "업적/칭호 상세 조회 실패",
      error: err.message,
    });
  }
});

module.exports = router;