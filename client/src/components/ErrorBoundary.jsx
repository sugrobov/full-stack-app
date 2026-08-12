import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    // Обновляем состояние, чтобы при следующем рендере показать запасной UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // вывести в консоль
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Запасной UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Что-то пошло не так</h1>
            <p className="text-gray-600 mb-6">
              Извините, произошла ошибка. Попробуйте обновить страницу или вернитесь на главную.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Обновить
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                На главную
              </a>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left bg-gray-100 p-4 rounded-md">
                <summary className="font-mono text-sm cursor-pointer">Технические детали</summary>
                <pre className="mt-2 text-xs overflow-auto">{this.state.error.toString()}</pre>
                <pre className="mt-2 text-xs overflow-auto">{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;