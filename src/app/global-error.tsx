'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ padding: 24 }}>
        <h1>App crashed.</h1>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#f88' }}>{error.message}</pre>
        {error.digest && <div>digest: {error.digest}</div>}
        <button onClick={reset} style={{ marginTop: 12 }}>Reload</button>
      </body>
    </html>
  );
}
