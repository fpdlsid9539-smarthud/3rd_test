const express = require('express');
const router = express.Router();

const faqController = require('../controllers/faqController');
const authMiddleware = require('../../middlewares/authMiddleware');
const adminMiddleware = require('../../middlewares/adminMiddleware');

/* =========================
   공개용 FAQ / 질문 조회
========================= */
router.get('/', faqController.getFaqList);

/* 공개 질문 목록 / 등록
   ※ 반드시 /:faqId 보다 먼저 와야 함
*/
router.get('/questions/list/public', faqController.getQuestionList);
router.post('/questions', faqController.createQuestion);

/* FAQ 단건 조회 */
router.get('/:faqId', faqController.getFaqById);

/* =========================
   관리자 전용 FAQ 전체 조회
========================= */
router.get(
  '/all',
  authMiddleware,
  adminMiddleware,
  faqController.getAllFaq
);

/* =========================
   관리자 전용 FAQ 관리
========================= */
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  faqController.createFaq
);

router.put(
  '/:faqId',
  authMiddleware,
  adminMiddleware,
  faqController.updateFaq
);

router.patch(
  '/:faqId/visibility',
  authMiddleware,
  adminMiddleware,
  faqController.toggleFaqVisibility
);

router.delete(
  '/:faqId',
  authMiddleware,
  adminMiddleware,
  faqController.deleteFaq
);

/* =========================
   관리자 전용 질문 관리
========================= */
router.get(
  '/questions',
  authMiddleware,
  adminMiddleware,
  faqController.getAllQuestions
);

router.patch(
  '/questions/:questionId/answer',
  authMiddleware,
  adminMiddleware,
  faqController.answerQuestion
);

router.delete(
  '/questions/:questionId',
  authMiddleware,
  adminMiddleware,
  faqController.deleteQuestion
);

module.exports = router;