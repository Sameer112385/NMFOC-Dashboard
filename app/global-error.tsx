"use client";

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#0d1117', color: '#e6edf3', fontFamily: 'monospace', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 640, width: '100%', border: '1px solid #30363d', borderRadius: 16, padding: '2rem', background: '#161b22' }}>
          <div style={{ color: '#f85149', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Global Error</div>
          <h2 style={{ marginTop: 8, fontSize: 20, fontWeight: 700 }}>Something went wrong</h2>
          <pre style={{ marginTop: 16, padding: '1rem', background: '#0d1117', borderRadius: 8, fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#8b949e' }}>
            {error.message}
            {'\n\n'}
            {error.stack}
            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
          <button onClick={reset} style={{ marginTop: 16, background: '#238636', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
