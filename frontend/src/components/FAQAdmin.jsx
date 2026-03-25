import React, { useEffect, useState } from 'react';
import './FAQAdmin.css';

const BACKEND_URL = 'http://localhost:5000';

const EMPTY_FORM = {
  question: '',
  answer: '',
  category: '일반',
  sort_order: 0,
  is_visible: 1,
};

const EMPTY_ANSWER_FORM = {
  questionId: null,
  admin_answer: '',
};

const FAQAdmin = () => {
  const [faqList, setFaqList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answerSaving, setAnswerSaving] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [answerForm, setAnswerForm] = useState(EMPTY_ANSWER_FORM);

  const getToken = () => localStorage.getItem('token');

  const fetchFaq = async () => {
    try {
      setLoading(true);

      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/faq/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'FAQ 목록 조회 실패');
      }

      setFaqList(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      alert(err.message || 'FAQ 목록 조회 중 오류가 발생했습니다.');
      setFaqList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      setQuestionLoading(true);

      const token = getToken();
      const res = await fetch(`${BACKEND_URL}/api/faq/questions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || '질문 목록 조회 실패');
      }

      setQuestionList(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      alert(err.message || '질문 목록 조회 중 오류가 발생했습니다.');
      setQuestionList([]);
    } finally {
      setQuestionLoading(false);
    }
  };

  useEffect(() => {
    fetchFaq();
    fetchQuestions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === 'sort_order' ? Number(value || 0) : value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.question.trim()) {
      alert('질문을 입력하세요.');
      return;
    }

    if (!form.answer.trim()) {
      alert('답변을 입력하세요.');
      return;
    }

    try {
      setSaving(true);

      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const url = editingId
        ? `${BACKEND_URL}/api/faq/${editingId}`
        : `${BACKEND_URL}/api/faq`;

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || '저장 실패');
      }

      alert(editingId ? 'FAQ 수정 완료' : 'FAQ 등록 완료');
      resetForm();
      fetchFaq();
    } catch (err) {
      console.error(err);
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq) => {
    setEditingId(faq.faq_id);
    setForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || '일반',
      sort_order: Number(faq.sort_order || 0),
      is_visible: Number(faq.is_visible || 0),
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (faqId) => {
    const ok = window.confirm('정말 이 FAQ를 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/faq/${faqId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || '삭제 실패');
      }

      alert('FAQ 삭제 완료');

      if (editingId === faqId) {
        resetForm();
      }

      fetchFaq();
    } catch (err) {
      console.error(err);
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleToggleVisibility = async (faqId) => {
    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/faq/${faqId}/visibility`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || '노출 상태 변경 실패');
      }

      fetchFaq();
    } catch (err) {
      console.error(err);
      alert(err.message || '노출 상태 변경 중 오류가 발생했습니다.');
    }
  };

  const startAnswerEdit = (question) => {
    setAnswerForm({
      questionId: question.question_id,
      admin_answer: question.admin_answer || '',
    });
  };

  const resetAnswerForm = () => {
    setAnswerForm(EMPTY_ANSWER_FORM);
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();

    if (!answerForm.questionId) {
      alert('답변할 질문을 선택하세요.');
      return;
    }

    if (!answerForm.admin_answer.trim()) {
      alert('답변 내용을 입력하세요.');
      return;
    }

    try {
      setAnswerSaving(true);

      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch(
        `${BACKEND_URL}/api/faq/questions/${answerForm.questionId}/answer`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            admin_answer: answerForm.admin_answer,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || '답변 등록 실패');
      }

      alert('질문 답변 등록 완료');
      resetAnswerForm();
      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert(err.message || '답변 등록 중 오류가 발생했습니다.');
    } finally {
      setAnswerSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const ok = window.confirm('정말 이 질문을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const token = getToken();
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/faq/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || '질문 삭제 실패');
      }

      alert('질문 삭제 완료');

      if (answerForm.questionId === questionId) {
        resetAnswerForm();
      }

      fetchQuestions();
    } catch (err) {
      console.error(err);
      alert(err.message || '질문 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className='faq-admin-page'>
      <div className='faq-admin-breadcrumb'>대시보드 &gt; FAQ 관리</div>

      <div className='faq-admin-card'>
        <h1>{editingId ? 'FAQ 수정' : 'FAQ 등록'}</h1>

        <form className='faq-admin-form' onSubmit={handleSubmit}>
          <div className='faq-admin-field'>
            <label>질문</label>
            <input
              type='text'
              name='question'
              value={form.question}
              onChange={handleChange}
              placeholder='질문을 입력하세요'
            />
          </div>

          <div className='faq-admin-field'>
            <label>답변</label>
            <textarea
              name='answer'
              value={form.answer}
              onChange={handleChange}
              placeholder='답변을 입력하세요'
              rows='5'
            />
          </div>

          <div className='faq-admin-grid'>
            <div className='faq-admin-field'>
              <label>카테고리</label>
              <input
                type='text'
                name='category'
                value={form.category}
                onChange={handleChange}
                placeholder='예: 일반, 계정, 결제'
              />
            </div>

            <div className='faq-admin-field'>
              <label>정렬순서</label>
              <input
                type='number'
                name='sort_order'
                value={form.sort_order}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className='faq-admin-visible-row'>
            <label>노출 여부</label>
            <select
              name='is_visible'
              value={form.is_visible}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_visible: Number(e.target.value),
                }))
              }
            >
              <option value={1}>노출</option>
              <option value={0}>숨김</option>
            </select>
          </div>

          <div className='faq-admin-actions'>
            <button type='submit' disabled={saving}>
              {saving ? '저장 중...' : editingId ? '수정하기' : '등록하기'}
            </button>
            <button
              type='button'
              className='secondary'
              onClick={resetForm}
              disabled={saving}
            >
              초기화
            </button>
          </div>
        </form>
      </div>

      <div className='faq-admin-card'>
        <h2>FAQ 목록</h2>

        {loading ? (
          <div className='faq-admin-empty'>불러오는 중...</div>
        ) : faqList.length === 0 ? (
          <div className='faq-admin-empty'>등록된 FAQ가 없습니다.</div>
        ) : (
          <div className='faq-admin-list'>
            {faqList.map((faq) => (
              <div key={faq.faq_id} className='faq-admin-item'>
                <div className='faq-admin-item-top'>
                  <div>
                    <div className='faq-admin-question'>{faq.question}</div>
                    <div className='faq-admin-meta'>
                      [{faq.category}] 정렬순서 {faq.sort_order} /{' '}
                      {Number(faq.is_visible) === 1 ? '노출중' : '숨김'}
                    </div>
                  </div>

                  <div className='faq-admin-item-actions'>
                    <button type='button' onClick={() => handleEdit(faq)}>
                      수정
                    </button>
                    <button
                      type='button'
                      onClick={() => handleToggleVisibility(faq.faq_id)}
                    >
                      {Number(faq.is_visible) === 1 ? '숨기기' : '노출'}
                    </button>
                    <button
                      type='button'
                      className='danger'
                      onClick={() => handleDelete(faq.faq_id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className='faq-admin-answer'>{faq.answer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='faq-admin-card'>
        <h2>사용자 질문 관리</h2>

        <form className='faq-admin-form' onSubmit={handleAnswerSubmit}>
          <div className='faq-admin-field'>
            <label>운영진 답변</label>
            <textarea
              value={answerForm.admin_answer}
              onChange={(e) =>
                setAnswerForm((prev) => ({
                  ...prev,
                  admin_answer: e.target.value,
                }))
              }
              placeholder='질문을 선택한 뒤 답변을 입력하세요'
              rows='4'
            />
          </div>

          <div className='faq-admin-actions'>
            <button type='submit' disabled={answerSaving}>
              {answerSaving ? '저장 중...' : '답변 등록하기'}
            </button>
            <button
              type='button'
              className='secondary'
              onClick={resetAnswerForm}
              disabled={answerSaving}
            >
              초기화
            </button>
          </div>
        </form>

        {questionLoading ? (
          <div className='faq-admin-empty'>불러오는 중...</div>
        ) : questionList.length === 0 ? (
          <div className='faq-admin-empty'>등록된 질문이 없습니다.</div>
        ) : (
          <div className='faq-admin-list'>
            {questionList.map((question) => (
              <div key={question.question_id} className='faq-admin-item'>
                <div className='faq-admin-item-top'>
                  <div>
                    <div className='faq-admin-question'>{question.title}</div>
                    <div className='faq-admin-meta'>
                      [{question.category}] /{' '}
                      {Number(question.is_anonymous) === 1
                        ? '익명'
                        : question.nickname || '사용자'}{' '}
                      / {question.status === 'answered' ? '답변완료' : '답변대기'}
                    </div>
                  </div>

                  <div className='faq-admin-item-actions'>
                    <button
                      type='button'
                      onClick={() => startAnswerEdit(question)}
                    >
                      답변
                    </button>
                    <button
                      type='button'
                      className='danger'
                      onClick={() => handleDeleteQuestion(question.question_id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                <div className='faq-admin-answer'>{question.content}</div>

                {question.admin_answer ? (
                  <div className='faq-admin-answer' style={{ marginTop: '0.8rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.8rem' }}>
                    <strong>운영진 답변</strong>
                    <div style={{ marginTop: '0.35rem' }}>{question.admin_answer}</div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQAdmin;