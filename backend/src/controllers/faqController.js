const db = require('../../config/db');

/* 공통 응답 */
function success(res, message, data = null, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}

function formatDateLabel(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}.${mm}.${dd}`;
}

/* =========================
   공개용 FAQ 목록 조회
========================= */
exports.getFaqList = async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit || 10);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : 10;

    const [rows] = await db.promise().query(
      `
      SELECT
        faq_id,
        question,
        answer,
        category,
        sort_order,
        is_visible,
        created_at,
        updated_at
      FROM faq
      WHERE is_visible = 1
      ORDER BY sort_order ASC, faq_id ASC
      LIMIT ?
      `,
      [limit]
    );

    return success(res, 'FAQ 조회 성공', rows);
  } catch (err) {
    console.error('getFaqList error =', err);
    return fail(res, 'FAQ 조회 실패', err.message, 500);
  }
};

/* =========================
   관리자용 FAQ 전체 조회
========================= */
exports.getAllFaq = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `
      SELECT
        faq_id,
        question,
        answer,
        category,
        sort_order,
        is_visible,
        created_at,
        updated_at
      FROM faq
      ORDER BY sort_order ASC, faq_id ASC
      `
    );

    return success(res, '전체 FAQ 조회 성공', rows);
  } catch (err) {
    console.error('getAllFaq error =', err);
    return fail(res, '전체 FAQ 조회 실패', err.message, 500);
  }
};

/* =========================
   FAQ 단건 조회
========================= */
exports.getFaqById = async (req, res) => {
  try {
    const faqId = Number(req.params.faqId);

    if (!Number.isInteger(faqId) || faqId <= 0) {
      return fail(res, '올바른 FAQ ID가 아닙니다.', null, 400);
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        faq_id,
        question,
        answer,
        category,
        sort_order,
        is_visible,
        created_at,
        updated_at
      FROM faq
      WHERE faq_id = ?
      LIMIT 1
      `,
      [faqId]
    );

    if (!rows.length) {
      return fail(res, 'FAQ를 찾을 수 없습니다.', null, 404);
    }

    return success(res, 'FAQ 단건 조회 성공', rows[0]);
  } catch (err) {
    console.error('getFaqById error =', err);
    return fail(res, 'FAQ 단건 조회 실패', err.message, 500);
  }
};

/* =========================
   FAQ 생성
========================= */
exports.createFaq = async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    const answer = String(req.body?.answer || '').trim();
    const category = String(req.body?.category || '일반').trim();
    const sortOrderRaw = Number(req.body?.sort_order ?? 0);
    const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;
    const isVisible = Number(req.body?.is_visible ?? 1) === 1 ? 1 : 0;

    if (!question) {
      return fail(res, '질문(question)은 필수입니다.', null, 400);
    }

    if (!answer) {
      return fail(res, '답변(answer)은 필수입니다.', null, 400);
    }

    const [result] = await db.promise().query(
      `
      INSERT INTO faq (
        question,
        answer,
        category,
        sort_order,
        is_visible
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [question, answer, category || '일반', sortOrder, isVisible]
    );

    const [rows] = await db.promise().query(
      `
      SELECT
        faq_id,
        question,
        answer,
        category,
        sort_order,
        is_visible,
        created_at,
        updated_at
      FROM faq
      WHERE faq_id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return success(res, 'FAQ 생성 성공', rows[0], 201);
  } catch (err) {
    console.error('createFaq error =', err);
    return fail(res, 'FAQ 생성 실패', err.message, 500);
  }
};

/* =========================
   FAQ 수정
========================= */
exports.updateFaq = async (req, res) => {
  try {
    const faqId = Number(req.params.faqId);

    if (!Number.isInteger(faqId) || faqId <= 0) {
      return fail(res, '올바른 FAQ ID가 아닙니다.', null, 400);
    }

    const question = String(req.body?.question || '').trim();
    const answer = String(req.body?.answer || '').trim();
    const category = String(req.body?.category || '일반').trim();
    const sortOrderRaw = Number(req.body?.sort_order ?? 0);
    const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;
    const isVisible = Number(req.body?.is_visible ?? 1) === 1 ? 1 : 0;

    if (!question) {
      return fail(res, '질문(question)은 필수입니다.', null, 400);
    }

    if (!answer) {
      return fail(res, '답변(answer)은 필수입니다.', null, 400);
    }

    const [exists] = await db.promise().query(
      `SELECT faq_id FROM faq WHERE faq_id = ? LIMIT 1`,
      [faqId]
    );

    if (!exists.length) {
      return fail(res, 'FAQ를 찾을 수 없습니다.', null, 404);
    }

    await db.promise().query(
      `
      UPDATE faq
      SET
        question = ?,
        answer = ?,
        category = ?,
        sort_order = ?,
        is_visible = ?
      WHERE faq_id = ?
      `,
      [question, answer, category || '일반', sortOrder, isVisible, faqId]
    );

    const [rows] = await db.promise().query(
      `
      SELECT
        faq_id,
        question,
        answer,
        category,
        sort_order,
        is_visible,
        created_at,
        updated_at
      FROM faq
      WHERE faq_id = ?
      LIMIT 1
      `,
      [faqId]
    );

    return success(res, 'FAQ 수정 성공', rows[0]);
  } catch (err) {
    console.error('updateFaq error =', err);
    return fail(res, 'FAQ 수정 실패', err.message, 500);
  }
};

/* =========================
   FAQ 삭제
========================= */
exports.deleteFaq = async (req, res) => {
  try {
    const faqId = Number(req.params.faqId);

    if (!Number.isInteger(faqId) || faqId <= 0) {
      return fail(res, '올바른 FAQ ID가 아닙니다.', null, 400);
    }

    const [exists] = await db.promise().query(
      `
      SELECT faq_id, question
      FROM faq
      WHERE faq_id = ?
      LIMIT 1
      `,
      [faqId]
    );

    if (!exists.length) {
      return fail(res, 'FAQ를 찾을 수 없습니다.', null, 404);
    }

    await db.promise().query(
      `
      DELETE FROM faq
      WHERE faq_id = ?
      `,
      [faqId]
    );

    return success(res, 'FAQ 삭제 성공', {
      faq_id: faqId,
      question: exists[0].question,
    });
  } catch (err) {
    console.error('deleteFaq error =', err);
    return fail(res, 'FAQ 삭제 실패', err.message, 500);
  }
};

/* =========================
   FAQ 노출 토글
========================= */
exports.toggleFaqVisibility = async (req, res) => {
  try {
    const faqId = Number(req.params.faqId);

    if (!Number.isInteger(faqId) || faqId <= 0) {
      return fail(res, '올바른 FAQ ID가 아닙니다.', null, 400);
    }

    const [rows] = await db.promise().query(
      `
      SELECT
        faq_id,
        is_visible
      FROM faq
      WHERE faq_id = ?
      LIMIT 1
      `,
      [faqId]
    );

    if (!rows.length) {
      return fail(res, 'FAQ를 찾을 수 없습니다.', null, 404);
    }

    const nextVisible = Number(rows[0].is_visible) === 1 ? 0 : 1;

    await db.promise().query(
      `
      UPDATE faq
      SET is_visible = ?
      WHERE faq_id = ?
      `,
      [nextVisible, faqId]
    );

    const [updated] = await db.promise().query(
      `
      SELECT
        faq_id,
        question,
        answer,
        category,
        sort_order,
        is_visible,
        created_at,
        updated_at
      FROM faq
      WHERE faq_id = ?
      LIMIT 1
      `,
      [faqId]
    );

    return success(res, 'FAQ 노출 상태 변경 성공', updated[0]);
  } catch (err) {
    console.error('toggleFaqVisibility error =', err);
    return fail(res, 'FAQ 노출 상태 변경 실패', err.message, 500);
  }
};

/* =========================
   공개 질문 목록 조회
   ※ faq_questions 테이블 필요
========================= */
exports.getQuestionList = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `
      SELECT
        question_id,
        title,
        content,
        category,
        nickname,
        is_anonymous,
        status,
        admin_answer,
        created_at,
        updated_at
      FROM faq_questions
      WHERE is_deleted = 0
      ORDER BY question_id DESC
      LIMIT 10
      `
    );

    const mapped = rows.map((row) => ({
      ...row,
      created_at_label: formatDateLabel(row.created_at),
    }));

    return success(res, '질문 목록 조회 성공', mapped);
  } catch (err) {
    console.error('getQuestionList error =', err);
    return fail(
      res,
      '질문 목록 조회 실패',
      'faq_questions 테이블이 아직 없으면 SQL 작업 후 다시 시도해야 합니다.',
      500
    );
  }
};

/* =========================
   공개 질문 등록
   ※ faq_questions 테이블 필요
========================= */
exports.createQuestion = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const content = String(req.body?.content || '').trim();
    const category = String(req.body?.category || '일반').trim();
    const isAnonymous = Number(req.body?.is_anonymous ?? 1) === 1 ? 1 : 0;
    const nickname = String(req.body?.nickname || '').trim();

    if (!title) {
      return fail(res, '제목(title)은 필수입니다.', null, 400);
    }

    if (!content) {
      return fail(res, '내용(content)은 필수입니다.', null, 400);
    }

    if (isAnonymous === 0 && !nickname) {
      return fail(res, '익명이 아닐 경우 닉네임이 필요합니다.', null, 400);
    }

    const [result] = await db.promise().query(
      `
      INSERT INTO faq_questions (
        title,
        content,
        category,
        nickname,
        is_anonymous,
        status,
        admin_answer,
        is_deleted
      )
      VALUES (?, ?, ?, ?, ?, 'pending', NULL, 0)
      `,
      [title, content, category || '일반', nickname, isAnonymous]
    );

    const [rows] = await db.promise().query(
      `
      SELECT
        question_id,
        title,
        content,
        category,
        nickname,
        is_anonymous,
        status,
        admin_answer,
        created_at,
        updated_at
      FROM faq_questions
      WHERE question_id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return success(res, '질문 등록 성공', rows[0], 201);
  } catch (err) {
    console.error('createQuestion error =', err);
    return fail(
      res,
      '질문 등록 실패',
      'faq_questions 테이블이 아직 없으면 SQL 작업 후 다시 시도해야 합니다.',
      500
    );
  }
};

/* =========================
   관리자용 전체 질문 조회
========================= */
exports.getAllQuestions = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `
      SELECT
        question_id,
        title,
        content,
        category,
        nickname,
        is_anonymous,
        status,
        admin_answer,
        is_deleted,
        created_at,
        updated_at
      FROM faq_questions
      ORDER BY question_id DESC
      `
    );

    const mapped = rows.map((row) => ({
      ...row,
      created_at_label: formatDateLabel(row.created_at),
    }));

    return success(res, '전체 질문 조회 성공', mapped);
  } catch (err) {
    console.error('getAllQuestions error =', err);
    return fail(
      res,
      '전체 질문 조회 실패',
      'faq_questions 테이블이 아직 없으면 SQL 작업 후 다시 시도해야 합니다.',
      500
    );
  }
};

/* =========================
   관리자 답변 등록/수정
========================= */
exports.answerQuestion = async (req, res) => {
  try {
    const questionId = Number(req.params.questionId);
    const adminAnswer = String(req.body?.admin_answer || '').trim();

    if (!Number.isInteger(questionId) || questionId <= 0) {
      return fail(res, '올바른 질문 ID가 아닙니다.', null, 400);
    }

    if (!adminAnswer) {
      return fail(res, '답변(admin_answer)은 필수입니다.', null, 400);
    }

    const [exists] = await db.promise().query(
      `SELECT question_id FROM faq_questions WHERE question_id = ? LIMIT 1`,
      [questionId]
    );

    if (!exists.length) {
      return fail(res, '질문을 찾을 수 없습니다.', null, 404);
    }

    await db.promise().query(
      `
      UPDATE faq_questions
      SET
        admin_answer = ?,
        status = 'answered'
      WHERE question_id = ?
      `,
      [adminAnswer, questionId]
    );

    const [rows] = await db.promise().query(
      `
      SELECT
        question_id,
        title,
        content,
        category,
        nickname,
        is_anonymous,
        status,
        admin_answer,
        is_deleted,
        created_at,
        updated_at
      FROM faq_questions
      WHERE question_id = ?
      LIMIT 1
      `,
      [questionId]
    );

    return success(res, '질문 답변 등록 성공', rows[0]);
  } catch (err) {
    console.error('answerQuestion error =', err);
    return fail(
      res,
      '질문 답변 등록 실패',
      'faq_questions 테이블이 아직 없으면 SQL 작업 후 다시 시도해야 합니다.',
      500
    );
  }
};

/* =========================
   관리자 질문 삭제
========================= */
exports.deleteQuestion = async (req, res) => {
  try {
    const questionId = Number(req.params.questionId);

    if (!Number.isInteger(questionId) || questionId <= 0) {
      return fail(res, '올바른 질문 ID가 아닙니다.', null, 400);
    }

    const [exists] = await db.promise().query(
      `
      SELECT question_id, title
      FROM faq_questions
      WHERE question_id = ?
      LIMIT 1
      `,
      [questionId]
    );

    if (!exists.length) {
      return fail(res, '질문을 찾을 수 없습니다.', null, 404);
    }

    await db.promise().query(
      `
      UPDATE faq_questions
      SET is_deleted = 1
      WHERE question_id = ?
      `,
      [questionId]
    );

    return success(res, '질문 삭제 성공', {
      question_id: questionId,
      title: exists[0].title,
    });
  } catch (err) {
    console.error('deleteQuestion error =', err);
    return fail(
      res,
      '질문 삭제 실패',
      'faq_questions 테이블이 아직 없으면 SQL 작업 후 다시 시도해야 합니다.',
      500
    );
  }
};