"use client";

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html>
      <body className="bg-bg text-text">
        <div className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="surface-card max-w-2xl p-8">
            <div className="section-kicker text-danger">Global Error</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text">Something went wrong</h2>
            <p className="mt-3 text-sm leading-6 text-muted">The application hit an unexpected error. Review the diagnostic details below and try the action again.</p>
            <pre className="mt-6 overflow-x-auto rounded-3xl border border-line/70 bg-panel2/75 p-4 text-xs text-muted">
              {error.message}
              {'\n\n'}
              {error.stack}
              {error.digest ? `\n\nDigest: ${error.digest}` : ''}
            </pre>
            <button onClick={reset} className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
