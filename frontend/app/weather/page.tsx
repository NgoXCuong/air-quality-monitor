'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  weatherApi,
  owmIcon,
  formatTime,
  formatDate,
  formatDateStr,
  windDirection,
  type CurrentWeather,
  type HourlyWeather,
  type DailyWeather,
  type HistoryWeather,
} from '@/lib/weather-api';

// ─────────────────────────────────────────────────────────────────────────────
// Styles (inline CSS-in-JS)
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: '0',
  } as React.CSSProperties,

  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '2rem 1.5rem',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  } as React.CSSProperties,

  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,

  card: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '1.5rem',
  } as React.CSSProperties,

  badge: (color: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: color,
    borderRadius: 999,
    padding: '4px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
  }) as React.CSSProperties,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, unit, color = '#60a5fa' }: {
  icon: string; label: string; value: string | number; unit?: string; color?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12,
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
    >
      <div style={{ fontSize: '1.4rem' }}>{icon}</div>
      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color }}>
        {value}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1.25rem',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.85rem',
        transition: 'all 0.2s',
        background: active ? 'rgba(96,165,250,0.2)' : 'transparent',
        color: active ? '#60a5fa' : '#64748b',
        borderBottom: active ? '2px solid #60a5fa' : '2px solid transparent',
      }}
    >
      {children}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid rgba(96,165,250,0.2)',
        borderTopColor: '#60a5fa',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Đang tải dữ liệu thời tiết...</p>
    </div>
  );
}

function ErrorMsg({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
      <p style={{ marginBottom: 12 }}>{msg}</p>
      <button onClick={onRetry} style={{
        padding: '0.5rem 1.5rem', borderRadius: 8, border: '1px solid #f87171',
        background: 'transparent', color: '#f87171', cursor: 'pointer', fontWeight: 600,
      }}>Thử lại</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hourly Section
// ─────────────────────────────────────────────────────────────────────────────

function HourlySection({ data }: { data: HourlyWeather[] }) {
  if (!data.length) return null;

  const temps = data.map(h => h.temp);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = maxT - minT || 1;

  return (
    <div style={S.card}>
      <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        🕐 Dự báo 24 giờ tới
      </h3>

      {/* Temp sparkline */}
      <div style={{ position: 'relative', height: 60, marginBottom: '0.75rem' }}>
        <svg width="100%" height="60" viewBox={`0 0 ${data.length * 80} 60`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinejoin="round"
            points={data.map((h, i) => `${i * 80 + 40},${50 - ((h.temp - minT) / range) * 40}`).join(' ')}
          />
          <polygon
            fill="url(#lineGrad)"
            points={[
              ...data.map((h, i) => `${i * 80 + 40},${50 - ((h.temp - minT) / range) * 40}`),
              `${(data.length - 1) * 80 + 40},60`,
              `40,60`,
            ].join(' ')}
          />
        </svg>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
        {data.map((h, i) => (
          <div key={i} style={{
            flexShrink: 0,
            width: 72,
            background: i === 0 ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${i === 0 ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 10,
            padding: '0.6rem 0.4rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              {i === 0 ? 'Giờ này' : formatTime(h.timestamp)}
            </span>
            <img src={owmIcon(h.weather_icon)} alt={h.weather_description} style={{ width: 36, height: 36 }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{h.temp}°</span>
            <span style={{ fontSize: '0.68rem', color: '#60a5fa' }}>{Math.round(h.pop * 100)}%💧</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily Section
// ─────────────────────────────────────────────────────────────────────────────

function DailySection({ data }: { data: DailyWeather[] }) {
  return (
    <div style={S.card}>
      <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        📅 Dự báo 5 ngày
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto auto auto',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 1rem',
            background: i === 0 ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.02)',
            borderRadius: 10,
            border: `1px solid ${i === 0 ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.04)'}`,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {i === 0 ? 'Hôm nay' : formatDateStr(d.date)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                {d.weather_description}
              </div>
            </div>
            <img src={owmIcon(d.weather_icon)} alt={d.weather_description} style={{ width: 36, height: 36 }} />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>💧{d.humidity}%</span>
            <span style={{ fontSize: '0.8rem', color: '#60a5fa' }}>🌧️{Math.round(d.pop * 100)}%</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{d.temp_max}°</span>
              <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: 6 }}>{d.temp_min}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History Section
// ─────────────────────────────────────────────────────────────────────────────

function HistorySection({ data }: { data: HistoryWeather[] }) {
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          📊 Lịch sử 7 ngày qua
        </h3>
        <span style={S.badge('rgba(251,191,36,0.15)')}>
          <span style={{ color: '#fbbf24' }}>⚠️ Mock Data</span>
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Ngày', 'Điều kiện', 'Min (°C)', 'Max (°C)', 'TB (°C)', 'Độ ẩm', 'Gió (m/s)', 'Áp suất'].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((d, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '0.7rem 0.75rem', whiteSpace: 'nowrap' }}>{formatDateStr(d.date)}</td>
                <td style={{ padding: '0.7rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <img src={owmIcon(d.weather_icon)} alt="" style={{ width: 28, height: 28 }} />
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'capitalize' }}>{d.weather_description}</span>
                  </div>
                </td>
                <td style={{ padding: '0.7rem 0.75rem', color: '#60a5fa', fontWeight: 600 }}>{d.temp_min}</td>
                <td style={{ padding: '0.7rem 0.75rem', color: '#f97316', fontWeight: 600 }}>{d.temp_max}</td>
                <td style={{ padding: '0.7rem 0.75rem' }}>{d.temp_avg}</td>
                <td style={{ padding: '0.7rem 0.75rem' }}>{d.humidity}%</td>
                <td style={{ padding: '0.7rem 0.75rem' }}>{d.wind_speed}</td>
                <td style={{ padding: '0.7rem 0.75rem' }}>{d.pressure} hPa</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'hourly' | 'daily' | 'history';

export default function WeatherPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyWeather[]>([]);
  const [daily, setDaily] = useState<DailyWeather[]>([]);
  const [history, setHistory] = useState<HistoryWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cur, hou, dai, his] = await Promise.all([
        weatherApi.getCurrent(),
        weatherApi.getHourly(),
        weatherApi.getDaily(),
        weatherApi.getHistory(),
      ]);
      setCurrent(cur);
      setHourly(hou);
      setDaily(dai);
      setHistory(his);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Không thể tải dữ liệu thời tiết';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh mỗi 10 phút
    const interval = setInterval(fetchAll, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(96,165,250,0.3); border-radius: 4px; }
      `}</style>

      <div style={S.page}>
        <div style={S.container}>

          {/* ── Header ── */}
          <div style={S.header}>
            <div>
              <h1 style={S.title}>🌤️ Thời tiết</h1>
              {lastUpdated && (
                <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4 }}>
                  Cập nhật lúc {lastUpdated.toLocaleTimeString('vi-VN')}
                </p>
              )}
            </div>
            <button
              onClick={fetchAll}
              disabled={loading}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: 8,
                border: '1px solid rgba(96,165,250,0.3)',
                background: 'rgba(96,165,250,0.1)',
                color: '#60a5fa',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⏳ Đang tải...' : '🔄 Làm mới'}
            </button>
          </div>

          {/* ── Error ── */}
          {error && <ErrorMsg msg={error} onRetry={fetchAll} />}

          {/* ── Loading ── */}
          {loading && !current && <LoadingSpinner />}

          {/* ── Current Hero Card ── */}
          {current && (
            <div style={{
              ...S.card,
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(167,139,250,0.08) 100%)',
              border: '1px solid rgba(96,165,250,0.2)',
              animation: 'fadeIn 0.4s ease',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>
                    📍 {current.city}, {current.country}
                  </div>
                  <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.1, background: 'linear-gradient(135deg, #f0f9ff, #bae6fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {current.temp}°C
                  </div>
                  <div style={{ fontSize: '1rem', color: '#94a3b8', marginTop: 4, textTransform: 'capitalize' }}>
                    {current.weather_description}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                    Cảm giác như {current.feels_like}°C &nbsp;·&nbsp; {current.temp_min}° / {current.temp_max}°
                  </div>
                </div>
                <img
                  src={owmIcon(current.weather_icon, '4x')}
                  alt={current.weather_description}
                  style={{ width: 100, height: 100, filter: 'drop-shadow(0 0 20px rgba(96,165,250,0.4))' }}
                />
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <StatCard icon="💧" label="Độ ẩm" value={current.humidity} unit="%" color="#60a5fa" />
                <StatCard icon="🌬️" label="Gió" value={current.wind_speed} unit={`m/s ${windDirection(current.wind_deg)}`} color="#a78bfa" />
                <StatCard icon="📊" label="Áp suất" value={current.pressure} unit="hPa" color="#34d399" />
                <StatCard icon="👁️" label="Tầm nhìn" value={(current.visibility / 1000).toFixed(1)} unit="km" color="#fb923c" />
                <StatCard icon="☁️" label="Mây" value={current.clouds} unit="%" color="#94a3b8" />
                <StatCard icon="🌅" label="Mặt trời mọc" value={formatTime(current.sunrise)} color="#fbbf24" />
                <StatCard icon="🌇" label="Mặt trời lặn" value={formatTime(current.sunset)} color="#f97316" />
              </div>
            </div>
          )}

          {/* ── Tabs ── */}
          {current && (
            <>
              <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
                <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>Tổng quan</TabBtn>
                <TabBtn active={tab === 'hourly'} onClick={() => setTab('hourly')}>Theo giờ</TabBtn>
                <TabBtn active={tab === 'daily'} onClick={() => setTab('daily')}>5 ngày</TabBtn>
                <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>Lịch sử</TabBtn>
              </div>

              <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tab === 'overview' && (
                  <>
                    <HourlySection data={hourly} />
                    <DailySection data={daily} />
                  </>
                )}
                {tab === 'hourly' && <HourlySection data={hourly} />}
                {tab === 'daily' && <DailySection data={daily} />}
                {tab === 'history' && <HistorySection data={history} />}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
