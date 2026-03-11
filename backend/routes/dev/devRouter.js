const express = require("express");
const router = express.Router();

const members = require("../../data/memberData");
const devRankData = require("../../data/devRankData");

// 회원 목데이터 조회
router.get("/member", (req, res) => {
  try {
    res.json({
      message: "회원 목데이터 조회 성공",
      data: members,
    });
  } catch (err) {
    res.status(500).json({
      message: "회원 목데이터 조회 실패",
      error: err.message,
    });
  }
});

// 랭킹 목데이터 조회
router.get("/rank", (req, res) => {
  try {
    const rankData = devRankData.map((rank) => {
      const member = members.find((m) => m.member_id === rank.member_id);

      return {
        season_name: rank.season_name,
        member_id: rank.member_id,
        nickname: member ? member.nickname : null,
        score: rank.score,
        rank_num: rank.rank_num,
      };
    });

    res.json({
      message: "랭킹 목데이터 조회 성공",
      data: rankData,
    });
  } catch (err) {
    res.status(500).json({
      message: "랭킹 목데이터 조회 실패",
      error: err.message,
    });
  }
});

module.exports = router;