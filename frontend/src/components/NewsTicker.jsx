    import React, { useState, useEffect } from 'react';
import { api } from '../config/api';
import './NewsTicker.css';

const NewsTicker = () => {
  const [newsList, setNewsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // 🟢 모달 창 열림/닫힘 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/news');
        const data = res?.data?.data || res?.data || [];
        setNewsList(data);
      } catch (err) {
        console.error('뉴스 로딩 실패:', err);
        setNewsList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  useEffect(() => {
    // 🟢 모달이 열려있을 때는 롤링을 멈춥니다
    if (newsList.length <= 1 || isModalOpen) return;

    const timerID = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex === newsList.length - 1 ? 0 : prevIndex + 1));
    }, 5000);

    return () => clearInterval(timerID);
  }, [newsList, isModalOpen]);

  if (loading) return <div className="news-ticker-container loading">실시간 주식 뉴스 가져오는 중...</div>;
  if (newsList.length === 0) return null;

  const currentNews = newsList[currentIndex];

  return (
    <>
      <div className="news-ticker-container">
        <div className="news-content" key={currentNews.id}>
          <span className="news-source">[{currentNews.source}]</span>
          <a href={currentNews.url} target="_blank" rel="noopener noreferrer" className="news-title" title="클릭하여 원문 보기">
            {currentNews.title}
          </a>
        </div>
        {/* 🟢 전체보기 버튼 */}
        <button className="news-all-btn" onClick={() => setIsModalOpen(true)}>전체보기</button>
      </div>

      {/* 🟢 전체 뉴스 팝업(모달) 창 */}
      {isModalOpen && (
        <div className="news-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="news-modal-header">
              <h3>📈 오늘의 실시간 주식 뉴스</h3>
              <button className="news-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="news-modal-list">
              {newsList.map((news) => (
                <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer" className="news-modal-item">
                  <span className="news-modal-source">[{news.source}]</span>
                  <span className="news-modal-title">{news.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsTicker;