import React, { useEffect, useMemo, useState } from 'react'
import './Stocks.css'
import { api } from '../config/api'

const tabTitleMap = {
  popular: '인기 종목',
  rising: '급상승 종목',
  falling: '급하락 종목',
}

const Stocks = () => {
  const [activeTab, setActiveTab] = useState('popular')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const response = await api.get('/api/stocks')
        setStocks(response.data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadStocks()
  }, [])

  const normalizedStocks = useMemo(() => {
    return stocks.map((stock, index) => {
      const name = stock.name || stock.shortName || stock.longName || stock.symbol || `종목 ${index + 1}`
      const price = stock.price || stock.regularMarketPrice || stock.close || 0
      const change = stock.change || stock.regularMarketChange || 0
      const rate = stock.rate || stock.regularMarketChangePercent || 0

      return {
        id: stock.symbol || index + 1,
        symbol: stock.symbol || '',
        name,
        price: typeof price === 'number' ? `${price.toLocaleString()}원` : String(price),
        change:
          typeof change === 'number'
            ? `${change >= 0 ? '+' : ''}${change.toLocaleString()}원`
            : String(change),
        rate:
          typeof rate === 'number'
            ? `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`
            : String(rate),
      }
    })
  }, [stocks])

  const filteredStocks = useMemo(() => {
    let currentList = normalizedStocks

    if (activeTab === 'rising') {
      currentList = normalizedStocks.filter((stock) => String(stock.rate).startsWith('+'))
    } else if (activeTab === 'falling') {
      currentList = normalizedStocks.filter((stock) => String(stock.rate).startsWith('-'))
    }

    if (!searchKeyword.trim()) return currentList

    return currentList.filter((stock) =>
      stock.name.toLowerCase().includes(searchKeyword.toLowerCase())
    )
  }, [activeTab, searchKeyword, normalizedStocks])

  if (loading) {
    return <div className='stocks-container'>주식 목록 불러오는 중...</div>
  }

  if (error) {
    return <div className='stocks-container'>오류: {error}</div>
  }

  return (
    <div className='stocks-container'>
      <div className='stocks-breadcrumb'>대시보드 &gt; 전략실 &gt; 주식</div>

      <div className='stocks-layout'>
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
                          String(stock.change).startsWith('+')
                            ? 'stocks-up'
                            : 'stocks-down'
                        }
                      >
                        {stock.change}
                      </p>
                      <span
                        className={
                          String(stock.rate).startsWith('+')
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
                <div className='stocks-empty'>검색 결과가 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div className='stocks-side'>
          <div className='stocks-card small'>
            <h3>💹 보유 주식</h3>
            <div className='stocks-card-body'>
              <div className='side-stock-item'>
                <p>아직 연동 전</p>
                <span>보유 종목 API 연결 예정</span>
              </div>
            </div>
          </div>

          <div className='stocks-card small'>
            <h3>💖 찜한 주식</h3>
            <div className='stocks-card-body'>
              <div className='side-stock-item'>
                <p>아직 연동 전</p>
                <span>찜 목록 API 연결 예정</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stocks