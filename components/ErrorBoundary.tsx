'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, RotateCcw } from 'lucide-react';
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Show toast notification
    this.showErrorToast(error);
  }

  showErrorToast = (error: Error) => {
    toast.error(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="font-semibold">Something went wrong</span>
        </div>
        <p className="text-sm text-gray-600">
          An error occurred on this page. You can continue using the site, or report this issue to our support team.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full"
          onClick={() => this.sendErrorReport()}
        >
          <Mail className="w-4 h-4 mr-2" />
          Report to Support
        </Button>
      </div>,
      {
        duration: 10000,
        closeButton: true,
      }
    );
  };

  sendErrorReport = async () => {
    const { error, errorInfo } = this.state;
    
    if (!error) return;

    try {
      const response = await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          errorInfo: errorInfo?.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Error report sent successfully. Our team will look into it.');
      } else {
        toast.error('Failed to send error report. Please contact support directly.');
      }
    } catch (err) {
      console.error('Failed to send error report:', err);
      toast.error('Failed to send error report. Please contact support at james@inventright.com');
    }
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI but keep the page functional
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 bg-white rounded-lg shadow-lg">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            
            <p className="text-gray-600 mb-6 text-center">
              We encountered an error while loading this page. Don't worry, your data is safe. 
              You can try refreshing the page or report this issue to our support team.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-sm">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2 rounded-lg w-full",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Refresh Page
              </button>
              
              <Button
                variant="outline"
                onClick={this.sendErrorReport}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                Report to Support
              </Button>

              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 p-4 bg-muted rounded text-xs w-full overflow-auto">
                <summary className="cursor-pointer font-semibold text-muted-foreground mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="whitespace-pre-wrap text-destructive text-sm">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
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
