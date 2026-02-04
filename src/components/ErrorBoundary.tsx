import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border-l-4 border-red-500">
            <h1 className="mb-2 text-xl font-bold text-red-600">Terjadi Kesalahan Aplikasi</h1>
            <p className="mb-4 text-gray-600">
              Mohon maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
            </p>
            <div className="mb-4 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-800 font-mono border">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-3">
                <button
                onClick={() => window.location.reload()}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                >
                Muat Ulang
                </button>
                <button
                onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                }}
                className="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition"
                >
                Reset Data & Reload
                </button>
            </div>
            <p className="mt-4 text-xs text-gray-400">
                Jika masalah berlanjut, silakan hubungi administrator.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
