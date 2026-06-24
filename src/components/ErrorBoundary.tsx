import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F3F4F6',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}>
            <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '16px' }} />
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              marginBottom: '8px',
            }}>
              Oops! Kuch Galat Hua
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '16px',
              lineHeight: '1.5',
            }}>
              App mein technical issue aa gya hai. Admin se contact karo ya dobara try karo.
            </p>
            
            {this.state.error && (
              <div style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'left',
              }}>
                <code style={{
                  fontSize: '11px',
                  color: '#991b1b',
                  wordBreak: 'break-all',
                  display: 'block',
                }}>
                  {this.state.error.message}
                </code>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#008069',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
              }}
            >
              <RotateCw size={16} />
              Dobara Try Karo
            </button>

            <p style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '12px',
            }}>
              Error ID: {Math.random().toString(36).substr(2, 9)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
