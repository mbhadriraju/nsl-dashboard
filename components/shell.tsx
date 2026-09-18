"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { useLeague } from "./league-provider";
import { Logo } from "./ui";
const links = [
  ["Home", "/"],
  ["Schedule", "/schedule"],
  ["Standings", "/standings"],
  ["Rosters", "/rosters"],
  ["Trades", "/trades"],
  ["Media", "/media"],
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { profile, teams, signIn, signOut } = useLeague();
  const [menu, setMenu] = useState(false);
  const myTeam = teams.find((t) => t.id === profile?.team_id);
  return (
    <>
      <header className="site-header">
        <div className="nav-wrap">
          <Link href="/" className="brand" aria-label="NSL home">
            <Logo size={48} />
            <span>
              NSL<span className="brand-sub">THE LEAGUE. OUR GAME.</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([name, url]) => (
              <Link
                aria-current={path === url ? "page" : undefined}
                className={path === url ? "active" : ""}
                href={url}
                key={url}
              >
                {name}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            {profile ? (
              <details className="user-menu">
                <summary>
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      width={32}
                      height={32}
                      alt="Your avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={20} />
                  )}
                  <ChevronDown size={14} />
                </summary>
                <div className="dropdown">
                  <Link href="/profile">Profile</Link>
                  <Link
                    href={myTeam ? `/rosters?team=${myTeam.slug}` : "/rosters"}
                  >
                    My Team
                  </Link>
                  {profile.role !== "player" && (
                    <Link href="/captain">Captain Dashboard</Link>
                  )}
                  <button onClick={() => void signOut()}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </details>
            ) : (
              <button className="button sign-in" onClick={() => void signIn()}>
                Sign In <ArrowUpRight size={15} />
              </button>
            )}
            <button
              className="icon-button mobile-menu-button"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {links.map(([name, url]) => (
              <Link
                key={url}
                className={path === url ? "active" : ""}
                href={url}
                onClick={() => setMenu(false)}
              >
                {name}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <Link className="footer-brand" href="/">
          <Logo size={34} />
          <strong>NOBAGLAGI SOCCER LEAGUE</strong>
        </Link>
        <span>Friends off the pitch. Rivals on it.</span>
        <Link href="/schedule">
          See you on the pitch <ArrowUpRight size={14} />
        </Link>
      </footer>
    </>
  );
}
