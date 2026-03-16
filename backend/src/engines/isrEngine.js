exports.calculateISR = async (req, res) => {

  try {

    const userId = req.user.id

    // 1️⃣ get trades
    const [trades] = await db.query(
      `SELECT * FROM trades WHERE user_id = ?`,
      [userId]
    )

    // 2️⃣ get portfolio history
    const [portfolioHistory] = await db.query(
      `SELECT value
       FROM point_history
       WHERE user_id = ?
       ORDER BY date`,
      [userId]
    )

    const portfolioValues =
      portfolioHistory.map(p => p.value)

    // mock returns
    const returns =
      portfolioValues.map((v,i,arr) =>
        i === 0 ? 0 : (v - arr[i-1]) / arr[i-1]
      )

    // 3️⃣ calculate metrics

    const accuracy =
      isrEngine.calculateAccuracy(trades)

    const stability =
      isrEngine.calculateStability(returns)

    const discipline =
      isrEngine.calculateDiscipline(trades)

    // placeholders until engines added
    const risk = 70
    const strategy = 60
    const adaptability = 65

    const metrics = {
      accuracy,
      risk,
      strategy,
      stability,
      discipline,
      adaptability
    }

    // 4️⃣ calculate final score

    const isrScore =
      isrEngine.calculateISR(metrics)

    // 5️⃣ save to DB

    await db.query(
      `REPLACE INTO isr_score
       (user_id, accuracy, risk, strategy, stability, discipline, adaptability, isr_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        accuracy,
        risk,
        strategy,
        stability,
        discipline,
        adaptability,
        isrScore
      ]
    )

    res.json({
      metrics,
      isrScore
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "ISR 점수 계산 실패"
    })

  }

}