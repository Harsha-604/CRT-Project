import React, { useState } from 'react';
import './App.css';

const API = 'https://khfzkzvrxc.execute-api.ap-south-1.amazonaws.com/prod';

function App() {
  const [page, setPage] = useState('home');
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [result, setResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsCode, setAnalyticsCode] = useState('');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createLink = async () => {
    if (!longUrl) { setError('Please enter a URL'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body = { long_url: longUrl };
      if (customAlias) body.custom_alias = customAlias;
      if (expiresAt) body.expires_at = new Date(expiresAt).toISOString();
      const res = await fetch(`${API}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create link'); return; }
      const shortUrl = `${API}/${data.short_code}`;
      setResult({ ...data, short_url: shortUrl });
    } catch (e) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAnalytics = async () => {
    if (!analyticsCode) { setError('Enter a short code'); return; }
    setLoading(true);
    setError('');
    setAnalytics(null);
    try {
      const res = await fetch(`${API}/analytics/${analyticsCode}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Not found'); return; }
      setAnalytics(data);
    } catch (e) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const getQR = async (code) => {
    setLoading(true);
    setQrData(null);
    try {
      const res = await fetch(`${API}/qr/${code}`);
      const data = await res.json();
      setQrData(data.qr_code);
    } catch (e) {
      setError('Failed to load QR code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">⚡ SmartLink</div>
        <div className="nav-links">
          <button onClick={() => { setPage('home'); setResult(null); setError(''); }} className={page === 'home' ? 'active' : ''}>Create</button>
          <button onClick={() => { setPage('analytics'); setAnalytics(null); setError(''); }} className={page === 'analytics' ? 'active' : ''}>Analytics</button>
        </div>
      </nav>

      <main className="main">
        {page === 'home' && (
          <div className="card">
            <h1>Smart Link Manager</h1>
            <p className="subtitle">Create smart short links with QR codes and click analytics</p>

            <div className="form-group">
              <label>Long URL *</label>
              <input
                type="url"
                placeholder="https://example.com/very/long/url"
                value={longUrl}
                onChange={e => setLongUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Custom Alias (optional)</label>
              <input
                type="text"
                placeholder="my-custom-link"
                value={customAlias}
                onChange={e => setCustomAlias(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Expiry Date (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button className="btn-primary" onClick={createLink} disabled={loading}>
              {loading ? 'Creating...' : 'Create Short Link'}
            </button>

            {result && (
              <div className="result">
                <h3>✅ Link Created!</h3>
                <div className="result-row">
                  <span className="result-label">Short URL:</span>
                  <a href={result.short_url} target="_blank" rel="noreferrer">{result.short_url}</a>
                </div>
                <div className="result-row">
                  <span className="result-label">Short Code:</span>
                  <code>{result.short_code}</code>
                </div>
                <div className="result-actions">
                  <button className="btn-secondary" onClick={() => navigator.clipboard.writeText(result.short_url)}>
                    📋 Copy Link
                  </button>
                  <button className="btn-secondary" onClick={() => getQR(result.short_code)}>
                    🔲 Get QR Code
                  </button>
                </div>
                {qrData && (
                  <div className="qr-container">
                    <img src={`data:image/png;base64,${qrData}`} alt="QR Code" />
                    <a href={`data:image/png;base64,${qrData}`} download="qrcode.png">
                      <button className="btn-secondary">⬇ Download QR</button>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {page === 'analytics' && (
          <div className="card">
            <h1>Link Analytics</h1>
            <p className="subtitle">Track clicks and performance of your short links</p>

            <div className="form-group">
              <label>Short Code</label>
              <input
                type="text"
                placeholder="e.g. apP1gb"
                value={analyticsCode}
                onChange={e => setAnalyticsCode(e.target.value)}
              />
            </div>

            {error && <div className="error">{error}</div>}

            <button className="btn-primary" onClick={getAnalytics} disabled={loading}>
              {loading ? 'Loading...' : 'Get Analytics'}
            </button>

            {analytics && (
              <div className="result">
                <h3>📊 Analytics for <code>{analytics.short_code}</code></h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-number">{analytics.click_count}</div>
                    <div className="stat-label">Total Clicks</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">{new Date(analytics.created_at).toLocaleDateString()}</div>
                    <div className="stat-label">Created On</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-number">{analytics.expires_at ? new Date(analytics.expires_at).toLocaleDateString() : 'Never'}</div>
                    <div className="stat-label">Expires</div>
                  </div>
                </div>
                <div className="result-row">
                  <span className="result-label">Destination:</span>
                  <a href={analytics.long_url} target="_blank" rel="noreferrer">{analytics.long_url}</a>
                </div>
                {analytics.clicks.length > 0 && (
                  <div className="clicks-table">
                    <h4>Click History</h4>
                    <table>
                      <thead>
                        <tr><th>Timestamp</th><th>IP</th><th>User Agent</th></tr>
                      </thead>
                      <tbody>
                        {analytics.clicks.slice(-10).reverse().map((click, i) => (
                          <tr key={i}>
                            <td>{new Date(click.timestamp).toLocaleString()}</td>
                            <td>{click.ip}</td>
                            <td>{click.user_agent.substring(0, 40)}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
