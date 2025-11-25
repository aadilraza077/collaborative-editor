import React, { useState, useEffect, useRef } from 'react';

// REPLACE THIS WITH YOUR HOSTINGER DOMAIN PATH
// If your site is example.com, this is likely https://example.com/api/index.php
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-80">
        <h2 className="mb-4 text-xl font-bold text-center">Login</h2>
        {error && <div className="mb-2 text-red-500 text-sm">{error}</div>}
        <input
          className="w-full p-2 mb-3 border rounded"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700">
          Sign In
        </button>
      </form>
    </div>
  );
}

// --- Editor Component ---
function Editor({ user, onLogout }) {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('Synced');
  const timeoutRef = useRef(null);
  const isTypingRef = useRef(false);

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
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm">
        <div>
          <h1 className="font-bold text-lg">Collab Editor</h1>
          <span className={`text-xs ${status === 'Error saving' ? 'text-red-500' : 'text-green-600'}`}>
            ● {status}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">User: {user}</span>
          <button onClick={onLogout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </div>
      
      <div className="flex-1 p-8">
        <textarea
          className="w-full h-full p-6 border rounded shadow-sm focus:outline-none focus:ring-2 ring-blue-200 resize-none font-mono text-gray-700"
          value={content}
          onChange={handleChange}
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
}