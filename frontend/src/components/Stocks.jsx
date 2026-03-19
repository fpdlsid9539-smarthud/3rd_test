import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';
import zoomPlugin from 'chartjs-plugin-zoom';
import { api } from '../config/api';
import './Stocks.css';

ChartJS.register(CategoryScale, LinearScale, TimeScale, CandlestickController, CandlestickElement, Tooltip, Legend, zoomPlugin);

const tabTitleMap = { popular: '인기 종목', rising: '급상승 종목', falling: '급하락 종목' };

const RANGES = [
  { label: '일', range: '6mo', interval: '1d' },
  { label: '주', range: '2y', interval: '1wk' },
  { label: '월', range: '5y', interval: '1mo' },
  { label: '년', range: '10y', interval: '3mo' }
];

const Stocks = () => {
  const [activeTab, setActiveTab] = useState('popular');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSymbol, setExpandedSymbol] = useState(null); 
  const [chartData, setChartData] = useState(null);
  const [selectedRangeLabel, setSelectedRangeLabel] = useState('일'); 

  const [tradeModal, setTradeModal] = useState({ isOpen: false, type: '', stock: null });
  const [tradeQuantity, setTradeQuantity] = useState(1);

  const [ownedStocks, setOwnedStocks] = useState([]);
  const [likedStocks, setLikedStocks] = useState([]);

  const fetchStocks = async (keyword = '') => {
    setLoading(true);
    setExpandedSymbol(null);
    try {
      const url = keyword ? `/api/stocks?keyword=${keyword}` : `/api/stocks?type=${activeTab}`;
      const res = await api.get(url);
      const resultData = res.data.data || res.data;
      setStocks(Array.isArray(resultData) ? resultData : []);
    } catch (err) { 
      console.error("데이터 로드 실패:", err); 
      setStocks([]);
    } finally { 
      setLoading(false); 
    }
  };

  const fetchSideStocks = async () => {
    try {
      const [ownedRes, likedRes] = await Promise.all([
        api.get('/api/stocks/owned'),
        api.get('/api/stocks/liked')
      ]);
      const ownedData = ownedRes?.data?.data || ownedRes?.data || ownedRes?.stocks || [];
      const likedData = likedRes?.data?.data || likedRes?.data || likedRes?.stocks || [];

      setOwnedStocks(Array.isArray(ownedData) ? ownedData : []);
      setLikedStocks(Array.isArray(likedData) ? likedData : []);
    } catch (err) {
      console.error("사이드 주식 로드 실패:", err);
    }
  };

  useEffect(() => {
     fetchSideStocks();
  }, []);

  useEffect(() => { 
    if (activeTab !== 'search') fetchStocks(); 
  }, [activeTab]);

  const handleSearch = () => {
    if (!searchKeyword.trim()) return;
    setActiveTab('search');
    fetchStocks(searchKeyword);
  };

  const handleTabClick = (tab) => {
    setSearchKeyword('');
    setActiveTab(tab);
  };

  const fetchStockChart = async (symbol, rangeItem) => {
    setSelectedRangeLabel(rangeItem.label);
    setChartData(null); 
    try {
      const res = await api.get(`/api/stocks/${symbol}/chart?range=${rangeItem.range}&interval=${rangeItem.interval}`);
      let resultData = res.data?.data || res.data;
      
      if (Array.isArray(resultData)) {
        resultData.sort((a, b) => a.x - b.x);
      } else {
        resultData = [];
      }

      setChartData({
        datasets: [{ 
          data: resultData,
          // 💡 에러 나던 요소 제거하고 라이브러리 표준 색상(초록/빨강)으로 명확히 명시!
          color: { up: '#26a69a', down: '#ef4444', unchanged: '#999' }
        }]
      });
    } catch (err) { console.error(err); }
  };

  const handleStockClick = (symbol) => {
    if (expandedSymbol === symbol) { setExpandedSymbol(null); return; }
    setExpandedSymbol(symbol);
    
    const defaultRange = RANGES.find(r => r.label === '일');
    fetchStockChart(symbol, defaultRange);
  };

  const openTradeModal = (type, stock, e) => {
    e.stopPropagation(); 
    setTradeModal({ isOpen: true, type, stock });
    setTradeQuantity(1); 
  };

  const closeTradeModal = () => {
    setTradeModal({ isOpen: false, type: '', stock: null });
  };

  const handleTradeSubmit = () => {
    const actionName = tradeModal.type === 'buy' ? '매수' : '매도';
    alert(`${tradeModal.stock.name} ${tradeQuantity}주 ${actionName}가 완료되었습니다!\n(총 ${(tradeModal.stock.price * tradeQuantity).toLocaleString()}원)`);
    closeTradeModal();
  };

  let timeUnit = 'month';
  let xFormat = 'MM/dd';
  let tipFormat = 'yyyy-MM-dd';

  if (selectedRangeLabel === '일') {
    timeUnit = 'day';
    xFormat = 'MM/dd';
  } else if (selectedRangeLabel === '주') {
    timeUnit = 'month';
    xFormat = 'yy.MM';
  } else if (selectedRangeLabel === '월') {
    timeUnit = 'year';
    xFormat = 'yyyy.MM';
  } else if (selectedRangeLabel === '년') {
    timeUnit = 'year';
    xFormat = 'yyyy';
    tipFormat = 'yyyy-MM';
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { left: 5, right: 5, top: 10, bottom: 0 } },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeUnit, 
          displayFormats: { day: xFormat, month: xFormat, year: xFormat },
          tooltipFormat: tipFormat
        },
        grid: { display: false, drawBorder: false },
        ticks: {
          autoSkip: true,       
          maxTicksLimit: 6, 
          maxRotation: 0,
          color: '#8b95a1',
          font: { size: 11, weight: '500' }
        }
      },
      y: {
        position: 'right',
        grid: { color: '#f2f4f6', drawBorder: false },
        border: { display: false },
        ticks: {
          color: '#8b95a1',
          font: { size: 11 },
          callback: function(value) { return value.toLocaleString(); }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 10,
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context) => {
            const point = context.raw;
            if (!point) return '';
            return [
              `시가: ${Number(point.o).toLocaleString()}원`,
              `고가: ${Number(point.h).toLocaleString()}원`,
              `저가: ${Number(point.l).toLocaleString()}원`,
              `종가: ${Number(point.c).toLocaleString()}원`
            ];
          }
        }
      },
      zoom: {
        limits: { x: { min: 'original', max: 'original' } },
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
      }
    }
  };

  return (
    <div className='stocks-container'>
      <div className='stocks-breadcrumb'>대시보드 &gt; 전략실 &gt; 주식</div>
      <div className='stocks-layout'>
        <div className='stocks-main'>
          <div className='stocks-search-row'>
            <input type='text' className='stocks-search-input' placeholder='종목코드 또는 이름 검색' value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <button className='stocks-search-btn' onClick={handleSearch}>검색</button>
          </div>

          <div className='stocks-tab-group'>
            {Object.keys(tabTitleMap).map(tab => (
              <button key={tab} className={`stocks-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => handleTabClick(tab)}>
                {tabTitleMap[tab]}
              </button>
            ))}
          </div>

          <div className='stocks-chart-panel'>
            <div className='stocks-panel-header'>
              <h3>{activeTab === 'search' ? '검색 종목' : tabTitleMap[activeTab]}</h3>
              <span>{stocks.length}개 종목</span>
            </div>

            <div className='stocks-list'>
              {loading ? <div className='stocks-empty'>데이터 로딩 중...</div> :
                stocks.length > 0 ? (
                  stocks.map((stock, index) => (
                    <div key={stock.symbol} className='stock-item-wrap'>
                      <div className='stocks-list-item' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                        <div className='stock-info-clickable' onClick={() => handleStockClick(stock.symbol)} style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingRight: '20px' }}>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="stock-rank-badge">{index + 1}</div>
                            <div className='stocks-item-left' style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{stock.name}</span>
                              <span style={{ fontSize: '0.9rem', color: '#666' }}>{Number(stock.price).toLocaleString()}원</span>
                            </div>
                          </div>

                          <div className='stocks-item-right' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                            <span className={stock.change >= 0 ? 'stocks-up' : 'stocks-down'} style={{ fontWeight: 'bold' }}>
                              {stock.change >= 0 ? '+' : ''}{Number(stock.change).toLocaleString()}원
                            </span>
                            <span className={stock.rate >= 0 ? 'stocks-up' : 'stocks-down'} style={{ fontWeight: 'bold' }}>
                              {stock.rate >= 0 ? '+' : ''}{Number(stock.rate).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className='stock-trade-btns' style={{ display: 'flex', gap: '8px' }}>
                          <button className='trade-btn buy' onClick={(e) => openTradeModal('buy', stock, e)}>매수</button>
                          <button className='trade-btn sell' onClick={(e) => openTradeModal('sell', stock, e)}>매도</button>
                        </div>
                      </div>
                      
                      {expandedSymbol === stock.symbol && (
                        <div className='stock-chart-expanded' style={{ height: '420px', padding: '15px', backgroundColor: '#fcfcfd' }}>
                          
                          {/* 💡 [핵심] 차트 툴바 영역: 미니 범례 + 일/주/월/년 버튼 */}
                          <div className="chart-toolbar">
                            <div className="chart-legend-badge">
                              <span className="legend-item"><span className="color-box up"></span> 상승</span>
                              <span className="legend-item"><span className="color-box down"></span> 하락</span>
                            </div>
                            
                            <div className="chart-range-group">
                              {RANGES.map(r => (
                                <button
                                  key={r.label}
                                  className={`chart-range-btn ${selectedRangeLabel === r.label ? 'active' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); fetchStockChart(stock.symbol, r); }}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ height: '310px' }}>
                            {chartData ? <Chart type="candlestick" data={chartData} options={chartOptions} /> : <div style={{padding:'20px'}}>차트 로딩 중...</div>}
                          </div>

                          {/* 💡 [핵심] 차트 하단 안내 문구 */}
                          <div className="chart-notice">
                            * 본 차트는 글로벌 금융 표준 색상(상승: 초록색, 하락: 빨간색)을 따르고 있습니다.
                          </div>

                        </div>
                      )}
                    </div>
                  ))
                ) : ( <div className='stocks-empty'>조회된 종목이 없습니다.</div> )
              }
            </div>
          </div>
        </div>
        
        <div className='stocks-side'>
          <div className='stocks-card'>
            <h3>💹 보유 주식</h3>
            <div className="stocks-card-body">
              {ownedStocks.length > 0 ? (
                ownedStocks.map(stock => (
                  <div key={`owned-${stock.stockCode}`} className="side-stock-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0 }}>{stock.stockName}</p>
                      <p style={{ margin: 0 }}>{Number(stock.price).toLocaleString()}원</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{stock.quantity}주 (평단가 {Number(stock.avgPrice).toLocaleString()}원)</span>
                      <span className={stock.changeRate >= 0 ? 'stocks-up' : 'stocks-down'}>
                        {stock.changeRate >= 0 ? '+' : ''}{Number(stock.changeRate).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="stocks-empty" style={{ minHeight: '6rem' }}>보유 주식이 없습니다.</div>
              )}
            </div>
          </div>

          <div className='stocks-card'>
            <h3>💖 찜한 주식</h3>
            <div className="stocks-card-body">
              {likedStocks.length > 0 ? (
                likedStocks.map(stock => (
                  <div key={`liked-${stock.stockCode}`} className="side-stock-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ margin: 0 }}>{stock.stockName}</p>
                      <p style={{ margin: 0 }}>{Number(stock.price).toLocaleString()}원</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span className={stock.changeRate >= 0 ? 'stocks-up' : 'stocks-down'}>
                        {stock.changeRate >= 0 ? '+' : ''}{Number(stock.changeRate).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="stocks-empty" style={{ minHeight: '6rem' }}>찜한 주식이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {tradeModal.isOpen && tradeModal.stock && (
        <div className="trade-modal-overlay" onClick={closeTradeModal}>
          <div className="trade-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="trade-modal-header">
              <h2>{tradeModal.stock.name}</h2>
              <button className="trade-modal-close" onClick={closeTradeModal}>&times;</button>
            </div>
            
            <div className="trade-modal-body">
              <div className="trade-info-row">
                <span>현재가</span>
                <strong>{Number(tradeModal.stock.price).toLocaleString()}원</strong>
              </div>
              <div className="trade-quantity-control">
                <span>수량</span>
                <div className="quantity-buttons">
                  <button onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}>-</button>
                  <input 
                    type="number" 
                    value={tradeQuantity} 
                    onChange={(e) => setTradeQuantity(Math.max(1, Number(e.target.value)))} 
                  />
                  <button onClick={() => setTradeQuantity(tradeQuantity + 1)}>+</button>
                </div>
              </div>
              <div className="trade-total-price">
                <span>총 주문 금액</span>
                <strong className={tradeModal.type === 'buy' ? 'text-red' : 'text-blue'}>
                  {(tradeModal.stock.price * tradeQuantity).toLocaleString()}원
                </strong>
              </div>
            </div>

            <div className="trade-modal-footer">
              <button className="btn-cancel" onClick={closeTradeModal}>취소</button>
              <button 
                className={`btn-submit ${tradeModal.type}`} 
                onClick={handleTradeSubmit}
              >
                {tradeModal.type === 'buy' ? '매수하기' : '매도하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks;