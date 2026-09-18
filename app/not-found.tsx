import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Out of bounds.</h1>
      <p>This page is not in the lineup.</p>
      <Link href="/" className="button button-primary">
        Back to the league
      </Link>
    </div>
  );
}
