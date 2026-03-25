import React, { useState } from 'react'
import { loadTossPayments } from '@tosspayments/payment-sdk'
import './Billing.css'

const PAYMENT_OPTIONS = [
  { key: 'toss', name: '토스페이먼츠', description: '현재 우선 지원 중인 결제수단', enabled: true, badge: '사용 가능' },
  { key: 'iamport', name: '아임포트', description: '추후 확장 예정', enabled: false, badge: '준비 중' },
  { key: 'nice', name: '나이스페이먼츠', description: '추후 확장 예정', enabled: false, badge: '준비 중' },
  { key: 'naverpay', name: '네이버페이', description: '추후 확장 예정', enabled: false, badge: '준비 중' },
  { key: 'kakaopay', name: '카카오페이', description: '추후 확장 예정', enabled: false, badge: '준비 중' },
]

const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

const Billing = ({ membershipType, setMembershipType }) => {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('toss')

  const isPremium = membershipType === 'premium'
  const isMembershipLoaded = membershipType !== null

  const handleSelectPayment = (paymentKey, enabled) => {
    if (isPremium || !isMembershipLoaded) return

    if (!enabled) {
      setMessage('현재는 토스페이먼츠만 우선 지원합니다.')
      return
    }

    setMessage('')
    setSelectedPayment(paymentKey)
  }

  const handleUpgrade = async () => {
    try {
      const token = localStorage.getItem('token')

      if (!token) {
        setMessage('로그인이 필요합니다.')
        return
      }

      if (!isMembershipLoaded) {
        setMessage('회원 정보를 확인 중입니다.')
        return
      }

      if (isPremium) {
        setMessage('이미 프리미엄 회원입니다.')
        return
      }

      if (selectedPayment !== 'toss') {
        setMessage('현재는 토스페이먼츠만 우선 지원합니다.')
        return
      }

      setLoading(true)
      setMessage('결제창을 띄우는 중입니다...')

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)

      

      await tossPayments.requestPayment('카드', {
        amount: 9900,
        orderId: `order_${new Date().getTime()}`, // 매번 고유한 주문번호 생성
        orderName: '프리미엄 멤버십 (1개월)',
        customerName: '성준', // 로그인한 유저 이름으로 대체 가능
        successUrl: `${window.location.origin}/payment/success`, // 성공 시 이동할 주소
        failUrl: `${window.location.origin}/payment/fail`,       // 실패 시 이동할 주소
      })

    } catch (err) {
      // 사용자가 결제창을 닫았거나 에러가 발생한 경우
      if (err.code === 'USER_CANCEL') {
        setMessage('결제를 취소하셨습니다.')
      } else {
        setMessage(err.message || '결제 모듈 로드 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="billing-container">
      {/* 화면 렌더링 부분은 기존 코드와 100% 동일하므로 생략 없이 그대로 유지합니다 */}
      <div className={`billing-page ${isPremium ? 'premium-locked' : ''}`}>
        <section className="billing-hero-card">
          <div className="billing-hero-badge">PREMIUM</div>
          <h1 className="billing-title">프리미엄 멤버십</h1>
          <p className="billing-subtitle">
            더 많은 기능과 확장 가능한 결제 구조를 반영한 프리미엄 멤버십 페이지입니다.
          </p>
          <div className="billing-price-area">
            <span className="billing-price">₩9,900</span>
            <span className="billing-price-unit"> / 월</span>
          </div>
          <div className="billing-status-box">
            {!isMembershipLoaded && <span className="billing-status-text">회원 등급 확인 중...</span>}
            {isMembershipLoaded && !isPremium && (
              <span className="billing-status-text free">현재 무료회원입니다. 결제 후 프리미엄으로 전환됩니다.</span>
            )}
            {isMembershipLoaded && isPremium && (
              <span className="billing-status-text premium">이미 프리미엄 회원입니다.</span>
            )}
          </div>
        </section>

        <section className="billing-section">
          <h2 className="billing-section-title">프리미엄 혜택</h2>
          <div className="billing-benefit-list">
            <div className="billing-benefit-item">
              <div className="billing-benefit-title">프리미엄 전용 기능</div>
              <div className="billing-benefit-desc">추가 기능 및 확장 영역을 우선적으로 이용할 수 있습니다.</div>
            </div>
            <div className="billing-benefit-item">
              <div className="billing-benefit-title">추가 학습 콘텐츠</div>
              <div className="billing-benefit-desc">기존 무료 기능 외 확장 학습 기능을 반영할 수 있습니다.</div>
            </div>
            <div className="billing-benefit-item">
              <div className="billing-benefit-title">전략실 확장 가능 구조</div>
              <div className="billing-benefit-desc">향후 프리미엄 전용 전략 기능과 연결하기 쉬운 구조입니다.</div>
            </div>
          </div>
        </section>

        <section className="billing-section">
          <div className="billing-section-head">
            <h2 className="billing-section-title">결제 수단 선택</h2>
            <p className="billing-section-note">
              현재는 토스페이먼츠를 우선 지원하며, 다른 결제수단은 순차적으로 확장 예정입니다.
            </p>
          </div>
          <div className="payment-grid">
            {PAYMENT_OPTIONS.map((option) => {
              const selected = selectedPayment === option.key
              const disabled = !option.enabled || isPremium || !isMembershipLoaded
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`payment-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => handleSelectPayment(option.key, option.enabled)}
                  disabled={isPremium || !isMembershipLoaded}
                >
                  <div className="payment-card-top">
                    <span className="payment-name">{option.name}</span>
                    <span className={`payment-badge ${option.enabled ? 'enabled' : 'soon'}`}>{option.badge}</span>
                  </div>
                  <p className="payment-description">{option.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="billing-section billing-action-section">
          <div className="billing-summary-card">
            <div className="billing-summary-row">
              <span>선택한 결제수단</span>
              <strong>{PAYMENT_OPTIONS.find((item) => item.key === selectedPayment)?.name || '토스페이먼츠'}</strong>
            </div>
            <div className="billing-summary-row">
              <span>멤버십</span>
              <strong>Premium</strong>
            </div>
            <div className="billing-summary-row total">
              <span>결제 금액</span>
              <strong>₩9,900 / 월</strong>
            </div>
          </div>
          <button
            className="billing-upgrade-button"
            onClick={handleUpgrade}
            disabled={loading || isPremium || !isMembershipLoaded}
          >
            {loading ? '결제창 여는 중...' : !isMembershipLoaded ? '확인 중...' : isPremium ? '이미 프리미엄 회원입니다.' : '결제하기'}
          </button>
          {message && <p className="billing-message">{message}</p>}
        </section>
      </div>
    </div>
  )
}

export default Billing