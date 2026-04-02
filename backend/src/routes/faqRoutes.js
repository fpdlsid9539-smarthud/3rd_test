const express = require('express')
const router = express.Router()
const db = require('../../config/db')
const jwt = require('jsonwebtoken')

function getDecodedToken(req) {
  try {
    const authHeader = req.headers.authorization || ''
    if (!authHeader.startsWith('Bearer ')) return null

    const token = authHeader.split(' ')[1]
    if (!process.env.JWT_SECRET) return null

    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

function getMemberIdFromHeader(req) {
  const decoded = getDecodedToken(req)
  return decoded?.member_id || decoded?.memberId || decoded?.id || null
}

/* FAQ 기본 리스트 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM faq WHERE is_visible = 1 ORDER BY sort_order ASC`
    )
    res.json({ success: true, data: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'FAQ 조회 실패' })
  }
})

/* 질문 목록
   ✅ 일반 유저 댓글이 1개 이상 있으면 is_answered = true
*/
router.get('/questions', async (req, res) => {
  try {
    const currentMemberId = getMemberIdFromHeader(req)

    const [rows] = await db.promise().query(`
      SELECT
        fq.question_id,
        fq.member_id,
        fq.title,
        fq.content,
        fq.category,
        fq.is_anonymous,
        fq.nickname,
        fq.is_deleted,
        fq.created_at,
        fq.updated_at,
        fq.edit_password,
        m.nickname AS member_nickname,
        COUNT(c.comment_id) AS comment_count
      FROM faq_questions fq
      LEFT JOIN members m
        ON fq.member_id = m.member_id
      LEFT JOIN faq_question_comments c
        ON fq.question_id = c.question_id
       AND c.is_deleted = 0
      WHERE fq.is_deleted = 0
      GROUP BY
        fq.question_id,
        fq.member_id,
        fq.title,
        fq.content,
        fq.category,
        fq.is_anonymous,
        fq.nickname,
        fq.is_deleted,
        fq.created_at,
        fq.updated_at,
        fq.edit_password,
        m.nickname
      ORDER BY fq.question_id DESC
    `)

    const mapped = rows.map((row) => ({
      ...row,
      edit_password: undefined,
      has_password: !!row.edit_password,
      is_mine:
        currentMemberId && row.member_id
          ? Number(currentMemberId) === Number(row.member_id)
          : false,
      comment_count: Number(row.comment_count || 0),
      is_answered: Number(row.comment_count || 0) > 0,
    }))

    res.json({ success: true, data: mapped })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '질문 목록 조회 실패' })
  }
})

/* 질문 등록 */
router.post('/questions', async (req, res) => {
  try {
    const { title, content, nickname, is_anonymous, edit_password } = req.body

    const memberId = getMemberIdFromHeader(req)
    const anonymousFlag = Number(is_anonymous) === 1 ? 1 : 0

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: '제목과 내용을 입력하세요.',
      })
    }

    let finalNickname = null

    if (memberId) {
      const [memberRows] = await db.promise().query(
        `SELECT nickname FROM members WHERE member_id = ? LIMIT 1`,
        [memberId]
      )

      if (!memberRows.length) {
        return res.status(404).json({
          success: false,
          message: '로그인 사용자 정보를 찾을 수 없습니다.',
        })
      }

      finalNickname = memberRows[0].nickname || null
    } else {
      if (anonymousFlag === 0 && !nickname?.trim()) {
        return res.status(400).json({
          success: false,
          message: '닉네임을 입력하세요.',
        })
      }

      if (!edit_password?.trim()) {
        return res.status(400).json({
          success: false,
          message: '비로그인 사용자는 수정/삭제용 비밀번호가 필요합니다.',
        })
      }

      finalNickname = anonymousFlag === 1 ? null : nickname.trim()
    }

    await db.promise().query(
      `
      INSERT INTO faq_questions (
        member_id,
        title,
        content,
        nickname,
        is_anonymous,
        edit_password,
        is_deleted
      )
      VALUES (?, ?, ?, ?, ?, ?, 0)
      `,
      [
        memberId,
        title.trim(),
        content.trim(),
        finalNickname,
        anonymousFlag,
        memberId ? null : edit_password.trim(),
      ]
    )

    res.json({ success: true, message: '질문 등록 완료' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '질문 등록 실패' })
  }
})

/* 질문 수정 */
router.patch('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, nickname, is_anonymous, edit_password } = req.body
    const anonymousFlag = Number(is_anonymous) === 1 ? 1 : 0

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: '제목과 내용을 입력하세요.',
      })
    }

    const [rows] = await db.promise().query(
      `SELECT * FROM faq_questions WHERE question_id = ? AND is_deleted = 0 LIMIT 1`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.',
      })
    }

    const question = rows[0]
    const memberId = getMemberIdFromHeader(req)

    let finalNickname = null

    if (question.member_id) {
      if (!memberId || Number(question.member_id) !== Number(memberId)) {
        return res.status(403).json({
          success: false,
          message: '본인이 작성한 질문만 수정할 수 있습니다.',
        })
      }

      const [memberRows] = await db.promise().query(
        `SELECT nickname FROM members WHERE member_id = ? LIMIT 1`,
        [memberId]
      )

      if (!memberRows.length) {
        return res.status(404).json({
          success: false,
          message: '로그인 사용자 정보를 찾을 수 없습니다.',
        })
      }

      finalNickname = memberRows[0].nickname || null
    } else {
      if (anonymousFlag === 0 && !nickname?.trim()) {
        return res.status(400).json({
          success: false,
          message: '닉네임을 입력하세요.',
        })
      }

      if (!question.edit_password) {
        return res.status(403).json({
          success: false,
          message: '이 질문은 비밀번호가 설정되지 않아 수정할 수 없습니다.',
        })
      }

      if (!edit_password?.trim() || question.edit_password !== edit_password.trim()) {
        return res.status(403).json({
          success: false,
          message: '비밀번호가 일치하지 않습니다.',
        })
      }

      finalNickname = anonymousFlag === 1 ? null : nickname.trim()
    }

    await db.promise().query(
      `
      UPDATE faq_questions
      SET
        title = ?,
        content = ?,
        nickname = ?,
        is_anonymous = ?,
        updated_at = NOW()
      WHERE question_id = ?
      `,
      [title.trim(), content.trim(), finalNickname, anonymousFlag, id]
    )

    res.json({ success: true, message: '질문 수정 완료' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '질문 수정 실패' })
  }
})

/* 질문 삭제 */
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { edit_password } = req.body || {}

    const [rows] = await db.promise().query(
      `SELECT * FROM faq_questions WHERE question_id = ? AND is_deleted = 0 LIMIT 1`,
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.',
      })
    }

    const question = rows[0]
    const memberId = getMemberIdFromHeader(req)

    if (question.member_id) {
      if (!memberId || Number(question.member_id) !== Number(memberId)) {
        return res.status(403).json({
          success: false,
          message: '본인이 작성한 질문만 삭제할 수 있습니다.',
        })
      }
    } else {
      if (!question.edit_password) {
        return res.status(403).json({
          success: false,
          message: '이 질문은 비밀번호가 설정되지 않아 삭제할 수 없습니다.',
        })
      }

      if (!edit_password?.trim() || question.edit_password !== edit_password.trim()) {
        return res.status(403).json({
          success: false,
          message: '비밀번호가 일치하지 않습니다.',
        })
      }
    }

    await db.promise().query(
      `UPDATE faq_questions SET is_deleted = 1, updated_at = NOW() WHERE question_id = ?`,
      [id]
    )

    res.json({ success: true, message: '질문 삭제 완료' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '질문 삭제 실패' })
  }
})

/* 댓글 목록 조회 */
router.get('/questions/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const currentMemberId = getMemberIdFromHeader(req)

    const [questionRows] = await db.promise().query(
      `SELECT question_id FROM faq_questions WHERE question_id = ? AND is_deleted = 0 LIMIT 1`,
      [id]
    )

    if (!questionRows.length) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.',
      })
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        c.comment_id,
        c.question_id,
        c.member_id,
        c.guest_nickname,
        c.guest_password,
        c.content,
        c.created_at,
        c.updated_at,
        m.nickname AS member_nickname
      FROM faq_question_comments c
      LEFT JOIN members m
        ON c.member_id = m.member_id
      WHERE c.question_id = ?
        AND c.is_deleted = 0
      ORDER BY c.comment_id ASC
      `,
      [id]
    )

    const mapped = rows.map((row) => ({
      comment_id: row.comment_id,
      question_id: row.question_id,
      member_id: row.member_id,
      guest_nickname: row.guest_nickname,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      writer_name: row.member_nickname || row.guest_nickname || '익명',
      is_mine:
        currentMemberId && row.member_id
          ? Number(currentMemberId) === Number(row.member_id)
          : false,
      is_guest_comment: !row.member_id,
      has_password: !!row.guest_password,
    }))

    res.json({ success: true, data: mapped })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '댓글 목록 조회 실패' })
  }
})

/* 댓글 등록 - 로그인/비로그인 모두 가능 */
router.post('/questions/:id/comments', async (req, res) => {
  try {
    const { id } = req.params
    const memberId = getMemberIdFromHeader(req)

    const content = String(req.body?.content || '').trim()
    const guestNickname = String(req.body?.guest_nickname || '').trim()
    const guestPassword = String(req.body?.guest_password || '').trim()

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '댓글 내용을 입력하세요.',
      })
    }

    const [questionRows] = await db.promise().query(
      `SELECT question_id FROM faq_questions WHERE question_id = ? AND is_deleted = 0 LIMIT 1`,
      [id]
    )

    if (!questionRows.length) {
      return res.status(404).json({
        success: false,
        message: '질문을 찾을 수 없습니다.',
      })
    }

    if (memberId) {
      await db.promise().query(
        `
        INSERT INTO faq_question_comments (
          question_id,
          member_id,
          guest_nickname,
          guest_password,
          content
        )
        VALUES (?, ?, NULL, NULL, ?)
        `,
        [id, memberId, content]
      )
    } else {
      if (!guestNickname) {
        return res.status(400).json({
          success: false,
          message: '비로그인 사용자는 댓글 닉네임을 입력하세요.',
        })
      }

      if (!guestPassword) {
        return res.status(400).json({
          success: false,
          message: '비로그인 사용자는 댓글 비밀번호를 입력하세요.',
        })
      }

      await db.promise().query(
        `
        INSERT INTO faq_question_comments (
          question_id,
          member_id,
          guest_nickname,
          guest_password,
          content
        )
        VALUES (?, NULL, ?, ?, ?)
        `,
        [id, guestNickname, guestPassword, content]
      )
    }

    res.json({ success: true, message: '댓글 등록 완료' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '댓글 등록 실패' })
  }
})

/* 댓글 삭제 - 로그인 본인 또는 비로그인 비밀번호 */
router.delete('/questions/:questionId/comments/:commentId', async (req, res) => {
  try {
    const { questionId, commentId } = req.params
    const memberId = getMemberIdFromHeader(req)
    const guestPassword = String(req.body?.guest_password || '').trim()

    const [rows] = await db.promise().query(
      `
      SELECT
        comment_id,
        question_id,
        member_id,
        guest_password,
        is_deleted
      FROM faq_question_comments
      WHERE comment_id = ?
        AND question_id = ?
      LIMIT 1
      `,
      [commentId, questionId]
    )

    if (!rows.length || Number(rows[0].is_deleted) === 1) {
      return res.status(404).json({
        success: false,
        message: '댓글을 찾을 수 없습니다.',
      })
    }

    const comment = rows[0]

    if (comment.member_id) {
      if (!memberId || Number(comment.member_id) !== Number(memberId)) {
        return res.status(403).json({
          success: false,
          message: '본인 댓글만 삭제할 수 있습니다.',
        })
      }
    } else {
      if (!comment.guest_password) {
        return res.status(403).json({
          success: false,
          message: '이 댓글은 비밀번호가 설정되지 않아 삭제할 수 없습니다.',
        })
      }

      if (!guestPassword || comment.guest_password !== guestPassword) {
        return res.status(403).json({
          success: false,
          message: '댓글 비밀번호가 일치하지 않습니다.',
        })
      }
    }

    await db.promise().query(
      `
      UPDATE faq_question_comments
      SET is_deleted = 1,
          updated_at = NOW()
      WHERE comment_id = ?
      `,
      [commentId]
    )

    res.json({ success: true, message: '댓글 삭제 완료' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: '댓글 삭제 실패' })
  }
})

module.exports = router