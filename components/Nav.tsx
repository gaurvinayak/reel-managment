import Link from "next/link";

export function Nav() {
  return (
    <nav className="topnav">
      <Link href="/" className="brand">
        🎬 Reel DM Manager
      </Link>
      <Link href="/">Dashboard</Link>
      <Link href="/activity">Activity</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
