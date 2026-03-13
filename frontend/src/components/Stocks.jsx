import React, { useMemo, useState } from 'react'
import './Stocks.css'

const stockData = {
  popular: [
    { id: 1, name: '삼성전자', price: '73,200원', change: '+1,200원', rate: '+1.67%' },
    { id: 2, name: 'SK하이닉스', price: '198,400원', change: '+2,500원', rate: '+1.28%' },
    { id: 3, name: 'NAVER', price: '212,000원', change: '-1,000원', rate: '-0.47%' },
    { id: 4, name: '카카오', price: '41,350원', change: '+350원', rate: '+0.85%' },
    { id: 5, name: '현대차', price: '238,500원', change: '-2,000원', rate: '-0.83%' },
  ],
  rising: [
    { id: 1, name: '한화에어로스페이스', price: '412,000원', change: '+18,000원', rate: '+4.57%' },
    { id: 2, name: 'POSCO홀딩스', price: '365,500원', change: '+9,500원', rate: '+2.67%' },
    { id: 3, name: 'LG화학', price: '298,000원', change: '+6,000원', rate: '+2.05%' },
    { id: 4, name: '삼성전자', price: '73,200원', change: '+1,200원', rate: '+1.67%' },
  ],
  falling: [
    { id: 1, name: '에코프로', price: '91,300원', change: '-4,700원', rate: '-4.90%' },
    { id: 2, name: '카카오', price: '41,350원', change: '-1,250원', rate: '-2.94%' },
    { id: 3, name: '현대차', price: '238,500원', change: '-2,000원', rate: '-0.83%' },
    { id: 4, name: 'NAVER', price: '212,000원', change: '-1,000원', rate: '-0.47%' },
  ],
}

const holdings = [
  { id: 1, name: '삼성전자', info: '12주 보유' },
  { id: 2, name: 'NAVER', info: '3주 보유' },
  { id: 3, name: '현대차', info: '2주 보유' },
]

const favorites = [
  { id: 1, name: '카카오', info: '관심 종목' },
  { id: 2, name: 'LG화학', info: '관심 종목' },
  { id: 3, name: 'SK하이닉스', info: '관심 종목' },
]

const tabTitleMap = {
  popular: '인기 종목',
  rising: '급상승 종목',
  falling: '급하락 종목',
}

const Stocks = () => {
  const [activeTab, setActiveTab] = useState('popular')
  const [searchKeyword, setSearchKeyword] = useState('')

  const filteredStocks = useMemo(() => {
    const currentList = stockData[activeTab]

    if (!searchKeyword.trim()) return currentList

    return currentList.filter((stock) =>
      stock.name.toLowerCase().includes(searchKeyword.toLowerCase())
    )
  }, [activeTab, searchKeyword])

  return (
    <div className='stocks-container'>
      <div className='stocks-breadcrumb'>대시보드 &gt; 전략실 &gt; 주식</div>

      <div className='stocks-layout'>
        {/* 왼쪽 메인 영역 */}
        <div className='stocks-main'>
          <div className='stocks-search-box'>
            <label className='stocks-label' htmlFor='stock-search'>
              주식 검색
            </label>

            <input
              id='stock-search'
              type='text'
              className='stocks-search-input'
              placeholder='주식 검색'
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <div className='stocks-tab-group'>
            <button
              type='button'
              className={`stocks-tab ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              인기 종목
            </button>

            <button
              type='button'
              className={`stocks-tab ${activeTab === 'rising' ? 'active' : ''}`}
              onClick={() => setActiveTab('rising')}
            >
              급상승 종목
            </button>

            <button
              type='button'
              className={`stocks-tab ${activeTab === 'falling' ? 'active' : ''}`}
              onClick={() => setActiveTab('falling')}
            >
              급하락 종목
            </button>
          </div>

          <div className='stocks-chart-panel'>
            <div className='stocks-panel-header'>
              <h3>{tabTitleMap[activeTab]}</h3>
              <span>{filteredStocks.length}개 종목</span>
            </div>

            <div className='stocks-list'>
              {filteredStocks.length > 0 ? (
                filteredStocks.map((stock) => (
                  <div className='stocks-list-item' key={stock.id}>
                    <div className='stocks-item-left'>
                      <p className='stocks-item-name'>{stock.name}</p>
                      <span className='stocks-item-price'>{stock.price}</span>
                    </div>

                    <div className='stocks-item-right'>
                      <p
                        className={
                          stock.change.startsWith('+')
                            ? 'stocks-up'
                            : 'stocks-down'
                        }
                      >
                        {stock.change}
                      </p>
                      <span
                        className={
                          stock.rate.startsWith('+')
                            ? 'stocks-up'
                            : 'stocks-down'
                        }
                      >
                        {stock.rate}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='stocks-empty'>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽 사이드 영역 */}
        <div className='stocks-side'>
          <div className='stocks-card small'>
            <h3>💹 보유 주식</h3>
            <div className='stocks-card-body'>
              {holdings.map((stock) => (
                <div className='side-stock-item' key={stock.id}>
                  <p>{stock.name}</p>
                  <span>{stock.info}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='stocks-card small'>
            <h3>💖 찜한 주식</h3>
            <div className='stocks-card-body'>
              {favorites.map((stock) => (
                <div className='side-stock-item' key={stock.id}>
                  <p>{stock.name}</p>
                  <span>{stock.info}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stocks