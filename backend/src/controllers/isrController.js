const db = require('../../config/db')

exports.calculateISR = async (req, res) => {

  try {

    const memberId = req.user.member_id

    // 1️⃣ 게임 로그 조회
    const [logs] = await db.query(
      `SELECT * FROM gameLog WHERE member_id = ?`,
      [memberId]
    )

    if (logs.length === 0) {
      return res.json({ message: "No gameplay data yet." })
    }

    // -------------------------
    // Accuracy (퀴즈/예측 정확도)
    // -------------------------

    const successCount =
      logs.filter(l => l.status === "SUCCESS").length

    const accuracy =
      (successCount / logs.length) * 100


    // -------------------------
    // Risk Management
    // -------------------------

    const penalties =
      logs.reduce((sum, l) =>
        sum + Number(l.penalty_amount || 0), 0)

    const totalBet =
      logs.reduce((sum, l) =>
        sum + Number(l.bet_amount), 0)

    let risk = 100

    if (totalBet > 0)
      risk = Math.max(0, 100 - (penalties / totalBet) * 100)


    // -------------------------
    // Strategy Consistency
    // -------------------------

    const betAmounts =
      logs.map(l => Number(l.bet_amount))

    const avgBet =
      betAmounts.reduce((a, b) => a + b, 0) / betAmounts.length

    const variance =
      betAmounts.reduce(
        (sum, b) => sum + Math.pow(b - avgBet, 2),
        0
      ) / betAmounts.length

    const strategy =
      Math.max(0, 100 - Math.sqrt(variance) / 100)


    // -------------------------
    // Stability
    // -------------------------

    const pnlList =
      logs.map(l => Number(l.pnl_amount || 0))

    const avgPnl =
      pnlList.reduce((a, b) => a + b, 0) / pnlList.length

    const pnlVariance =
      pnlList.reduce(
        (sum, b) => sum + Math.pow(b - avgPnl, 2),
        0
      ) / pnlList.length

    const stability =
      Math.max(0, 100 - Math.sqrt(pnlVariance) / 100)


    // -------------------------
    // Discipline
    // -------------------------

    const pending =
      logs.filter(l => l.status === "PENDING").length

    const discipline =
      Math.max(0, 100 - (pending / logs.length) * 100)


    // -------------------------
    // Adaptability
    // -------------------------

    const upWins =
      logs.filter(l =>
        l.prediction === "UP" && l.status === "SUCCESS"
      ).length

    const downWins =
      logs.filter(l =>
        l.prediction === "DOWN" && l.status === "SUCCESS"
      ).length

    const adaptability =
      Math.min(100, (Math.min(upWins, downWins) /
        Math.max(upWins, downWins || 1)) * 100)


    // -------------------------
    // Final ISR Score
    // -------------------------

    const isrScore =
      accuracy * 0.30 +
      risk * 0.25 +
      strategy * 0.15 +
      stability * 0.20 +
      discipline * 0.05 +
      adaptability * 0.05


    // -------------------------
    // Save ISR Chart
    // -------------------------

    await db.query(

      `INSERT INTO isr_chart
      (member_id,
       isr_accuracy,
       isr_risk,
       isr_strategy,
       isr_stability,
       isr_discipline,
       isr_adaptability,
       isr_score)

      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,

      [
        memberId,
        accuracy,
        risk,
        strategy,
        stability,
        discipline,
        adaptability,
        isrScore
      ]
    )


    // -------------------------
    // Update Member ISR
    // -------------------------

    await db.query(

      `UPDATE members
       SET isr_score = ?
       WHERE member_id = ?`,

      [isrScore, memberId]

    )

    res.json({
      isr_score: isrScore,
      accuracy,
      risk,
      strategy,
      stability,
      discipline,
      adaptability
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "ISR calculation failed"
    })

  }

}