import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, { extra: errorInfo });
    }
    console.error('ErrorBoundary caught exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5 font-sans text-slate-900">
          <div className="bg-white border border-slate-200 rounded-xl shadow-md max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>

            <h2 className="text-xl font-bold text-slate-900 font-display">
              Application Render Error
            </h2>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              An unexpected interface error occurred. The diagnostic details have been logged for administrative review.
            </p>

            {this.state.error?.message && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left font-mono text-sm text-red-700 mb-5 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition shadow-xs"
              >
                <RotateCw size={18} />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2.5 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg transition shadow-2xs"
              >
                <Home size={18} />
                <span>Return to Hub</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
