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

const Stocks = () => {
  const [activeTab, setActiveTab] = useState('popular');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSymbol, setExpandedSymbol] = useState(null); 
  const [chartData, setChartData] = useState(null);

  // 💡 모달(팝업) 창 관리를 위한 상태 (어떤 종목? 매수/매도? 수량은?)
  const [tradeModal, setTradeModal] = useState({ isOpen: false, type: '', stock: null });
  const [tradeQuantity, setTradeQuantity] = useState(1);

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

  const handleStockClick = async (symbol) => {
    if (expandedSymbol === symbol) { setExpandedSymbol(null); return; }
    setExpandedSymbol(symbol);
    setChartData(null);
    try {
      const res = await api.get(`/api/stocks/${symbol}/chart`);
      const resultData = res.data.data || res.data;
      setChartData({
        datasets: [{ data: resultData, color: { up: '#ef4444', down: '#3b82f6', unchanged: '#999' } }]
      });
    } catch (err) { console.error(err); }
  };

  // 💡 매수/매도 버튼 클릭 시 모달 열기
  const openTradeModal = (type, stock, e) => {
    e.stopPropagation(); // 차트 열리는 것 방지
    setTradeModal({ isOpen: true, type, stock });
    setTradeQuantity(1); // 수량 1개로 초기화
  };

  // 💡 모달 닫기
  const closeTradeModal = () => {
    setTradeModal({ isOpen: false, type: '', stock: null });
  };

  // 💡 실제 매수/매도 실행 (임시 완료 알림)
  const handleTradeSubmit = () => {
    const actionName = tradeModal.type === 'buy' ? '매수' : '매도';
    alert(`${tradeModal.stock.name} ${tradeQuantity}주 ${actionName}가 완료되었습니다!\n(총 ${(tradeModal.stock.price * tradeQuantity).toLocaleString()}원)`);
    closeTradeModal();
  };

 const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      left: 0,
      right: 0 // 불필요한 레이아웃 여백 제거
    }
  },
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day', // 단위를 일 단위로 설정
        displayFormats: { day: 'MM-dd' }
      },
      bounds: 'data',
      ticks: {
        source: 'auto',       // 💡 자동으로 적절한 월요일 지점을 찾아줌
        maxRotation: 12,
        autoSkip: true,       // 화면 크기에 따라 너무 촘촘하면 자동으로 생략
        maxRotation: 0,
        font: {
          size: 10
        }
      },
      grid: {
        color: '#f0f0f0'
      }
    },
    y: {
      position: 'right',
      grid: { color: '#f0f0f0' }
    }
  },
  plugins: {
    legend: { display: false },
    zoom: {
      // 💡 [핵심 설정] 축소 및 이동 범위를 데이터가 있는 곳까지만 제한
      limits: {
        x: { min: 'original', max: 'original' }, 
      },
      pan: {
        enabled: true,
        mode: 'x',
      },
      zoom: {
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: 'x',
      }
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
                  stocks.map((stock) => (
                    <div key={stock.symbol} className='stock-item-wrap'>
                      <div className='stocks-list-item' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                        <div className='stock-info-clickable' onClick={() => handleStockClick(stock.symbol)} style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingRight: '20px' }}>
                          <div className='stocks-item-left' style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{stock.name}</span>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>{Number(stock.price).toLocaleString()}원</span>
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
                        
                        {/* 💡 매수/매도 버튼에 모달 열기 함수 연결 */}
                        <div className='stock-trade-btns' style={{ display: 'flex', gap: '8px' }}>
                          <button className='trade-btn buy' onClick={(e) => openTradeModal('buy', stock, e)}>매수</button>
                          <button className='trade-btn sell' onClick={(e) => openTradeModal('sell', stock, e)}>매도</button>
                        </div>
                      </div>
                      
                      {expandedSymbol === stock.symbol && (
                        <div className='stock-chart-expanded' style={{ height: '350px', padding: '15px', backgroundColor: '#fcfcfd' }}>
                          {chartData ? <Chart type="candlestick" data={chartData} options={chartOptions} /> : "차트 로딩 중..."}
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
          <div className='stocks-card small'><h3>💹 보유 주식</h3></div>
          <div className='stocks-card small'><h3>💖 찜한 주식</h3></div>
        </div>
      </div>

      {/* 💡 매수/매도 모달 (팝업창) UI */}
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