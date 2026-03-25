const express = require('express')
const router = express.Router()
const db = require('../../config/db')
const authMiddleware = require('../../middlewares/authMiddleware')
const adminMiddleware = require('../../middlewares/adminMiddleware')

/* FAQ 기본 리스트 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM faq WHERE is_visible = 1 ORDER BY sort_order ASC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false })
  }
})

/* 질문 목록 */
router.get('/questions', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM faq_questions WHERE is_deleted = 0 ORDER BY question_id DESC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false })
  }
})

/* 질문 등록 */
router.post('/questions', async (req, res) => {
  try {
    const { title, content, nickname, is_anonymous } = req.body

    await db.promise().query(
      `INSERT INTO faq_questions (title, content, nickname, is_anonymous)
       VALUES (?, ?, ?, ?)`,
      [
        title,
        content,
        is_anonymous ? null : nickname,
        is_anonymous ? 1 : 0,
      ]
    )

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false })
  }
})

/* 관리자 답변 */
router.patch(
  '/questions/:id/answer',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params
      const { answer } = req.body

      await db.promise().query(
        `UPDATE faq_questions 
         SET admin_answer = ?, status = 'answered'
         WHERE question_id = ?`,
        [answer, id]
      )

      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ success: false })
    }
  }
)

/* 관리자 삭제 */
router.delete(
  '/questions/:id',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params

      await db.promise().query(
        `UPDATE faq_questions SET is_deleted = 1 WHERE question_id = ?`,
        [id]
      )

      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ success: false })
    }
  }
)

module.exports = router