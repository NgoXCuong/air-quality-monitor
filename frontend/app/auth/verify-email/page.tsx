'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { authApi } from '../../../lib/api';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token xác thực không hợp lệ.');
      return;
    }
    authApi.verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
      });
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-right" style={{ width: '100%' }}>
        <div className="auth-card" style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
            }}>🌬️</div>
            <span style={{
              fontWeight: 700, fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>AirQuality Monitor</span>
          </div>

          {status === 'loading' && (
            <>
              <div className="verify-icon">⏳</div>
              <h2 className="verify-title">Đang xác thực...</h2>
              <p className="verify-text">Vui lòng chờ trong giây lát.</p>
            </>
          )}

          {status === 'success' && (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <h2 className="verify-title">Xác thực thành công!</h2>
              <p className="verify-text">{message}</p>
              <a href="/auth">
                <button className="btn-primary">Đăng nhập ngay</button>
              </a>
            </div>
          )}

          {status === 'error' && (
            <>
              <div className="verify-icon" style={{ fontSize: '3rem' }}>❌</div>
              <h2 className="verify-title" style={{ color: '#fca5a5' }}>Xác thực thất bại</h2>
              <p className="verify-text">{message}</p>
              <div className="alert alert-warning" style={{ textAlign: 'left' }}>
                <span>💡</span>
                <span>Link xác thực chỉ có hiệu lực một lần. Hãy yêu cầu gửi lại email.</span>
              </div>
              <a href="/auth">
                <button className="btn-primary">Quay lại</button>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1e' }} />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
