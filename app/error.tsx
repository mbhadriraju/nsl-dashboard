"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <h1>Play paused.</h1>
      <p>This page could not load. Give it another try.</p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
