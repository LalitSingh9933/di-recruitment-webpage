"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="section">
      <div className="container">
        <h1>Temporarily unavailable</h1>
        <p>We couldn’t load this page. Please try again shortly.</p>
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
