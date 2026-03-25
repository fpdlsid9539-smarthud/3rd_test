import React, { useEffect, useState } from 'react';
import './PaymentSuccess.css'; // 🟢 분리된 CSS 파일 불러오기

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
        const response = await fetch('http://localhost:5000/api/billing/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ paymentKey, orderId, amount })
        });

        if (response.ok) {
          setStatus('결제가 성공적으로 완료되었습니다! 프리미엄 혜택을 누려보세요.');
          // 3초 뒤 메인 화면으로 리다이렉트
          setTimeout(() => {
            window.location.href = '/'; 
          }, 3000); 
        } else {
          setStatus('결제 승인에 실패했습니다. 관리자에게 문의하세요.');
        }
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