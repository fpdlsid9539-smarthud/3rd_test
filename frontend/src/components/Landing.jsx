import React, { useEffect, useMemo, useRef, useState } from 'react'
import './Landing.css'
import FAQPage from './FAQPage'
import kakao from '../assets/kakao.svg'
import google from '../assets/google.svg'
import home from '../assets/icons/home.svg'
import service from '../assets/icons/bar-chart.svg'
import faqIcon from '../assets/icons/megaphone.svg'
import minus from '../assets/icons/minus.svg'
import plus from '../assets/icons/plus.svg'
import close from '../assets/icons/close.svg'
import MarketBackground from './MarketBackground'
import finsight from '../assets/finsight.svg'
import logo from '../assets/logo-long.svg'
import idk from '../assets/idk.jpg'
import BackgroundGrid from './BackgroundGrid'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Landing = ({ setPage }) => {
  const [faqList, setFaqList] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [openFaqId, setOpenFaqId] = useState(null)
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [faqModalTarget, setFaqModalTarget] = useState('top')

  const topRef = useRef(null)
  const serviceRef = useRef(null)
  const faqRef = useRef(null)

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('member')
    localStorage.removeItem('nickname')
    sessionStorage.clear()
  }

  const scrollToSection = (elementRef) => {
    elementRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleKakaoLogin = () => {
    clearAuth()
    window.location.href = `${BACKEND_URL}/api/auth/kakao`
  }

  const handleGoogleLogin = () => {
    clearAuth()
    window.location.href = `${BACKEND_URL}/api/auth/google`
  }

  const getFaqCategory = (faq) => {
    const text = `${faq?.question || ''} ${faq?.answer || ''}`.toLowerCase()

    if (
      text.includes('로그인') ||
      text.includes('카카오') ||
      text.includes('구글') ||
      text.includes('계정')
    ) {
      return '로그인'
    }

    if (
      text.includes('퀴즈') ||
      text.includes('교육') ||
      text.includes('학습')
    ) {
      return '학습'
    }

    if (
      text.includes('투자') ||
      text.includes('주식') ||
      text.includes('실전') ||
      text.includes('가상')
    ) {
      return '투자'
    }

    if (
      text.includes('포인트') ||
      text.includes('랭킹') ||
      text.includes('isr')
    ) {
      return '성장'
    }

    return '기타'
  }

  const goToFaqPage = (focusTarget = 'top') => {
    setFaqModalTarget(focusTarget)
    setFaqModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeFaqModal = () => {
    setFaqModalOpen(false)
    document.body.style.overflow = ''
  }

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/faq?limit=5`)
        const data = await res.json()

        if (data?.success && Array.isArray(data.data)) {
          setFaqList(data.data)
        } else {
          setFaqList([])
        }
      } catch (err) {
        console.error('FAQ 불러오기 실패:', err)
        setFaqList([])
      }
    }

    fetchFaq()
  }, [])

  const categories = useMemo(() => {
    const dynamicCategories = faqList.map((faq) => getFaqCategory(faq))
    return ['전체', ...Array.from(new Set(dynamicCategories))]
  }, [faqList])

  const filteredFaqList = useMemo(() => {
    return faqList.filter((faq) => {
      const category = getFaqCategory(faq)
      const keyword = searchKeyword.trim().toLowerCase()
      const targetText = `${faq.question || ''} ${faq.answer || ''}`.toLowerCase()

      const categoryMatched =
        selectedCategory === '전체' || selectedCategory === category

      const keywordMatched =
        keyword === '' || targetText.includes(keyword)

      return categoryMatched && keywordMatched
    })
  }, [faqList, selectedCategory, searchKeyword])

  const toggleFaq = (faqId) => {
    setOpenFaqId((prev) => (prev === faqId ? null : faqId))
  }

  return (
    <div className='white-section' ref={topRef}>
      <MarketBackground />
      <BackgroundGrid />

      <div className='landing-header'>
        <div className='header-logo'>
          <img src={finsight} alt='logo' className='landing-logo2' />
          <img src={logo} alt='logo' className='landing-logo' />
        </div>

        <div className='landing-navigation'>
          <div className='landing-btn'>
            <button
              className='landing-navigation-menu'
              onClick={() => scrollToSection(topRef)}
            >
              <img src={home} alt='home' className='landing-menu' />
              <p>홈</p>
            </button>

            <button
              className='landing-navigation-menu'
              onClick={() => scrollToSection(serviceRef)}
            >
              <img src={service} alt='service' className='landing-menu' />
              <p>서비스</p>
            </button>

            <button
              className='landing-navigation-menu'
              onClick={() => scrollToSection(faqRef)}
            >
              <img src={faqIcon} alt='faq' className='landing-menu' />
              <p>FAQ</p>
            </button>
          </div>
        </div>

        <div className='floating-nav'>
          <button className='kakao_btn' onClick={handleKakaoLogin}>
            <img src={kakao} alt='카카오' />
            <span>로그인</span>
          </button>

          <button className='google_btn' onClick={handleGoogleLogin}>
            <img src={google} alt='구글' />
            <span>로그인</span>
          </button>
        </div>
      </div>

      <div className='container'>
        <div>
          <div className='title'>
            <h1 className='hero-title'>투자를 <span className='text-gradient'>게임처럼</span> 배우다</h1>
          </div>
          <div className='title-description'>
            <p>주식 차트 분석, 투자 판단, 그리고 나만의 투자 성향 분석까지.</p>
            <p>실전 데이터를 기반으로 투자 감각을 훈련하는 금융 트레이닝 플랫폼입니다.</p>
          </div>
        </div>

        <div className='ad-title'>
          <h2>많은 사람들이 투자에 관심이 있지만,</h2>
          <div className='intro-description'>
            <p>어디서부터 시작해야 할지 모르고...</p>
            <p>차트와 용어가 어렵고...</p>
            <p>그래서 우리는 투자를 안전하게 연습할 수 있는 공간을 만들었습니다.</p>
            <p>여기서는 실제 시장 데이터를 기반으로 투자 판단을 연습하고 자신의 투자 스타일을 분석할 수 있습니다.</p>
          </div>
        </div>

        <div className='ad-grid' ref={serviceRef} >

          <div className='intro-container span-first-two'>
            <div className='image-container'>
              <div className='image-cover' />
              <img src={idk} alt="ikd" className='landing-idk' />
            </div>
            <div className='intro-title'>
              <h2>"투자가 무서우신가요?"</h2>
              <div className='intro-description'>
                <p>어렵고 복잡한 차트, 잃을까 봐 두려운 내 자산. <br />
                  FinSight는 실제 데이터를 활용한 가상 환경을 제공합니다.</p>
                <ul>
                  <li>포인트를 모으는 재미</li>
                  <li>리스크 제로의 투자 연습</li>
                  <li>실시간 랭킹 시스템</li>
                </ul>
              </div>
            </div>
          </div>

          <div className='ad-title span-last-two'>
            <h2>게임처럼 성장하세요!</h2>
            <div className='intro-description'>
              <p>이 플랫폼은 단순한 학습 사이트가 아닙니다.</p>
              <ul>
                <li>포인트를 모으고,</li>
                <li>투자 판단을 연습하고,</li>
                <li>랭킹에 도전할 수 있습니다.</li>
              </ul>
              <p>목표는 단 하나, <strong>더 나은 투자 판단 능력 만들기.</strong></p>
            </div>
          </div>

          <div className='ad-title span-first-two'>
            <h2>실제 돈은 사용하지 않습니다!</h2>
            <div className='intro-description'>
              <p>이 플랫폼은 투자 연습을 위한 트레이닝 공간입니다.</p>
              <ul>
                <li>실제 돈 사용 없음.</li>
                <li>위험 없는 투자 연습하기.</li>
                <li>데이터 기반 학습하기.</li>
              </ul>
              <p>실수를 통해 배우고 투자 감각을 키워보세요.</p>
            </div>
          </div>

          <div className='ad-title span-last-two'>
            <h2>왜 우리가 이걸 만들었는가?</h2>
            <div className='intro-description'>
              <p>이 플랫폼은 단순한 학습 사이트가 아닙니다.</p>
              <p>우리도 투자 초보였고, <strong>어디서부터 시작해야 할지 몰랐습니다.</strong></p>
            </div>
          </div>

          <div className='ad-title span-first-two'>
            <h2>당신의 투자 성향은 어떤 모습인가요?</h2>
            <div className='intro-description'>
              <p>지금 시작하고 나의 투자 실력을 확인해보세요.</p>
            </div>
          </div>

        </div>

        <section id='faq-section' className='landing-faq-section' ref={faqRef}>
          <div className='landing-faq-header'>
            <p className='landing-faq-subtitle'>FAQ PREVIEW</p>
            <h2>자주 묻는 질문</h2>
            <p className='landing-faq-preview-desc'>
              자주 찾는 질문만 먼저 모아봤습니다. 전체 내용과 질문 남기기는 FAQ 페이지에서 볼 수 있습니다.
            </p>
          </div>

          <div className='landing-faq-toolbar'>
            <div className='landing-faq-categories'>
              {categories.map((category) => (
                <button
                  key={category}
                  type='button'
                  className={`landing-faq-chip ${selectedCategory === category ? 'active' : ''
                    }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <input
              type='text'
              className='landing-faq-search'
              placeholder='질문 검색'
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>

          <div className='landing-faq-list'>
            {filteredFaqList.length === 0 ? (
              <p className='faq-empty'>검색 결과가 없습니다.</p>
            ) : (
              filteredFaqList.map((faq) => {
                const isOpen = openFaqId === faq.faq_id
                const category = getFaqCategory(faq)

                return (
                  <div key={faq.faq_id} className='landing-faq-accordion'>
                    <button
                      type='button'
                      className={`landing-faq-question-row ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleFaq(faq.faq_id)}
                    >
                      <div className='landing-faq-question-left'>
                        <span className={`landing-faq-badge ${category}`}>{category}</span>
                        <span className='landing-faq-question-text'>
                          Q. {faq.question}
                        </span>
                      </div>
                      <span className='landing-faq-toggle'><img src={isOpen ? minus : plus} alt="toggle" /></span>
                    </button>

                    {isOpen && (
                      <div className='landing-faq-answer-box'>
                        <p>A. {faq.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className='landing-faq-preview-actions'>
            <button
              type='button'
              className='landing-faq-primary-btn'
              onClick={() => goToFaqPage('top')}
            >
              전체 FAQ 보기
            </button>

            <button
              type='button'
              className='landing-faq-secondary-btn'
              onClick={() => goToFaqPage('question')}
            >
              질문 남기기
            </button>
          </div>
        </section>
      </div>

      {/* ── FAQ Modal ─────────────────────────────────── */}
      {faqModalOpen && (
        <div className='faq-modal-overlay' onClick={closeFaqModal}>
          <div className='faq-modal-container' onClick={(e) => e.stopPropagation()}>
            <div className='faq-modal-header'>
              <button
                className='faq-modal-close'
                onClick={closeFaqModal}
                aria-label='닫기'
              >
                <img src={close} alt="닫기" />
              </button>
            </div>
            <div className='faq-modal-body'>
              <FAQPage scrollTarget={faqModalTarget} />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Landing