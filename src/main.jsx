import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '20px', background: '#f8fafc', color: '#1e293b' }}>
          <div style={{ maxWidth: '600px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#ef4444' }}>Đã xảy ra lỗi khi tải trang</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Hệ thống đã ghi nhận lỗi. Bạn vui lòng thử tải lại trang hoặc kiểm tra kết nối mạng.
            </p>
            <div style={{ textAlign: 'left', background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', marginBottom: '20px', color: '#334155' }}>
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)

