const db = require('../../config/db')
const isrEngine = require('../engines/isrEngine')

// GET USER ISR
exports.getISR = async (req, res) => {

  try {

    const userId = req.user.id

    const [rows] = await db.query(
      `SELECT *
       FROM irs_score
       WHERE member_id = ?`,
      [userId]
    )

    if (rows.length === 0) {
      return res.status(404).json({
        message: "ISR 확인 안됨"
      })
    }

    res.json(rows[0])

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: "ISR 점수 불러오기 실패하였습니다"
    })

  }

}