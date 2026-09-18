"use client";
import { isUpcoming } from "@/lib/dates";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Trophy,
  CalendarDays,
  Users,
  ArrowLeftRight,
  FolderOpen,
  MapPin,
  Clock,
  Shield,
  Camera,
} from "lucide-react";
import { useLeague } from "./league-provider";
import {
  Logo,
  Change,
  SectionTitle,
  Empty,
  DataBoundary,
  teamStyle,
  formatDate,
  formatTime,
} from "./ui";
import { DRIVE_URL } from "@/lib/supabase";
import type { Reservation, Team } from "@/lib/types";
export function StandingsTable() {
  const { teams } = useLeague();
  return (
    <div className="table-scroll">
      <table className="standings-table">
        <thead>
          <tr>
            {["Rank", "Club", "Wins", "Losses", "Goals", "Games", "Points"].map(
              (t) => (
                <th key={t}>{t}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {[...teams]
            .sort((a, b) => b.points - a.points || b.goals - a.goals)
            .map((t, i) => (
              <tr key={t.id} className={i === 0 ? "leader" : ""}>
                <td>
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                </td>
                <td>
                  <Link href={`/rosters?team=${t.slug}`}>
                    <Logo team={t} size={38} />
                    <strong>{t.name}</strong>
                    {i === 0 && <Trophy className="gold" size={14} />}
                  </Link>
                </td>
                <td>{t.wins}</td>
                <td>{t.losses}</td>
                <td>{t.goals}</td>
                <td>{t.games}</td>
                <td>
                  <b className="points">{t.points}</b>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
export function TeamCard({ team }: { team: Team }) {
  const { players } = useLeague();
  const roster = players.filter((p) => p.team_id === team.id);
  return (
    <article className="team-card" style={teamStyle(team)}>
      <div className="team-card-top">
        <Logo team={team} size={76} />
        <div className="overall">
          <strong>{team.overall}</strong>
          <span>
            OVR <Change value={team.overall_change} />
          </span>
        </div>
      </div>
      <h3>{team.name}</h3>
      <div className="team-card-info">
        <span>
          <Shield size={13} />
          {roster.find((p) => p.is_captain)?.name || "Captain unassigned"}
        </span>
        <span>
          <Users size={13} />
          {roster.length} players
        </span>
      </div>
      <div className="team-card-bottom">
        <span>
          <b>{team.points}</b> PTS
        </span>
        <Link href={`/rosters?team=${team.slug}`}>
          View Roster <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
export function EventCard({ event }: { event: Reservation }) {
  const { teams } = useLeague();
  const home = teams.find(
    (t) => t.id === (event.team_id || event.home_team_id),
  );
  const away = teams.find((t) => t.id === event.away_team_id);
  return (
    <div className={`event-card ${event.type}`}>
      <span className="eyebrow">
        {event.type === "game" ? "League game" : "Team practice"}
      </span>
      <div className="matchup">
        <div>
          <Logo team={home} size={56} />
          <strong>{home?.name}</strong>
        </div>
        {away && (
          <>
            <span className="vs">VS</span>
            <div>
              <Logo team={away} size={56} />
              <strong>{away.name}</strong>
            </div>
          </>
        )}
      </div>
      <div className="event-meta">
        <span>
          <CalendarDays size={14} />
          {formatDate(event.date)}
        </span>
        <span>
          <Clock size={14} />
          {formatTime(event.start_time)}
        </span>
      </div>
      <p>
        <MapPin size={14} />
        {event.location}
      </p>
    </div>
  );
}
export function MediaBanner() {
  return (
    <section className="media-banner">
      <div className="media-art" aria-hidden="true">
        <Camera size={60} />
        <div className="film-line" />
      </div>
      <div className="media-copy">
        <span className="eyebrow">OFF THE PITCH. ON THE RECORD.</span>
        <h2>
          THE MOMENTS.
          <br />
          THE MEMORIES.
        </h2>
        <p>
          Matchday photos, highlights, and everything in between.
          <br className="desktop-only" /> Find it all in the NSL Media Archive.
        </p>
        <a
          className="button button-light"
          href={DRIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FolderOpen size={16} />
          Open Google Drive
          <ArrowUpRight size={17} />
        </a>
      </div>
      <span className="media-watermark" aria-hidden="true">
        NSL
      </span>
    </section>
  );
}
export function Home() {
  const { teams, players, reservations } = useLeague();
  const upcoming = reservations.filter(isUpcoming);
  return (
    <>
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="live-dot" /> FOUR CLUBS. ONE LEAGUE.
          </div>
          <h1>
            NOBAGLAGI
            <br />
            <span>SOCCER LEAGUE.</span>
          </h1>
          <p>Fixtures. Rankings. Rivalries.</p>
          <div className="hero-actions">
            <Link href="/schedule" className="button button-primary">
              Explore the schedule <ArrowUpRight size={18} />
            </Link>
            <Link href="/rosters" className="hero-link">
              Meet the teams <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="hero-emblem">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <Logo size={255} />
          <span className="emblem-label">OUR LEAGUE. OUR LEGACY.</span>
        </div>
        <div className="hero-bottom">
          <span>
            <Trophy size={15} /> THE RACE STARTS HERE
          </span>
          <div>
            <b>{teams.length || "—"}</b> Clubs <span />
            <b>{players.length || "—"}</b> Players <span />
            <b>1</b> Trophy
          </div>
        </div>
      </section>
      <div className="content-wrap">
        <DataBoundary>
          <div className="home-primary">
            <section className="standings-panel panel">
              <div className="panel-header">
                <div>
                  <Trophy size={18} />
                  <h2>THE LEAGUE TABLE</h2>
                </div>
                <span className="week-badge">WEEK 1</span>
              </div>
              <StandingsTable />
              <Link className="panel-footer" href="/standings">
                View Full Standings <ArrowRight size={16} />
              </Link>
            </section>
            <aside className="next-panel">
              <div className="section-heading">
                <h2>UP NEXT</h2>
                <Link
                  href="/schedule"
                  className="text-link"
                  aria-label="Full schedule"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              {upcoming.find((e) => e.type === "game") ? (
                <EventCard event={upcoming.find((e) => e.type === "game")!} />
              ) : (
                <div className="compact-empty panel">
                  <span className="event-label">
                    <span className="live-dot" /> NEXT GAME
                  </span>
                  <CalendarDays size={27} />
                  <h3>No fixtures booked yet.</h3>
                  <p>The next rivalry is waiting.</p>
                  <Link className="text-link" href="/schedule">
                    View schedule <ArrowRight size={15} />
                  </Link>
                </div>
              )}
              {upcoming.find((e) => e.type === "practice") ? (
                <EventCard
                  event={upcoming.find((e) => e.type === "practice")!}
                />
              ) : (
                <Link className="practice-empty panel" href="/schedule">
                  <div className="practice-icon">
                    <Shield size={20} />
                  </div>
                  <div>
                    <span className="eyebrow">NEXT PRACTICE</span>
                    <p>No practice scheduled</p>
                  </div>
                  <ArrowUpRight size={17} />
                </Link>
              )}
            </aside>
          </div>
          <section className="clubs-section">
            <SectionTitle
              title="FOUR CLUBS. ALL IN."
              subtitle="Pick your side. Know your competition."
              href="/rosters"
              link="Explore rosters"
            />
            <div className="team-grid">
              {[...teams]
                .sort(
                  (a, b) =>
                    [
                      "villains",
                      "dangerous-boys",
                      "marlon-fc",
                      "real-nathan",
                    ].indexOf(a.slug) -
                    [
                      "villains",
                      "dangerous-boys",
                      "marlon-fc",
                      "real-nathan",
                    ].indexOf(b.slug),
                )
                .map((t) => (
                  <TeamCard team={t} key={t.id} />
                ))}
            </div>
          </section>
          <MediaBanner />
          <Link className="trade-teaser" href="/trades">
            <span className="trade-teaser-icon">
              <ArrowLeftRight size={24} />
            </span>
            <div>
              <h3>BUILD YOUR NEXT WINNING ROSTER.</h3>
              <p>Big moves start in the NSL Trade Center.</p>
            </div>
            <span className="text-link">
              Enter Trade Center <ArrowUpRight size={18} />
            </span>
          </Link>
        </DataBoundary>
      </div>
    </>
  );
}
