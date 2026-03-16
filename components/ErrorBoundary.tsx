import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔥 CRASH DETECTADO:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.href = '/';
  }

  private handleClearData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-50 dark:bg-black p-6 text-center font-sans">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ops! Ocorreu um erro.</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              Algo inesperado aconteceu. Tente recarregar a página.
            </p>

            <div className="space-y-3">
                <button 
                  onClick={this.handleReload}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                   <RefreshCw size={18} /> Recarregar
                </button>
                
                <button 
                  onClick={this.handleClearData}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                   <Trash2 size={16} /> Limpar Cache
                </button>
            </div>
            
            {this.state.error && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-black rounded-xl text-left overflow-hidden">
                    <p className="text-[10px] font-mono text-gray-500 break-words line-clamp-3">
                        {this.state.error.toString()}
                    </p>
                </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;