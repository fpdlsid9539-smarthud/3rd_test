const express = require("express");
const router = express.Router();
const educationData = require("../data/educationData");

// 1) 학습 목록 조회
// GET /education
// GET /education?category=주식기초
router.get("/", (req, res) => {
  try {
    const { category } = req.query;

    let result = educationData;

    if (category) {
      result = educationData.filter((item) => item.category === category);
    }

    res.json({
      message: "학습 콘텐츠 조회 성공",
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      message: "학습 콘텐츠 조회 실패",
      error: err.message,
    });
  }
});

// 2) 학습 상세 조회
// GET /education/1
router.get("/:edu_id", (req, res) => {
  try {
    const { edu_id } = req.params;

    const item = educationData.find(
      (data) => Number(data.edu_id) === Number(edu_id)
    );

    if (!item) {
      return res.status(404).json({
        message: "해당 학습 콘텐츠를 찾을 수 없습니다.",
      });
    }

    res.json({
      message: "학습 콘텐츠 상세 조회 성공",
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      message: "학습 콘텐츠 상세 조회 실패",
      error: err.message,
    });
  }
});

module.exports = router;