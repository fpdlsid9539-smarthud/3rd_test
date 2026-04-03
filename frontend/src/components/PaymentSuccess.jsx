import React, { useEffect, useState } from 'react';
import './PaymentSuccess.css'; // 🟢 분리된 CSS 파일 불러오기
import { api } from '../config/api';

const PaymentSuccess = () => {
  const [status, setStatus] = useState('결제를 확인하고 있습니다...');

  useEffect(() => {
    // 🟢 자바스크립트 기본 URL 기능으로 파라미터 추출
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId');
    const amount = urlParams.get('amount');

    const confirmPayment = async () => {
      try {
        await api.post('/api/billing/confirm', { paymentKey, orderId, amount });

        setStatus('결제가 성공적으로 완료되었습니다! 프리미엄 혜택을 누려보세요.');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } catch (error) {
        setStatus('결제 처리 중 에러가 발생했습니다.');
      }
    };

    if (paymentKey && orderId && amount) {
      confirmPayment();
    } else {
      setStatus('잘못된 접근입니다.');
    }
  }, []);

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <h2>결제 진행 상태</h2>
        <p>{status}</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;