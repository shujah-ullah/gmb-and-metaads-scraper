import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('LocalScope could not render:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ maxWidth: 680, margin: '12vh auto', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#1c2d32' }}>
          <h1 style={{ fontSize: 24 }}>LocalScope could not load this workspace</h1>
          <p style={{ lineHeight: 1.6 }}>The page hit a rendering error. Your locally stored data has not been cleared.</p>
          <pre style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', padding: 14, borderRadius: 8, background: '#f3f5f5', color: '#7d3030' }}>{String(this.state.error?.message || this.state.error)}</pre>
          <button type="button" onClick={() => window.location.reload()} style={{ padding: '9px 13px', border: 0, borderRadius: 6, background: '#176649', color: '#fff', cursor: 'pointer' }}>Reload page</button>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
