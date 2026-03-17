exports.calculateISR = async (req, res) => {

  try {

    const memberId = req.user.member_id;

    // 1️⃣ get trades
    const [trades] = await db.query(
      `SELECT * FROM gameLog WHERE member_id = ?`,
      [memberId]
    )

    // 2️⃣ get portfolio history
    const [portfolioHistory] = await db.query(
      `SELECT value
       FROM point_history
       WHERE member_id = ?
       ORDER BY date`,
      [memberId]
    )

    const portfolioValues =
      portfolioHistory.map(p => p.value)

    // mock returns
    const returns = portfolioValues.map((v, i, arr) => i === 0 ? 0 : (v - arr[i - 1]) / arr[i - 1])

    // 3️⃣ calculate metrics

    const accuracy = isrEngine.calculateAccuracy(trades);

    const stability = isrEngine.calculateStability(returns);

    const discipline = isrEngine.calculateDiscipline(trades);

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
    };

    // 4️⃣ calculate final score

    const isrScore =
      isrEngine.calculateISR(metrics);

    // 5️⃣ save to DB

    await db.query(
      `INSERT INTO isr_Chart
       (member_id, isr_accuracy, isr_risk, isr_strategy, isr_stability, isr_discipline, isr_adaptability, isr_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memberId,
        isr_accuracy,
        isr_risk,
        isr_strategy,
        isr_stability,
        isr_discipline,
        isr_adaptability,
        isr_score
      ]
    );

    await db.query(
      `UPDATE members
       SET isr_score = ?
       WHERE member_id = ?`,
      [isr_score, memberId]
    );

    res.json({
      metrics,
      isrScore
    });

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "ISR 점수 계산 실패"
    });

  };

}