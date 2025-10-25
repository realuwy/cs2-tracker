'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Something went wrong.</h1>
      <pre style={{ whiteSpace: 'pre-wrap', color: '#f88' }}>{error.message}</pre>
      {error.digest && <div>digest: {error.digest}</div>}
      <button onClick={reset} style={{ marginTop: 12 }}>Try again</button>
    </div>
  );
}
