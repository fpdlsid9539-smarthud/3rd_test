import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  TimeSeriesScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';
import zoomPlugin from 'chartjs-plugin-zoom';
import { api } from '../config/api';
import './Stocks.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  TimeSeriesScale,
  CandlestickController,
  CandlestickElement,
  Tooltip,
  Legend,
  zoomPlugin
);

const tabTitleMap = {
  popular: '인기 종목',
  rising: '급상승 종목',
  falling: '급하락 종목',
};

const RANGES = [
  { label: '일', range: '6mo', interval: '1d' },
  { label: '주', range: '2y', interval: '1wk' },
  { label: '월', range: '5y', interval: '1mo' },
  { label: '년', range: '10y', interval: '3mo' },
];

const Stocks = () => {
  const [activeTab, setActiveTab] = useState('popular');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedSymbol, setExpandedSymbol] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [selectedRangeLabel, setSelectedRangeLabel] = useState('일');

  const [tradeModal, setTradeModal] = useState({
    isOpen: false,
    type: '',
    stock: null,
  });
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeLoading, setTradeLoading] = useState(false);

  const [tradeHistory, setTradeHistory] = useState([]);
  const [ownedStocks, setOwnedStocks] = useState([]);
  const [likedStocks, setLikedStocks] = useState([]);
  const [likedCodeSet, setLikedCodeSet] = useState(new Set());

  const normalizeArray = (res) => {
    const data = res?.data?.data ?? res?.data ?? [];
    return Array.isArray(data) ? data : [];
  };

  const getStockCode = (stock) =>
    String(stock?.symbol ?? stock?.stockCode ?? '').padStart(6, '0');

  const getStockName = (stock) => stock?.name ?? stock?.stockName ?? '알 수 없음';

  const getStockPrice = (stock) => Number(stock?.price ?? 0);

  const toTradeStock = (stock) => ({
    symbol: getStockCode(stock),
    name: getStockName(stock),
    price: getStockPrice(stock),
  });

  const fetchTradeHistory = async () => {
    try {
      const res = await api.get('/api/points/notifications');

      const payload = res?.data?.data ? res.data : res?.data ? res : {};
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];

      const tradeData = list
        .filter((item) => {
          const type = String(item.type || '');
          return (
            type.includes('매수') || type.includes('매도')
          );
        })
        .map((item) => {
          const typeText = String(item.type || '');
          const isBuy = typeText.includes('매수');
          const isSell = typeText.includes('매도');

          const match = typeText.match(/^(.*)\s(\d+)주\s(매수|매도)$/);

          const dateObj = new Date(item.createdAt);
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getDate()).padStart(2, '0');
          const hh = String(dateObj.getHours()).padStart(2, '0');
          const mm = String(dateObj.getMinutes()).padStart(2, '0');
          const dateStr = `${y}. ${m}. ${d} ${hh}:${mm}`;

          if (!match) return null;

          const stockName = match.at(1) || '알 수 없음';
          const quantity = match.at(2) || '0';
          const price = Math.abs(Number(item.changeAmount));

          return {
            id: item.history_id,
            stockName,
            type: isBuy ? 'buy' : isSell ? 'sell' : 'etc',
            quantity,
            price,
            date: dateStr,
          };
        })
        .filter(Boolean)
        .slice(0, 10);

      setTradeHistory(tradeData);
    } catch (err) {
      console.error('매매 내역 로딩 실패:', err);
      setTradeHistory([]);
    }
  };

  const fetchStocks = async (keyword = '') => {
    setLoading(true);
    setExpandedSymbol(null);
    setChartData(null);

    try {
      const url = keyword
        ? `/api/stocks?keyword=${encodeURIComponent(keyword)}`
        : `/api/stocks?type=${activeTab}`;

      const res = await api.get(url);
      const resultData = normalizeArray(res);
      setStocks(resultData);
    } catch (err) {
      console.error('주식 목록 로드 실패:', err);
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSideStocks = async () => {
    try {
      const [ownedRes, likedRes] = await Promise.all([
        api.get('/api/stocks/owned'),
        api.get('/api/stocks/liked'),
      ]);

      const ownedData = normalizeArray(ownedRes);
      const likedData = normalizeArray(likedRes);

      setOwnedStocks(ownedData);
      setLikedStocks(likedData);
      setLikedCodeSet(new Set(likedData.map((item) => String(item.stockCode).padStart(6, '0'))));
    } catch (err) {
      console.error('사이드 주식 로드 실패:', err);
      setOwnedStocks([]);
      setLikedStocks([]);
      setLikedCodeSet(new Set());
    }
  };

  useEffect(() => {
    if (activeTab !== 'search') {
      fetchStocks();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSideStocks();
    fetchTradeHistory();
  }, []);

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
      const res = await api.get(
        `/api/stocks/${symbol}/chart?range=${rangeItem.range}&interval=${rangeItem.interval}`
      );

      let resultData = res?.data?.data ?? res?.data ?? [];

      if (Array.isArray(resultData)) {
        resultData = [...resultData].sort((a, b) => {
          const ax = new Date(a.x).getTime();
          const bx = new Date(b.x).getTime();
          return ax - bx;
        });
      } else {
        resultData = [];
      }

      setChartData({
        datasets: [
          {
            data: resultData,
            color: {
              up: '#26a69a',
              down: '#ef4444',
              unchanged: '#999',
            },
          },
        ],
      });
    } catch (err) {
      console.error('차트 로드 실패:', err);
      setChartData(null);
    }
  };

  const handleStockClick = async (symbol) => {
    if (expandedSymbol === symbol) {
      setExpandedSymbol(null);
      setChartData(null);
      return;
    }

    setExpandedSymbol(symbol);

    const defaultRange = RANGES.find((r) => r.label === '일');
    if (defaultRange) {
      fetchStockChart(symbol, defaultRange);
    }
  };

  const openTradeModal = (type, stock, e) => {
    e?.stopPropagation?.();
    setTradeModal({
      isOpen: true,
      type,
      stock: toTradeStock(stock),
    });
    setTradeQuantity(1);
  };

  const closeTradeModal = () => {
    if (tradeLoading) return;
    setTradeModal({ isOpen: false, type: '', stock: null });
    setTradeQuantity(1);
  };

  const isLiked = (stockCode) => likedCodeSet.has(String(stockCode).padStart(6, '0'));

  const handleToggleLike = async (stock, e) => {
    e?.stopPropagation?.();

    const stockCode = getStockCode(stock);

    try {
      const res = await api.post(`/api/stocks/${stockCode}/like`);
      const payload = res?.data?.data ?? res?.data ?? {};
      const liked = Boolean(payload.liked);

      setLikedCodeSet((prev) => {
        const next = new Set(prev);
        if (liked) next.add(stockCode);
        else next.delete(stockCode);
        return next;
      });

      await Promise.all([
        fetchSideStocks(),
        fetchTradeHistory(),
      ]);

      window.dispatchEvent(new Event('pointsUpdated'));
    } catch (err) {
      console.error('찜 토글 실패:', err);
      alert(err?.response?.data?.message || err?.message || '찜하기 처리에 실패했습니다.');
    }
  };

  const handleTradeSubmit = async () => {
    if (!tradeModal.stock) return;

    const quantity = Number(tradeQuantity);
    const unitPrice = Number(tradeModal.stock.price);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      alert('수량은 1 이상의 정수여야 합니다.');
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      alert('현재 가격 정보가 올바르지 않습니다.');
      return;
    }

    const actionPath = tradeModal.type === 'buy' ? 'buy' : 'sell';

    try {
      setTradeLoading(true);

      const res = await api.post(`/api/stocks/${tradeModal.stock.symbol}/${actionPath}`, {
        quantity,
        unitPrice,
      });

      const message =
        res?.data?.message || (tradeModal.type === 'buy' ? '매수 완료' : '매도 완료');

      alert(message);

      await Promise.all([
        fetchSideStocks(),
        activeTab === 'search' ? fetchStocks(searchKeyword) : fetchStocks(),
        fetchTradeHistory(),
      ]);

      window.dispatchEvent(new Event('pointsUpdated'));
      closeTradeModal();
    } catch (err) {
      console.error('거래 실패:', err);
      alert(err?.response?.data?.message || err?.message || '거래 처리에 실패했습니다.');
    } finally {
      setTradeLoading(false);
    }
  };

  let timeUnit = 'month';
  let xFormat = 'MM/dd';
  let tipFormat = 'yyyy-MM-dd';

  if (selectedRangeLabel === '일') {
    timeUnit = 'day';
    xFormat = 'MM/dd';
    tipFormat = 'yyyy-MM-dd';
  } else if (selectedRangeLabel === '주') {
    timeUnit = 'month';
    xFormat = 'yy.MM';
    tipFormat = 'yyyy-MM-dd';
  } else if (selectedRangeLabel === '월') {
    timeUnit = 'year';
    xFormat = 'yyyy.MM';
    tipFormat = 'yyyy-MM';
  } else if (selectedRangeLabel === '년') {
    timeUnit = 'year';
    xFormat = 'yyyy';
    tipFormat = 'yyyy-MM';
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { left: 5, right: 5, top: 10, bottom: 0 },
    },
    scales: {
      x: {
        type: 'timeseries',
        time: {
          unit: timeUnit,
          displayFormats: {
            day: xFormat,
            month: xFormat,
            year: xFormat,
          },
          tooltipFormat: tipFormat,
        },
        bounds: 'data',
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 6,
          maxRotation: 0,
          color: '#8b95a1',
          font: {
            size: 11,
            weight: '500',
          },
        },
      },
      y: {
        position: 'right',
        grid: {
          color: '#f2f4f6',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: '#8b95a1',
          font: { size: 11 },
          callback: function (value) {
            return Number(value).toLocaleString();
          },
        },
      },
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
              `종가: ${Number(point.c).toLocaleString()}원`,
            ];
          },
        },
      },
      zoom: {
        limits: { x: { min: 'original', max: 'original' } },
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
    },
  };

  const ownedMap = useMemo(() => {
    const map = new Map();
    ownedStocks.forEach((item) => {
      map.set(String(item.stockCode).padStart(6, '0'), item);
    });
    return map;
  }, [ownedStocks]);

  return (
    <div className='stocks-container'>
      <div className='stocks-breadcrumb'>대시보드 &gt; 전략실 &gt; 주식</div>

      <div className='stocks-layout'>
        <div className='stocks-main'>
          <div className='stocks-search-row'>
            <input
              type='text'
              className='stocks-search-input'
              placeholder='종목코드 또는 이름 검색'
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className='stocks-search-btn' onClick={handleSearch}>
              검색
            </button>
          </div>

          <div className='stocks-tab-group'>
            {Object.keys(tabTitleMap).map((tab) => (
              <button
                key={tab}
                className={`stocks-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabClick(tab)}
              >
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
              {loading ? (
                <div className='stocks-empty'>데이터 로딩 중...</div>
              ) : stocks.length > 0 ? (
                stocks.map((stock, index) => {
                  const stockCode = getStockCode(stock);
                  const liked = isLiked(stockCode);
                  const ownedInfo = ownedMap.get(stockCode);

                  return (
                    <div key={stockCode} className='stock-item-wrap'>
                      <div className='stocks-list-item'>
                        <div
                          className='stock-info-clickable'
                          onClick={() => handleStockClick(stockCode)}
                        >
                          <div className='stocks-info-group'>
                            <div className='stock-rank-badge'>{index + 1}</div>

                            <div className='stocks-item-left'>
                              <span className='stocks-item-title'>{stock.name}</span>
                              <span className='stocks-item-price'>
                                {Number(stock.price || 0).toLocaleString()}원
                              </span>
                              {ownedInfo ? (
                                <span className='stocks-owned-badge'>
                                  보유 {ownedInfo.quantity}주
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className='stocks-item-right'>
                            <span
                              className={Number(stock.change || 0) >= 0 ? 'stocks-up' : 'stocks-down'}
                            >
                              {Number(stock.change || 0) >= 0 ? '+' : ''}
                              {Number(stock.change || 0).toLocaleString()}원
                            </span>
                            <span
                              className={Number(stock.rate || 0) >= 0 ? 'stocks-up' : 'stocks-down'}
                            >
                              {Number(stock.rate || 0) >= 0 ? '+' : ''}
                              {Number(stock.rate || 0).toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        <div className='stock-trade-btns'>
                          <button
                            type='button'
                            className={`side-like-btn ${liked ? 'liked' : ''}`}
                            onClick={(e) => handleToggleLike(stock, e)}
                            title={liked ? '찜 해제' : '찜하기'}
                          >
                            {liked ? '♥' : '♡'}
                          </button>

                          <button
                            className='trade-btn buy'
                            onClick={(e) => openTradeModal('buy', stock, e)}
                          >
                            매수
                          </button>
                          <button
                            className='trade-btn sell'
                            onClick={(e) => openTradeModal('sell', stock, e)}
                          >
                            매도
                          </button>
                        </div>
                      </div>

                      {expandedSymbol === stockCode && (
                        <div className='stock-chart-expanded'>
                          <div className='chart-toolbar'>
                            <div className='chart-legend-badge'>
                              <span className='legend-item'>
                                <span className='color-box up'></span> 상승
                              </span>
                              <span className='legend-item'>
                                <span className='color-box down'></span> 하락
                              </span>
                            </div>

                            <div className='chart-range-group'>
                              {RANGES.map((r) => (
                                <button
                                  key={r.label}
                                  className={`chart-range-btn ${
                                    selectedRangeLabel === r.label ? 'active' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchStockChart(stockCode, r);
                                  }}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className='chart-render-area'>
                            {chartData ? (
                              <Chart type='candlestick' data={chartData} options={chartOptions} />
                            ) : (
                              <div className='stocks-empty'>차트 로딩 중...</div>
                            )}
                          </div>

                          <div className='chart-notice'>
                            * 본 차트는 글로벌 금융 표준 색상(상승: 초록색, 하락: 빨간색)을 따르고 있습니다.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className='stocks-empty'>조회된 종목이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className='stocks-side'>
          <div className='stocks-card'>
            <h3>💹 보유 주식</h3>
            <div className='stocks-card-body'>
              {ownedStocks.length > 0 ? (
                ownedStocks.map((stock) => (
                  <div key={`owned-${stock.stockCode}`} className='side-stock-item'>
                    <div className='side-stock-top'>
                      <p>{stock.stockName}</p>
                      <p>
                        {stock.price !== null && stock.price !== undefined
                          ? `${Number(stock.price).toLocaleString()}원`
                          : '-'}
                      </p>
                    </div>

                    <div className='side-stock-mid'>
                      <span>
                        {stock.quantity}주 (평단가 {Number(stock.avgPrice || 0).toLocaleString()}원)
                      </span>
                      <span
                        className={Number(stock.changeRate || 0) >= 0 ? 'stocks-up' : 'stocks-down'}
                      >
                        {stock.changeRate !== null && stock.changeRate !== undefined
                          ? `${Number(stock.changeRate) >= 0 ? '+' : ''}${Number(
                              stock.changeRate
                            ).toFixed(2)}%`
                          : '-'}
                      </span>
                    </div>

                    <div className='side-stock-actions'>
                      <button
                        className='trade-btn buy side'
                        onClick={(e) => openTradeModal('buy', stock, e)}
                      >
                        매수
                      </button>
                      <button
                        className='trade-btn sell side'
                        onClick={(e) => openTradeModal('sell', stock, e)}
                      >
                        매도
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className='stocks-empty side-empty'>보유 주식이 없습니다.</div>
              )}
            </div>
          </div>

          <div className='stocks-card'>
            <h3>💖 찜한 주식</h3>
            <div className='stocks-card-body'>
              {likedStocks.length > 0 ? (
                likedStocks.map((stock) => {
                  const liked = isLiked(stock.stockCode);

                  return (
                    <div key={`liked-${stock.stockCode}`} className='side-stock-item'>
                      <div className='side-stock-top'>
                        <p>{stock.stockName}</p>
                        <p>
                          {stock.price !== null && stock.price !== undefined
                            ? `현재가 ${Number(stock.price).toLocaleString()}원`
                            : '-'}
                        </p>
                      </div>

                      <div className='side-stock-mid'></div>

                      <div className='side-liked-actions'>
                        <button
                          type='button'
                          className='trade-btn buy liked-buy'
                          onClick={(e) => openTradeModal('buy', stock, e)}
                        >
                          매수
                        </button>

                        <button
                          type='button'
                          className='side-like-btn liked'
                          onClick={(e) => handleToggleLike(stock, e)}
                          title='찜 해제'
                        >
                          ♥
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className='stocks-empty side-empty'>찜한 주식이 없습니다.</div>
              )}
            </div>
          </div>

          <div className='stocks-card'>
            <h3>최근 매매 내역</h3>
            <div className='st-history-list'>
              {tradeHistory.length === 0 ? (
                <div className='stocks-empty side-empty'>매매 내역이 없습니다.</div>
              ) : (
                tradeHistory.map((item) => (
                  <div key={item.id} className='st-history-item'>
                    <div className='st-history-left'>
                      <div className='st-history-name'>{item.stockName}</div>
                      <div className='st-history-date'>{item.date}</div>
                    </div>

                    <div
                      className={`st-history-right ${
                        item.type === 'buy'
                          ? 'buy'
                          : item.type === 'sell'
                          ? 'sell'
                          : 'buy'
                      }`}
                    >
                      <div className='st-history-action'>
                        {item.type === 'buy' && `매수 ${item.quantity}주`}
                        {item.type === 'sell' && `매도 ${item.quantity}주`}
                        {item.type === 'like' && '찜하기'}
                        {item.type === 'unlike' && '찜 해제'}
                      </div>
                      <div className='st-history-price'>
                        {item.price ? `${item.price.toLocaleString()}원` : '0원'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {tradeModal.isOpen && tradeModal.stock && (
        <div className='trade-modal-overlay' onClick={closeTradeModal}>
          <div className='trade-modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='trade-modal-header'>
              <h2>{tradeModal.stock.name}</h2>
              <button className='trade-modal-close' onClick={closeTradeModal}>
                &times;
              </button>
            </div>

            <div className='trade-modal-body'>
              <div className='trade-info-row'>
                <span>현재가</span>
                <strong>{Number(tradeModal.stock.price || 0).toLocaleString()}원</strong>
              </div>

              <div className='trade-quantity-control'>
                <span>수량</span>
                <div className='quantity-buttons'>
                  <button
                    type='button'
                    onClick={() => setTradeQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={tradeLoading}
                  >
                    -
                  </button>
                  <input
                    type='number'
                    min='1'
                    value={tradeQuantity}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setTradeQuantity(
                        Number.isFinite(value) && value > 0 ? Math.floor(value) : 1
                      );
                    }}
                    disabled={tradeLoading}
                  />
                  <button
                    type='button'
                    onClick={() => setTradeQuantity((prev) => prev + 1)}
                    disabled={tradeLoading}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className='trade-total-price'>
                <span>총 주문 금액</span>
                <strong className={tradeModal.type === 'buy' ? 'text-red' : 'text-blue'}>
                  {(Number(tradeModal.stock.price || 0) * tradeQuantity).toLocaleString()}원
                </strong>
              </div>
            </div>

            <div className='trade-modal-footer'>
              <button className='btn-cancel' onClick={closeTradeModal} disabled={tradeLoading}>
                취소
              </button>
              <button
                className={`btn-submit ${tradeModal.type}`}
                onClick={handleTradeSubmit}
                disabled={tradeLoading}
              >
                {tradeLoading ? '처리 중...' : tradeModal.type === 'buy' ? '매수하기' : '매도하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stocks;