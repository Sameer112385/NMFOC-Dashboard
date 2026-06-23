"use client";

import { useEffect } from 'react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6">
      <div className="glass w-full max-w-lg rounded-3xl p-8 shadow-glow">
        <div className="text-sm font-semibold uppercase tracking-widest text-danger">Application Error</div>
        <h2 className="mt-2 text-xl font-bold text-text">Something went wrong</h2>
        <pre className="mt-4 overflow-auto rounded-xl bg-white/5 p-4 text-xs text-muted whitespace-pre-wrap break-words">
          {error.message}
          {error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-bg transition hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
