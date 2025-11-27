import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = "https://editor.aadilraza.in/api/index.php";

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return <Editor user={user} onLogout={() => setUser(null)} />;
}

// --- Login Component ---
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });
      const data = await res.json();

      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Is the API URL correct?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your collaborative editor</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="input-group">
            <label>Username</label>
            <input
              className="input-field"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              className="input-field"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- Editor Component ---
function Editor({ user, onLogout }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Synced');
  const timeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Helper to get status class
  const getStatusClass = (statusText) => {
    if (statusText === 'Synced' || statusText === 'Saved') return 'status-synced';
    if (statusText === 'Saving...') return 'status-saving';
    if (statusText === 'Typing...') return 'status-typing';
    return 'status-error';
  };

  // 1. Polling: Fetch data every 2 seconds
  useEffect(() => {
    const fetchData = async () => {
      // Don't overwrite if user is currently typing
      if (isTypingRef.current) return;

      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        if (data.content !== undefined) {
          setContent(data.content);
        }
      } catch (err) {
        console.error("Fetch error", err);
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 2000); // Poll every 2s
    return () => clearInterval(interval);
  }, []);

  // 2. Save Logic (Debounced)
  const handleChange = (e) => {
    const newText = e.target.value;
    setContent(newText);
    setStatus('Typing...');
    isTypingRef.current = true;

    // Clear previous save timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Set new save timer (Wait 1s after last keystroke)
    timeoutRef.current = setTimeout(async () => {
      setStatus('Saving...');
      try {
        await fetch(API_URL, {
          method: 'POST',
          body: JSON.stringify({ content: newText }),
        });
        setStatus('Saved');
        isTypingRef.current = false;
      } catch (err) {
        setStatus('Error saving');
        isTypingRef.current = false;
      }
    }, 1000);
  };

  return (
    <div className="editor-wrapper">
      <header className="editor-header">
        <div className="header-left">
          <div className="logo">
            <span>📝</span> Collab Editor
          </div>
          <div className={`status-indicator ${getStatusClass(status)}`}>
            <div className="status-dot"></div>
            {status}
          </div>
        </div>

        <div className="header-right">
          <div className="user-badge">
            <div className="avatar">
              {user.charAt(0).toUpperCase()}
            </div>
            <span className="username">{user}</span>
          </div>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="editor-workspace">
        <div className="document-container">
          <textarea
            className="document-textarea"
            value={content}
            onChange={handleChange}
            placeholder="Start typing your document here..."
            spellCheck={false}
          />
        </div>
      </main>
    </div>
  );
}