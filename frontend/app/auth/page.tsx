'use client';
import { useState, useEffect } from 'react';
import RegisterForm from './_components/RegisterForm';
import LoginForm from './_components/LoginForm';
import ForgotPasswordForm from './_components/ForgotPasswordForm';
import VerifyEmailNotice from './_components/VerifyEmailNotice';
import DashboardView from './_components/DashboardView';

type View = 'login' | 'register' | 'forgot' | 'verify' | 'dashboard';

export default function AuthPage() {
  const [view, setView] = useState<View>('login');
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Check if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
      setView('dashboard');
    }
  }, []);

  return (
    <div className="auth-container">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      {/* Left – Branding panel */}
      {view !== 'dashboard' && (
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-brand-icon">🌬️</div>
            <span className="auth-brand-name">AirQuality Monitor</span>
          </div>

          <h1 className="auth-headline">
            Giám sát<br />
            <span>chất lượng</span><br />
            không khí
          </h1>

          <p className="auth-subtext">
            Hệ thống theo dõi chất lượng không khí theo thời gian thực, cảnh báo sức khỏe thông minh và dự báo chính xác cho cuộc sống của bạn.
          </p>

          <div className="auth-stats">
            <div className="auth-stat">
              <span className="auth-stat-value">99.9%</span>
              <span className="auth-stat-label">Uptime</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">24/7</span>
              <span className="auth-stat-label">Giám sát</span>
            </div>
            <div className="auth-stat">
              <span className="auth-stat-value">100+</span>
              <span className="auth-stat-label">Trạm đo</span>
            </div>
          </div>
        </div>
      )}

      {/* Right – Card */}
      <div className={`auth-right ${view === 'dashboard' ? '' : ''}`}
        style={view === 'dashboard' ? { width: '100%', maxWidth: '100%', padding: '2rem', background: 'transparent' } : {}}
      >
        {view === 'dashboard' ? (
          <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>
            <div className="auth-card">
              <DashboardView onSuccess={() => setView('login')} />
            </div>
          </div>
        ) : (
          <div className="auth-card">
            {/* Tab switcher for login/register */}
            {(view === 'login' || view === 'register') && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                  }}>🌬️</div>
                  <span style={{
                    fontWeight: 700, fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>AirQuality Monitor</span>
                </div>

                <div className="form-tabs">
                  <button
                    className={`form-tab ${view === 'login' ? 'active' : ''}`}
                    onClick={() => setView('login')}
                  >
                    Đăng nhập
                  </button>
                  <button
                    className={`form-tab ${view === 'register' ? 'active' : ''}`}
                    onClick={() => setView('register')}
                  >
                    Đăng ký
                  </button>
                </div>
              </>
            )}

            {view === 'login' && (
              <LoginForm
                onSuccess={() => setView('dashboard')}
                onSwitch={() => setView('register')}
                onForgotPassword={() => setView('forgot')}
              />
            )}

            {view === 'register' && (
              <RegisterForm
                onSuccess={(email) => {
                  setRegisteredEmail(email);
                  setView('verify');
                }}
                onSwitch={() => setView('login')}
              />
            )}

            {view === 'forgot' && (
              <ForgotPasswordForm onBack={() => setView('login')} />
            )}

            {view === 'verify' && (
              <VerifyEmailNotice
                email={registeredEmail}
                onResendSuccess={() => {}}
                onBack={() => setView('login')}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
