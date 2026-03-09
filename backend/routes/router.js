console.log("ROUTER LOADED ✅", new Date().toISOString());
const express = require("express");
const router = express.Router();
const db = require("../config/db.js");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey']
});

router.get("/", (req,res)=>{
  res.send("접속완료")
})

router.get("/members", async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM members"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({
      message: "DB error",
      error: err.message
    });
  }
});

router.get("/ping", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT 1 AS ok");
    res.json(rows[0]); // { ok: 1 }
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err.message });
  }
});



module.exports = router;